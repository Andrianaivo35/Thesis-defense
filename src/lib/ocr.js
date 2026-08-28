import path from 'path';

/* =====================================================================
   RECONNAISSANCE OPTIQUE DE CARACTÈRES — adaptateur

   POURQUOI UN ADAPTATEUR PLUTÔT QU'UN APPEL DIRECT

   Le choix d'un moteur OCR est un arbitrage, pas une évidence :

     - Tesseract (retenu ici) est libre, s'exécute hors ligne, et se
       glisse dans le conteneur existant. Sa précision suffit sur du CV
       dactylographié. La démonstration ne dépend d'aucun réseau ni
       d'aucun quota.

     - Les OCR infonuagiques (Google Vision, Azure Document Intelligence,
       AWS Textract) sont nettement meilleurs sur les scans
       photographiés, et surtout sensibles à la MISE EN PAGE : ils
       reconstituent l'ordre de lecture d'un CV sur deux colonnes, là où
       Tesseract entrelace les colonnes. Mais ils sont payants et
       dépendent du réseau.

   Cet arbitrage peut légitimement se retourner en production. Le placer
   derrière une interface fait du changement de moteur une affaire de
   configuration, non de réécriture : le reste du pipeline ne connaît que
   `reconnaitre(image) -> { texte, confiance }`.

   CONTRAT

     nom          identifiant du moteur, journalisé avec le résultat
     disponible() le moteur peut-il travailler ici et maintenant
     reconnaitre(image) -> { texte, confiance }   confiance en 0..100

   RÈGLE : un moteur indisponible LÈVE une erreur. Il ne renvoie jamais
   un texte vide, qui serait indistinguable d'une page blanche et ferait
   passer une panne pour un CV sans compétences.
   ===================================================================== */

/* Les données linguistiques sont versionnées dans le dépôt plutôt que
   téléchargées au premier appel. Sans cela, la première analyse échoue
   sur une machine hors ligne — et une soutenance se déroule rarement
   avec une connexion fiable. */
const DOSSIER_DONNEES = process.env.OCR_DATA_DIR || path.join(process.cwd(), 'ocr-data');

const LANGUE = process.env.OCR_LANGUE || 'fra';

/* Un travailleur Tesseract coûte plusieurs centaines de millisecondes à
   démarrer et charge le modèle en mémoire. On le garde entre deux
   analyses. */
let travailleurPartage = null;
let demarrageEnCours = null;

async function obtenirTravailleur() {
  if (travailleurPartage) return travailleurPartage;
  /* Deux analyses simultanées ne doivent pas démarrer deux travailleurs :
     la seconde attend la promesse de la première. */
  if (demarrageEnCours) return demarrageEnCours;

  demarrageEnCours = (async () => {
    const { createWorker } = await import('tesseract.js');
    travailleurPartage = await createWorker(LANGUE, undefined, {
      langPath: DOSSIER_DONNEES,
      cachePath: DOSSIER_DONNEES,
      gzip: false
    });
    demarrageEnCours = null;
    return travailleurPartage;
  })();

  return demarrageEnCours;
}

const moteurTesseract = {
  nom: 'tesseract',

  async disponible() {
    try {
      await import('tesseract.js');
      return true;
    } catch {
      return false;
    }
  },

  async reconnaitre(image) {
    const travailleur = await obtenirTravailleur();
    const { data } = await travailleur.recognize(image);
    return {
      texte: data.text || '',
      confiance: typeof data.confidence === 'number' ? data.confidence : null
    };
  }
};

/* Moteur de repli explicite. Il existe pour que l'absence d'OCR soit une
   information — « ce CV est un scan et nous ne savons pas le lire » —
   plutôt qu'un silence. */
const moteurAbsent = {
  nom: 'aucun',
  async disponible() { return false; },
  async reconnaitre() {
    throw new Error(
      "Aucun moteur OCR n'est configuré : ce CV est un document numérisé " +
      'et son contenu ne peut pas être lu automatiquement.'
    );
  }
};

const MOTEURS = {
  tesseract: moteurTesseract,
  aucun: moteurAbsent
};

/** Renvoie le moteur configuré (variable d'environnement MOTEUR_OCR). */
export function obtenirMoteurOcr() {
  const demande = process.env.MOTEUR_OCR || 'tesseract';
  return MOTEURS[demande] || moteurAbsent;
}

/** Libère le travailleur. Appelé par les scripts en ligne de commande,
    qui autrement ne rendraient jamais la main. */
export async function libererOcr() {
  if (travailleurPartage) {
    await travailleurPartage.terminate();
    travailleurPartage = null;
  }
}
