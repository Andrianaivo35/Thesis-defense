/* =====================================================================
   LECTURE DE FICHIERS CSV

   Écrit ici plutôt qu'emprunté à une bibliothèque, parce que le besoin
   est étroit — un fichier d'une page de colonnes, sans échappement
   exotique — et que les difficultés réelles ne sont pas celles que
   traite une bibliothèque générique. Elles tiennent toutes à une seule
   cause : LE FICHIER SORT D'EXCEL, sur un poste français.

   TROIS PIÈGES, TOUS OBSERVÉS DANS LA VRAIE VIE

   1. LE SÉPARATEUR N'EST PAS LA VIRGULE. Excel configuré en français
      écrit des points-virgules, parce que la virgule y est le séparateur
      décimal. Un lecteur qui suppose la virgule voit une seule colonne
      et déclare le fichier vide.

   2. L'ENCODAGE N'EST PAS UTF-8. « Enregistrer sous CSV » produit du
      Windows-1252. Les noms malgaches et français y perdent leurs
      accents : « Rakotondrabé » devient « RakotondrabÃ© ». Le fichier
      s'importe sans erreur, et la base se remplit de noms abîmés — un
      échec silencieux, le pire des trois.

   3. LA MARQUE D'ORDRE D'OCTETS. Excel préfixe ses fichiers UTF-8 de
      trois octets invisibles. Sans les retirer, la première en-tête
      s'appelle « ﻿nom » et aucune colonne n'est reconnue.
   ===================================================================== */

/* Séparateurs envisagés, du plus au moins probable dans notre contexte. */
const SEPARATEURS = [';', ',', '\t', '|'];

/**
 * Décode un fichier en texte, en devinant son encodage.
 *
 * On tente l'UTF-8 en mode strict : s'il échoue, c'est que le fichier
 * n'est pas de l'UTF-8, et le candidat suivant est Windows-1252 —
 * l'encodage d'Excel sur un poste occidental.
 *
 * L'ordre compte. Windows-1252 accepte n'importe quelle suite d'octets
 * sans jamais échouer : l'essayer en premier « réussirait » toujours, y
 * compris sur de l'UTF-8, qu'il transformerait en charabia.
 */
export function decoder(tampon) {
  const octets = Buffer.isBuffer(tampon) ? tampon : Buffer.from(tampon);

  let texte;
  try {
    texte = new TextDecoder('utf-8', { fatal: true }).decode(octets);
  } catch {
    texte = new TextDecoder('windows-1252').decode(octets);
  }

  // Marque d'ordre d'octets
  if (texte.charCodeAt(0) === 0xfeff) texte = texte.slice(1);

  return texte;
}

/**
 * Devine le séparateur : celui qui découpe la première ligne non vide en
 * le plus grand nombre de colonnes.
 *
 * On compare sur l'en-tête plutôt que sur le fichier entier : c'est la
 * ligne dont on sait qu'elle contient toutes les colonnes, et elle ne
 * contient pas de données susceptibles de fausser le compte.
 */
export function devinerSeparateur(texte) {
  const premiere = texte.split(/\r?\n/).find(l => l.trim().length > 0) || '';
  let meilleur = ';';
  let colonnes = 0;
  for (const sep of SEPARATEURS) {
    const n = decouperLigne(premiere, sep).length;
    if (n > colonnes) { colonnes = n; meilleur = sep; }
  }
  return meilleur;
}

/* Découpe une ligne en respectant les guillemets : un champ entouré de
   guillemets peut contenir le séparateur, et « "" » y représente un
   guillemet littéral. Sans cela, « Rakoto, Jean » dans une cellule
   décalerait toutes les colonnes suivantes. */
function decouperLigne(ligne, separateur) {
  const champs = [];
  let courant = '';
  let entreGuillemets = false;

  for (let i = 0; i < ligne.length; i++) {
    const c = ligne[i];
    if (entreGuillemets) {
      if (c === '"') {
        if (ligne[i + 1] === '"') { courant += '"'; i++; }
        else entreGuillemets = false;
      } else courant += c;
    } else if (c === '"') {
      entreGuillemets = true;
    } else if (c === separateur) {
      champs.push(courant);
      courant = '';
    } else {
      courant += c;
    }
  }
  champs.push(courant);
  return champs.map(c => c.trim());
}

/* Découpe le fichier en lignes logiques. Une ligne physique ne suffit
   pas : un champ entre guillemets peut contenir un retour à la ligne —
   cas courant d'une adresse postale collée dans une cellule. */
function lignesLogiques(texte) {
  const lignes = [];
  let courante = '';
  let entreGuillemets = false;

  for (let i = 0; i < texte.length; i++) {
    const c = texte[i];
    if (c === '"') entreGuillemets = !entreGuillemets;

    if (!entreGuillemets && (c === '\n' || c === '\r')) {
      if (c === '\r' && texte[i + 1] === '\n') i++;
      lignes.push(courante);
      courante = '';
    } else {
      courante += c;
    }
  }
  if (courante.length > 0) lignes.push(courante);
  return lignes;
}

/* Normalise un nom de colonne pour le rapprocher des alias attendus :
   « Prénom », « prenom », « PRENOM  » désignent la même chose. */
export function normaliserEntete(valeur) {
  return String(valeur || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Lit un fichier CSV.
 *
 * @param {Buffer} tampon contenu brut du fichier
 * @returns {{entetes: string[], lignes: object[], separateur: string, total: number}}
 *   `lignes` associe chaque en-tête normalisé à sa valeur, et porte le
 *   numéro de ligne du fichier — c'est lui qu'affichera le récapitulatif,
 *   pour que l'utilisateur retrouve la ligne dans son tableur.
 */
export function lireCSV(tampon) {
  const texte = decoder(tampon);
  const separateur = devinerSeparateur(texte);
  const brutes = lignesLogiques(texte).filter(l => l.trim().length > 0);

  if (brutes.length === 0) {
    return { entetes: [], lignes: [], separateur, total: 0 };
  }

  const entetes = decouperLigne(brutes[0], separateur).map(normaliserEntete);
  const lignes = [];

  for (let i = 1; i < brutes.length; i++) {
    const champs = decouperLigne(brutes[i], separateur);
    const objet = {};
    entetes.forEach((entete, k) => {
      if (entete) objet[entete] = champs[k] ?? '';
    });
    /* +1 pour l'en-tête, +1 parce qu'un tableur numérote à partir de 1 :
       la ligne 2 du fichier est le premier étudiant. */
    objet.__ligne = i + 1;
    lignes.push(objet);
  }

  return { entetes, lignes, separateur, total: lignes.length };
}
