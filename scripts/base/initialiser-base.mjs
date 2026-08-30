/* =====================================================================
   Initialisation de la base au demarrage du conteneur

   Remplace le montage de quinze fichiers SQL dans
   /docker-entrypoint-initdb.d/ : l'ancien dump du projet, suivi des
   quatorze migrations qui le rattrapaient.

   POURQUOI CE CHANGEMENT

   L'ancien dispositif fonctionnait mais reposait sur une convention
   fragile : chaque migration devait etre montee a la main dans
   docker-compose.yml, dans le bon ordre alphabetique, et RIEN
   n'enregistrait ce qui avait ete applique. Une migration oubliee au
   montage ne se voyait pas — la base partait simplement sans elle.

   Prisma tient desormais ce registre (table _prisma_migrations). Une
   base a jour ne rejoue rien ; une base en retard rattrape exactement ce
   qui lui manque.

   LE JEU DE DONNEES

   Il n'est charge QUE si la base est vide. Sur un volume existant, ce
   script ne fait donc que verifier les migrations. Sans cette condition,
   chaque redemarrage ecraserait le travail en cours.
   ===================================================================== */
import { execFileSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { createRequire } from 'module';
import path from 'path';
import pg from 'pg';

const require = createRequire(import.meta.url);

const RACINE = process.cwd();
const SEED = path.join(RACINE, 'prisma', 'seed.sql');

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

/* --- 1. Migrations ---------------------------------------------------- */
console.log('[base] application des migrations...');
try {
  /* On appelle le CLI de Prisma par son point d'entree plutot que par
     `npx`. Passer par un shell obligerait a l'activer sous Windows, ce
     que Node signale comme une faiblesse — les arguments y sont
     concatenes et non echappes. Ici, aucun shell n'intervient, et le
     comportement est le meme sur les trois systemes. */
  execFileSync(process.execPath, [require.resolve('prisma/build/index.js'),
                                  'migrate', 'deploy'],
    { stdio: 'inherit', cwd: RACINE });
} catch {
  console.error('[base] les migrations ont echoue — le demarrage est interrompu');
  process.exit(1);
}

/* --- 2. Jeu de donnees, si et seulement si la base est vide ------------ */
const client = await pool.connect();
try {
  const { rows } = await client.query('SELECT count(*)::int AS n FROM utilisateur');
  if (rows[0].n > 0) {
    console.log(`[base] ${rows[0].n} utilisateurs deja presents — aucun chargement`);
  } else if (!existsSync(SEED)) {
    console.log('[base] base vide et aucun jeu de donnees : demarrage a blanc');
  } else {
    console.log('[base] base vide — chargement du jeu de donnees...');
    /* Les meta-commandes de psql sont retirees : un dump recent commence
       par `\restrict` et finit par `\unrestrict`, et pg_dump emet aussi
       `\connect` selon les options. Ces lignes ne sont pas du SQL — le
       pilote les refuse avec « syntax error at or near \ », un message
       qui ne dit pas d'ou vient le probleme.

       On ne touche qu'aux lignes ENTIERES commencant par une barre
       oblique inverse : une barre a l'interieur d'une valeur inseree est
       du texte legitime. */
    /* Le registre `_prisma_migrations` est ecarte lui aussi. Les
       migrations viennent d'etre appliquees juste au-dessus, et Prisma y
       a inscrit SES identifiants. Recharger ceux du dump ne provoque
       aucune erreur — les UUID different — mais laisse deux lignes par
       migration, et fait echouer tout rechargement ulterieur sur un
       conflit de cle. Ce registre appartient a Prisma. */
    const contenu = readFileSync(SEED, 'utf8')
      .split('\n')
      .filter(l => !l.startsWith('\\'))
      .filter(l => !l.startsWith('INSERT INTO public._prisma_migrations'))
      .join('\n');

    /* Le dump est joue en UNE transaction : une base a moitie peuplee
       serait pire qu'une base vide, parce qu'elle passerait le test
       ci-dessus au prochain demarrage. */
    await client.query('BEGIN');
    await client.query(contenu);
    await client.query('COMMIT');

    /* pg_dump emet `set_config('search_path', '', false)` en tete : le
       chemin de recherche reste VIDE apres le chargement, et toute
       requete non qualifiee echoue ensuite par « relation ... does not
       exist » — alors meme que le chargement a reussi.

       Le diagnostic est trompeur : l'erreur survient APRES le COMMIT, et
       laisse croire a un echec. On retablit donc le chemin. */
    await client.query('SET search_path TO public');

    const bilan = await client.query('SELECT count(*)::int AS n FROM utilisateur');
    console.log(`[base] jeu de donnees charge — ${bilan.rows[0].n} utilisateurs`);
  }
} catch (erreur) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('[base] chargement impossible :', erreur.message);
  process.exit(1);
} finally {
  client.release();
  await pool.end();
}
