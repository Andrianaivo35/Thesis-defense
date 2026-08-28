import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { verifyToken } from '@/lib/jwt';
import { validerMotDePasse } from '@/lib/motDePasse';

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
      nom, prenom, email, motDePasse,
      matricule, niveauAcademique, filiere, specialisation, telephone
    } = await req.json();

    if (!nom?.trim() || !prenom?.trim() || !email?.trim()) {
      return NextResponse.json(
        { error: 'Le nom, le prénom et l\'adresse e-mail sont obligatoires' },
        { status: 400 }
      );
    }

    const erreurMotDePasse = validerMotDePasse(motDePasse);
    if (erreurMotDePasse) {
      return NextResponse.json({ error: erreurMotDePasse }, { status: 400 });
    }

    const emailNormalise = email.trim().toLowerCase();

    const dejaPris = await client.query(
      'SELECT 1 FROM utilisateur WHERE LOWER("emailUtilisateur") = $1',
      [emailNormalise]
    );
    if (dejaPris.rows.length > 0) {
      return NextResponse.json(
        { error: 'Un compte existe déjà avec cette adresse e-mail' },
        { status: 409 }
      );
    }

    const hash = await bcrypt.hash(motDePasse, 10);

    await client.query('BEGIN');

    const utilisateur = await client.query(
      `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur", "motDePasse")
       VALUES ('Etudiant', $1, $2) RETURNING "idUtilisateur"`,
      [emailNormalise, hash]
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

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: `Le compte de ${prenom.trim()} ${nom.trim()} a été créé et rattaché à votre établissement.`,
        idEtudiant: etudiant.rows[0].idEtudiant
      },
      { status: 201 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur ajout étudiant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
