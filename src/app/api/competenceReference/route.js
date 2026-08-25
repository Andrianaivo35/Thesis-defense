import pool from '@/lib/db';
import { NextResponse } from 'next/server';

/* =====================================================================
   GET : liste du référentiel de compétences
   Route publique : elle sert aussi bien au formulaire d'inscription
   (utilisateur pas encore connecté) qu'à la modification de profil.
   ===================================================================== */
export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT
        "idCompetenceReference",
        "nomCompetenceReference",
        "categorieCompetenceReference",
        "description"
      FROM "CompetenceReference"
      ORDER BY "categorieCompetenceReference" ASC, "nomCompetenceReference" ASC
    `);

    return NextResponse.json({ competences: result.rows }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET competenceReference:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}