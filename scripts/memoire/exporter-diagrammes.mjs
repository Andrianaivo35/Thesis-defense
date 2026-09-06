/* =====================================================================
   DIAGRAMMES MERMAID → IMAGES HAUTE DÉFINITION

   Usage : node scripts/memoire/exporter-diagrammes.mjs [fichier.md ...]
           node scripts/memoire/exporter-diagrammes.mjs --largeur 3840

   Sans argument, traite « MD/11 - DIAGRAMME-DE-CLASSES.md ».

   POURQUOI UN SCRIPT PLUTÔT QU'UNE CAPTURE D'ÉCRAN

   Les diagrammes vivent dans le Markdown, sous forme de texte. Ils
   changent chaque fois que le schéma change. Une capture faite à la main
   serait périmée dès la modification suivante, et deux captures prises à
   des moments différents n'auraient ni la même échelle ni la même
   police.

   Ici on rejoue le rendu : même version de Mermaid, même thème, même
   règle d'échelle pour toutes les figures.

   CE QUE LE SCRIPT PRODUIT

   Pour chaque bloc mermaid du fichier, dans MD/images/<document>/ :
     - un .svg — vectoriel, à privilégier pour l'impression du mémoire ;
     - un .png — dont le plus grand côté fait 3840 px (« 4K »).

   Le nom du fichier reprend le titre de section qui précède le bloc, ce
   qui garde évidente la correspondance entre le document et l'image.
   ===================================================================== */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..', '..');

/* Le plus grand côté de chaque PNG, en pixels. 3840 = largeur d'un écran
   4K : au-delà, le fichier grossit sans que l'œil y gagne quoi que ce
   soit, le SVG étant de toute façon là pour les agrandissements. */
const args = process.argv.slice(2);
const iLargeur = args.indexOf('--largeur');
const COTE_MAX = iLargeur > -1 ? Number(args[iLargeur + 1]) : 3840;
const fichiers = args.filter((a, i) => !a.startsWith('--') && i !== iLargeur + 1);
if (!fichiers.length) fichiers.push('MD/11 - DIAGRAMME-DE-CLASSES.md');

/* Mermaid n'est pas une dépendance du projet : l'application ne s'en
   sert pas, seule la documentation en a besoin. On le récupère une fois
   dans le cache de node_modules plutôt que d'alourdir package.json. */
const CACHE = path.join(RACINE, 'node_modules', '.cache', 'mermaid');
const MERMAID = path.join(CACHE, 'mermaid.min.js');
const CDN = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js';

async function obtenirMermaid() {
  if (existsSync(MERMAID)) return readFileSync(MERMAID, 'utf8');
  process.stdout.write('Téléchargement de Mermaid… ');
  const reponse = await fetch(CDN);
  if (!reponse.ok) throw new Error(`Mermaid inaccessible (${reponse.status})`);
  const source = await reponse.text();
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(MERMAID, source);
  console.log('fait');
  return source;
}

/* --- Extraction -------------------------------------------------------
   On garde le dernier titre rencontré avant chaque bloc : c'est lui qui
   nomme l'image. Un compteur départage les blocs d'une même section. */
function extraire(markdown) {
  const lignes = markdown.split(/\r?\n/);
  const blocs = [];
  let titre = 'diagramme';
  let dedans = false;
  let courant = [];

  for (const ligne of lignes) {
    if (!dedans && /^#{1,6}\s/.test(ligne)) {
      titre = ligne.replace(/^#+\s*/, '').trim();
      continue;
    }
    if (!dedans && ligne.trim() === '```mermaid') {
      dedans = true;
      courant = [];
      continue;
    }
    if (dedans && ligne.trim() === '```') {
      dedans = false;
      blocs.push({ titre, source: courant.join('\n') });
      continue;
    }
    if (dedans) courant.push(ligne);
  }
  return blocs;
}

/* Un titre de section n'est pas un nom de fichier : accents, apostrophes
   et espaces s'y invitent. On les réduit à l'ASCII, en conservant le
   numéro de section pour que l'ordre du document soit celui du dossier. */
function ardoise(texte) {
  return texte
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'diagramme';
}

/* Les notes du document séparent leurs lignes par « \n ». Mermaid ne
   traduit pas cette séquence dans un diagramme de classes : il l'affiche
   telle quelle, en toutes lettres, au milieu de la note. Un vrai retour
   à la ligne, lui, est bien rendu — on convertit donc avant d'appeler le
   moteur, sur les seules lignes de note pour ne pas toucher au reste. */
function normaliserNotes(source) {
  return source
    .split('\n')
    .map((ligne) => (/^\s*note\b/.test(ligne) ? ligne.replaceAll('\\n', '\n') : ligne))
    .join('\n');
}

/* --- Rendu ----------------------------------------------------------- */
async function rendre(page, source) {
  return page.evaluate(async (texte) => {
    const conteneur = document.getElementById('cible');
    conteneur.innerHTML = '';
    const { svg } = await window.mermaid.render('d' + Date.now(), texte);
    conteneur.innerHTML = svg;
    const element = conteneur.querySelector('svg');

    /* Mermaid pose un « max-width » en style en ligne et une hauteur de
       100 % : tant qu'on ne les retire pas, le SVG se contente de la
       largeur de la fenêtre et l'agrandissement ne donne rien.

       Le cadrage se prend sur l'encombrement réel du tracé, marge
       comprise : le viewBox d'origine rogne la bordure des dernières
       classes, qui se retrouvent coupées au ras de l'image. */
    const MARGE = 16;
    const boite = element.getBBox();
    const largeur = Math.ceil(boite.width) + MARGE * 2;
    const hauteur = Math.ceil(boite.height) + MARGE * 2;
    element.removeAttribute('style');
    element.setAttribute(
      'viewBox',
      `${boite.x - MARGE} ${boite.y - MARGE} ${largeur} ${hauteur}`
    );
    element.setAttribute('width', largeur);
    element.setAttribute('height', hauteur);
    return { largeur, hauteur };
  }, source);
}

/* Agrandir le SVG plutôt que forcer un facteur d'échelle du navigateur :
   le tracé étant vectoriel, le résultat est net à n'importe quelle
   taille, et la mémoire n'a pas à héberger une page géante. */
async function agrandir(page, largeur, hauteur, cote) {
  const facteur = Math.max(1, cote / Math.max(largeur, hauteur));
  const L = Math.round(largeur * facteur);
  const H = Math.round(hauteur * facteur);
  await page.evaluate(([l, h]) => {
    const element = document.querySelector('#cible svg');
    element.setAttribute('width', l);
    element.setAttribute('height', h);
  }, [L, H]);
  await page.setViewportSize({ width: Math.min(L, 8000), height: Math.min(H, 8000) });
  return { L, H };
}

const GABARIT = (js) => `<!doctype html><html><head><meta charset="utf-8">
<style>
  html, body { margin: 0; padding: 0; background: #ffffff; }
  #cible { display: inline-block; }
  #cible svg { display: block; background: #ffffff; }
</style>
<script>${js}</scr` + `ipt>
</head><body><div id="cible"></div></body></html>`;

async function principal() {
  const js = await obtenirMermaid();
  const navigateur = await chromium.launch();
  const contexte = await navigateur.newContext({ viewport: { width: 1600, height: 1200 } });
  const page = await contexte.newPage();
  await page.setContent(GABARIT(js));
  await page.evaluate(() => window.mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
    /* Le rendu par défaut refuse les très grands diagrammes de classes :
       on lève les bornes plutôt que de laisser Mermaid les tronquer. */
    maxTextSize: 500000,
    class: { useMaxWidth: false },
    flowchart: { useMaxWidth: false },
    er: { useMaxWidth: false },
    sequence: { useMaxWidth: false }
  }));

  let total = 0;
  for (const relatif of fichiers) {
    const chemin = path.resolve(RACINE, relatif);
    const markdown = readFileSync(chemin, 'utf8');
    const blocs = extraire(markdown);
    if (!blocs.length) {
      console.log(`${relatif} — aucun bloc mermaid`);
      continue;
    }

    const document_ = ardoise(path.basename(chemin, '.md').replace(/^\d+\s*-\s*/, ''));
    const sortie = path.join(RACINE, 'MD', 'images', document_);
    mkdirSync(sortie, { recursive: true });
    console.log(`\n${relatif} — ${blocs.length} diagramme(s) → MD/images/${document_}/`);

    const vus = new Map();
    for (const [index, bloc] of blocs.entries()) {
      let nom = `${String(index).padStart(2, '0')}-${ardoise(bloc.titre)}`;
      const rang = (vus.get(nom) || 0) + 1;
      vus.set(nom, rang);
      if (rang > 1) nom += `-${rang}`;

      const { largeur, hauteur } = await rendre(page, normaliserNotes(bloc.source));
      const svg = await page.evaluate(() => document.querySelector('#cible').innerHTML);
      writeFileSync(path.join(sortie, `${nom}.svg`), svg);

      const { L, H } = await agrandir(page, largeur, hauteur, COTE_MAX);
      await page.locator('#cible svg').screenshot({
        path: path.join(sortie, `${nom}.png`),
        scale: 'css'
      });
      console.log(`  ${nom}.png — ${L}×${H} px  (source ${largeur}×${hauteur})`);
      total++;
    }
  }

  await navigateur.close();
  console.log(`\n${total} diagramme(s) exporté(s).`);
}

principal().catch((erreur) => {
  console.error(erreur);
  process.exit(1);
});
