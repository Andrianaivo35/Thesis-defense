import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { obtenirMatrice } from '@/lib/cooccurrence';
import { evaluerCouple, SEUIL_MINIMUM_APPARIEMENT } from '@/lib/appariement';

/* =====================================================================
   GET : recommandations d'offres pour l'étudiant connecté

   Le calcul de score vit dans src/lib/appariement.js, partagé avec la
   route inverse (/api/offreCandidats) : une seule mesure, lue depuis les
   deux extrémités.
   ===================================================================== */

const NOMBRE_MAX = 10;

/* =====================================================================
   GET : générer et renvoyer les recommandations de l'étudiant connecté
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

    /* ---------- 1. Profil de l'étudiant ---------- */
    const etudiantResult = await client.query(`
      SELECT "idEtudiant", "filiere", "specialisation", "niveauAcademique"
      FROM etudiant
      WHERE "idEtudiant" = $1
    `, [idEtudiant]);

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }
    const etudiant = etudiantResult.rows[0];

    /* ---------- 2. Compétences, préférences, centres d'intérêt ---------- */
    const [competencesResult, preferenceResult, interetsResult] = await Promise.all([
      client.query(`
        SELECT ce."idCompetenceReference", ce."niveau", cr."nomCompetenceReference"
        FROM "CompetenceEtudiant" ce
        JOIN "CompetenceReference" cr
          ON cr."idCompetenceReference" = ce."idCompetenceReference"
        WHERE ce."idEtudiant" = $1
      `, [idEtudiant]),

      client.query(`
        SELECT * FROM "preference-stage" WHERE "idEtudiant" = $1
      `, [idEtudiant]),

      client.query(`
        SELECT "domaineInteret", "missionPreferee"
        FROM "centre-interet" WHERE "idEtudiant" = $1
      `, [idEtudiant])
    ]);

    const competencesEtudiant = competencesResult.rows;
    const preference = preferenceResult.rows[0] || null;
    const centresInteret = interetsResult.rows;

    /* ---------- 3. Offres candidates ----------
       Attention : la colonne s'appelle "dateLimites" (avec un s). */
    const offresResult = await client.query(`
      SELECT
        o.*,
        e."nomEntreprise",
        e."logo" AS "logoEntreprise"
      FROM offre o
      JOIN entreprise e ON e."idEntreprise" = o."idEntreprise"
      WHERE (o."statut" IS NULL OR o."statut" = 'Active')
        AND (o."dateLimites" IS NULL OR o."dateLimites" >= CURRENT_DATE)
        AND NOT EXISTS (
          SELECT 1 FROM "Candidature" c
          WHERE c."idOffre" = o."idOffre" AND c."idEtudiant" = $1
        )
    `, [idEtudiant]);

    const offres = offresResult.rows;

    const profilComplet = {
      aCompetences: competencesEtudiant.length > 0,
      aPreferences: Boolean(preference),
      aInterets: centresInteret.length > 0
    };

    if (offres.length === 0) {
      return NextResponse.json({ recommandations: [], profilComplet }, { status: 200 });
    }

    /* ---------- 4. Compétences exigées par ces offres ----------
       Attention : la colonne s'appelle "niveauSouhaitee" (avec un e). */
    const idsOffres = offres.map(o => o.idOffre);
    const competencesOffresResult = await client.query(`
      SELECT co."idOffre", co."idCompetenceReference", co."niveauSouhaitee",
             co."estObligatoire", cr."nomCompetenceReference"
      FROM "CompetenceOffre" co
      JOIN "CompetenceReference" cr
        ON cr."idCompetenceReference" = co."idCompetenceReference"
      WHERE co."idOffre" = ANY($1::int[])
    `, [idsOffres]);

    const competencesParOffre = new Map();
    for (const c of competencesOffresResult.rows) {
      const cle = String(c.idOffre);
      if (!competencesParOffre.has(cle)) competencesParOffre.set(cle, []);
      competencesParOffre.get(cle).push(c);
    }

    /* ---------- 5. Matrice de co-occurrence ----------
       Mise en cache : elle ne change qu'avec les compétences déclarées.
       Un échec de construction ne doit pas empêcher la recommandation —
       le moteur retombe alors sur la correspondance exacte. */
    let matrice = null;
    try {
      matrice = await obtenirMatrice(client);
    } catch (erreurMatrice) {
      console.error('Matrice de co-occurrence indisponible :', erreurMatrice.message);
    }

    /* ---------- 6. Calcul des scores ----------
       Le calcul est délégué à lib/appariement : c'est la même mesure que
       celle utilisée par /api/offreCandidats dans l'autre sens. */
    const evaluees = offres.map(offre => {
      const resultat = evaluerCouple({
        offre,
        etudiant,
        competencesOffre: competencesParOffre.get(String(offre.idOffre)) || [],
        competencesEtudiant,
        preference,
        centresInteret,
        matrice
      });
      return { offre, ...resultat };
    });

    const retenues = evaluees
      .filter(e => e.global >= SEUIL_MINIMUM_APPARIEMENT)
      .sort((a, b) => b.global - a.global)
      .slice(0, NOMBRE_MAX);

    /* ---------- 7. Enregistrement (historique + traçabilité) ---------- */
    await client.query('BEGIN');
    await client.query('DELETE FROM recommandation WHERE "idEtudiant" = $1', [idEtudiant]);

    for (const r of retenues) {
      await client.query(`
        INSERT INTO recommandation (
          "idEtudiant", "idOffre", "scoresGlobal", "scoresCompetence",
          "scoresFiliere", "scoreNiveau", "scoreLocalisation",
          "scorePreference", "dateGeneration"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `, [
        idEtudiant, r.offre.idOffre, r.global,
        r.scores.competence, r.scores.filiere, r.scores.niveau,
        r.scores.localisation, r.scores.preference
      ]);
    }
    await client.query('COMMIT');

    /* ---------- 7. Réponse ---------- */
    return NextResponse.json({
      recommandations: retenues.map(r => ({
        ...r.offre,
        score: r.global,
        raisons: r.raisons,
        detailScores: r.scores
      })),
      profilComplet
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur GET recommandations:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}