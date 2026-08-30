/* =====================================================================
   Produit le necessaire pour reprendre le projet sur un autre poste.

   Usage : node scripts/exporter-donnees.mjs

   Trois artefacts dans export/ :
     donnees.sql     toutes les donnees, en INSERT explicites
     uploads.tar.gz  les fichiers PDF des CV
     INSTALLATION.md la procedure (versionnee, pas engendree ici)

   POURQUOI DES INSERT ET NON DES COPY

   pg_dump produit par defaut des `COPY ... FROM stdin` suivis d'un
   terminateur `\.`. C'est une construction propre a psql : le pilote
   `pg` la refuse avec « syntax error at or near \ », un message qui ne
   dit pas d'ou vient le probleme.

   Le script d'initialisation devant charger ce fichier sans psql, on
   exporte en INSERT nommant leurs colonnes. Plus volumineux, mais
   chargeable par n'importe quel client — et resistant a un changement
   d'ordre des colonnes.

   POURQUOI CES FICHIERS NE SONT PAS DANS LE DEPOT

   uploads.tar.gz contient des CV. Le dossier `uploads/` est
   volontairement exclu de git pour cette raison ; l'archive le serait
   tout autant. Elle se transmet par cle USB ou par lien prive.

   donnees.sql est identique a prisma/seed.sql, qui est versionne : il
   n'est copie ici que pour tenir dans un seul dossier a remettre.
   ===================================================================== */
import { execFileSync } from 'child_process';
import { mkdirSync, copyFileSync, existsSync, statSync, writeFileSync } from 'fs';
import path from 'path';

const RACINE = process.cwd();
const EXPORT = path.join(RACINE, 'export');
const CONTENEUR = process.env.CONTENEUR_DB || 'stage-share-db';
const BASE = process.env.DB_NAME || 'stage-share';

mkdirSync(EXPORT, { recursive: true });

const taille = (f) => existsSync(f)
  ? (statSync(f).size / 1048576).toFixed(1) + ' Mo' : 'absent';

/* --- 1. Les donnees --------------------------------------------------- */
const seed = path.join(RACINE, 'prisma', 'seed.sql');
console.log('Export des donnees...');
try {
  const dump = execFileSync('docker', [
    'exec', CONTENEUR, 'pg_dump', '-U', process.env.DB_USER || 'postgres',
    '-d', BASE, '--data-only', '--column-inserts',
    '--no-owner', '--no-privileges'
  ], { maxBuffer: 256 * 1024 * 1024 });
  writeFileSync(seed, dump);
} catch {
  console.log('  (conteneur injoignable — prisma/seed.sql existant conserve)');
}
copyFileSync(seed, path.join(EXPORT, 'donnees.sql'));
console.log('  export/donnees.sql :', taille(path.join(EXPORT, 'donnees.sql')));

/* --- 2. Les fichiers deposes ------------------------------------------ */
console.log('Archivage des CV...');
mkdirSync(path.join(RACINE, 'uploads', 'cv'), { recursive: true });
mkdirSync(path.join(RACINE, 'uploads', 'lettres'), { recursive: true });
/* Chemin RELATIF pour l'archive : sous Windows, GNU tar interprete
   « C:\... » comme un hote distant — la syntaxe `hote:chemin` — et
   echoue sur « Cannot connect to C ». Depuis uploads/, la destination
   s'ecrit sans lettre de lecteur. */
execFileSync('tar', ['-czf', path.join('..', 'export', 'uploads.tar.gz'), 'cv', 'lettres'],
  { cwd: path.join(RACINE, 'uploads') });
console.log('  export/uploads.tar.gz :', taille(path.join(EXPORT, 'uploads.tar.gz')));

console.log('\nRemettre le dossier export/ — par cle USB ou lien prive, pas par git :');
console.log('  il contient des CV, qui sont des donnees personnelles.');
