import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = await pool.connect();

  try {
    // Récupère toutes les entreprises vérifiées + nombre d'offres actives
    const result = await client.query(`
      SELECT 
        e."idEntreprise",
        e."nomEntreprise",
        e."secteurActivitePrincipal",
        e."formeJuridique",
        e."description",
        e."logo",
        e."adresseSiegeSocial",
        e."siteWeb",
        e."estVerifie",
        e."dateInscription",
        COUNT(o."idOffre") FILTER (WHERE o."statut" = 'Active') AS "nombreOffresActives"
      FROM entreprise e
      LEFT JOIN offre o ON o."idEntreprise" = e."idEntreprise"
      GROUP BY e."idEntreprise"
      ORDER BY e."nomEntreprise" ASC
    `);

    return NextResponse.json(
      { entreprises: result.rows },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur liste entreprises:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}