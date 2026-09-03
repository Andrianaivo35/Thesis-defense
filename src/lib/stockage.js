import { writeFile, mkdir, readFile, unlink } from 'fs/promises';
import { randomUUID } from 'crypto';
import path from 'path';

/* =====================================================================
   Stockage des fichiers téléversés (CV, lettres de motivation)

   Les fichiers étaient auparavant écrits dans public/uploads/. Deux
   problèmes :

   1. Next.js ne sert le dossier public/ que dans l'état où il se trouvait
      au moment du build. Un fichier déposé ensuite renvoyait 404 : en
      production, une entreprise ne pouvait jamais ouvrir le CV d'un
      candidat.

   2. Tout ce qui est dans public/ est accessible sans authentification.
      Des CV — donnee personnelle — étaient téléchargeables par quiconque
      connaissait l'URL.

   Les fichiers sont désormais écrits hors de public/, sur un volume Docker
   dédié, et servis uniquement par des routes qui vérifient les droits.

   Ce module est le seul à manipuler des chemins : le reste du code ne
   connaît que des noms de fichiers.
   ===================================================================== */

const RACINE = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

export const TAILLE_MAX_OCTETS = 5 * 1024 * 1024; // 5 Mo
export const TYPE_ATTENDU = 'application/pdf';

/* Sous-dossiers autorisés. Une valeur libre permettrait de sortir de la
   racine de stockage. */
const DOSSIERS = {
  cv: 'cv',
  lettres: 'lettres',
  documents: 'documents'
};

function resoudreDossier(categorie) {
  const dossier = DOSSIERS[categorie];
  if (!dossier) throw new Error(`Catégorie de stockage inconnue : ${categorie}`);
  return path.join(RACINE, dossier);
}

/* Le nom est genere par le serveur : jamais celui fourni par le client,
   qui pourrait contenir des séparateurs de chemin ou « .. ». */
function genererNomFichier(prefixe) {
  return `${prefixe}-${randomUUID()}.pdf`;
}

/**
 * Valide un fichier reçu d'un formulaire.
 * @returns {string|null} message d'erreur en français, ou null si valide
 */
export function validerFichierPdf(fichier, libelle = 'Le fichier') {
  if (!fichier || typeof fichier.arrayBuffer !== 'function') {
    return `${libelle} est manquant.`;
  }
  if (fichier.type !== TYPE_ATTENDU) {
    return `${libelle} doit être au format PDF.`;
  }
  if (fichier.size > TAILLE_MAX_OCTETS) {
    return `${libelle} est trop volumineux (maximum 5 Mo).`;
  }
  if (fichier.size === 0) {
    return `${libelle} est vide.`;
  }
  return null;
}

/**
 * Écrit un fichier sur le volume et renvoie son nom de stockage.
 * @param {'cv'|'lettres'} categorie
 * @returns {Promise<string>} le nom du fichier à conserver en base
 */
export async function enregistrerFichier(categorie, fichier, prefixe = 'fichier') {
  const dossier = resoudreDossier(categorie);
  await mkdir(dossier, { recursive: true });

  const nomFichier = genererNomFichier(prefixe);
  const contenu = Buffer.from(await fichier.arrayBuffer());
  await writeFile(path.join(dossier, nomFichier), contenu);

  return nomFichier;
}

/**
 * Lit un fichier du volume.
 * Le nom est validé pour empêcher toute remontée de répertoire.
 */
export async function lireFichier(categorie, nomFichier) {
  if (!nomFichier || nomFichier.includes('/') || nomFichier.includes('\\') || nomFichier.includes('..')) {
    throw new Error('Nom de fichier invalide');
  }
  return readFile(path.join(resoudreDossier(categorie), nomFichier));
}

/** Supprime un fichier ; l'absence du fichier n'est pas une erreur. */
export async function supprimerFichier(categorie, nomFichier) {
  if (!nomFichier || nomFichier.includes('/') || nomFichier.includes('\\') || nomFichier.includes('..')) {
    return false;
  }
  try {
    await unlink(path.join(resoudreDossier(categorie), nomFichier));
    return true;
  } catch (erreur) {
    if (erreur.code !== 'ENOENT') {
      console.error('Suppression de fichier impossible :', erreur.message);
    }
    return false;
  }
}
