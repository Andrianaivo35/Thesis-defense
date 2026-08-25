import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req, { params }) {
  const { idOffre } = await params;  // Next.js 15 : params est async
  const client = await pool.connect();

  try {
    // === Authentification : étudiant uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;

    // === Vérifier si l'étudiant a déjà postulé ===
    const dejaPostule = await client.query(
      `SELECT "idCandidature" FROM "Candidature"
       WHERE "idEtudiant" = $1 AND "idOffre" = $2`,
      [idEtudiant, idOffre]
    );

    if (dejaPostule.rows.length > 0) {
      return NextResponse.json(
        { error: 'Vous avez déjà postulé à cette offre', alreadyApplied: true },
        { status: 409 }
      );
    }

    // === Infos de l'offre + entreprise ===
    const offreResult = await client.query(
      `SELECT o."idOffre", o."titre", o."description",
              e."nomEntreprise", e."logo" AS "logoEntreprise"
       FROM offre o
       INNER JOIN entreprise e ON o."idEntreprise" = e."idEntreprise"
       WHERE o."idOffre" = $1`,
      [idOffre]
    );

    if (offreResult.rows.length === 0) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 });
    }

    // === Infos du QCM ===
    const qcmResult = await client.query(
      `SELECT "idQCM", "titre", "description", "duree", "noteMinimal"
       FROM "QCM"
       WHERE "idOffre" = $1 AND "estActif" = true`,
      [idOffre]
    );

    if (qcmResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Aucun QCM actif pour cette offre' },
        { status: 404 }
      );
    }

    const qcm = qcmResult.rows[0];

    // === Questions + choix (SANS estCorrect) ===
    const questionsResult = await client.query(
      `SELECT
        q."idQuestion", q."enonce", q."ordre", q."points",
        COALESCE(
          json_agg(
            json_build_object(
              'idChoix', c."idChoix",
              'enonce', c."enonce",
              'ordre', c."ordre"
            ) ORDER BY c."ordre"
          ) FILTER (WHERE c."idChoix" IS NOT NULL),
          '[]'::json
        ) AS choix
      FROM "Question" q
      LEFT JOIN "ChoixReponse" c ON q."idQuestion" = c."idQuestion"
      WHERE q."idQCM" = $1
      GROUP BY q."idQuestion"
      ORDER BY q."ordre"`,
      [qcm.idQCM]
    );

    return NextResponse.json(
      {
        offre: offreResult.rows[0],
        qcm,
        questions: questionsResult.rows
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur GET QCM:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}