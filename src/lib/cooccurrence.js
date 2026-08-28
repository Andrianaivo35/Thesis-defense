/* =====================================================================
   Similarité entre compétences par co-occurrence

   Objectif : permettre au moteur de reconnaître que deux compétences sont
   proches sans que personne ne le lui ait déclaré. Le score de compétence
   actuel fonctionne par identifiant exact — un étudiant maîtrisant React
   obtient zéro sur une offre demandant Vue.js, alors qu'un recruteur y
   verrait une quasi-correspondance.

   Méthode : sémantique distributionnelle, calculée par comptage.
   Aucun modèle de langue, aucun apprentissage : uniquement des
   dénombrements sur les données de la plateforme, donc entièrement
   explicable et reproductible.

   -------------------------------------------------------------------
   Pourquoi une similarité du SECOND ordre

   La co-occurrence directe ne suffit pas ici. React et Vue.js sont des
   alternatives : elles ne figurent presque jamais ensemble dans une même
   offre, donc leur co-occurrence directe est nulle. Les compter
   directement conclurait qu'elles n'ont aucun rapport — l'inverse de la
   réalité.

   On compare donc les **profils de co-occurrence** : React et Vue.js
   apparaissent toutes deux aux côtés de JavaScript, HTML/CSS et Git.
   Leurs vecteurs de contexte se ressemblent, donc les compétences sont
   jugées proches. C'est le principe « on reconnaît un mot à ses
   fréquentations » de Firth, appliqué à des compétences.

   -------------------------------------------------------------------
   Contextes retenus

   Deux sources de co-occurrence, toutes deux légitimes :
     - les compétences exigées par une même offre ;
     - les compétences déclarées par un même étudiant.

   -------------------------------------------------------------------
   Rareté des données

   Avec un corpus réduit, la matrice est creuse : la plupart des paires
   ne sont jamais observées. Une similarité calculée sur zéro observation
   n'est pas « nulle », elle est *inconnue* — la traiter comme nulle
   reviendrait à affirmer une absence de lien qu'on n'a pas constatée.

   On mélange donc l'observation à un a priori faible tiré de la
   catégorie du référentiel : deux compétences de même catégorie
   démarrent légèrement proches, et les données observées viennent ensuite
   renforcer ou nuancer ce lien. C'est un lissage d'estimateur creux par
   un a priori, et il est assumé comme tel.
   ===================================================================== */

/* Poids de l'a priori de catégorie dans le mélange final. Volontairement
   faible : il oriente en l'absence de données, il ne doit pas dominer
   lorsque des observations existent. */
const POIDS_APRIORI = 0.25;

/* En deçà de ce seuil, deux compétences sont considérées sans rapport.

   Calibré sur le corpus. À 0,15, le moteur créditait « Git » pour une
   offre exigeant « SQL » : la proximité statistique existait — les deux
   figurent dans les mêmes offres informatiques — mais aucun recruteur ne
   les jugerait interchangeables.

   Principe retenu : si une proximité n'inspire pas assez confiance pour
   être affichée à l'utilisateur, elle n'en inspire pas assez pour entrer
   dans le score. Un seul seuil gouverne donc les deux. */
const SEUIL_SIMILARITE = 0.4;

/* Constante d'amortissement par le volume de preuves.

   Une similarité calculée sur deux compétences vues chacune dans un seul
   contexte n'a pas la même valeur qu'une similarité établie sur vingt
   observations — le cosinus, lui, ne fait pas la différence : deux
   vecteurs minuscules partageant leurs rares voisins obtiennent un score
   proche de 1.

   Constaté sur le corpus : « Génie civil » et « Génie textile »
   ressortaient à 0,98 alors que chacune n'apparaissait que dans deux ou
   trois contextes, partagés avec « Contrôle qualité ». Coïncidence de
   rareté, pas proximité réelle.

   On multiplie donc la similarité par n / (n + K), où n est le nombre de
   contextes de la compétence la moins observée. Avec K = 5 : une seule
   observation ne conserve que 17 % du score, cinq en conservent 50 %,
   vingt en conservent 80 %. L'amortissement s'efface à mesure que le
   corpus s'étoffe — ce qui est exactement le comportement souhaité. */
const CONSTANTE_AMORTISSEMENT = 5;

/* Pénalité de complémentarité.

   Le cosinus du second ordre mesure « apparaît dans des contextes
   semblables ». Cela recouvre en réalité deux relations très
   différentes :

     - la SUBSTITUABILITÉ — React et Vue.js jouent le même rôle, on
       emploie l'une *ou* l'autre ;
     - la COMPLÉMENTARITÉ — Git et SQL sont souvent exigés ensemble sans
       que l'une puisse remplacer l'autre.

   Constaté sur le corpus : le moteur créditait un étudiant possédant Git
   pour une offre exigeant SQL, et justifiait « Git est proche de SQL ».
   La proximité statistique était réelle, la conclusion fausse.

   Pour créditer un profil, c'est la substituabilité qui compte. Or les
   deux relations se distinguent par un signal simple : deux compétences
   substituables apparaissent dans des contextes *semblables* mais
   rarement *ensemble*, tandis que deux compétences complémentaires
   apparaissent précisément ensemble.

   On atténue donc la similarité proportionnellement à la fréquence de
   co-occurrence directe. */
const POIDS_COMPLEMENTARITE = 0.8;

/* Poids du signal textuel dans la similarite finale.

   La co-occurrence seule ne peut pas resoudre deux situations :

     - une competence qu'aucune offre n'exige encore (Vue.js, Angular)
       n'a aucun voisin, donc aucune similarite mesurable ;
     - deux competences systematiquement exigees ensemble (Git et SQL)
       sont indiscernables de deux competences interchangeables, puisque
       aucun decompte de contextes ne les separe.

   La description du referentiel apporte un signal independant. Git et SQL
   ne partagent aucun terme (« versions du code source » contre « bases de
   donnees relationnelles »), la ou React et Vue.js partagent presque tout
   leur vocabulaire. Ce signal est en outre dense : il ne depend pas du
   nombre d'offres publiees.

   Poids majoritaire assume : a l'echelle actuelle du corpus, la
   description est plus fiable que 141 paires observees. Le rapport
   s'inversera naturellement quand la plateforme aura assez d'offres. */
const POIDS_TEXTE = 0.6;

/* Mots vides francais : trop frequents pour porter du sens, ils
   rapprocheraient artificiellement toutes les descriptions. */
const MOTS_VIDES = new Set([
  'de', 'des', 'du', 'la', 'le', 'les', 'un', 'une', 'et', 'ou', 'au',
  'aux', 'sur', 'pour', 'par', 'dans', 'avec', 'sans', 'leur', 'leurs',
  'ce', 'ces', 'son', 'ses', 'est', 'sont'
]);

/* Durée de vie du cache. La matrice ne change qu'avec les compétences
   déclarées : la recalculer à chaque requête serait inutile. */
const DUREE_CACHE_MS = 5 * 60 * 1000;

let cache = null;

/* ---------------------------------------------------------------------
   Lecture des contextes
   ------------------------------------------------------------------ */
async function lireContextes(client) {
  const offres = await client.query(`
    SELECT "idOffre" AS contexte, "idCompetenceReference" AS competence
    FROM "CompetenceOffre"
  `);
  const etudiants = await client.query(`
    SELECT "idEtudiant" AS contexte, "idCompetenceReference" AS competence
    FROM "CompetenceEtudiant"
  `);

  // Les identifiants de contexte sont préfixés : une offre 3 et un
  // étudiant 3 sont deux contextes distincts.
  const parContexte = new Map();
  const ajouter = (prefixe, lignes) => {
    for (const { contexte, competence } of lignes) {
      const cle = `${prefixe}${contexte}`;
      if (!parContexte.has(cle)) parContexte.set(cle, new Set());
      parContexte.get(cle).add(Number(competence));
    }
  };
  ajouter('o', offres.rows);
  ajouter('e', etudiants.rows);

  return [...parContexte.values()].filter(s => s.size >= 2);
}

/* Decoupe une description en termes significatifs : sans accents, sans
   mots vides, sans termes trop courts. */
function termes(texte) {
  if (!texte) return [];
  return texte
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter(m => m.length > 2 && !MOTS_VIDES.has(m))
    .map(racine);
}

/* Racinisation minimale du francais.

   Sans elle, « industrielle » et « industrielles » sont deux termes
   distincts : « Genie mecanique » et « Genie des procedes » ne
   partageaient donc aucun mot alors que leurs descriptions evoquent
   toutes deux la production industrielle.

   Volontairement conservatrice — on retire les marques de pluriel et de
   feminin les plus regulieres, sans chercher a lemmatiser. Une
   racinisation agressive rapprocherait des termes sans rapport, ce qui
   serait pire que le probleme initial. */
function racine(mot) {
  if (mot.length <= 4) return mot;
  return mot
    .replace(/(aux|eaux)$/, 'al')
    .replace(/(elles|elle)$/, 'el')
    .replace(/(ives|ive)$/, 'if')
    .replace(/s$/, '')
    .replace(/e$/, '');
}

/* Vecteurs TF-IDF des descriptions.

   L'IDF est indispensable : sans lui, « pour » ou « applications »
   pesueraient autant que « relationnelles ». Ce sont precisement les
   termes rares qui distinguent une competence d'une autre. */
function construireVecteursTexte(competences) {
  const documents = new Map();
  const frequenceDocumentaire = new Map();

  for (const [id, infos] of competences) {
    const mots = termes(infos.description);
    if (mots.length === 0) continue;

    const comptes = new Map();
    for (const m of mots) comptes.set(m, (comptes.get(m) || 0) + 1);
    documents.set(id, comptes);

    for (const m of comptes.keys()) {
      frequenceDocumentaire.set(m, (frequenceDocumentaire.get(m) || 0) + 1);
    }
  }

  const nombreDocuments = documents.size || 1;
  const vecteurs = new Map();
  const normes = new Map();

  for (const [id, comptes] of documents) {
    const vecteur = new Map();
    let sommeCarres = 0;
    for (const [mot, tf] of comptes) {
      const idf = Math.log(nombreDocuments / (frequenceDocumentaire.get(mot) || 1)) + 1;
      const poids = tf * idf;
      vecteur.set(mot, poids);
      sommeCarres += poids * poids;
    }
    vecteurs.set(id, vecteur);
    normes.set(id, Math.sqrt(sommeCarres));
  }

  return { vecteurs, normes };
}

/* ---------------------------------------------------------------------
   Construction de la matrice
   ------------------------------------------------------------------ */
export async function construireMatrice(client) {
  const contextes = await lireContextes(client);

  const referentiel = await client.query(`
    SELECT "idCompetenceReference" AS id,
           "nomCompetenceReference" AS nom,
           "categorieCompetenceReference" AS categorie,
           "description"
    FROM "CompetenceReference"
  `);

  const competences = new Map(
    referentiel.rows.map(r => [
      Number(r.id),
      { nom: r.nom, categorie: r.categorie, description: r.description }
    ])
  );

  const texte = construireVecteursTexte(competences);

  /* 1. Comptage des co-occurrences. cooc.get(a).get(b) = nombre de
        contextes où a et b apparaissent ensemble. Matrice symétrique. */
  const cooc = new Map();
  const incrementer = (a, b) => {
    if (!cooc.has(a)) cooc.set(a, new Map());
    cooc.get(a).set(b, (cooc.get(a).get(b) || 0) + 1);
  };

  for (const ensemble of contextes) {
    const liste = [...ensemble];
    for (let i = 0; i < liste.length; i++) {
      for (let k = i + 1; k < liste.length; k++) {
        incrementer(liste[i], liste[k]);
        incrementer(liste[k], liste[i]);
      }
    }
  }

  /* 2. Nombre de contextes où chaque compétence apparaît : sert à
        mesurer le volume de preuves disponible pour une paire. */
  const occurrences = new Map();
  for (const ensemble of contextes) {
    for (const id of ensemble) {
      occurrences.set(id, (occurrences.get(id) || 0) + 1);
    }
  }

  /* 3. Norme de chaque vecteur de contexte, pour le cosinus. */
  const normes = new Map();
  for (const [id, voisins] of cooc) {
    let somme = 0;
    for (const valeur of voisins.values()) somme += valeur * valeur;
    normes.set(id, Math.sqrt(somme));
  }

  return {
    cooc,
    normes,
    occurrences,
    competences,
    texte,
    calculeeLe: Date.now(),
    /* Statistiques exposées pour le chapitre évaluation du mémoire :
       elles documentent la densité réelle du corpus. */
    statistiques: {
      nombreContextes: contextes.length,
      nombreCompetences: competences.size,
      pairesObservees: [...cooc.values()].reduce((n, m) => n + m.size, 0) / 2,
      pairesPossibles: (competences.size * (competences.size - 1)) / 2,
      competencesDecrites: texte.vecteurs.size
    }
  };
}

/* ---------------------------------------------------------------------
   Similarité entre deux compétences
   ------------------------------------------------------------------ */

/* Cosinus entre les profils de co-occurrence : mesure du second ordre. */
function cosinusContexte(matrice, a, b) {
  const va = matrice.cooc.get(a);
  const vb = matrice.cooc.get(b);
  if (!va || !vb) return 0;

  const na = matrice.normes.get(a) || 0;
  const nb = matrice.normes.get(b) || 0;
  if (na === 0 || nb === 0) return 0;

  // Parcours du plus petit vecteur : le produit scalaire est creux
  const [petit, grand] = va.size <= vb.size ? [va, vb] : [vb, va];
  let produit = 0;
  for (const [voisin, valeur] of petit) {
    const autre = grand.get(voisin);
    if (autre) produit += valeur * autre;
  }

  return produit / (na * nb);
}

/* Cosinus entre les vecteurs TF-IDF des descriptions. */
function cosinusTexte(matrice, a, b) {
  const va = matrice.texte.vecteurs.get(a);
  const vb = matrice.texte.vecteurs.get(b);
  if (!va || !vb) return 0;

  const na = matrice.texte.normes.get(a) || 0;
  const nb = matrice.texte.normes.get(b) || 0;
  if (na === 0 || nb === 0) return 0;

  const [petit, grand] = va.size <= vb.size ? [va, vb] : [vb, va];
  let produit = 0;
  for (const [mot, poids] of petit) {
    const autre = grand.get(mot);
    if (autre) produit += poids * autre;
  }
  return produit / (na * nb);
}

/* A priori : deux compétences de même catégorie sont un peu plus
   susceptibles d'être proches, en l'absence d'observation. */
function aprioriCategorie(matrice, a, b) {
  const ca = matrice.competences.get(a)?.categorie;
  const cb = matrice.competences.get(b)?.categorie;
  if (!ca || !cb) return 0;
  return ca === cb ? 1 : 0;
}

/**
 * Similarité entre deux compétences, dans [0, 1].
 * 1 = même compétence ; 0 = aucun rapport établi.
 */
export function similarite(matrice, idA, idB) {
  const a = Number(idA);
  const b = Number(idB);
  if (a === b) return 1;

  /* La confiance est bornée par la compétence la moins observée : une
     similarité ne peut pas être plus fiable que son maillon le plus
     faible. */
  const na = matrice.occurrences.get(a) || 0;
  const nb = matrice.occurrences.get(b) || 0;
  const preuves = Math.min(na, nb);
  const confiance = preuves / (preuves + CONSTANTE_AMORTISSEMENT);

  /* Atténuation par la co-occurrence directe : plus deux compétences
     sont exigées ensemble, moins l'une peut se substituer à l'autre. */
  const ensemble = matrice.cooc.get(a)?.get(b) || 0;
  const tauxDirect = preuves > 0 ? Math.min(1, ensemble / preuves) : 0;
  const facteurSubstituabilite = 1 - POIDS_COMPLEMENTARITE * tauxDirect;

  const observee =
    cosinusContexte(matrice, a, b) * confiance * facteurSubstituabilite;

  /* L'a priori de catégorie n'est pas amorti : il ne repose sur aucune
     observation, c'est précisément son rôle de combler leur absence. */
  const apriori = aprioriCategorie(matrice, a, b);

  const textuelle = cosinusTexte(matrice, a, b);

  /* Trois signaux complementaires :
       - la description, dense et disponible meme sans aucune offre ;
       - la co-occurrence observee, precise mais rare ;
       - la categorie, qui n'oriente qu'en dernier recours. */
  const poidsObservation = 1 - POIDS_TEXTE - POIDS_APRIORI;
  const melange =
    POIDS_TEXTE * textuelle +
    poidsObservation * observee +
    POIDS_APRIORI * apriori;

  return melange < SEUIL_SIMILARITE ? 0 : Math.min(1, melange);
}

/**
 * Compétences les plus proches d'une compétence donnée.
 * Sert à l'explication affichée et à l'inspection de la matrice.
 */
export function competencesProches(matrice, idCompetence, limite = 5) {
  const cible = Number(idCompetence);
  const resultats = [];

  for (const [id, infos] of matrice.competences) {
    if (id === cible) continue;
    const score = similarite(matrice, cible, id);
    if (score > 0) {
      resultats.push({
        idCompetenceReference: id,
        nom: infos.nom,
        categorie: infos.categorie,
        similarite: Number(score.toFixed(3)),
        contextes: matrice.occurrences.get(id) || 0
      });
    }
  }

  return resultats
    .sort((x, y) => y.similarite - x.similarite)
    .slice(0, limite);
}

/* ---------------------------------------------------------------------
   Accès avec cache
   ------------------------------------------------------------------ */
export async function obtenirMatrice(client, forcerRecalcul = false) {
  if (!forcerRecalcul && cache && Date.now() - cache.calculeeLe < DUREE_CACHE_MS) {
    return cache;
  }
  cache = await construireMatrice(client);
  return cache;
}

export function invaliderCache() {
  cache = null;
}
