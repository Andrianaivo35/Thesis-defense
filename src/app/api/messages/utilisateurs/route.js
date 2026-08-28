import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import {
  lireParametresPagination, lireRecherche, construirePagination
} from '@/lib/pagination';

/* =====================================================================
   GET : liste paginée des utilisateurs joignables par messagerie

   L'adresse e-mail a été retirée de la réponse : la route exposait
   l'annuaire complet des e-mails de la plateforme à tout utilisateur
   authentifié. L'écran de messagerie n'en a pas besoin.

   Paramètres : ?page=1&taille=20&recherche=telma
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const monIdUtilisateur = payload.idUtilisateur;
    const { page, taille, offset } = lireParametresPagination(req);
    const recherche = lireRecherche(req);

    const nomAffichage = `COALESCE(
      ent."nomEntreprise",
      univ."nomUniversite",
      et."prenomEtudiant" || ' ' || et."nomEtudiant"
    )`;

    const parametres = [monIdUtilisateur];
    let filtreRecherche = '';
    if (recherche) {
      parametres.push(`%${recherche}%`);
      filtreRecherche = `AND ${nomAffichage} ILIKE $2`;
    }
    const i = parametres.length + 1;
    parametres.push(taille, offset);

    const result = await client.query(`
      SELECT
        u."idUtilisateur",
        u."typeUtilisateur",
        ${nomAffichage} AS "nomAffichage",
        COALESCE(ent."logo", univ."logo", et."photoProfil") AS "photo",
        COUNT(*) OVER() AS "totalResultats"
      FROM utilisateur u
      LEFT JOIN entreprise ent ON u."idUtilisateur" = ent."idUtilisateur"
      LEFT JOIN universite univ ON u."idUtilisateur" = univ."idUtilisateur"
      LEFT JOIN etudiant et ON u."idUtilisateur" = et."idUtilisateur"
      WHERE u."idUtilisateur" != $1
        AND u."typeUtilisateur" != 'Admin'
        ${filtreRecherche}
      ORDER BY "nomAffichage" ASC, u."idUtilisateur" ASC
      LIMIT $${i} OFFSET $${i + 1}
    `, parametres);

    return NextResponse.json(
      {
        utilisateurs: result.rows.map(({ totalResultats, ...ligne }) => ligne),
        pagination: construirePagination({
          page, taille, total: result.rows[0]?.totalResultats ?? 0
        })
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur liste utilisateurs:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
