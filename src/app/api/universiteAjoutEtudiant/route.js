import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { creerJeton, TYPE_ACTIVATION } from '@/lib/jetons';
import { envoyerLienActivation, lienActivation, envoiConfigure } from '@/lib/mail';
import { declencherVidage } from '@/lib/fileCourriel';
import { normaliserEmail, estConflitEmail, MESSAGE_EMAIL_PRIS } from '@/lib/email';

/* =====================================================================
   POST : création d'un compte étudiant par son université

   La page `universiteAjoutEtudiant` existait mais était une coquille vide
   (8 lignes, fragment vide) et orpheline : aucun lien n'y menait.

   Périmètre volontairement restreint à un étudiant à la fois. L'import de
   masse relève du Lot 6.3 ; les deux se complètent, une université
   ajoutant ponctuellement un étudiant isolé après un import de promotion.

   Le rattachement est créé directement « Valide » : c'est l'université
   elle-même qui crée le compte, elle n'a pas à valider sa propre demande.
   ===================================================================== */
export async function POST(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;
    const {
      nom, prenom, email,
      matricule, niveauAcademique, filiere, specialisation, telephone
    } = await req.json();

    if (!nom?.trim() || !prenom?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Le nom, le prénom et l\'adresse e-mail sont obligatoires' },
        { status: 400 }
      );
    }

    const emailNormalise = normaliserEmail(email);

    const dejaPris = await client.query(
      'SELECT 1 FROM utilisateur WHERE LOWER("emailUtilisateur") = $1',
      [emailNormalise]
    );
    if (dejaPris.rows.length > 0) {
      return NextResponse.json(
        { error: MESSAGE_EMAIL_PRIS },
        { status: 409 }
      );
    }

    await client.query('BEGIN');

    /* Le compte naît SANS mot de passe et inactif.

       L'université ne choisit pas le mot de passe de ses étudiants. Un
       mot de passe temporaire qu'elle transmettrait resterait en clair
       dans un courriel ou un tableur, serait rarement changé, et
       échapperait à la politique de robustesse du Lot 4.3.

       L'étudiant recevra un lien d'activation à usage unique et posera
       lui-même son mot de passe. */
    const utilisateur = await client.query(
      `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur",
                                "motDePasse", "compteActive")
       VALUES ('Etudiant', $1, NULL, false) RETURNING "idUtilisateur"`,
      [emailNormalise]
    );
    const idUtilisateur = utilisateur.rows[0].idUtilisateur;

    const universite = await client.query(
      'SELECT "nomUniversite" FROM universite WHERE "idUniversite" = $1',
      [idUniversite]
    );

    const etudiant = await client.query(
      `INSERT INTO etudiant (
        "idUtilisateur", "nomEtudiant", "prenomEtudiant", "telephoneEtudiant",
        "idUniversite", "nomUniversiteSaisi", "matricule",
        "filiere", "specialisation", "niveauAcademique",
        "dateInscription", "estActif", "statutRattachement", "dateRattachement"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10, CURRENT_DATE, true, 'Valide', now())
      RETURNING "idEtudiant"`,
      [
        idUtilisateur, nom.trim(), prenom.trim(), telephone?.trim() || null,
        idUniversite, universite.rows[0]?.nomUniversite || null,
        matricule?.trim() || null,
        filiere || null, specialisation || null, niveauAcademique || null
      ]
    );

    const { jeton, expiration } = await creerJeton(client, idUtilisateur, TYPE_ACTIVATION);

    /* Mise en file dans la transaction : le courriel et le compte
       existent ensemble, ou pas du tout. */
    const courriel = await envoyerLienActivation(client, {
      to: emailNormalise,
      nom: `${prenom.trim()} ${nom.trim()}`,
      nomUniversite: universite.rows[0]?.nomUniversite || null,
      jeton, expiration
    });

    await client.query('COMMIT');
    declencherVidage();

    /* Tant que l'envoi n'est pas configuré (Lot 6.6), le lien est rendu
       à l'université, qui le transmettra elle-même. Sans cela le compte
       serait créé et inaccessible — la fonctionnalité ne serait pas
       démontrable.

       Ce n'est pas une fuite : l'université est authentifiée, c'est elle
       qui vient de créer ce compte, et le lien ne permet que d'en poser
       le premier mot de passe. */
    const lien = (envoiConfigure() && courriel.enFile) ? null : lienActivation(jeton);

    return NextResponse.json(
      {
        success: true,
        courrielEnvoye: courriel.enFile,
        envoiConfigure: envoiConfigure(),
        lienActivation: lien,
        expirationActivation: expiration,
        message: (envoiConfigure() && courriel.enFile)
          ? `Le compte de ${prenom.trim()} ${nom.trim()} a été créé. Un lien d'activation vient de lui être envoyé par courriel.`
          : `Le compte de ${prenom.trim()} ${nom.trim()} a été créé. L'envoi de courriel n'étant pas configuré, transmettez-lui vous-même le lien d'activation ci-dessous.`,
        idEtudiant: etudiant.rows[0].idEtudiant
      },
      { status: 201 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});

    /* La vérification préalable ne suffit pas : entre le SELECT et
       l'INSERT, une autre requête peut avoir pris l'adresse. La
       contrainte d'unicité de la migration 008 est le seul garde-fou
       réel, et c'est ici qu'on traduit son refus en message clair
       plutôt qu'en « erreur serveur ». */
    if (estConflitEmail(error)) {
      return NextResponse.json({ error: MESSAGE_EMAIL_PRIS }, { status: 409 });
    }
    console.error('Erreur ajout étudiant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
