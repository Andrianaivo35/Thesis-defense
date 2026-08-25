import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT  
        o.*,
        e."nomEntreprise",
        e."logo" AS "logoEntreprise",
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
      WHERE o."statut" = 'Active'
      GROUP BY o."idOffre", e."nomEntreprise", e."logo"
      ORDER BY o."datePublication" DESC
    `);

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