/* =====================================================================
   Appariement étudiant / offre — logique de score partagée

   Ce module contient l'intégralité du calcul de correspondance entre un
   profil d'étudiant et une offre de stage.

   Il est délibérément **indépendant du sens de lecture**. La même mesure
   sert :
     - à recommander des offres à un étudiant  (/api/recommandations)
     - à classer des candidats pour une offre  (/api/offreCandidats)

   C'est le principe annoncé au PLAN §5.2 : la correspondance
   bidirectionnelle n'est pas une seconde heuristique à écrire et à
   maintenir en parallèle, c'est la même mesure lue depuis l'autre
   extrémité. Deux implémentations divergeraient inévitablement, et
   l'étudiant comme l'entreprise verraient alors des scores différents
   pour un même couple.
   ===================================================================== */

import { similarite } from './cooccurrence.js';
import { VALEUR_NIVEAU, DUREE_EN_MOIS, domaineDeLaFiliere } from './referentiels.js';

export const POIDS = {
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
export function scoreCompetence(competencesOffre, competencesEtudiant, matrice) {
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
export function scoreFiliere(offre, etudiant, centresInteret) {
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

export function scoreNiveau(offre, etudiant) {
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

export function scoreLocalisation(offre, preference) {
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

export function scorePreference(offre, preference) {
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
export function construireRaisons(scores, details) {
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
   Agrégation : score global d'un couple (étudiant, offre)

   Point unique de calcul, appelé par les deux sens de lecture.
   ===================================================================== */
export function evaluerCouple({ offre, etudiant, competencesOffre, competencesEtudiant,
                                preference, centresInteret = [], matrice = null }) {
  const rCompetence   = scoreCompetence(competencesOffre, competencesEtudiant, matrice);
  const rFiliere      = scoreFiliere(offre, etudiant, centresInteret);
  const rNiveau       = scoreNiveau(offre, etudiant);
  const rLocalisation = scoreLocalisation(offre, preference);
  const rPreference   = scorePreference(offre, preference);

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

  return { scores, details, global, raisons: construireRaisons(scores, details) };
}

export const SEUIL_MINIMUM_APPARIEMENT = 35;
