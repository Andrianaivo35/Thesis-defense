/* =====================================================================
   INSTALLATION DES FICHIERS CV, depuis le corpus versionné

   Usage : npm run base:cv

   POURQUOI CE SCRIPT PLUTÔT QU'UNE ARCHIVE À TRANSMETTRE

   Les 38 PDF de `uploads/cv/` sont, octet pour octet, les 38 PDF de
   `scripts/corpus/cv-test/`, qui sont versionnés. Seul le nom diffère :
   l'application range ses dépôts sous un identifiant unique, le corpus
   les nomme lisiblement.

   Les transmettre à part — archive sur clé, ou dossier `uploads/`
   ajouté au dépôt — reviendrait à livrer deux fois les mêmes octets, et
   à mettre dans git un dossier volontairement exclu parce qu'il reçoit
   les fichiers déposés par de vrais utilisateurs.

   La correspondance entre les deux noms est déjà en base, dans la table
   `CV` : `nomFichierOriginal` donne le fichier du corpus, `nomFichier`
   le nom attendu par l'application. Il suffit de la suivre.

   CONSÉQUENCE

   Après un clone et le chargement des données, cette commande suffit :
   rien à transmettre à la main, et aucune donnée personnelle dans le
   dépôt.
   ===================================================================== */
import 'dotenv/config';
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const RACINE = process.cwd();
const CORPUS = path.join(RACINE, 'scripts', 'corpus', 'cv-test');
const DEPOTS = process.env.UPLOADS_DIR || path.join(RACINE, 'uploads');

const stop = (message, quoiFaire) => {
  console.error(`\n[cv] ECHEC : ${message}`);
  if (quoiFaire) console.error(`     -> ${quoiFaire}\n`);
  process.exit(1);
};

if (!existsSync(CORPUS)) {
  stop(`corpus introuvable : ${CORPUS}`,
    'ce dossier est versionne — un `git pull` devrait le ramener');
}

const client = new pg.Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 5432,
});

await client.connect().catch((e) => stop(
  e.code === '3D000' ? `la base « ${client.database} » n'existe pas`
    : e.code === '28P01' ? `mot de passe refuse pour « ${client.user} »`
      : e.code === 'ECONNREFUSED' ? 'PostgreSQL ne repond pas' : e.message));

/* La correspondance vient de la BASE, pas d'une liste écrite ici : c'est
   elle que l'application interrogera pour retrouver chaque fichier. Une
   liste recopiée se désynchroniserait au premier changement. */
const { rows } = await client.query(
  'SELECT "nomFichier", "nomFichierOriginal" FROM "CV" ORDER BY "idCV"')
  .catch((e) => stop(
    e.code === '42P01' ? 'la table CV n\'existe pas' : e.message,
    'npm run base:charger'));
await client.end();

if (rows.length === 0) {
  stop('aucun CV en base', 'npm run base:charger');
}

/* `lettres/` est cree aussi : l'application y ecrit des le premier depot
   d'une lettre de motivation, et un dossier absent produit une erreur
   d'ecriture au pire moment. */
const dossierCV = path.join(DEPOTS, 'cv');
mkdirSync(dossierCV, { recursive: true });
mkdirSync(path.join(DEPOTS, 'lettres'), { recursive: true });

let copies = 0;
let deja = 0;
const absents = [];

for (const { nomFichier, nomFichierOriginal } of rows) {
  const source = path.join(CORPUS, nomFichierOriginal);
  const cible = path.join(dossierCV, nomFichier);

  if (!existsSync(source)) { absents.push(nomFichierOriginal); continue; }
  /* Une taille identique suffit a reconnaitre un fichier deja en place :
     les sources ne changent qu'a la regeneration du corpus, qui change
     aussi leur taille. Relancer la commande ne recopie donc rien. */
  if (existsSync(cible) && statSync(cible).size === statSync(source).size) { deja++; continue; }

  copyFileSync(source, cible);
  copies++;
}

/* Chemin relatif quand il est sous le projet, absolu sinon : un
   `..\..\..\` remontant hors du dossier se lit plus mal que le chemin
   entier. */
const relatif = path.relative(RACINE, dossierCV);
const affiche = relatif.startsWith('..') ? dossierCV : relatif;
console.log(`[cv] ${affiche} : ${copies} copie(s), ${deja} deja en place`);

if (absents.length) {
  console.error(`[cv] ${absents.length} fichier(s) absent(s) du corpus :`);
  absents.slice(0, 5).forEach((f) => console.error(`     ${f}`));
  stop('le corpus ne correspond pas au jeu de donnees',
    'il a probablement ete regenere : node scripts/corpus/generer-cv-test.js\n'
    + '        puis node scripts/base/seed-candidatures.mjs');
}

console.log('[cv] termine — verifiez avec : npm run base:verifier\n');
