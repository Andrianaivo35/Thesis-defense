import { extraireTexteCV } from './extractionTexte.js';
import { construireIndex, extraireCompetences, SEUIL_RETENTION } from './appariementFlou.js';
import { lireFichier } from './stockage.js';
import pool from './db.js';

/* =====================================================================
   INGESTION D'UN CV — orchestration

   Enchaîne les briques et persiste le résultat :

     fichier → texte page par page (natif ou OCR)
             → compétences appariées au référentiel
             → propositions soumises à l'étudiant

   POURQUOI LE RÉSULTAT N'ALIMENTE PAS DIRECTEMENT LE PROFIL

   Parce qu'aucun OCR n'est fiable à 100 %, et qu'aucune extraction ne
   l'est davantage. Écrire d'office dans "CompetenceEtudiant" ferait
   d'une erreur de lecture une corruption silencieuse du profil, qui se
   propagerait ensuite dans les recommandations sans que personne ne
   puisse remonter à sa cause.

   Le pipeline PROPOSE, l'étudiant DISPOSE. Une erreur d'OCR devient
   alors une gêne mineure — une case à décocher — au lieu d'une donnée
   fausse.

   C'est aussi ce qui rend l'évaluation possible : l'écart entre ce que
   le pipeline a proposé et ce que l'étudiant a retenu EST la mesure de
   sa précision.
   ===================================================================== */

/**
 * Analyse un CV de la bibliothèque et enregistre le résultat.
 *
 * Ne lève pas sur échec d'analyse : l'échec est un état du CV
 * ('echec' + message en clair), pas une exception à remonter à
 * l'interface. Un CV illisible reste un CV téléchargeable.
 *
 * @param {number} idCV
 * @returns {Promise<object>} le résumé de l'analyse
 */
export async function analyserCV(idCV) {
  const { rows } = await pool.query(
    'SELECT "idCV", "idEtudiant", "nomFichier" FROM "CV" WHERE "idCV" = $1',
    [idCV]
  );
  const cv = rows[0];
  if (!cv) throw new Error('CV introuvable');

  await pool.query(
    `UPDATE "CV" SET "statutAnalyse" = 'en_cours', "messageAnalyse" = NULL WHERE "idCV" = $1`,
    [idCV]
  );

  try {
    const fichier = await lireFichier('cv', cv.nomFichier);
    const extraction = await extraireTexteCV(fichier);

    const reference = await pool.query(
      `SELECT "idCompetenceReference", "nomCompetenceReference", "categorieCompetenceReference"
         FROM "CompetenceReference"`
    );
    const index = construireIndex(reference.rows);

    /* L'extraction travaille page par page pour conserver l'origine de
       chaque détection : « lu page 2, section Compétences ». Sans cette
       trace, impossible d'expliquer à l'étudiant d'où sort une
       proposition. */
    const parCompetence = new Map();
    for (const page of extraction.pages) {
      for (const detection of extraireCompetences(page.texte, index, page.numero)) {
        const cle = String(detection.idCompetenceReference);
        const ancienne = parCompetence.get(cle);
        if (!ancienne || detection.confiance > ancienne.confiance) {
          parCompetence.set(cle, detection);
        }
      }
    }
    const detections = [...parCompetence.values()]
      .sort((a, b) => b.confiance - a.confiance);

    await enregistrerDetections(idCV, detections);

    await pool.query(
      `UPDATE "CV"
          SET "statutAnalyse" = 'analyse',
              "texteExtrait"  = $2,
              "nombrePages"   = $3,
              "pagesOcr"      = $4,
              "confianceOcr"  = $5,
              "dateAnalyse"   = now(),
              "messageAnalyse" = NULL
        WHERE "idCV" = $1`,
      [idCV, extraction.texte, extraction.nombrePages,
       extraction.pagesOcr, extraction.confianceOcr]
    );

    return {
      idCV,
      statut: 'analyse',
      voie: extraction.voie,
      nombrePages: extraction.nombrePages,
      pagesOcr: extraction.pagesOcr,
      confianceOcr: extraction.confianceOcr,
      pages: extraction.pages.map(p => ({
        numero: p.numero, voie: p.voie, motif: p.motif,
        confiance: p.confiance, erreur: p.erreur || null
      })),
      detections,
      /* Ce qui sera coché d'office dans l'écran de revue. */
      retenues: detections.filter(d => d.confiance >= SEUIL_RETENTION).length
    };
  } catch (erreur) {
    await pool.query(
      `UPDATE "CV" SET "statutAnalyse" = 'echec', "messageAnalyse" = $2,
                       "dateAnalyse" = now()
        WHERE "idCV" = $1`,
      [idCV, erreur.message]
    );
    return { idCV, statut: 'echec', message: erreur.message, detections: [] };
  }
}

/* Réécrit les détections d'un CV. Une réanalyse repart d'une table
   propre : conserver les détections d'une analyse précédente mêlerait
   deux exécutions du pipeline et fausserait toute mesure.

   Les décisions déjà prises par l'étudiant sont en revanche reportées :
   il n'a pas à trancher deux fois la même proposition. */
async function enregistrerDetections(idCV, detections) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const anciennes = await client.query(
      `SELECT "idCompetenceReference", "decision"
         FROM "CompetenceDetectee"
        WHERE "idCV" = $1 AND "decision" IS NOT NULL`,
      [idCV]
    );
    const decisions = new Map(
      anciennes.rows.map(r => [String(r.idCompetenceReference), r.decision])
    );

    await client.query('DELETE FROM "CompetenceDetectee" WHERE "idCV" = $1', [idCV]);

    for (const d of detections) {
      const decision = decisions.get(String(d.idCompetenceReference)) || null;
      await client.query(
        `INSERT INTO "CompetenceDetectee"
           ("idCV", "idCompetenceReference", "termeDetecte", "methode",
            "confiance", "page", "section", "contexte", "decision", "dateDecision")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CASE WHEN $9::text IS NULL THEN NULL ELSE now() END)`,
        [idCV, d.idCompetenceReference, d.termeDetecte, d.methode,
         d.confiance, d.page, d.section, d.contexte, decision]
      );
    }

    await client.query('COMMIT');
  } catch (erreur) {
    await client.query('ROLLBACK');
    throw erreur;
  } finally {
    client.release();
  }
}

/**
 * Applique les décisions de l'étudiant : les compétences confirmées
 * entrent dans son profil.
 *
 * Le profil de compétences est l'UNION des compétences confirmées sur
 * l'ensemble des CV de l'étudiant. Une compétence déjà présente n'est pas
 * dupliquée, et le niveau saisi manuellement n'est jamais écrasé : le
 * pipeline lit un nom de compétence, il ne sait rien du niveau de
 * maîtrise.
 *
 * @param {number} idCV
 * @param {number} idEtudiant
 * @param {number[]} confirmees identifiants de CompetenceReference retenus
 * @returns {Promise<{confirmees: number, rejetees: number, ajouteesAuProfil: number}>}
 */
export async function appliquerDecisions(idCV, idEtudiant, confirmees) {
  const retenues = [...new Set((confirmees || []).map(Number).filter(Boolean))];

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    /* Le CV doit appartenir à l'étudiant : sans cette vérification, un
       identifiant de CV deviné suffirait à écrire dans le profil d'un
       autre. */
    const proprietaire = await client.query(
      'SELECT 1 FROM "CV" WHERE "idCV" = $1 AND "idEtudiant" = $2',
      [idCV, idEtudiant]
    );
    if (proprietaire.rowCount === 0) {
      throw new Error('Ce CV ne vous appartient pas.');
    }

    await client.query(
      `UPDATE "CompetenceDetectee"
          SET "decision" = CASE WHEN "idCompetenceReference" = ANY($2::int[])
                                THEN 'confirmee' ELSE 'rejetee' END,
              "dateDecision" = now()
        WHERE "idCV" = $1`,
      [idCV, retenues]
    );

    /* ON CONFLICT DO NOTHING : la compétence peut déjà figurer au profil,
       saisie à la main ou confirmée depuis un autre CV. */
    let ajoutees = 0;
    for (const idCompetence of retenues) {
      const res = await client.query(
        `INSERT INTO "CompetenceEtudiant" ("idEtudiant", "idCompetenceReference", "niveau")
         SELECT $1, $2, 'Débutant'
          WHERE NOT EXISTS (
            SELECT 1 FROM "CompetenceEtudiant"
             WHERE "idEtudiant" = $1 AND "idCompetenceReference" = $2
          )`,
        [idEtudiant, idCompetence]
      );
      ajoutees += res.rowCount;
    }

    const total = await client.query(
      `SELECT count(*) FILTER (WHERE "decision" = 'confirmee') AS confirmees,
              count(*) FILTER (WHERE "decision" = 'rejetee')   AS rejetees
         FROM "CompetenceDetectee" WHERE "idCV" = $1`,
      [idCV]
    );

    await client.query('COMMIT');

    return {
      confirmees: Number(total.rows[0].confirmees),
      rejetees: Number(total.rows[0].rejetees),
      ajouteesAuProfil: ajoutees
    };
  } catch (erreur) {
    await client.query('ROLLBACK');
    throw erreur;
  } finally {
    client.release();
  }
}
