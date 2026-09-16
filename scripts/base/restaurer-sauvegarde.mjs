/* =====================================================================
   RESTAURATION D'UNE SAUVEGARDE — base et fichiers déposés

   Usage : node scripts/base/restaurer-sauvegarde.mjs --confirmer [nom]

   Sans nom, restaure « avant-chapitre3 » : la base telle qu'elle était
   avant la remise à zéro du scénario, avec ses 38 CV.

   Les sauvegardes vivent dans memoire/sauvegardes-base/ :
     <nom>.dump                 format personnalisé de pg_dump
     <nom>-uploads.tar.gz       le dossier uploads/ au même instant

   POURQUOI PASSER PAR LE CONTENEUR

   pg_restore n'est pas installé sur le poste, mais il l'est dans
   l'image PostgreSQL. On y copie le fichier et on l'y exécute : même
   version d'outil que le serveur, donc aucun écart de format.

   --clean --if-exists supprime les objets avant de les recréer : la
   base retrouve exactement l'état sauvegardé, identifiants compris,
   quel que soit ce qui s'y est passé entre-temps.
   ===================================================================== */
import { execFileSync } from 'child_process';
import { existsSync, rmSync, readdirSync, statSync } from 'fs';
import path from 'path';

if (!process.argv.includes('--confirmer')) {
  console.error('Ce script remplace toutes les données. Relancez avec --confirmer.');
  process.exit(1);
}
const nom = process.argv.slice(2).find(a => !a.startsWith('--')) || 'avant-chapitre3';
const DOSSIER = path.join('memoire', 'sauvegardes-base');
const dump = path.join(DOSSIER, `${nom}.dump`);
const archive = path.join(DOSSIER, `${nom}-uploads.tar.gz`);
const CONTENEUR = process.env.CONTENEUR_BASE || 'stage-share-db';

if (!existsSync(dump)) {
  console.error(`Sauvegarde introuvable : ${dump}`);
  process.exit(1);
}

/* Sous Git Bash, un chemin « /tmp/… » passé à un exécutable Windows est
   réécrit en chemin Windows. On l'en empêche pour docker. */
const env = { ...process.env, MSYS_NO_PATHCONV: '1' };
const docker = (...args) => execFileSync('docker', args, { stdio: 'inherit', env });

docker('cp', dump, `${CONTENEUR}:/tmp/restauration.dump`);
docker('exec', CONTENEUR, 'pg_restore', '-U', 'postgres', '-d', 'stage-share',
       '--clean', '--if-exists', '--no-owner', '/tmp/restauration.dump');
console.log(`Base restaurée depuis ${dump}`);

if (existsSync(archive)) {
  const depots = path.join(process.cwd(), 'uploads');
  if (existsSync(depots)) {
    for (const sous of readdirSync(depots)) {
      const d = path.join(depots, sous);
      if (statSync(d).isDirectory()) {
        for (const f of readdirSync(d)) rmSync(path.join(d, f), { recursive: true, force: true });
      }
    }
  }
  execFileSync('tar', ['xzf', archive], { stdio: 'inherit', env });
  console.log(`Fichiers déposés restaurés depuis ${archive}`);
}
