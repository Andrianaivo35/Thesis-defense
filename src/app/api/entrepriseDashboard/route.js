import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   GET : tableau de bord de l'entreprise connectée

   Il n'existait aucun tableau de bord entreprise, alors que l'admin et
   l'université en ont un — et que l'entreprise est le rôle le plus actif.
   Cette absence provoquait deux liens morts : la redirection après
   publication d'une offre, et le logo du menu.
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;

    // Compteurs, en une seule requête plutôt qu'un aller-retour par indicateur
    const stats = await client.query(`
      SELECT
        COUNT(DISTINCT o."idOffre")::int AS "offresTotal",
        COUNT(DISTINCT o."idOffre") FILTER (WHERE o."statut" = 'Active')::int
          AS "offresActives",
        COUNT(DISTINCT c."idCandidature")::int AS "candidaturesTotal",
        COUNT(DISTINCT c."idCandidature") FILTER (WHERE c."statut" = 'En attente')::int
          AS "candidaturesEnAttente",
        COUNT(DISTINCT c."idCandidature") FILTER (WHERE c."statut" = 'Recruté')::int
          AS "candidaturesRetenues"
      FROM offre o
      LEFT JOIN "Candidature" c ON c."idOffre" = o."idOffre"
      WHERE o."idEntreprise" = $1
    `, [idEntreprise]);

    // Offres les plus récentes, avec leur nombre de candidatures
    const offres = await client.query(`
      SELECT
        o."idOffre", o."titre", o."domaine", o."ville", o."statut",
        o."datePublication", o."dateLimites",
        COUNT(c."idCandidature")::int AS "nombreCandidatures"
      FROM offre o
      LEFT JOIN "Candidature" c ON c."idOffre" = o."idOffre"
      WHERE o."idEntreprise" = $1
      GROUP BY o."idOffre"
      ORDER BY o."datePublication" DESC, o."idOffre" DESC
      LIMIT 5
    `, [idEntreprise]);

    // Dernières candidatures reçues
    const candidatures = await client.query(`
      SELECT
        c."idCandidature", c."dateCandidature", c."statut",
        c."noteQCM",
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant",
        o."titre" AS "titreOffre"
      FROM "Candidature" c
      INNER JOIN offre o ON o."idOffre" = c."idOffre"
      INNER JOIN etudiant e ON e."idEtudiant" = c."idEtudiant"
      WHERE o."idEntreprise" = $1
      ORDER BY c."dateCandidature" DESC
      LIMIT 5
    `, [idEntreprise]);

    return NextResponse.json({
      statistiques: stats.rows[0],
      offresRecentes: offres.rows,
      candidaturesRecentes: candidatures.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur tableau de bord entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
