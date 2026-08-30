/* =====================================================================
   ÉTAPE 1 — CAPTURES D'ÉCRAN POUR LE CHAPITRE 3

   Usage : node scripts/memoire/capturer-ecrans.mjs [--url http://localhost:3000]

   Avant de lancer :
     - l'application doit tourner ;
     - `npx playwright install chromium` doit avoir été fait une fois.

   POURQUOI AUTOMATISER PLUTÔT QUE CAPTURER À LA MAIN

   Une vingtaine d'écrans, quatre rôles, des pages qui dépendent des
   données. Une capture manuelle est à refaire entièrement au moindre
   changement d'interface, et rien ne garantit que deux captures montrent
   le même état de la base.

   Ici tout est rejoué à l'identique : mêmes comptes, même résolution,
   même attente avant déclenchement.

   CE QUE CE SCRIPT PRODUIT EN PLUS DES IMAGES

   Un fichier `reperes.json` donnant, pour chaque écran, les COORDONNÉES
   RÉELLES des éléments à annoter — relevées dans le navigateur par
   `boundingBox()`. L'étape suivante y pose ses pastilles numérotées sans
   jamais deviner une position.

   C'est ce qui rend les annotations exactes, et surtout justes après une
   modification de l'interface.
   ===================================================================== */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { creerJeton } from '../../src/lib/jetons.js';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');
const SORTIE = path.join(RACINE, 'chapitre3', 'figures');

const argUrl = process.argv.indexOf('--url');
const BASE = argUrl > -1 ? process.argv[argUrl + 1] : 'http://localhost:3000';

/* Résolution fixe : toutes les figures doivent avoir la même échelle,
   sinon le document mélange des captures de tailles différentes et la
   mise en page devient illisible. */
const LARGEUR = 1440;
const HAUTEUR = 900;

const config = JSON.parse(readFileSync(path.join(ICI, 'ecrans.json'), 'utf8'));
mkdirSync(SORTIE, { recursive: true });

/* --- Sessions ---------------------------------------------------------
   On se connecte par l'API plutôt qu'en remplissant le formulaire :
   c'est plus rapide, et surtout cela ne dépend pas de la mise en page,
   qui est précisément ce que l'on documente. */
async function ouvrirSession(role) {
  if (role === 'public') return null;
  const compte = config.comptes[role];
  if (!compte) throw new Error(`Aucun compte configuré pour le rôle « ${role} »`);

  const reponse = await fetch(BASE + compte.route, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: compte.email, motDePasse: config.motDePasse })
  });
  const data = await reponse.json();
  if (!reponse.ok || !data.token) {
    throw new Error(`Connexion impossible pour ${role} : ${data.error || reponse.status}`);
  }
  return { token: data.token, utilisateur: data.utilisateur };
}

/* Remplace les {{identifiants}} d'une adresse par leurs valeurs.

   Sans cela, chaque page paramétrée porterait un identifiant en dur, et
   changer l'étudiant d'exemple obligerait à modifier cinq adresses. */
function resoudre(chemin) {
  return chemin.replace(/\{\{(\w+)\}\}/g, (_, cle) => {
    const valeur = config.identifiants?.[cle];
    if (valeur === undefined) {
      console.log(`    identifiant inconnu : {{${cle}}}`);
      return '';
    }
    return String(valeur);
  });
}

/* Crée un lien à usage unique pour les écrans qui en attendent un.

   Sans jeton, ces pages n'affichent que leur état d'échec — « ce lien ne
   fonctionne plus » — au lieu du formulaire, qui est ce que le mémoire
   doit montrer.

   Les jetons créés sont INVALIDÉS à la fin de la capture : un script qui
   produit des images n'a pas à laisser derrière lui des accès vivants,
   même limités dans le temps et jamais expédiés. */
const bdd = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

const jetonsCrees = [];

async function creerLien(demande) {
  const compte = config.comptes[demande.compte];
  if (!compte) throw new Error(`Compte « ${demande.compte} » inconnu`);

  const client = await bdd.connect();
  try {
    const { rows } = await client.query(
      'SELECT "idUtilisateur" FROM utilisateur WHERE lower("emailUtilisateur") = $1',
      [compte.email.toLowerCase()]
    );
    if (rows.length === 0) throw new Error(`Aucun compte pour ${compte.email}`);

    await client.query('BEGIN');
    const { jeton } = await creerJeton(client, rows[0].idUtilisateur, demande.type);
    await client.query('COMMIT');
    jetonsCrees.push({ idUtilisateur: rows[0].idUtilisateur, type: demande.type });
    return jeton;
  } catch (erreur) {
    await client.query('ROLLBACK').catch(() => {});
    throw erreur;
  } finally {
    client.release();
  }
}

/* Localise un repère. Deux écritures acceptées :
     "texte:Mes promotions"  -> le premier élément contenant ce texte
     "input[type=file]"      -> un sélecteur CSS */
async function localiser(page, cible) {
  if (cible.startsWith('texte:')) {
    return page.getByText(cible.slice(6), { exact: false }).first();
  }
  return page.locator(cible).first();
}

const attendre = (ms) => new Promise(r => setTimeout(r, ms));

/* Une capture peut « réussir » tout en photographiant un refus.

   C'est arrivé : le profil d'un étudiant avait été demandé avec
   l'identifiant d'un AUTRE étudiant que celui connecté, et la page
   affichait « vous ne pouvez consulter que votre propre profil ». Le
   script n'y voyait rien — la page avait bien répondu — et l'image
   serait partie telle quelle dans le mémoire.

   On cherche donc les formulations d'échec de l'application. Mieux vaut
   un faux signalement, qu'on écarte d'un coup d'oeil, qu'une page
   d'erreur imprimée dans un chapitre. */
const REFUS = [
  'ne pouvez consulter',
  'Non autorisé',
  'introuvable',
  'Erreur serveur',
  'Accès refusé',
  'Chargement impossible'
];

async function detecterRefus(page) {
  const texte = await page.locator('body').innerText().catch(() => '');
  return REFUS.filter(m => texte.toLowerCase().includes(m.toLowerCase()));
}

async function capturer(navigateur, ecran, session) {
  const contexte = await navigateur.newContext({
    viewport: { width: LARGEUR, height: HAUTEUR },
    locale: 'fr-FR',
    deviceScaleFactor: 2   // captures nettes une fois réduites dans le document
  });

  /* La session est injectée AVANT tout chargement : l'application lit
     localStorage au premier rendu, et une injection tardive donnerait un
     écran déconnecté suivi d'un rechargement. */
  if (session) {
    await contexte.addInitScript(([token, utilisateur]) => {
      localStorage.setItem('token', token);
      localStorage.setItem('utilisateur', utilisateur);
    }, [session.token, JSON.stringify(session.utilisateur)]);
  }

  const page = await contexte.newPage();
  const reperes = [];

  try {
    let adresse = resoudre(ecran.chemin);

    if (ecran.jeton) {
      const jeton = await creerLien(ecran.jeton);
      adresse += (adresse.includes('?') ? '&' : '?') + 'jeton=' + encodeURIComponent(jeton);
    }

    await page.goto(BASE + adresse, { waitUntil: 'networkidle', timeout: 30000 });

    if (ecran.attendre) {
      await page.locator(ecran.attendre).first()
        .waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
    }

    /* Actions préalables — dérouler une section, ouvrir un onglet. */
    for (const action of ecran.avant || []) {
      if (action.clic) await page.locator(action.clic).first().click().catch(() => {});
      if (action.saisir) await page.locator(action.saisir.cible).first()
        .fill(action.saisir.valeur).catch(() => {});
      if (action.pause) await attendre(action.pause);
    }

    /* Laisser les animations se terminer : une transition figée à
       mi-course donne une capture floue ou décalée. */
    await attendre(900);

    /* Les coordonnées des repères sont relevées MAINTENANT, sur la page
       telle qu'elle sera photographiée. */
    for (const repere of ecran.reperes || []) {
      const element = await localiser(page, repere.cible);
      const boite = await element.boundingBox().catch(() => null);
      if (!boite) {
        console.log(`    repère introuvable : ${repere.cible}`);
        continue;
      }
      reperes.push({ ...boite, legende: repere.legende });
    }

    const refus = await detecterRefus(page);

    const fichier = path.join(SORTIE, ecran.fichier + '.png');
    await page.screenshot({ path: fichier, fullPage: false });

    const mention = refus.length
      ? `  ⚠ REFUS DÉTECTÉ : « ${refus[0]} »`
      : `  (${reperes.length} repère(s))`;
    console.log(`    ${ecran.fichier}.png${mention}`);

    return { fichier: ecran.fichier, reperes, refus };

  } catch (erreur) {
    console.log(`    ÉCHEC ${ecran.fichier} : ${erreur.message.split('\n')[0]}`);
    return null;
  } finally {
    await contexte.close();
  }
}

/* --- Déroulement ------------------------------------------------------ */
console.log(`Captures depuis ${BASE}\n`);

/* Deux réglages, pour une même raison : les contrôles NATIFS du
   navigateur — le bouton d'un champ de fichier, par exemple — doivent
   être en français.

   `--lang` ne suffit pas seul. Playwright lance par défaut le « headless
   shell », une version allégée de Chromium DÉPOURVUE DE TRADUCTIONS :
   le bouton s'affichait « Choose File / No file chosen » au milieu d'une
   interface française, ce qui saute aux yeux dans un mémoire.

   `channel: 'chromium'` demande le navigateur complet, qui les porte. Il
   est déjà téléchargé par `playwright install chromium`. */
const navigateur = await chromium.launch({
  channel: 'chromium',
  args: ['--lang=fr-FR']
});
const sessions = {};
const releve = {};
const refusees = [];
let reussies = 0, echouees = 0;

try {
  for (const section of config.sections) {
    console.log(`  ${section.titre}`);
    for (const ecran of section.ecrans) {
      if (!(ecran.role in sessions)) {
        try {
          sessions[ecran.role] = await ouvrirSession(ecran.role);
        } catch (erreur) {
          console.log(`    ${erreur.message}`);
          sessions[ecran.role] = null;
        }
      }
      const resultat = await capturer(navigateur, ecran, sessions[ecran.role]);
      if (resultat) {
        releve[resultat.fichier] = resultat.reperes;
        reussies++;
        if (resultat.refus?.length) refusees.push(resultat.fichier);
      } else echouees++;
    }
  }
} finally {
  await navigateur.close();

  /* Les jetons engendrés pour les captures sont marqués utilisés. */
  for (const { idUtilisateur, type } of jetonsCrees) {
    await bdd.query(
      `UPDATE "JetonUtilisateur" SET "dateUtilisation" = now()
        WHERE "idUtilisateur" = $1 AND "type" = $2 AND "dateUtilisation" IS NULL`,
      [idUtilisateur, type]
    ).catch(() => {});
  }
  if (jetonsCrees.length) {
    console.log(`
${jetonsCrees.length} jeton(s) de capture invalidé(s).`);
  }

  await bdd.end();
}

writeFileSync(path.join(SORTIE, 'reperes.json'), JSON.stringify(releve, null, 2));

console.log(`\n${reussies} capture(s) dans chapitre3/figures/` +
            (echouees ? `, ${echouees} en échec` : ''));
console.log('Étape suivante : python scripts/memoire/annoter-captures.py');
