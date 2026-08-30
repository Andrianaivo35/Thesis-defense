/* =====================================================================
   VÉRIFICATION DE L'INSTALLATION — la base est-elle vraiment prête ?

   Usage : npm run base:verifier

   Ce script ne modifie RIEN. Il répond à une seule question : ce qui
   devait être installé l'est-il ?

   POURQUOI IL EXISTE

   Une installation peut échouer de plusieurs façons qui se ressemblent
   toutes vues de l'application — une page vide, un CV qui ne s'ouvre
   pas — sans qu'on sache laquelle. Les quatre étapes sont pourtant
   distinctes, et chacune peut réussir sans les autres :

     1. le serveur PostgreSQL répond
     2. la base existe
     3. les tables existent          (`prisma migrate deploy`)
     4. les données sont chargées    (le jeu de `prisma/seed.sql`)
     5. les fichiers PDF sont sur le disque

   Le cas le plus trompeur est le 4 : `npm run base:init` ne charge les
   données QUE si la table `utilisateur` est vide. Une base à moitié
   remplie garde donc son contenu partiel à chaque relance, sans qu'un
   seul message d'erreur n'apparaisse.

   D'OÙ VIENNENT LES NOMBRES ATTENDUS

   De `prisma/seed.sql` lui-même, compté à l'exécution — jamais d'une
   liste écrite à la main. Un attendu recopié devient faux le jour où le
   jeu de données change, et un script de vérification qui se trompe est
   pire que pas de script du tout.
   ===================================================================== */
import 'dotenv/config';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import pg from 'pg';

const RACINE = process.cwd();
const SEED = path.join(RACINE, 'prisma', 'seed.sql');

const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 5432,
};

const vert = (t) => `\x1b[32m${t}\x1b[0m`;
const rouge = (t) => `\x1b[31m${t}\x1b[0m`;
const jaune = (t) => `\x1b[33m${t}\x1b[0m`;

let echecs = 0;
const ok = (t) => console.log(`  ${vert('OK')}    ${t}`);
const ko = (t, quoiFaire) => {
  echecs++;
  console.log(`  ${rouge('ECHEC')} ${t}`);
  if (quoiFaire) console.log(`        -> ${quoiFaire}`);
};

/* --- 0. Ce que la configuration dit ------------------------------------
   Affiché avant toute connexion : quand l'accès échoue, la première
   chose à savoir est à QUOI on essayait de se connecter. Le mot de
   passe n'est jamais imprimé, seulement sa présence. */
console.log('\nConfiguration lue dans .env');
console.log(`  hote        ${config.host}:${config.port}`);
console.log(`  utilisateur ${config.user}`);
console.log(`  base        ${config.database}`);
console.log(`  mot de passe ${config.password ? 'renseigne' : jaune('VIDE')}`);
console.log(`  DATABASE_URL ${process.env.DATABASE_URL
  ? jaune(`renseignee — elle ECRASE les DB_* ci-dessus`)
  : 'vide (deduite des DB_*, c\'est le cas normal)'}`);

/* --- 1. et 2. Le serveur répond, et la base existe ---------------------
   Les deux échecs se distinguent par le code renvoyé par PostgreSQL, et
   chacun appelle une correction différente. Un message générique
   « connexion impossible » ferait chercher au mauvais endroit. */
console.log('\nConnexion');
const client = new pg.Client(config);
try {
  await client.connect();
  ok(`connecte a « ${config.database} »`);
} catch (e) {
  const diagnostic = {
    ECONNREFUSED: ['PostgreSQL ne repond pas sur ce port',
      'demarrez le service PostgreSQL, ou mettez DB_HOST=127.0.0.1'],
    '28P01': [`mot de passe refuse pour « ${config.user} »`,
      'verifiez DB_PASSWORD, et que DB_USER vaut bien « postgres » (pas « postgresql »)'],
    '3D000': [`la base « ${config.database} » n'existe pas`,
      /* Le nom est encadre de guillemets doubles : « stage-share »
         contient un tiret, que PostgreSQL lirait comme une soustraction. */
      `psql -U postgres -c 'CREATE DATABASE "${config.database}";'`],
    ENOTFOUND: [`hote « ${config.host} » introuvable`, 'verifiez DB_HOST'],
  }[e.code] || [e.message || e.code, null];
  ko(diagnostic[0], diagnostic[1]);
  console.log(`\n${rouge('Installation incomplete')} — rien d'autre ne peut etre verifie.\n`);
  process.exit(1);
}

/* --- 3. Les tables ------------------------------------------------------ */
console.log('\nSchema');
const { rows: tables } = await client.query(
  `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`);
const presentes = new Set(tables.map((t) => t.tablename));

if (presentes.size === 0) {
  ko('aucune table', 'npm run base:init');
} else {
  ok(`${presentes.size} tables`);
}

/* Les index fonctionnels et les contraintes CHECK que Prisma ne sait pas
   exprimer viennent d'une migration a part. Leur absence ne casse rien
   tout de suite — elle laisse seulement passer deux comptes ayant la
   meme adresse a la casse pres, bien plus tard. */
const { rows: idx } = await client.query(
  `SELECT indexname FROM pg_indexes
    WHERE schemaname = 'public' AND indexname = 'idx_utilisateur_email_unique'`);
if (idx.length) ok('index complementaires appliques');
else ko('migration 0_init_complements non appliquee', 'npm run base:migrer');

/* --- 4. Les données ----------------------------------------------------
   Attendus comptés dans le fichier de jeu de données, pas recopiés. */
console.log('\nDonnees');
if (presentes.size === 0) {
  /* Sans tables, chaque table manque : les enumerer une par une noierait
     le seul message utile, deja donne juste au-dessus. */
  console.log('        (aucune table — rien a compter)');
} else if (!existsSync(SEED)) {
  ko('prisma/seed.sql est absent', 'recuperez-le : il est versionne dans le depot');
} else {
  const seed = readFileSync(SEED, 'utf8');
  const attendus = new Map();
  for (const m of seed.matchAll(/^INSERT INTO public\.("?)([A-Za-z_]+)\1 /gm)) {
    /* `_prisma_migrations` est exclu : `prisma migrate deploy` y ecrit
       ses propres lignes, avec d'autres identifiants. Comparer ce
       registre au fichier n'aurait aucun sens. */
    if (m[2] === '_prisma_migrations') continue;
    attendus.set(m[2], (attendus.get(m[2]) || 0) + 1);
  }

  const ecarts = [];
  for (const [table, attendu] of [...attendus].sort()) {
    if (!presentes.has(table)) { ecarts.push([table, attendu, 'table absente']); continue; }
    const { rows } = await client.query(`SELECT count(*)::int AS n FROM "${table}"`);
    if (rows[0].n !== attendu) ecarts.push([table, attendu, rows[0].n]);
  }

  const total = [...attendus.values()].reduce((a, b) => a + b, 0);
  if (ecarts.length === 0) {
    ok(`${attendus.size} tables peuplees, ${total} lignes — conforme au jeu de donnees`);
  } else {
    ko(`${ecarts.length} table(s) sur ${attendus.size} ne correspondent pas`);
    for (const [table, attendu, trouve] of ecarts) {
      console.log(`        ${table.padEnd(24)} attendu ${String(attendu).padStart(4)}   trouve ${trouve}`);
    }
    /* Une base vide et une base a moitie remplie ne se corrigent pas de
       la meme facon, et la seconde est la plus piegeuse : `base:init`
       la laissera telle quelle indefiniment. */
    const { rows: u } = await client.query('SELECT count(*)::int AS n FROM utilisateur')
      .catch(() => ({ rows: [{ n: 0 }] }));
    console.log(u[0].n === 0
      ? '        -> base vide : npm run base:init'
      : `        -> base a moitie remplie : « base:init » ne rechargera RIEN tant que\n` +
        `           la table utilisateur n'est pas vide. Repartez de zero :\n` +
        `           psql -U postgres -c 'DROP DATABASE "${config.database}";'\n` +
        `           psql -U postgres -c 'CREATE DATABASE "${config.database}";'\n` +
        `           npm run base:init`);
  }
}

/* --- 5. Les fichiers sur le disque -------------------------------------
   Les PDF ne sont pas dans le depot. Une base complete avec un dossier
   vide donne « document indisponible » a l'ecran, ce qui ressemble a un
   defaut de l'application alors que c'est une etape d'installation
   oubliee. */
console.log('\nFichiers deposes');
const dossierCV = path.join(process.env.UPLOADS_DIR || path.join(RACINE, 'uploads'), 'cv');
let attenduCV = 0;
try {
  const { rows } = await client.query('SELECT count(*)::int AS n FROM "CV"');
  attenduCV = rows[0].n;
} catch { /* table absente : deja signale plus haut */ }

if (!existsSync(dossierCV)) {
  ko(`${dossierCV} n'existe pas`,
    'mkdir -p uploads && tar --force-local -xzf ../uploads.tar.gz -C uploads/');
} else {
  const pdf = readdirSync(dossierCV).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (attenduCV && pdf.length < attenduCV) {
    ko(`${pdf.length} PDF sur le disque pour ${attenduCV} CV en base`,
      "l'archive uploads.tar.gz n'est pas extraite, ou pas au bon endroit");
  } else {
    ok(`${pdf.length} PDF dans ${path.relative(RACINE, dossierCV)}`);
  }
}

/* --- Verdict ----------------------------------------------------------- */
await client.end();
console.log(echecs === 0
  ? `\n${vert('Installation complete')} — npm run dev, puis http://localhost:3000\n`
  : `\n${rouge(`Installation incomplete : ${echecs} point(s) a corriger`)}\n`);
process.exit(echecs === 0 ? 0 : 1);
