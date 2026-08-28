import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { VALEUR_NIVEAU, DUREE_EN_MOIS, domaineDeLaFiliere } from '@/lib/referentiels';
import { obtenirMatrice, similarite } from '@/lib/cooccurrence';

/* =====================================================================
   NOMS RÉELS UTILISÉS DANS CETTE ROUTE
     tables minuscules  : etudiant, offre, entreprise, recommandation
     tables CamelCase   : "Candidature", "CompetenceOffre",
                          "CompetenceReference", "CompetenceEtudiant"
     tables avec tiret  : "centre-interet", "preference-stage"

   COLONNES À ORTHOGRAPHE PARTICULIÈRE
     offre           : "dateLimites"      (avec un s)
     CompetenceOffre : "niveauSouhaitee"  (avec un e final)
   ===================================================================== */

const POIDS = {
  competence: 40,
  filiere: 20,
  niveau: 15,
  localisation: 15,
  preference: 10
};

const SEUIL_MINIMUM = 35;
const NOMBRE_MAX = 10;

/* =====================================================================
   OUTILS
   ===================================================================== */

function normaliser(texte) {
  if (!texte) return '';
  return texte
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function mots(texte) {
  return normaliser(texte).split(' ').filter(m => m.length > 2);
}

function recouvrement(a, b) {
  const motsA = mots(a);
  const motsB = mots(b);
  if (motsA.length === 0 || motsB.length === 0) return 0;
  const communs = motsA.filter(m => motsB.includes(m));
  return communs.length / Math.min(motsA.length, motsB.length);
}

/* Les niveaux sont désormais saisis dans une liste fermée : la valeur est
   lue directement dans le référentiel. L'analyse textuelle ci-dessous n'est
   conservée que pour les profils créés avant cette normalisation. */
function valeurNiveau(niveau) {
  if (niveau && VALEUR_NIVEAU[niveau] !== undefined) {
    return VALEUR_NIVEAU[niveau];
  }

  const n = normaliser(niveau);
  if (!n) return null;

  if (n.includes('doctorat') || n.includes('these')) return 8;
  if (n.includes('master 2') || n.includes('master2') || n.includes('m2')) return 7;
  if (n.includes('master 1') || n.includes('master1') || n.includes('m1')) return 6;
  if (n.includes('master') || n.includes('ingenieur')) return 6;
  if (n.includes('licence 3') || n.includes('licence3') || n.includes('l3')) return 5;
  if (n.includes('licence 2') || n.includes('licence2') || n.includes('l2')) return 4;
  if (n.includes('licence 1') || n.includes('licence1') || n.includes('l1')) return 3;
  if (n.includes('licence')) return 5;
  if (n.includes('bts') || n.includes('dut')) return 4;
  if (n.includes('bac')) return 2;
  return null;
}

function valeurCompetence(niveau) {
  const n = normaliser(niveau);
  if (n.includes('expert') || n.includes('avance')) return 3;
  if (n.includes('intermediaire') || n.includes('moyen')) return 2;
  if (n.includes('debutant') || n.includes('base') || n.includes('notion')) return 1;
  return 2;
}

/* Même principe que valeurNiveau : lecture directe dans le référentiel,
   extraction par expression régulière en repli pour les anciennes saisies. */
function dureeEnMois(duree) {
  if (duree && DUREE_EN_MOIS[duree] !== undefined) {
    return DUREE_EN_MOIS[duree];
  }

  const n = normaliser(duree);
  const nombre = parseInt(n.match(/\d+/)?.[0] || '', 10);
  if (isNaN(nombre)) return null;
  if (n.includes('semaine')) return Math.round(nombre / 4);
  if (n.includes('an')) return nombre * 12;
  return nombre;
}

/* =====================================================================
   LES CINQ SOUS-SCORES
   ===================================================================== */

/* Score de compétence, avec correspondances approchées.

   Auparavant la correspondance était strictement exacte : un étudiant
   maîtrisant React obtenait zéro sur une offre demandant Vue.js, alors
   qu'un recruteur y verrait une quasi-correspondance.

   La matrice de co-occurrence permet désormais de créditer partiellement
   une compétence proche. Le crédit est proportionnel à la similarité
   mesurée, donc borné par la confiance qu'on a dans cette proximité —
   une compétence approchante ne vaut jamais autant que la compétence
   exacte. */
function scoreCompetence(competencesOffre, competencesEtudiant, matrice) {
  if (!competencesOffre || competencesOffre.length === 0) {
    return { score: 60, detail: null };
  }

  const parId = new Map(
    competencesEtudiant.map(c => [String(c.idCompetenceReference), c])
  );

  let poidsTotal = 0;
  let poidsObtenu = 0;
  let nbTrouvees = 0;
  let nbApprochees = 0;
  let nbObligatoiresManquantes = 0;
  const correspondancesApprochees = [];

  for (const co of competencesOffre) {
    const poids = co.estObligatoire ? 2 : 1;
    poidsTotal += poids;

    const possedee = parId.get(String(co.idCompetenceReference));

    if (possedee) {
      nbTrouvees++;
      // Attention : la colonne s'appelle "niveauSouhaitee" (avec un e final)
      const attendu = valeurCompetence(co.niveauSouhaitee);
      const acquis = valeurCompetence(possedee.niveau);
      poidsObtenu += acquis >= attendu ? poids : poids * 0.75;
      continue;
    }

    /* Aucune correspondance exacte : on cherche la compétence de
       l'étudiant la plus proche de celle exigée. */
    let meilleure = null;
    let meilleurScore = 0;

    if (matrice) {
      for (const ce of competencesEtudiant) {
        const proximite = similarite(matrice, co.idCompetenceReference, ce.idCompetenceReference);
        if (proximite > meilleurScore) {
          meilleurScore = proximite;
          meilleure = ce;
        }
      }
    }

    if (meilleure) {
      nbApprochees++;
      /* Le crédit est le produit du poids par la similarité : une
         proximité de 0,5 vaut la moitié de la compétence exigée. */
      poidsObtenu += poids * meilleurScore;
      correspondancesApprochees.push({
        exigee: co.nomCompetenceReference,
        possedee: meilleure.nomCompetenceReference,
        similarite: Number(meilleurScore.toFixed(2))
      });
    } else if (co.estObligatoire) {
      nbObligatoiresManquantes++;
    }
  }

  let score = poidsTotal > 0 ? (poidsObtenu / poidsTotal) * 100 : 60;
  score -= nbObligatoiresManquantes * 8;

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    detail: {
      nbTrouvees,
      nbApprochees,
      total: competencesOffre.length,
      nbObligatoiresManquantes,
      /* Les deux meilleures correspondances approchées sont conservées
         pour pouvoir expliquer le rapprochement à l'utilisateur. */
      correspondancesApprochees: correspondancesApprochees
        .sort((a, b) => b.similarite - a.similarite)
        .slice(0, 2)
    }
  };
}

/* Domaine et filière proviennent désormais du même référentiel
   hiérarchique : la comparaison peut être exacte, et le fait qu'une
   spécialisation appartienne au domaine de l'offre devient exploitable.

   Trois situations sont distinguées, là où le recouvrement de mots ne
   donnait qu'un continuum flou :
     - la filière de l'étudiant est le domaine de l'offre
     - sa spécialisation appartient à ce domaine
     - aucun rapport

   L'analyse textuelle est conservée en repli, pour les profils saisis
   avant la normalisation et pour les centres d'intérêt, qui restent en
   texte libre. */
function scoreFiliere(offre, etudiant, centresInteret) {
  const domaine = offre.domaine || offre.titre || '';
  if (!normaliser(domaine)) return { score: 50, detail: null };

  // 1. Correspondance exacte sur le domaine
  if (etudiant.filiere && etudiant.filiere === offre.domaine) {
    return { score: 100, detail: { viaFiliere: true, correspondanceExacte: true } };
  }

  // 2. La spécialisation de l'étudiant relève du domaine de l'offre
  if (etudiant.specialisation &&
      domaineDeLaFiliere(etudiant.specialisation) === offre.domaine) {
    return { score: 92, detail: { viaSpecialisation: true, correspondanceExacte: true } };
  }

  // 3. Repli textuel : anciennes saisies et centres d'intérêt
  const parFiliere = recouvrement(domaine, etudiant.filiere);
  const parSpecialisation = recouvrement(domaine, etudiant.specialisation);
  const parInterets = centresInteret.length > 0
    ? Math.max(...centresInteret.map(c => recouvrement(domaine, c.domaineInteret)))
    : 0;

  const meilleur = Math.max(parFiliere, parSpecialisation, parInterets);
  const concordances = [parFiliere, parSpecialisation, parInterets]
    .filter(v => v > 0.3).length;

  const score = Math.min(100, Math.round(meilleur * 100 + Math.max(0, concordances - 1) * 8));

  return {
    score: Math.max(0, score),
    detail: {
      viaFiliere: parFiliere > 0.3,
      viaSpecialisation: parSpecialisation > 0.3,
      viaInteret: parInterets > 0.3
    }
  };
}

function scoreNiveau(offre, etudiant) {
  const requis = valeurNiveau(offre.niveauRequis);
  const acquis = valeurNiveau(etudiant.niveauAcademique);

  if (requis === null || acquis === null) return { score: 60, detail: null };

  const ecart = acquis - requis;

  if (ecart === 0) return { score: 100, detail: { statut: 'exact' } };
  if (ecart === 1) return { score: 88, detail: { statut: 'superieur' } };
  if (ecart > 1) return { score: 70, detail: { statut: 'surqualifie' } };
  if (ecart === -1) return { score: 45, detail: { statut: 'proche' } };
  return { score: 15, detail: { statut: 'insuffisant' } };
}

function scoreLocalisation(offre, preference) {
  if (!preference) return { score: 55, detail: null };

  const memeVille =
    normaliser(offre.ville) &&
    normaliser(offre.ville) === normaliser(preference.villePreferee);

  const teletravailOffre = normaliser(offre.accepteTeletravail);
  const teletravailVoulu = normaliser(preference.accepteTeletravail);
  const teletravailPossible =
    teletravailOffre.includes('oui') || teletravailOffre.includes('hybride');

  if (memeVille) return { score: 100, detail: { statut: 'memeVille' } };

  if (teletravailPossible &&
      (teletravailVoulu.includes('oui') || teletravailVoulu.includes('hybride'))) {
    return { score: 85, detail: { statut: 'teletravail' } };
  }

  if (preference.mobiliteNational === true || preference.mobiliteNational === 'true') {
    return { score: 65, detail: { statut: 'mobile' } };
  }

  return { score: 20, detail: { statut: 'eloigne' } };
}

function scorePreference(offre, preference) {
  if (!preference) return { score: 55, detail: null };

  const criteres = [];

  if (preference.typeStagePreferee && offre.typeStage) {
    criteres.push(recouvrement(offre.typeStage, preference.typeStagePreferee) > 0.5 ? 100 : 30);
  }

  const dureeOffre = dureeEnMois(offre.duree);
  const dureeVoulue = dureeEnMois(preference.dureeSouhaitee);
  if (dureeOffre !== null && dureeVoulue !== null) {
    const ecart = Math.abs(dureeOffre - dureeVoulue);
    criteres.push(ecart === 0 ? 100 : ecart === 1 ? 75 : ecart === 2 ? 50 : 25);
  }

  if (offre.dateDebut && preference.dateDebutDisponibilite) {
    const debutOffre = new Date(offre.dateDebut);
    const dispoDebut = new Date(preference.dateDebutDisponibilite);
    const dispoFin = preference.dateFinDisponibilite
      ? new Date(preference.dateFinDisponibilite)
      : null;

    const apresDebut = debutOffre >= dispoDebut;
    const avantFin = !dispoFin || debutOffre <= dispoFin;
    criteres.push(apresDebut && avantFin ? 100 : 35);
  }

  if (criteres.length === 0) return { score: 55, detail: null };

  const moyenne = criteres.reduce((t, v) => t + v, 0) / criteres.length;
  return { score: Math.round(moyenne), detail: { nbCriteres: criteres.length } };
}

/* =====================================================================
   RAISONS AFFICHABLES
   ===================================================================== */
function construireRaisons(scores, details) {
  const raisons = [];

  const c = details.competence;

  /* Une correspondance approchée mérite d'être explicitée : sans cela,
     l'étudiant ne comprend pas pourquoi une offre dont il ne possède
     aucune compétence exigée lui est proposée. */
  if (c && c.correspondancesApprochees?.length > 0) {
    const meilleure = c.correspondancesApprochees[0];
    raisons.push({
      texte: `${meilleure.possedee} est proche de ${meilleure.exigee}`,
      fort: meilleure.similarite >= 0.5
    });
  }

  if (c && c.nbTrouvees > 0) {
    raisons.push({
      texte: `${c.nbTrouvees} compétence${c.nbTrouvees > 1 ? 's' : ''} sur ${c.total}`,
      fort: scores.competence >= 70
    });
  }

  const f = details.filiere;
  if (f && scores.filiere >= 55) {
    if (f.correspondanceExacte && f.viaFiliere) {
      raisons.push({ texte: 'Exactement votre filière', fort: true });
    }
    else if (f.correspondanceExacte && f.viaSpecialisation) {
      raisons.push({ texte: 'Correspond à votre spécialisation', fort: true });
    }
    else if (f.viaFiliere) raisons.push({ texte: 'Correspond à votre filière', fort: true });
    else if (f.viaSpecialisation) raisons.push({ texte: 'Correspond à votre spécialisation', fort: true });
    else if (f.viaInteret) raisons.push({ texte: "Dans vos centres d'intérêt" });
  }

  const n = details.niveau;
  if (n) {
    if (n.statut === 'exact') raisons.push({ texte: 'Niveau exactement requis', fort: true });
    else if (n.statut === 'superieur') raisons.push({ texte: 'Votre niveau convient' });
  }

  const l = details.localisation;
  if (l) {
    if (l.statut === 'memeVille') raisons.push({ texte: 'Dans votre ville', fort: true });
    else if (l.statut === 'teletravail') raisons.push({ texte: 'Télétravail possible' });
  }

  if (scores.preference >= 75) {
    raisons.push({ texte: 'Correspond à vos préférences' });
  }

  return raisons.slice(0, 4);
}

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

    /* ---------- 6. Calcul des scores ---------- */
    const evaluees = offres.map(offre => {
      const competencesOffre = competencesParOffre.get(String(offre.idOffre)) || [];

      const rCompetence = scoreCompetence(competencesOffre, competencesEtudiant, matrice);
      const rFiliere = scoreFiliere(offre, etudiant, centresInteret);
      const rNiveau = scoreNiveau(offre, etudiant);
      const rLocalisation = scoreLocalisation(offre, preference);
      const rPreference = scorePreference(offre, preference);

      const scores = {
        competence: rCompetence.score,
        filiere: rFiliere.score,
        niveau: rNiveau.score,
        localisation: rLocalisation.score,
        preference: rPreference.score
      };

      const details = {
        competence: rCompetence.detail,
        filiere: rFiliere.detail,
        niveau: rNiveau.detail,
        localisation: rLocalisation.detail,
        preference: rPreference.detail
      };

      const global = Math.round(
        (scores.competence * POIDS.competence +
         scores.filiere * POIDS.filiere +
         scores.niveau * POIDS.niveau +
         scores.localisation * POIDS.localisation +
         scores.preference * POIDS.preference) / 100
      );

      return {
        offre,
        scores,
        global,
        raisons: construireRaisons(scores, details)
      };
    });

    const retenues = evaluees
      .filter(e => e.global >= SEUIL_MINIMUM)
      .sort((a, b) => b.global - a.global)
      .slice(0, NOMBRE_MAX);

    /* ---------- 6. Enregistrement (historique + traçabilité) ---------- */
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