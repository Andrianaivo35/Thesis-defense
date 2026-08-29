/* =====================================================================
   APPARIEMENT FLOU DU TEXTE AVEC LE RÉFÉRENTIEL DE COMPÉTENCES

   L'IDÉE CENTRALE

   Deux problèmes se posaient séparément, et ils ont la même solution.

     1. L'OCR se trompe de caractères. « Javascript » devient
        « Javascrpt », « Comptabilité » devient « Comptabilite ».
        Une comparaison stricte laisserait passer ces compétences.

     2. Les étudiants n'écrivent pas les compétences comme le
        référentiel : « Node JS », « node.js », « NodeJS ».

   Dans les deux cas il faut reconnaître deux chaînes proches sans être
   identiques. Une seule mécanique — la distance d'édition — traite
   l'entrée bruitée ET la normalisation du vocabulaire. C'est ce qui fait
   de ce pipeline une conception cohérente, et non deux briques
   juxtaposées.

   CE QUI REND L'EXERCICE DIFFICILE

   Le flou est une arme à double tranchant. Trop permissif, il fabrique
   des compétences que le CV ne mentionne pas. Trois garde-fous :

     - les noms COURTS n'admettent aucun flou. À 3 caractères, « SQL »
       est à une substitution de « SGL », de « SQI », de « SOL ». Le
       rapport signal/bruit s'effondre : sous 6 caractères, on exige
       l'égalité stricte.

     - l'appariement retient LE PLUS LONG et masque ce qu'il a consommé.
       Sans cela « PostgreSQL » produirait aussi « SQL », et
       « NoSQL (MongoDB) » également.

     - la SECTION du CV pondère la confiance. Voir plus bas : c'est le
       garde-fou le plus efficace des trois.
   ===================================================================== */

/* Sous cette longueur, seule l'égalité exacte est acceptée. */
const LONGUEUR_MINIMALE_FLOU = 6;

/* Similarité minimale pour retenir un appariement flou. 0,86 tolère une
   à deux erreurs de caractères sur un mot de dix lettres — l'ordre de
   grandeur d'une erreur OCR — sans rapprocher deux compétences
   distinctes du référentiel. */
const SEUIL_SIMILARITE = 0.86;

/* Un terme lu dans une section secondaire (loisirs, qualités) est
   conservé mais sa confiance est abaissée sous le seuil de rétention :
   il sera visible dans l'écran de revue, sans être proposé d'office. */
export const SEUIL_RETENTION = 0.55;

/* Nombre maximal de mots d'un n-gramme candidat. La plus longue
   compétence du référentiel, « NoSQL (MongoDB) », en fait 2 une fois
   normalisée ; « Hôtellerie et Tourisme » en fait 3. On prend 4 de
   marge. */
const TAILLE_MAX_NGRAMME = 4;

/* ---------------------------------------------------------------------
   NORMALISATION

   Ramène « Node.js », « NODE JS » et « node-js » à une même forme, sans
   quoi aucune comparaison n'a de sens. On retire les accents parce que
   l'OCR les perd régulièrement, et l'étudiant les omet souvent.
   --------------------------------------------------------------------- */
export function normaliser(texte) {
  return (texte || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9+#]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------------------------------------------------------------------
   DISTANCE D'ÉDITION (Levenshtein)

   Implémentation à une seule ligne de travail : le référentiel compte 56
   entrées et un CV quelques centaines de n-grammes, mais le produit des
   deux se compte en dizaines de milliers de comparaisons par CV. Garder
   l'allocation constante évite d'y passer inutilement du temps.
   --------------------------------------------------------------------- */
export function distanceEdition(a, b) {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let precedente = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) precedente[j] = j;

  for (let i = 1; i <= a.length; i++) {
    let diagonale = precedente[0];
    precedente[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const suivante = Math.min(
        precedente[j] + 1,            // suppression
        precedente[j - 1] + 1,        // insertion
        diagonale + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
      diagonale = precedente[j];
      precedente[j] = suivante;
    }
  }
  return precedente[b.length];
}

/* Jaro-Winkler pondère les erreurs selon leur POSITION : deux chaînes
   partageant leur début sont jugées plus proches.

   ÉCARTÉ APRÈS MESURE. Conservé ici parce que le chapitre d'évaluation
   compare les deux mesures, et parce que l'écart est instructif.

   Le raisonnement initial semblait solide : l'OCR se trompe rarement sur
   les premières lettres d'un mot, donc privilégier le préfixe devait
   améliorer le rappel. On retenait max(Levenshtein, Jaro-Winkler).

   La mesure sur le corpus de vérité terrain a dit l'inverse. Jaro-Winkler
   était à lui seul la cause de la quasi-totalité des faux positifs :

     terme lu                   apparié à              J-W     Leven.
     « anglais »                Angular                0,867   0,571
     « autonomie »              Agronomie              0,867   0,778
     « gestion et commerce »    Gestion de projet      0,891   0,526
     « francais courant angl. » Français rédactionnel  0,877   0,500

   La raison est structurelle. Jaro-Winkler a été conçu pour le
   rapprochement d'enregistrements d'état civil : des PATRONYMES, courts
   et sans espaces. Son bonus de préfixe y a un sens. Appliqué à des
   locutions techniques de plusieurs mots, il suffit qu'elles partagent
   leur premier mot — « Gestion... », « Génie... » — pour que le bonus
   emporte la décision, quel que soit le reste.

   Levenshtein seul rejette ces quatre cas et retient malgré tout les
   véritables erreurs OCR : « Maiagasy » lu pour « Malagasy » est à une
   substitution près, soit 0,875, au-dessus du seuil. La correction du
   bruit OCR — le service qu'on attendait de Jaro-Winkler — était en fait
   déjà rendue par la distance d'édition.

   Leçon : une mesure de similarité n'est pas générique. Elle porte les
   hypothèses du problème pour lequel elle a été conçue. */
export function jaroWinkler(a, b) {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const fenetre = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const prisA = new Array(a.length).fill(false);
  const prisB = new Array(b.length).fill(false);

  let correspondances = 0;
  for (let i = 0; i < a.length; i++) {
    const debut = Math.max(0, i - fenetre);
    const fin = Math.min(i + fenetre + 1, b.length);
    for (let j = debut; j < fin; j++) {
      if (prisB[j] || a[i] !== b[j]) continue;
      prisA[i] = true;
      prisB[j] = true;
      correspondances++;
      break;
    }
  }
  if (correspondances === 0) return 0;

  /* Transpositions : caractères communs mais dans un ordre différent. */
  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!prisA[i]) continue;
    while (!prisB[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  const jaro = (
    correspondances / a.length +
    correspondances / b.length +
    (correspondances - transpositions) / correspondances
  ) / 3;

  /* Bonus de préfixe commun, plafonné à 4 caractères (Winkler). */
  let prefixe = 0;
  while (prefixe < 4 && prefixe < a.length && prefixe < b.length && a[prefixe] === b[prefixe]) {
    prefixe++;
  }
  return jaro + prefixe * 0.1 * (1 - jaro);
}

/** Similarité 0..1 entre deux formes normalisées.
    Distance d'édition seule : voir ci-dessus pourquoi Jaro-Winkler a été
    écarté. */
export function similarite(a, b) {
  if (a === b) return 1;
  return 1 - distanceEdition(a, b) / Math.max(a.length, b.length);
}

/* ---------------------------------------------------------------------
   SECTIONS DU CV

   Le garde-fou le plus efficace contre les faux positifs, et de loin.

   Un CV réel ne contient pas que des compétences : loisirs, qualités
   personnelles, logiciels hors référentiel, certifications. Sans tenir
   compte de la structure, « Photographie » listé en centres d'intérêt
   pèserait autant que « Comptabilité » listé en compétences.

   On classe donc les sections en deux familles :

     - PERTINENTES (compétences, expériences, formation, langues) : ce
       qu'on y lit est une déclaration de savoir-faire ;

     - SECONDAIRES (loisirs, qualités, divers, accroche) : ce qu'on y lit
       relève du contexte personnel.

   Un terme lu en section secondaire n'est pas écarté — le rejeter
   d'office ferait manquer le CV qui mentionne « Python » dans sa phrase
   d'accroche. Sa confiance est abaissée sous le seuil de rétention : il
   reste visible dans l'écran de revue, sans être coché par défaut.
   --------------------------------------------------------------------- */
const SECTIONS = [
  { cle: 'competences', pertinence: 1.00, motifs: ['competence', 'savoir faire', 'aptitude', 'expertise'] },
  { cle: 'logiciels',   pertinence: 0.85, motifs: ['logiciel', 'outil', 'technologie', 'environnement technique'] },
  { cle: 'experiences', pertinence: 0.90, motifs: ['experience', 'projet', 'stage', 'parcours professionnel', 'emploi'] },
  { cle: 'formation',   pertinence: 0.80, motifs: ['formation', 'diplome', 'etude', 'cursus', 'scolarite'] },
  { cle: 'langues',     pertinence: 0.90, motifs: ['langue'] },
  { cle: 'certifications', pertinence: 0.70, motifs: ['certification', 'attestation', 'habilitation'] },
  { cle: 'loisirs',     pertinence: 0.30, motifs: ['loisir', 'centre d interet', 'interet', 'hobbies', 'activite'] },
  { cle: 'qualites',    pertinence: 0.30, motifs: ['qualite', 'savoir etre', 'atout', 'point fort'] },
  { cle: 'divers',      pertinence: 0.40, motifs: ['divers', 'autre', 'reference', 'a propos', 'profil', 'objectif'] }
];

/* Reconnaît le titre de section porté par une ligne.

   Deux formes coexistent dans les CV réels, et il a fallu les traiter
   séparément :

     - le titre SUR SA PROPRE LIGNE, cas de la mise en page classique.
       La ligne entière est un titre et ne contient rien à extraire.

     - le titre EN TÊTE DE LIGNE, suivi de son contenu :
       « Formation   Licence 3 — Gestion et Commerce ». C'est la mise en
       page en colonnes libellé/valeur, et c'est aussi ce que produit
       l'OCR quand il replie deux colonnes sur une seule ligne.

   Ne traiter que le premier cas était une erreur mesurée : les lignes du
   second type n'ouvraient aucune section et héritaient de la
   précédente. « Qualités : Sens du relationnel, Rigueur » se retrouvait
   ainsi rattaché à la section « Logiciels » ouverte plus haut, avec sa
   pertinence élevée — exactement l'inverse de l'effet recherché.

   @returns {{section, titreSeul: boolean}|null}
*/
export function reconnaitreSection(ligne) {
  const brute = (ligne || '').trim();
  if (!brute) return null;

  /* Le repère doit être en TÊTE de ligne, jamais quelque part dedans.

     La règle plus permissive « la ligne contient le mot repère » a été
     essayée et mesurée : elle coûtait six compétences sur le corpus.
     La ligne « Contrôle qualité — niveau intermédiaire » contient
     « qualité » ; elle était donc prise pour le titre de la section
     « Qualités personnelles », et sautée en tant que titre. La
     compétence « Contrôle qualité » disparaissait, alors même qu'elle
     était écrite en toutes lettres.

     Un titre de section ouvre une section : il est en tête. */
  const forme = singulariser(normaliser(brute));
  if (!forme) return null;

  for (const section of SECTIONS) {
    for (const motif of section.motifs) {
      if (!forme.startsWith(motif)) continue;
      /* Le reste de la ligne après le mot repère. Vide (ou quasi) : la
         ligne n'est qu'un titre. Sinon elle porte aussi du contenu, qu'il
         faut continuer d'analyser sous cette section. */
      const reste = forme.slice(motif.length).trim();
      return { section, titreSeul: reste.length <= 2 };
    }
  }
  return null;
}

/* Ramène chaque mot au singulier, grossièrement mais suffisamment :
   « CENTRES D'INTÉRÊT » doit rejoindre le repère « centre d interet »,
   et « COMPÉTENCES TECHNIQUES » le repère « competence ». Le « s » final
   n'est retiré que sur les mots assez longs pour que ce ne soit pas leur
   dernière lettre utile. */
function singulariser(forme) {
  return forme
    .split(' ')
    .map(mot => (mot.length > 3 && mot.endsWith('s') ? mot.slice(0, -1) : mot))
    .join(' ');
}

/* ---------------------------------------------------------------------
   INDEX DU RÉFÉRENTIEL
   --------------------------------------------------------------------- */

/**
 * Prépare le référentiel pour l'appariement.
 * Trié par longueur décroissante : indispensable pour que « PostgreSQL »
 * soit essayé avant « SQL ».
 */
export function construireIndex(competencesReference) {
  return competencesReference
    .map(c => ({
      idCompetenceReference: c.idCompetenceReference,
      nom: c.nomCompetenceReference,
      categorie: c.categorieCompetenceReference,
      forme: normaliser(c.nomCompetenceReference)
    }))
    .filter(c => c.forme.length > 0)
    .sort((a, b) => b.forme.length - a.forme.length);
}

/* ---------------------------------------------------------------------
   EXTRACTION
   --------------------------------------------------------------------- */

/**
 * Cherche les compétences du référentiel dans le texte d'un CV.
 *
 * @param {string} texte texte extrait (natif ou OCR, indifféremment)
 * @param {Array} index sortie de construireIndex()
 * @param {number} page numéro de page, conservé pour l'explication
 * @returns {Array} détections { idCompetenceReference, nom, termeDetecte,
 *                               methode, confiance, section, contexte, page }
 */
export function extraireCompetences(texte, index, page = null) {
  const detections = new Map();
  let sectionCourante = null;

  for (const ligneBrute of (texte || '').split('\n')) {
    const ligne = ligneBrute.trim();
    if (!ligne) continue;

    const titre = reconnaitreSection(ligne);
    if (titre) {
      sectionCourante = titre.section;
      /* Un titre seul ne contient pas de compétence à extraire — sauf à
         confondre le titre « Compétences » avec une compétence. Un titre
         suivi de son contenu, en revanche, doit continuer d'être lu. */
      if (titre.titreSeul) continue;
    }

    const pertinence = sectionCourante ? sectionCourante.pertinence : 0.60;
    const cleSection = sectionCourante ? sectionCourante.cle : 'sans section';

    const mots = normaliser(ligne).split(' ').filter(Boolean);
    if (mots.length === 0) continue;

    /* Masque des positions déjà consommées par un appariement plus long. */
    const consomme = new Array(mots.length).fill(false);

    /* Du n-gramme le plus long au plus court : le plus long gagne. */
    for (let taille = Math.min(TAILLE_MAX_NGRAMME, mots.length); taille >= 1; taille--) {
      for (let debut = 0; debut + taille <= mots.length; debut++) {
        let libre = true;
        for (let k = debut; k < debut + taille; k++) if (consomme[k]) { libre = false; break; }
        if (!libre) continue;

        const candidat = mots.slice(debut, debut + taille).join(' ');
        const trouve = apparier(candidat, index);
        if (!trouve) continue;

        for (let k = debut; k < debut + taille; k++) consomme[k] = true;

        const confiance = Math.round(trouve.similarite * pertinence * 1000) / 1000;
        const cle = String(trouve.competence.idCompetenceReference);
        const ancienne = detections.get(cle);

        /* Une même compétence peut apparaître plusieurs fois dans le CV.
           On retient l'occurrence la plus fiable — typiquement celle lue
           en section « Compétences » plutôt qu'en « Loisirs ». */
        if (ancienne && ancienne.confiance >= confiance) continue;

        detections.set(cle, {
          idCompetenceReference: trouve.competence.idCompetenceReference,
          nom: trouve.competence.nom,
          categorie: trouve.competence.categorie,
          termeDetecte: mots.slice(debut, debut + taille).join(' '),
          methode: trouve.similarite === 1 ? 'exacte' : 'floue',
          similarite: Math.round(trouve.similarite * 1000) / 1000,
          confiance,
          section: cleSection,
          contexte: ligne.slice(0, 200),
          page
        });
      }
    }
  }

  return [...detections.values()].sort((a, b) => b.confiance - a.confiance);
}

/** Apparie un n-gramme normalisé à une entrée du référentiel. */
function apparier(candidat, index) {
  let meilleur = null;

  for (const competence of index) {
    if (candidat === competence.forme) return { competence, similarite: 1 };

    /* Pas de flou sur les noms courts, ni entre chaînes de longueurs
       trop éloignées : la distance d'édition y perd tout pouvoir
       discriminant. */
    if (competence.forme.length < LONGUEUR_MINIMALE_FLOU) continue;
    if (Math.abs(candidat.length - competence.forme.length) > 3) continue;

    const score = similarite(candidat, competence.forme);
    if (score >= SEUIL_SIMILARITE && (!meilleur || score > meilleur.similarite)) {
      meilleur = { competence, similarite: score };
    }
  }

  return meilleur;
}
