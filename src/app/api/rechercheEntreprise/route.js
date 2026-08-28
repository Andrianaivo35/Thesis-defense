import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  lireParametresPagination, construirePagination
} from '@/lib/pagination';

export async function GET(req) {
  const client = await pool.connect();

  try {
    const { page, taille, offset } = lireParametresPagination(req);
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
        COUNT(o."idOffre") FILTER (WHERE o."statut" = 'Active') AS "nombreOffresActives",
        COUNT(*) OVER() AS "totalResultats"
      FROM entreprise e
      LEFT JOIN offre o ON o."idEntreprise" = e."idEntreprise"
      GROUP BY e."idEntreprise"
      ORDER BY e."nomEntreprise" ASC, e."idEntreprise" ASC
      LIMIT $1 OFFSET $2
    `, [taille, offset]);

    return NextResponse.json(
      {
        entreprises: result.rows.map(({ totalResultats, ...ligne }) => ligne),
        pagination: construirePagination({
          page, taille, total: result.rows[0]?.totalResultats ?? 0
        })
      },
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