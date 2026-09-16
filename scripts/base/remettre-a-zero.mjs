/* =====================================================================
   REMISE À ZÉRO — une plateforme au premier jour de son installation

   Usage : node scripts/base/remettre-a-zero.mjs --confirmer

   POURQUOI

   Le chapitre 3 raconte la plateforme dans l'ordre où elle se remplit :
   un établissement s'inscrit, un étudiant le rejoint, une entreprise
   publie, un étudiant postule. Ce récit n'est possible que sur une base
   où rien n'existe encore — sur le jeu de démonstration, la première
   candidature est déjà décidée depuis longtemps.

   CE QUI RESTE APRÈS

     le référentiel des compétences   c'est une donnée de la plateforme,
                                      pas d'un utilisateur : une
                                      installation neuve la livre
     le registre des migrations       le schéma, lui, ne change pas
     un compte administrateur         sans lui, personne ne pourrait
                                      vérifier le premier établissement ;
                                      une installation réelle le crée
                                      aussi à la mise en service

   Tout le reste est vidé, compteurs d'identifiants compris : deux
   remises à zéro successives donnent les mêmes identifiants, donc les
   mêmes adresses de page dans les captures.

   ⚠️  EFFACE TOUTES LES DONNÉES DES UTILISATEURS, ET LES FICHIERS DÉPOSÉS.

   Trois garde-fous :
     - l'option --confirmer est obligatoire ;
     - la base doit être locale (localhost ou 127.0.0.1) ;
     - le script refuse de tourner si aucune sauvegarde n'existe dans
       memoire/sauvegardes-base/ — un jeu de démonstration perdu se
       reconstruit en heures, pas en secondes.

   Restaurer ensuite le jeu complet :
     node scripts/base/restaurer-sauvegarde.mjs --confirmer
   ===================================================================== */
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { readFileSync, readdirSync, rmSync, existsSync, mkdirSync, statSync } from 'fs';
import path from 'path';

for (const ligne of readFileSync('.env', 'utf8').split('\n')) {
  const m = ligne.match(/^([A-Z_]+)=(.*)$/);
  if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
}

const HOTE = process.env.DB_HOST || 'localhost';
const DOSSIER_SAUVEGARDES = path.join('memoire', 'sauvegardes-base');
const DOSSIER_DEPOTS = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

if (!process.argv.includes('--confirmer')) {
  console.error('Ce script efface toutes les données. Relancez avec --confirmer.');
  process.exit(1);
}
if (!['localhost', '127.0.0.1'].includes(HOTE)) {
  console.error(`Base non locale (${HOTE}) : remise à zéro refusée.`);
  process.exit(1);
}
const sauvegardes = existsSync(DOSSIER_SAUVEGARDES)
  ? readdirSync(DOSSIER_SAUVEGARDES).filter(f => f.endsWith('.dump'))
  : [];
if (sauvegardes.length === 0) {
  console.error(`Aucune sauvegarde dans ${DOSSIER_SAUVEGARDES}/ : remise à zéro refusée.`);
  process.exit(1);
}

/* Tables conservées. Tout le reste est vidé : lister ce qu'on garde
   plutôt que ce qu'on efface, c'est ne pas oublier la prochaine table
   ajoutée par une migration. */
const CONSERVEES = new Set(['CompetenceReference', '_prisma_migrations']);

export const ADMINISTRATEUR = {
  email: 'admin@stageshare.mg',
  motDePasse: 'Demo1234!',
  nom: 'Administrateur',
  prenom: 'Stage Share',
  telephone: '+261 20 22 000 00',
};

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: HOTE,
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});
const client = await pool.connect();

try {
  const { rows } = await client.query(`
    SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`);
  const aVider = rows.map(r => r.table_name).filter(t => !CONSERVEES.has(t));

  await client.query('BEGIN');
  await client.query(
    `TRUNCATE ${aVider.map(t => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`);

  const empreinte = await bcrypt.hash(ADMINISTRATEUR.motDePasse, 10);
  const { rows: [u] } = await client.query(
    `INSERT INTO utilisateur ("typeUtilisateur", "emailUtilisateur", "motDePasse", "compteActive")
     VALUES ('Admin', $1, $2, true) RETURNING "idUtilisateur"`,
    [ADMINISTRATEUR.email, empreinte]);
  await client.query(
    `INSERT INTO admin ("idUtilisateur", "nomAdmin", "prenomAdmin", telephone, "dateCreation")
     VALUES ($1, $2, $3, $4, now())`,
    [u.idUtilisateur, ADMINISTRATEUR.nom, ADMINISTRATEUR.prenom, ADMINISTRATEUR.telephone]);
  await client.query('COMMIT');

  console.log(`${aVider.length} tables vidées.`);
  const referentiel = await client.query('SELECT count(*)::int n FROM "CompetenceReference"');
  console.log(`Référentiel conservé : ${referentiel.rows[0].n} compétences.`);
  console.log(`Administrateur d'installation : ${ADMINISTRATEUR.email}`);
} catch (erreur) {
  await client.query('ROLLBACK').catch(() => {});
  console.error('Remise à zéro annulée :', erreur.message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}

/* Les fichiers déposés : leurs lignes en base viennent de disparaître,
   les garder laisserait des CV orphelins sur le disque. Les
   sous-dossiers sont conservés, l'application y écrit sans les créer. */
if (!process.exitCode && existsSync(DOSSIER_DEPOTS)) {
  let n = 0;
  for (const sous of readdirSync(DOSSIER_DEPOTS)) {
    const dossier = path.join(DOSSIER_DEPOTS, sous);
    if (!statSync(dossier).isDirectory()) continue;
    for (const f of readdirSync(dossier)) {
      rmSync(path.join(dossier, f), { recursive: true, force: true });
      n++;
    }
  }
  mkdirSync(path.join(DOSSIER_DEPOTS, 'cv'), { recursive: true });
  mkdirSync(path.join(DOSSIER_DEPOTS, 'lettres'), { recursive: true });
  console.log(`${n} fichiers déposés retirés de ${path.relative(process.cwd(), DOSSIER_DEPOTS)}/.`);
}
