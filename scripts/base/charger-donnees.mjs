/* =====================================================================
   IMPORT DES DONNÉES dans une base dont les tables existent déjà

   Usage : npm run base:charger
           npm run base:charger -- chemin/vers/donnees.sql
           npm run base:charger -- --remplacer      (vide d'abord)

   POURQUOI CE SCRIPT EXISTE À CÔTÉ DE `base:init`

   `base:init` fait deux choses — les migrations, puis le chargement — et
   ce chargement est conditionnel : il n'a lieu QUE si la table
   `utilisateur` est vide. Cette prudence est nécessaire au démarrage
   d'un conteneur, où le script tourne à chaque fois et écraserait le
   travail en cours.

   Elle devient un piège quand on veut justement importer les données.
   Trois situations où `base:init` annonce sa réussite sans rien charger :

     - le fichier de données est absent  -> « demarrage a blanc »
     - la table utilisateur n'est pas vide -> « deja presents »
     - les tables viennent d'être créées à part, par `migrate deploy`

   Ce script-ci ne fait qu'une chose, et la dit. Il ne migre pas, ne
   devine pas, et ne reste jamais silencieux sur un fichier manquant.
   ===================================================================== */
import 'dotenv/config';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const RACINE = process.cwd();
const args = process.argv.slice(2);
const remplacer = args.includes('--remplacer');
const fichier = path.resolve(
  args.find((a) => !a.startsWith('--')) || path.join(RACINE, 'prisma', 'seed.sql'));

const client = new pg.Client({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 5432,
});

const stop = (message, quoiFaire) => {
  console.error(`\n[charger] ECHEC : ${message}`);
  if (quoiFaire) console.error(`          -> ${quoiFaire}\n`);
  process.exit(1);
};

/* --- Le fichier ---------------------------------------------------------
   Vérifié AVANT toute connexion : c'est la panne la plus fréquente, et
   la seule que `base:init` maquille en réussite. */
if (!existsSync(fichier)) {
  stop(`fichier introuvable : ${fichier}`,
    "recuperez `prisma/seed.sql` (il est versionne dans le depot), ou donnez le chemin\n"
    + '             de `donnees.sql` en argument : npm run base:charger -- ../donnees.sql');
}
console.log(`[charger] fichier   ${fichier}`);
console.log(`[charger] base      ${client.database} sur ${client.host}:${client.port}`);

await client.connect().catch((e) => stop(
  e.code === '3D000' ? `la base « ${client.database} » n'existe pas`
    : e.code === '28P01' ? `mot de passe refuse pour « ${client.user} »`
      : e.code === 'ECONNREFUSED' ? 'PostgreSQL ne repond pas' : e.message));

/* --- Les tables ---------------------------------------------------------
   Ce script charge des données, il ne crée pas le schéma. Sans les
   tables, la première instruction échouerait sur un message SQL peu
   parlant. */
const { rows: tables } = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
if (!tables.some((t) => t.tablename === 'utilisateur')) {
  stop('les tables n\'existent pas', 'npm run base:migrer');
}

/* --- Ce qu'il y a déjà -------------------------------------------------- */
const { rows: avant } = await client.query('SELECT count(*)::int AS n FROM utilisateur');
if (avant[0].n > 0 && !remplacer) {
  stop(`${avant[0].n} utilisateurs sont deja presents`,
    'pour tout remplacer : npm run base:charger -- --remplacer');
}

/* --- Le chargement ------------------------------------------------------
   Deux corrections que le fichier de pg_dump impose, et qui échouent
   toutes deux de façon trompeuse si on les ignore :

     - `\restrict` et `\unrestrict` sont des méta-commandes de psql, pas
       du SQL. Le pilote les refuse avec « syntax error at or near \ ».
     - le dump vide le `search_path`. Toute requête non qualifiée échoue
       ensuite, APRÈS le COMMIT, ce qui fait passer un chargement réussi
       pour un échec.

   Et une troisième, propre à ce projet : le dump contient le registre
   `_prisma_migrations`, que `migrate deploy` vient de remplir avec SES
   propres identifiants. Les recharger ne provoque pas d'erreur — les
   UUID diffèrent — mais laisse deux lignes par migration, et fait
   échouer tout rechargement ultérieur sur un conflit de clé. Ce
   registre appartient à Prisma : il ne se restaure jamais depuis un
   jeu de données. */
const contenu = readFileSync(fichier, 'utf8')
  .split('\n')
  .filter((l) => !l.startsWith('\\'))
  .filter((l) => !l.startsWith('INSERT INTO public._prisma_migrations'))
  .join('\n');

console.log(remplacer ? '[charger] remplacement en cours...' : '[charger] chargement en cours...');
try {
  await client.query('BEGIN');
  if (remplacer) {
    /* TRUNCATE ... CASCADE plutôt que DELETE : les tables se référencent
       en cascade, et l'ordre de suppression n'aurait rien d'évident. */
    const noms = tables.map((t) => `"${t.tablename}"`)
      .filter((n) => n !== '"_prisma_migrations"').join(', ');
    await client.query(`TRUNCATE ${noms} RESTART IDENTITY CASCADE`);
  }
  /* En UNE transaction : une base à moitié peuplée serait pire qu'une
     base vide, parce qu'elle passerait pour installée. */
  await client.query(contenu);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK').catch(() => {});
  stop(e.message, 'rien n\'a ete modifie — la transaction a ete annulee');
}
await client.query('SET search_path TO public');

/* --- Ce qui est entré --------------------------------------------------- */
const attendus = new Map();
for (const m of contenu.matchAll(/^INSERT INTO public\.("?)([A-Za-z_]+)\1 /gm)) {
  if (m[2] === '_prisma_migrations') continue;
  attendus.set(m[2], (attendus.get(m[2]) || 0) + 1);
}
let total = 0;
let ecarts = 0;
for (const [table, attendu] of attendus) {
  const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
  total += rows[0].n;
  if (rows[0].n !== attendu) {
    ecarts++;
    console.log(`[charger] ${table} : attendu ${attendu}, trouve ${rows[0].n}`);
  }
}
await client.end();

console.log(`[charger] ${attendus.size} tables, ${total} lignes chargees`);
console.log(ecarts === 0
  ? '[charger] termine — verifiez avec : npm run base:verifier\n'
  : `[charger] ${ecarts} ecart(s) — verifiez avec : npm run base:verifier\n`);
