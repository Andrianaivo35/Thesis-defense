import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   GET : liste des offres actives

   Route volontairement publique : un visiteur non connecté doit pouvoir
   consulter les offres. Le jeton est donc lu s'il est présent, sans être
   exigé — il sert uniquement à indiquer à un étudiant connecté les offres
   auxquelles il a déjà postulé, information qu'il ne découvrait
   auparavant qu'après avoir ouvert le QCM (erreur 409).
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;
    const idEtudiant =
      payload?.typeUtilisateur === 'Etudiant' ? payload.idEtudiant : null;

    const result = await client.query(`
      SELECT
        o.*,
        e."nomEntreprise",
        e."logo" AS "logoEntreprise",
        cand."idCandidature" IS NOT NULL AS "dejaPostule",
        cand."statut" AS "statutCandidature",
        COALESCE(
          json_agg(
            json_build_object(
              'nom', cr."nomCompetenceReference",
              'categorie', cr."categorieCompetenceReference",
              'niveauSouhaitee', co."niveauSouhaitee",
              'estObligatoire', co."estObligatoire"
            )
          ) FILTER (WHERE cr."idCompetenceReference" IS NOT NULL),
          '[]'::json
        ) AS competences
      FROM offre o
      INNER JOIN entreprise e ON o."idEntreprise" = e."idEntreprise"
      LEFT JOIN "CompetenceOffre" co ON o."idOffre" = co."idOffre"
      LEFT JOIN "CompetenceReference" cr ON co."idCompetenceReference" = cr."idCompetenceReference"
      LEFT JOIN "Candidature" cand
        ON cand."idOffre" = o."idOffre" AND cand."idEtudiant" = $1
      WHERE o."statut" = 'Active'
      GROUP BY o."idOffre", e."nomEntreprise", e."logo",
               cand."idCandidature", cand."statut"
      ORDER BY o."datePublication" DESC
    `, [idEtudiant]);

    return NextResponse.json(
      { offres: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur listeOffre:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}