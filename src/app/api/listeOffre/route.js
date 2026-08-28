import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import {
  lireParametresPagination, lireRecherche, construirePagination
} from '@/lib/pagination';

/* =====================================================================
   GET : liste paginée des offres actives

   Route volontairement publique : un visiteur non connecté doit pouvoir
   consulter les offres. Le jeton est donc lu s'il est présent, sans être
   exigé — il sert uniquement à indiquer à un étudiant connecté les offres
   auxquelles il a déjà postulé.

   La recherche s'effectue désormais côté serveur. Elle était auparavant
   réalisée dans le navigateur, sur la totalité des offres téléchargées, et
   ne portait pas sur les compétences — pourtant le critère le plus
   pertinent pour un étudiant.

   Paramètres : ?page=1&taille=20&recherche=react
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = token ? verifyToken(token) : null;
    const idEtudiant =
      payload?.typeUtilisateur === 'Etudiant' ? payload.idEtudiant : null;

    const { page, taille, offset } = lireParametresPagination(req);
    const recherche = lireRecherche(req);

    /* La recherche porte sur les champs de l'offre, le nom de l'entreprise
       et les compétences requises. Le test sur les compétences passe par
       EXISTS plutôt que par la jointure d'agrégation : sinon une offre ne
       remonterait qu'avec les seules compétences correspondantes. */
    const filtreRecherche = recherche
      ? `AND (
           o."titre" ILIKE $2 OR o."description" ILIKE $2
           OR o."domaine" ILIKE $2 OR o."ville" ILIKE $2
           OR e."nomEntreprise" ILIKE $2
           OR EXISTS (
             SELECT 1 FROM "CompetenceOffre" cof
             INNER JOIN "CompetenceReference" cref
               ON cref."idCompetenceReference" = cof."idCompetenceReference"
             WHERE cof."idOffre" = o."idOffre"
               AND cref."nomCompetenceReference" ILIKE $2
           )
         )`
      : '';

    const parametres = [idEtudiant];
    if (recherche) parametres.push(`%${recherche}%`);
    const indexTaille = parametres.length + 1;
    parametres.push(taille, offset);

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
        ) AS competences,
        COUNT(*) OVER() AS "totalResultats"
      FROM offre o
      INNER JOIN entreprise e ON o."idEntreprise" = e."idEntreprise"
      LEFT JOIN "CompetenceOffre" co ON o."idOffre" = co."idOffre"
      LEFT JOIN "CompetenceReference" cr ON co."idCompetenceReference" = cr."idCompetenceReference"
      LEFT JOIN "Candidature" cand
        ON cand."idOffre" = o."idOffre" AND cand."idEtudiant" = $1
      WHERE o."statut" = 'Active'
        ${filtreRecherche}
      GROUP BY o."idOffre", e."nomEntreprise", e."logo",
               cand."idCandidature", cand."statut"
      /* Le second critère est indispensable : de nombreuses offres partagent
         la même date de publication, et sans départage déterministe l'ordre
         peut varier d'une requête à l'autre — deux pages successives
         renverraient alors des offres en double. */
      ORDER BY o."datePublication" DESC, o."idOffre" DESC
      LIMIT $${indexTaille} OFFSET $${indexTaille + 1}
    `, parametres);

    /* COUNT(*) OVER() est calculé après le GROUP BY : il compte donc bien
       les offres distinctes, pas les lignes de jointure. */
    const total = result.rows[0]?.totalResultats ?? 0;
    const offres = result.rows.map(({ totalResultats, ...offre }) => offre);

    return NextResponse.json(
      { offres, pagination: construirePagination({ page, taille, total }) },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur listeOffre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}