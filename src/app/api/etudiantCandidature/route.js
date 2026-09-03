import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   GET : les candidatures de l'étudiant connecté

   Cette route n'existait pas : un étudiant pouvait constituer un dossier
   complet (CV, lettre de motivation, QCM chronométré) sans jamais pouvoir
   consulter ensuite l'état de sa candidature. C'était la boucle principale
   de l'application qui restait ouverte.
   ===================================================================== */
export async function GET(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;

    const result = await client.query(`
      SELECT
        c."idCandidature",
        c."dateCandidature",
        c."statut",
        c."noteQCM",
        o."idOffre",
        o."titre"        AS "titreOffre",
        o."domaine",
        o."ville",
        o."typeStage",
        o."duree",
        o."statut"       AS "statutOffre",
        o."dateLimites",
        ent."idEntreprise",
        ent."nomEntreprise",
        ent."logo"       AS "logoEntreprise",
        ent."estVerifie" AS "entrepriseVerifiee",
        entU."idUtilisateur" AS "idUtilisateurEntreprise",
        COALESCE(
          (SELECT json_agg(
              json_build_object(
                'idDocument', d."idDocument",
                'nomFichierOriginal', d."nomFichierOriginal",
                'dateAjout', d."dateAjout"
              ) ORDER BY d."dateAjout"
            )
           FROM "DocumentCandidature" d
           WHERE d."idCandidature" = c."idCandidature"),
          '[]'::json
        ) AS documents
      FROM "Candidature" c
      INNER JOIN offre o        ON o."idOffre" = c."idOffre"
      INNER JOIN entreprise ent ON ent."idEntreprise" = o."idEntreprise"
      LEFT JOIN utilisateur entU ON entU."idUtilisateur" = ent."idUtilisateur"
      WHERE c."idEtudiant" = $1
      ORDER BY c."dateCandidature" DESC
    `, [idEtudiant]);

    const candidatures = result.rows;

    // Répartition par statut, pour l'affichage des compteurs
    const statistiques = {
      total: candidatures.length,
      enAttente: candidatures.filter(c => c.statut === 'En attente').length,
      recrutees: candidatures.filter(c => c.statut === 'Recruté').length,
      refusees: candidatures.filter(c => c.statut === 'Refusé').length
    };

    return NextResponse.json(
      { candidatures, statistiques },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur candidatures étudiant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
