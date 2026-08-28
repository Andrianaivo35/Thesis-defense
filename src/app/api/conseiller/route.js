import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { obtenirMatrice } from '@/lib/cooccurrence';
import { evaluerCouple, SEUIL_MINIMUM_APPARIEMENT } from '@/lib/appariement';

/* =====================================================================
   GET : conseiller — quelles compétences acquérir en priorité ?

   Le moteur classait les offres ; il ne disait rien de ce que l'étudiant
   pouvait faire pour améliorer sa situation. Cette route le transforme de
   classeur en conseiller.

   Principe : raisonnement contrefactuel par force brute. Aucun nouvel
   algorithme — on réutilise `evaluerCouple`, exactement le scoreur des
   deux autres routes, mais exécuté sur un profil hypothétique.

     1. on calcule la situation de référence (profil réel) ;
     2. pour chaque compétence que l'étudiant ne possède pas, on recalcule
        l'ensemble des offres comme s'il la maîtrisait ;
     3. on mesure l'écart : offres nouvellement accessibles, progression
        du score moyen, meilleure offre débloquée.

   C'est cette réutilisation qui rend le conseil crédible : la
   recommandation affichée et la simulation reposent sur exactement la
   même mesure. Un second calcul, même proche, produirait des conseils que
   les recommandations ne confirmeraient pas.
   ===================================================================== */

/* Niveau supposé pour une compétence simulée. « Intermédiaire » plutôt
   qu'« Avancé » : le conseil doit refléter ce qu'une formation
   raisonnable permet d'atteindre, pas une maîtrise experte. */
const NIVEAU_SIMULE = 'Intermédiaire';

/* Nombre de suggestions renvoyées. Au-delà, le conseil cesse d'être
   actionnable : un étudiant ne se forme pas à quinze compétences. */
const NOMBRE_SUGGESTIONS = 5;

/* Score à partir duquel une offre constitue une opportunité réelle.

   Le seuil d'éligibilité (35) est celui de l'affichage : il indique qu'une
   offre n'est pas totalement hors sujet. Il ne suffit pas à fonder un
   conseil.

   Constaté lors de la première version : en classant les suggestions par
   nombre d'offres franchissant 35, le conseiller recommandait
   « Communication » à une développeuse web — ce qui débloquait cinq
   offres d'assurance et de gestion de sinistres, tout en faisant *baisser*
   son score moyen de 57 à 55. Techniquement exact, concrètement inutile :
   ces offres n'étaient accessibles que de justesse et sans rapport avec
   son profil.

   On ne compte donc comme débloquée qu'une offre atteignant un score
   réellement prometteur. */
const SEUIL_OPPORTUNITE = 60;

/* Nombre d'offres constituant les cibles réalistes d'un étudiant. La
   progression se mesure sur celles-ci, et non sur la moyenne de toutes
   les offres éligibles : ajouter des offres faibles diluait la moyenne et
   pénalisait les conseils pertinents. */
const CIBLES_REALISTES = 10;

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

    const etudiantResult = await client.query(`
      SELECT "idEtudiant", "filiere", "specialisation", "niveauAcademique"
      FROM etudiant WHERE "idEtudiant" = $1
    `, [idEtudiant]);

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }
    const etudiant = etudiantResult.rows[0];

    const [competencesResult, preferenceResult, interetsResult, referentielResult] =
      await Promise.all([
        client.query(`
          SELECT ce."idCompetenceReference", ce."niveau", cr."nomCompetenceReference"
          FROM "CompetenceEtudiant" ce
          INNER JOIN "CompetenceReference" cr
            ON cr."idCompetenceReference" = ce."idCompetenceReference"
          WHERE ce."idEtudiant" = $1
        `, [idEtudiant]),
        client.query(`SELECT * FROM "preference-stage" WHERE "idEtudiant" = $1`, [idEtudiant]),
        client.query(`
          SELECT "domaineInteret", "missionPreferee"
          FROM "centre-interet" WHERE "idEtudiant" = $1
        `, [idEtudiant]),
        client.query(`
          SELECT "idCompetenceReference", "nomCompetenceReference",
                 "categorieCompetenceReference"
          FROM "CompetenceReference"
        `)
      ]);

    const competencesEtudiant = competencesResult.rows;
    const preference = preferenceResult.rows[0] || null;
    const centresInteret = interetsResult.rows;

    // Offres candidates : actives, non expirées, non déjà postulées
    const offresResult = await client.query(`
      SELECT o.*, e."nomEntreprise"
      FROM offre o
      INNER JOIN entreprise e ON e."idEntreprise" = o."idEntreprise"
      WHERE (o."statut" IS NULL OR o."statut" = 'Active')
        AND (o."dateLimites" IS NULL OR o."dateLimites" >= CURRENT_DATE)
        AND NOT EXISTS (
          SELECT 1 FROM "Candidature" c
          WHERE c."idOffre" = o."idOffre" AND c."idEtudiant" = $1
        )
    `, [idEtudiant]);
    const offres = offresResult.rows;

    if (offres.length === 0) {
      return NextResponse.json(
        { situationActuelle: null, suggestions: [], message: 'Aucune offre à analyser.' },
        { status: 200 }
      );
    }

    const idsOffres = offres.map(o => o.idOffre);
    const competencesOffresResult = await client.query(`
      SELECT co."idOffre", co."idCompetenceReference", co."niveauSouhaitee",
             co."estObligatoire", cr."nomCompetenceReference"
      FROM "CompetenceOffre" co
      INNER JOIN "CompetenceReference" cr
        ON cr."idCompetenceReference" = co."idCompetenceReference"
      WHERE co."idOffre" = ANY($1::int[])
    `, [idsOffres]);

    const competencesParOffre = new Map();
    for (const c of competencesOffresResult.rows) {
      const cle = String(c.idOffre);
      if (!competencesParOffre.has(cle)) competencesParOffre.set(cle, []);
      competencesParOffre.get(cle).push(c);
    }

    let matrice = null;
    try {
      matrice = await obtenirMatrice(client);
    } catch (erreurMatrice) {
      console.error('Matrice de co-occurrence indisponible :', erreurMatrice.message);
    }

    /* Évalue toutes les offres pour un jeu de compétences donné. */
    const evaluerToutesLesOffres = (competences) =>
      offres.map(offre => ({
        idOffre: offre.idOffre,
        titre: offre.titre,
        nomEntreprise: offre.nomEntreprise,
        score: evaluerCouple({
          offre,
          etudiant,
          competencesOffre: competencesParOffre.get(String(offre.idOffre)) || [],
          competencesEtudiant: competences,
          preference,
          centresInteret,
          matrice
        }).global
      }));

    const resume = (evaluations) => {
      const eligibles = evaluations.filter(e => e.score >= SEUIL_MINIMUM_APPARIEMENT);
      const opportunites = evaluations.filter(e => e.score >= SEUIL_OPPORTUNITE);

      /* La progression se mesure sur les meilleures offres — les cibles
         réalistes de l'étudiant — et non sur la moyenne de toutes les
         offres éligibles, que l'ajout d'offres faibles ferait baisser. */
      const meilleures = [...evaluations]
        .sort((a, b) => b.score - a.score)
        .slice(0, CIBLES_REALISTES);
      const moyenneCibles = meilleures.length > 0
        ? Math.round(meilleures.reduce((t, e) => t + e.score, 0) / meilleures.length)
        : 0;

      return {
        eligibles,
        opportunites,
        nombreEligibles: eligibles.length,
        nombreOpportunites: opportunites.length,
        scoreMoyenCibles: moyenneCibles
      };
    };

    // === 1. Situation de référence ===
    const reference = resume(evaluerToutesLesOffres(competencesEtudiant));
    const dejaAcquises = new Set(
      competencesEtudiant.map(c => String(c.idCompetenceReference))
    );
    const idsOpportunitesReference = new Set(reference.opportunites.map(e => e.idOffre));

    // === 2. Simulation, compétence par compétence ===
    const suggestions = [];

    for (const candidate of referentielResult.rows) {
      if (dejaAcquises.has(String(candidate.idCompetenceReference))) continue;

      const profilSimule = [
        ...competencesEtudiant,
        {
          idCompetenceReference: candidate.idCompetenceReference,
          nomCompetenceReference: candidate.nomCompetenceReference,
          niveau: NIVEAU_SIMULE
        }
      ];

      const simule = resume(evaluerToutesLesOffres(profilSimule));

      /* Ne comptent que les offres devenant de véritables opportunités,
         pas celles franchissant tout juste le seuil d'affichage. */
      const nouvellesOffres = simule.opportunites
        .filter(e => !idsOpportunitesReference.has(e.idOffre))
        .sort((a, b) => b.score - a.score);

      const gainMoyen = simule.scoreMoyenCibles - reference.scoreMoyenCibles;

      if (nouvellesOffres.length === 0 && gainMoyen < 1) continue;

      suggestions.push({
        idCompetenceReference: candidate.idCompetenceReference,
        competence: candidate.nomCompetenceReference,
        categorie: candidate.categorieCompetenceReference,
        offresDebloquees: nouvellesOffres.length,
        scoreMoyenApres: simule.scoreMoyenCibles,
        gainScoreMoyen: gainMoyen,
        nombreOpportunitesApres: simule.nombreOpportunites,
        // Les offres les plus intéressantes que cette compétence débloque
        exemplesOffres: nouvellesOffres.slice(0, 3).map(o => ({
          idOffre: o.idOffre, titre: o.titre,
          nomEntreprise: o.nomEntreprise, score: o.score
        }))
      });
    }

    /* Classement : d'abord le nombre d'offres débloquées — c'est le gain
       le plus concret pour l'étudiant — puis la progression du score. */
    suggestions.sort((a, b) =>
      b.offresDebloquees - a.offresDebloquees || b.gainScoreMoyen - a.gainScoreMoyen
    );

    return NextResponse.json({
      situationActuelle: {
        nombreCompetences: competencesEtudiant.length,
        offresAnalysees: offres.length,
        offresEligibles: reference.nombreEligibles,
        offresPrometteuses: reference.nombreOpportunites,
        scoreMoyen: reference.scoreMoyenCibles
      },
      suggestions: suggestions.slice(0, NOMBRE_SUGGESTIONS),
      niveauSimule: NIVEAU_SIMULE
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur conseiller:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
