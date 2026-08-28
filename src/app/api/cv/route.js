import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { enregistrerFichier, validerFichierPdf } from '@/lib/stockage';

const NOMBRE_MAX_CV = 5;

function authentifierEtudiant(req) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Etudiant') return null;
  return payload;
}

/* =====================================================================
   GET : la bibliothèque de CV de l'étudiant connecté
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const result = await client.query(`
      SELECT
        cv."idCV", cv."libelle", cv."nomFichierOriginal", cv."tailleOctets",
        cv."estPrincipal", cv."dateAjout",
        (SELECT COUNT(*) FROM "Candidature" c WHERE c."idCV" = cv."idCV")
          AS "nombreCandidatures"
      FROM "CV" cv
      WHERE cv."idEtudiant" = $1
      ORDER BY cv."estPrincipal" DESC, cv."dateAjout" DESC
    `, [payload.idEtudiant]);

    return NextResponse.json({ cvs: result.rows }, { status: 200 });

  } catch (error) {
    console.error('Erreur liste CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

/* =====================================================================
   POST : ajouter un CV à la bibliothèque (multipart/form-data)
   Champs attendus : fichier, libelle
   ===================================================================== */
export async function POST(req) {
  const client = await pool.connect();
  try {
    const payload = authentifierEtudiant(req);
    if (!payload) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const idEtudiant = payload.idEtudiant;
    const formData = await req.formData();
    const fichier = formData.get('fichier');
    const libelle = (formData.get('libelle') || '').toString().trim();

    if (!libelle) {
      return NextResponse.json(
        { error: 'Veuillez donner un nom à ce CV (ex. « CV Développement web »)' },
        { status: 400 }
      );
    }

    const erreurFichier = validerFichierPdf(fichier, 'Le CV');
    if (erreurFichier) {
      return NextResponse.json({ error: erreurFichier }, { status: 400 });
    }

    // Limite volontaire : une bibliothèque, pas un espace de stockage
    const compte = await client.query(
      'SELECT COUNT(*)::int AS total FROM "CV" WHERE "idEtudiant" = $1',
      [idEtudiant]
    );
    if (compte.rows[0].total >= NOMBRE_MAX_CV) {
      return NextResponse.json(
        { error: `Vous ne pouvez pas conserver plus de ${NOMBRE_MAX_CV} CV. Supprimez-en un avant d'en ajouter un nouveau.` },
        { status: 400 }
      );
    }

    /* Le fichier est écrit avant la transaction : en cas d'échec de
       l'insertion, on le supprime explicitement plus bas pour ne pas
       laisser de fichier orphelin sur le volume. */
    const nomFichier = await enregistrerFichier('cv', fichier, 'cv');

    try {
      await client.query('BEGIN');

      // Le premier CV déposé devient automatiquement le CV principal
      const estPremier = compte.rows[0].total === 0;

      const result = await client.query(`
        INSERT INTO "CV" (
          "idEtudiant", "libelle", "nomFichier", "nomFichierOriginal",
          "tailleOctets", "estPrincipal"
        ) VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING "idCV", "libelle", "estPrincipal", "dateAjout"
      `, [
        idEtudiant, libelle, nomFichier,
        fichier.name || null, fichier.size, estPremier
      ]);

      await client.query('COMMIT');

      return NextResponse.json(
        { success: true, message: 'CV ajouté à votre bibliothèque', cv: result.rows[0] },
        { status: 201 }
      );

    } catch (erreurBase) {
      await client.query('ROLLBACK').catch(() => {});
      // Pas de fichier orphelin si l'enregistrement en base a échoué
      const { supprimerFichier } = await import('@/lib/stockage');
      await supprimerFichier('cv', nomFichier);
      throw erreurBase;
    }

  } catch (error) {
    console.error('Erreur ajout CV:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
