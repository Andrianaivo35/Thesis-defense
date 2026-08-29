import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { analyserFichier } from '@/lib/importEtudiants';
import { creerJeton, TYPE_ACTIVATION } from '@/lib/jetons';
import { envoyerLienActivation, lienActivation, envoiConfigure } from '@/lib/mail';
import { trouverOuCreerPromotion, estAnneeValide } from '@/lib/promotions';

/* =====================================================================
   POST /api/universiteImport — import d'une promotion

   DEUX ÉTAPES, VOLONTAIREMENT

     etape=analyse       lit et valide, N'ÉCRIT RIEN, renvoie le
                         récapitulatif ligne par ligne
     etape=confirmation  crée les comptes, en une seule transaction

   Un import en une passe qui échoue à la ligne 47 laisse l'université
   avec quarante-six comptes créés, deux cent quarante manquants, et
   aucun moyen de savoir lesquels. La prévisualisation n'est pas un
   confort : c'est ce qui rend l'opération réversible dans la tête de
   celui qui la lance.

   L'EMPREINTE LIE LES DEUX ÉTAPES

   La confirmation renvoie le fichier ET l'empreinte reçue à l'analyse.
   Si elles diffèrent, le fichier a changé entre les deux clics et la
   confirmation est refusée. Ce que l'université a validé est exactement
   ce qui est écrit.
   ===================================================================== */

const TAILLE_MAX = 2 * 1024 * 1024;  // 2 Mo : ~20 000 lignes, très au-delà d'une promotion

function authentifierUniversite(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Universite') return null;
  return payload;
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const payload = authentifierUniversite(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const formData = await req.formData();
    const fichier = formData.get('fichier');
    const etape = String(formData.get('etape') || 'analyse');
    const empreinteAttendue = formData.get('empreinte');
    const libellePromotion = String(formData.get('promotion') || '').trim();
    const anneePromotion = String(formData.get('annee') || '').trim();

    if (!fichier || typeof fichier.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Aucun fichier reçu.' }, { status: 400 });
    }
    if (fichier.size === 0) {
      return NextResponse.json({ error: 'Le fichier est vide.' }, { status: 400 });
    }
    if (fichier.size > TAILLE_MAX) {
      return NextResponse.json(
        { error: 'Le fichier dépasse 2 Mo. Découpez-le en plusieurs promotions.' },
        { status: 400 }
      );
    }

    const tampon = Buffer.from(await fichier.arrayBuffer());

    /* Toutes les adresses de la plateforme, pour signaler les comptes
       déjà existants avant d'écrire. Sur un corpus de cette taille, une
       seule lecture vaut mieux qu'une requête par ligne. */
    const existantes = await client.query('SELECT lower("emailUtilisateur") AS email FROM utilisateur');
    const emailsExistants = new Set(existantes.rows.map(r => r.email));

    const analyse = analyserFichier(tampon, emailsExistants);

    if (etape === 'analyse') {
      return NextResponse.json({
        etape: 'analyse',
        ...analyse,
        envoiConfigure: envoiConfigure()
      }, { status: 200 });
    }

    /* --- Confirmation --- */
    if (!analyse.valide) {
      return NextResponse.json(
        { error: analyse.erreurGlobale || 'Ce fichier ne peut pas être importé.' },
        { status: 400 }
      );
    }
    if (empreinteAttendue && empreinteAttendue !== analyse.empreinte) {
      /* L'empreinte peut différer pour deux raisons très différentes, et
         les confondre égare l'utilisateur.

         Soit le fichier a réellement changé entre les deux clics. Soit
         le fichier est identique mais la BASE a bougé : quelqu'un s'est
         inscrit entre-temps avec une des adresses, qui devient donc non
         importable et sort de l'empreinte.

         Le second cas est le plus probable en usage réel, et annoncer
         « le fichier a changé » à quelqu'un qui n'y a pas touché est
         incompréhensible. On distingue donc les deux. */
      const prises = analyse.lignes
        .filter(l => l.erreurs.some(e => e.startsWith('adresse déjà')))
        .map(l => l.email);

      const message = prises.length > 0
        ? `Depuis la prévisualisation, ${prises.length === 1
             ? "une adresse du fichier a été prise" : prises.length + " adresses du fichier ont été prises"}` +
          ` par une autre inscription : ${prises.slice(0, 3).join(', ')}` +
          `${prises.length > 3 ? ` et ${prises.length - 3} autre(s)` : ''}.` +
          " Relancez l'analyse — aucun compte n'a été créé."
        : "Le fichier a changé depuis la prévisualisation." +
          " Relancez l'analyse pour vérifier ce qui sera importé.";

      return NextResponse.json({ error: message, adressesPrises: prises }, { status: 409 });
    }

    /* La promotion est exigée à la confirmation, pas à l'analyse :
       l'université doit pouvoir vérifier son fichier avant de décider
       comment le nommer. */
    if (!libellePromotion) {
      return NextResponse.json(
        { error: 'Indiquez le nom de la promotion, par exemple « L3 Informatique ».' },
        { status: 400 }
      );
    }
    if (!estAnneeValide(anneePromotion)) {
      return NextResponse.json(
        { error: "L'année universitaire doit être de la forme « 2025-2026 »." },
        { status: 400 }
      );
    }

    const universite = await client.query(
      'SELECT "nomUniversite" FROM universite WHERE "idUniversite" = $1',
      [payload.idUniversite]
    );
    const nomUniversite = universite.rows[0]?.nomUniversite || null;

    const aImporter = analyse.lignes.filter(l => l.importable);
    const crees = [];

    await client.query('BEGIN');
    let promotion;
    try {
      /* Retrouvée si elle existe déjà : relancer le même import ne doit
         pas fabriquer une seconde « L3 Informatique 2025-2026 ». Le
         niveau et la filière viennent de la première ligne importable,
         une promotion étant par construction homogène. */
      const modele = aImporter[0] || {};
      promotion = await trouverOuCreerPromotion(client, {
        idUniversite: payload.idUniversite,
        libelle: libellePromotion,
        annee: anneePromotion,
        niveauAcademique: modele.niveau || null,
        filiere: modele.filiere || null,
        specialisation: modele.specialisation || null
      });

      for (const ligne of aImporter) {
        /* Compte inactif et sans mot de passe : c'est l'étudiant qui
           choisira le sien via le lien d'activation (Lot 6.2). Aucun
           appel à bcrypt, donc aucun problème de durée même sur une
           promotion entière. */
        const utilisateur = await client.query(
          `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur",
                                    "motDePasse", "compteActive")
           VALUES ('Etudiant', $1, NULL, false) RETURNING "idUtilisateur"`,
          [ligne.email]
        );
        const idUtilisateur = utilisateur.rows[0].idUtilisateur;

        await client.query(
          `INSERT INTO etudiant (
             "idUtilisateur", "nomEtudiant", "prenomEtudiant", "telephoneEtudiant",
             "idUniversite", "nomUniversiteSaisi", "matricule",
             "filiere", "specialisation", "niveauAcademique", "idPromotion",
             "dateInscription", "estActif", "statutRattachement", "dateRattachement"
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11, CURRENT_DATE, true, 'Valide', now())`,
          [
            idUtilisateur, ligne.nom, ligne.prenom, ligne.telephone,
            payload.idUniversite, nomUniversite, ligne.matricule,
            ligne.filiere, ligne.specialisation, ligne.niveau,
            promotion.idPromotion
          ]
        );

        const { jeton, expiration } = await creerJeton(client, idUtilisateur, TYPE_ACTIVATION);
        crees.push({
          email: ligne.email,
          nom: `${ligne.prenom} ${ligne.nom}`,
          jeton, expiration
        });
      }

      await client.query('COMMIT');
    } catch (erreur) {
      await client.query('ROLLBACK');
      /* Une adresse prise entre l'analyse et la confirmation : la
         contrainte du Lot 6.1 l'attrape, et rien n'est écrit. */
      if (erreur.code === '23505') {
        return NextResponse.json(
          {
            error: 'Une adresse du fichier vient d\'être utilisée par une autre ' +
                   'inscription. Relancez l\'analyse : aucun compte n\'a été créé.'
          },
          { status: 409 }
        );
      }
      throw erreur;
    }

    /* Les courriels partent APRÈS la transaction. Trois cents envois à
       l'intérieur la maintiendraient ouverte plusieurs minutes, et
       l'échec du dernier annulerait les deux cent quatre-vingt-dix-neuf
       comptes précédents — alors qu'ils sont parfaitement valides. */
    let envoyes = 0;
    for (const compte of crees) {
      const resultat = await envoyerLienActivation({
        to: compte.email, nom: compte.nom, nomUniversite,
        jeton: compte.jeton, expiration: compte.expiration
      });
      if (resultat.envoye) envoyes++;
    }

    return NextResponse.json({
      etape: 'confirmation',
      success: true,
      comptesCrees: crees.length,
      promotion: { idPromotion: promotion.idPromotion,
                   libelle: promotion.libelle, annee: promotion.annee },
      courrielsEnvoyes: envoyes,
      envoiConfigure: envoiConfigure(),
      /* Tant que l'envoi n'est pas branché (Lot 6.6), les liens sont
         rendus à l'université — authentifiée, et créatrice de ces
         comptes — pour qu'elle les transmette. Sans eux, la promotion
         entière serait créée et inaccessible. */
      liens: envoyes === crees.length ? null : crees.map(c => ({
        nom: c.nom, email: c.email, lien: lienActivation(c.jeton)
      })),
      message: envoyes === crees.length
        ? `${crees.length} comptes créés dans la promotion « ${promotion.libelle} — ${promotion.annee} ». Chaque étudiant a reçu son lien d'activation.`
        : `${crees.length} comptes créés dans la promotion « ${promotion.libelle} — ${promotion.annee} ». L'envoi de courriel n'étant pas configuré, ` +
          `transmettez les liens ci-dessous à vos étudiants.`
    }, { status: 201 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur import de promotion :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
