import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import {
  lireParametresPagination, lireRecherche, construirePagination
} from '@/lib/pagination';

/* =====================================================================
   GET : liste paginée des entreprises

   Colonnes explicites à la place du SELECT * : celui-ci renvoyait aussi
   le logo, stocké en base64, ainsi que les numéros fiscaux — sur une
   route publique et sans authentification.

   Paramètres : ?page=1&taille=20&recherche=telma
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();
  try {
    const { page, taille, offset } = lireParametresPagination(req);
    const recherche = lireRecherche(req);

    const filtre = recherche
      ? `WHERE (e."nomEntreprise" ILIKE $1
                OR e."secteurActivitePrincipal" ILIKE $1
                OR e."description" ILIKE $1)`
      : '';

    const parametres = recherche ? [`%${recherche}%`] : [];
    const i = parametres.length + 1;
    parametres.push(taille, offset);

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
        COUNT(*) OVER() AS "totalResultats"
      FROM entreprise e
      ${filtre}
      ORDER BY e."nomEntreprise" ASC, e."idEntreprise" ASC
      LIMIT $${i} OFFSET $${i + 1}
    `, parametres);

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
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
