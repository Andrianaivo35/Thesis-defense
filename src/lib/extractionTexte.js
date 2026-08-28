import { PDFParse } from 'pdf-parse';
import { obtenirMoteurOcr } from './ocr.js';

/* =====================================================================
   EXTRACTION DU TEXTE D'UN CV — décision de routage page par page

   LE PROBLÈME

   Un PDF n'est pas un format, c'est deux formats sous un même nom :

     - le PDF NATIF porte une couche texte. Le texte est là, il suffit de
       le lire. Rapide, exact, gratuit.

     - le PDF NUMÉRISÉ n'est qu'une image de page — une photocopie, ou de
       plus en plus souvent une photo prise au téléphone. Aucune couche
       texte. Un extracteur classique y renvoie du vide, sans erreur : le
       CV est traité comme s'il ne contenait rien.

   L'étudiant ne doit jamais avoir à déclarer laquelle des deux natures
   il dépose. La détection est donc automatique.

   POURQUOI PAGE PAR PAGE ET NON DOCUMENT PAR DOCUMENT

   Le cas mixte est courant et c'est le plus traître : un CV rédigé sur
   traitement de texte (natif), auquel l'étudiant agrafe le scan de son
   diplôme ou de son attestation de scolarité.

   Une décision prise au niveau du document se trompe forcément :
     - « le document a du texte » → la page numérisée est ignorée ;
     - « le document est un scan » → on passe la page native à l'OCR,
       en dégradant un texte qui était parfait.

   D'où le routage page par page. C'est peu coûteux à écrire et cela
   change la nature du résultat.

   COMMENT ON RÉCUPÈRE L'IMAGE D'UNE PAGE NUMÉRISÉE

   On extrait l'image déjà EMBARQUÉE dans le PDF, plutôt que de
   rastériser la page. C'est possible parce qu'une page numérisée EST une
   image plein cadre : c'est ainsi que tout scanner produit son PDF.

   L'intérêt est concret : rastériser exigerait un moteur de rendu et une
   bibliothèque graphique native (canvas), lourds à installer dans le
   conteneur. L'extraction directe n'a besoin de rien de plus.

   Limite assumée, à signaler au mémoire : une page numérisée découpée en
   plusieurs images, ou mêlant image et dessin vectoriel, n'est pas
   couverte. Ce n'est pas le cas des scanners courants.
   ===================================================================== */

/* En deçà de ce nombre de caractères, une page de CV est considérée
   comme dépourvue de couche texte exploitable.

   Le seuil n'est pas arbitraire : une page numérisée renvoie en général
   0 caractère, mais parfois quelques dizaines — un numéro de page, un
   filigrane, un en-tête resté vectoriel. À l'inverse, la page de CV la
   plus dépouillée de notre corpus en compte plus de 600. La marge entre
   les deux populations est large ; 180 s'y place sans ambiguïté. */
const SEUIL_CARACTERES_PAGE = 180;

/* Une couche texte peut exister tout en étant inexploitable : polices
   mal encodées, PDF produit par un logiciel défaillant. Le symptôme est
   une proportion anormale de caractères non alphabétiques. */
const PART_ALPHABETIQUE_MINIMALE = 0.45;

export const VOIE_NATIVE = 'native';
export const VOIE_OCR = 'ocr';

/**
 * Décide si une page doit passer par l'OCR, et dit pourquoi.
 * Isolée de tout accès disque pour rester directement testable.
 */
export function evaluerCoucheTexte(texte) {
  const contenu = (texte || '').trim();

  if (contenu.length < SEUIL_CARACTERES_PAGE) {
    return {
      voie: VOIE_OCR,
      motif: contenu.length === 0
        ? 'aucune couche texte'
        : `couche texte trop courte (${contenu.length} caractères)`
    };
  }

  const lettres = (contenu.match(/[\p{L}]/gu) || []).length;
  const part = lettres / contenu.length;
  if (part < PART_ALPHABETIQUE_MINIMALE) {
    return {
      voie: VOIE_OCR,
      motif: `couche texte illisible (${Math.round(part * 100)} % de lettres)`
    };
  }

  return { voie: VOIE_NATIVE, motif: 'couche texte exploitable' };
}

/* Le texte issu d'un PDF natif porte les cicatrices de sa mise en page :
   mots coupés en fin de ligne, espaces multiples, lignes vides à
   répétition. On les efface avant d'aller plus loin, pour que la suite du
   pipeline traite un texte natif et un texte OCR de la même façon. */
export function nettoyerTexte(texte) {
  return (texte || '')
    // Recoller les mots coupés par un tiret en fin de ligne
    .replace(/([\p{L}])-\s*\n\s*([\p{Ll}])/gu, '$1$2')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t\u00A0]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function versTampon(donnees) {
  if (Buffer.isBuffer(donnees)) return donnees;
  if (donnees instanceof Uint8Array) return Buffer.from(donnees);
  /* pdf-parse peut restituer l'image sous forme d'objet indexé par
     position ; on le ramène à une suite d'octets. */
  if (donnees && typeof donnees === 'object') return Buffer.from(Object.values(donnees));
  return null;
}

/**
 * Extrait le texte d'un CV, page par page.
 *
 * @param {Buffer} fichier le PDF
 * @returns {Promise<{
 *   texte: string, pages: Array, nombrePages: number,
 *   pagesOcr: number, confianceOcr: number|null, voie: string
 * }>}
 */
export async function extraireTexteCV(fichier) {
  const analyseur = new PDFParse({ data: fichier });
  let pagesTexte = [];
  const imagesParPage = new Map();

  try {
    const resultat = await analyseur.getText();
    pagesTexte = resultat.pages || [];

    /* On ne réclame les images que si au moins une page en aura besoin :
       leur décodage est la partie coûteuse de la lecture du PDF. */
    const besoinImages = pagesTexte.some(
      p => evaluerCoucheTexte(p.text).voie === VOIE_OCR
    );

    if (besoinImages) {
      const extrait = await analyseur.getImage();
      for (const page of extrait.pages || []) {
        if (page.images?.length) imagesParPage.set(page.pageNumber, page.images);
      }
    }
  } finally {
    await analyseur.destroy();
  }

  const moteur = obtenirMoteurOcr();
  const pages = [];
  const confiances = [];

  for (let i = 0; i < pagesTexte.length; i++) {
    const numero = i + 1;
    const brut = pagesTexte[i].text || '';
    const decision = evaluerCoucheTexte(brut);

    if (decision.voie === VOIE_NATIVE) {
      pages.push({
        numero, voie: VOIE_NATIVE, motif: decision.motif,
        texte: nettoyerTexte(brut), confiance: null
      });
      continue;
    }

    const images = imagesParPage.get(numero) || [];
    if (images.length === 0) {
      /* Ni texte ni image : la page est réellement vide. Ce n'est pas une
         panne, et il ne faut pas la présenter comme telle. */
      pages.push({
        numero, voie: VOIE_NATIVE, motif: 'page vide',
        texte: '', confiance: null
      });
      continue;
    }

    /* Une page numérisée est une image plein cadre : on retient la plus
       volumineuse, qui est la page elle-même et non un logo ou un tampon. */
    const tampons = images.map(im => versTampon(im.data)).filter(Boolean);
    const image = tampons.sort((a, b) => b.length - a.length)[0];

    try {
      const { texte, confiance } = await moteur.reconnaitre(image);
      if (typeof confiance === 'number') confiances.push(confiance);
      pages.push({
        numero, voie: VOIE_OCR, motif: decision.motif,
        texte: nettoyerTexte(texte), confiance, moteur: moteur.nom
      });
    } catch (erreur) {
      /* L'échec d'une page ne doit pas emporter le document : les autres
         pages restent exploitables, et l'étudiant est informé de ce qui
         n'a pas pu être lu. */
      pages.push({
        numero, voie: VOIE_OCR, motif: decision.motif,
        texte: '', confiance: null, erreur: erreur.message
      });
    }
  }

  const pagesOcr = pages.filter(p => p.voie === VOIE_OCR).length;

  return {
    texte: pages.map(p => p.texte).filter(Boolean).join('\n\n'),
    pages,
    nombrePages: pages.length,
    pagesOcr,
    confianceOcr: confiances.length
      ? Math.round((confiances.reduce((s, c) => s + c, 0) / confiances.length) * 100) / 100
      : null,
    voie: pagesOcr === 0 ? VOIE_NATIVE : (pagesOcr === pages.length ? VOIE_OCR : 'mixte')
  };
}
