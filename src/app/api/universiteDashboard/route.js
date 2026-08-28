import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   GET : statistiques du tableau de bord université

   La page affichait un encart « Statistiques détaillées à venir » : elle
   existait, mais son contenu principal était une promesse non tenue.
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;

    const effectifs = await client.query(`
      SELECT
        COUNT(*) FILTER (WHERE e."statutRattachement" = 'Valide')::int
          AS "etudiantsValides",
        COUNT(*) FILTER (WHERE e."statutRattachement" = 'En attente')::int
          AS "demandesEnAttente",
        COUNT(*) FILTER (WHERE e."estActif")::int AS "comptesActifs"
      FROM etudiant e
      WHERE e."idUniversite" = $1
    `, [idUniversite]);

    /* Candidatures et placements des étudiants rattachés et validés : un
       étudiant en attente de validation ne doit pas peser dans les
       indicateurs de l'établissement. */
    const activite = await client.query(`
      SELECT
        COUNT(c."idCandidature")::int AS "candidaturesTotal",
        COUNT(c."idCandidature") FILTER (WHERE c."statut" = 'Recruté')::int
          AS "placements"
      FROM etudiant e
      LEFT JOIN "Candidature" c ON c."idEtudiant" = e."idEtudiant"
      WHERE e."idUniversite" = $1
        AND e."statutRattachement" = 'Valide'
    `, [idUniversite]);

    const cohortes = await client.query(`
      SELECT COUNT(*)::int AS "annoncesActives"
      FROM "AnnonceCohorte"
      WHERE "idUniversite" = $1 AND ("statut" IS NULL OR "statut" = 'Active')
    `, [idUniversite]);

    return NextResponse.json({
      statistiques: {
        ...effectifs.rows[0],
        ...activite.rows[0],
        ...cohortes.rows[0]
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur tableau de bord université:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
