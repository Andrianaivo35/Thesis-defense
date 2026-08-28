/*
 * Générateur de CV de test pour le pipeline d'ingestion (Lot 5.4).
 *
 * POURQUOI GÉNÉRER PLUTÔT QUE TÉLÉCHARGER
 *
 *   Les générateurs existants (fakedin, jsonresume-fake, datasets Hugging
 *   Face) produisent des CV en anglais, en PDF natif uniquement, et sans
 *   rapport avec notre référentiel de compétences.
 *
 *   L'argument décisif est ailleurs : en générant les CV à partir des
 *   profils réels de la base, on dispose d'une VÉRITÉ TERRAIN. On sait
 *   exactement quelles compétences figurent dans chaque CV, puisqu'on les
 *   y a écrites.
 *
 * CE QUI REND LE CORPUS EXIGEANT
 *
 *   1. QUATRE MAQUETTES distinctes — colonne unique, deux colonnes avec
 *      bandeau latéral, en-tête coloré pleine largeur, format compact.
 *      Un pipeline calibré sur une seule mise en page échouerait.
 *
 *   2. DU CONTENU PARASITE. Un vrai CV ne contient pas que des
 *      compétences du référentiel : loisirs, certifications, références,
 *      logiciels non référencés, qualités personnelles. Ces termes sont
 *      volontairement présents et consignés dans la vérité terrain.
 *      Ils mesurent la PRÉCISION : le pipeline ne doit pas les extraire.
 *      Sans eux, on ne mesurerait que le rappel.
 *
 *   3. UN EMPLACEMENT PHOTO, comme sur la plupart des CV réels — une
 *      zone graphique que l'extraction doit ignorer.
 *
 *   4. TROIS NATURES DE PDF : natif, scanné (image dégradée, OCR requis),
 *      et mixte (page native + page scannée) qui impose un routage page
 *      par page.
 *
 * SORTIE
 *   scripts/cv-test/*.pdf          les CV
 *   scripts/cv-test/verite.json    vérité terrain + termes parasites
 *
 * Exécution : node scripts/generer-cv-test.js
 */
const { Pool } = require('pg');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const PI = require('pureimage');
const fs = require('fs');
const path = require('path');

const DOSSIER = path.join(__dirname, 'cv-test');
const POLICE = 'C:/Windows/Fonts/arial.ttf';

const LARGEUR = 595;   // A4 en points
const HAUTEUR = 842;

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

/* =====================================================================
   CONTENU PARASITE

   Rien de tout cela ne figure au référentiel de compétences. Ces termes
   servent à mesurer la précision de l'extraction : les retrouver dans le
   résultat serait un faux positif.
   ===================================================================== */
const LOISIRS = [
  'Football', 'Basket-ball', 'Lecture', 'Photographie', 'Randonnée',
  'Musique traditionnelle', 'Cuisine', 'Natation', 'Échecs', 'Bénévolat associatif',
  'Voyages', 'Jardinage', 'Cinéma', 'Course à pied'
];

const LOGICIELS_NON_REFERENCES = [
  'Photoshop', 'Canva', 'Trello', 'Slack', 'Notion', 'Figma',
  'Microsoft Teams', 'Zoom', 'WordPress', 'AutoCAD'
];

const QUALITES = [
  'Autonomie', 'Rigueur', 'Travail en équipe', 'Sens de l\'organisation',
  'Esprit d\'initiative', 'Ponctualité', 'Capacité d\'adaptation',
  'Sens du relationnel', 'Curiosité intellectuelle'
];

const CERTIFICATIONS = [
  'Permis de conduire catégorie B', 'TOEIC — score 785',
  'Certification Google Analytics', 'Attestation de secourisme',
  'Certificat de formation aux premiers secours', 'Habilitation électrique B1V'
];

/* Formations antérieures et expériences complémentaires : la base ne
   contient qu'un projet par étudiant, ce qui laissait les CV à moitié
   vides. Un vrai CV occupe sa page. Ces éléments ajoutent aussi du
   contenu à ignorer par l'extraction. */
const BACCALAUREATS = [
  'Baccalauréat série C — mention Bien', 'Baccalauréat série D — mention Assez Bien',
  'Baccalauréat série A2 — mention Bien', 'Baccalauréat technique — mention Passable',
  'Baccalauréat série C — mention Très Bien'
];

const EXPERIENCES_COMPLEMENTAIRES = [
  { titre: "Stage d'observation", entreprise: 'Cabinet local',
    description: "Découverte du fonctionnement quotidien d'une structure et de ses services." },
  { titre: 'Bénévolat associatif', entreprise: 'Association de quartier',
    description: "Participation à l'organisation d'événements et à l'accueil du public." },
  { titre: 'Tutorat étudiant', entreprise: 'Université',
    description: "Accompagnement d'étudiants de première année dans leurs travaux dirigés." },
  { titre: "Job d'été", entreprise: 'Commerce de proximité',
    description: 'Accueil de la clientèle, encaissement et réassort des rayons.' },
  { titre: 'Projet universitaire collectif', entreprise: '',
    description: 'Travail en groupe de quatre personnes sur un cas pratique, avec restitution orale.' }
];

const LANGUES = [
  ['Malagasy', 'langue maternelle'], ['Français', 'courant'],
  ['Anglais', 'intermédiaire'], ['Allemand', 'notions']
];

const ACCROCHES = [
  "Étudiant motivé, à la recherche d'un stage pour mettre en pratique les connaissances acquises.",
  "En quête d'une première expérience professionnelle enrichissante au sein d'une équipe dynamique.",
  "Passionné par mon domaine, je souhaite contribuer concrètement aux projets d'une entreprise.",
  "Rigoureux et curieux, je recherche un stage formateur pour développer mes compétences."
];

const tirer = (liste, n) => {
  const copie = [...liste];
  const choix = [];
  for (let i = 0; i < n && copie.length > 0; i++) {
    choix.push(copie.splice(Math.floor(Math.random() * copie.length), 1)[0]);
  }
  return choix;
};

/* =====================================================================
   PRIMITIVES DE DESSIN

   Les maquettes décrivent leur contenu en coordonnées « origine en haut
   à gauche », indépendamment du support. Les deux rendus — PDF natif et
   image scannée — consomment la même description.

   C'est ce qui garantit qu'un CV scanné est bien le scan du CV natif
   correspondant, et non une mise en page différente.
   ===================================================================== */
const texte = (t, x, y, o = {}) => ({ type: 'texte', t, x, y, ...o });
const bloc = (x, y, l, h, couleur) => ({ type: 'bloc', x, y, l, h, couleur });
const trait = (x, y, l, couleur = [0.8, 0.8, 0.8]) => ({ type: 'trait', x, y, l, couleur });

/* Emplacement photo : cadre gris avec les initiales, comme un
   trombinoscope. L'extraction doit l'ignorer. */
function photo(x, y, taille, initiales, couleur) {
  return [
    bloc(x, y, taille, taille, couleur.map(c => Math.min(1, c + 0.35))),
    texte(initiales, x + taille / 2 - 11, y + taille / 2 + 6,
      { taille: 20, gras: true, couleur: [1, 1, 1] })
  ];
}

/* Découpe un texte long en lignes tenant dans une largeur donnée. */
function replier(t, largeurMax, tailleCar = 5.2) {
  const motsListe = String(t).split(' ');
  const lignes = [];
  let courante = '';
  for (const mot of motsListe) {
    const essai = courante ? `${courante} ${mot}` : mot;
    if (essai.length * tailleCar > largeurMax && courante) {
      lignes.push(courante);
      courante = mot;
    } else {
      courante = essai;
    }
  }
  if (courante) lignes.push(courante);
  return lignes;
}

/* =====================================================================
   LES QUATRE MAQUETTES
   ===================================================================== */

/* --- Maquette 1 : colonne unique, en-tête sobre --- */
function maquetteClassique(p) {
  const el = [];
  const c = p.couleur;
  let y = 60;

  el.push(...photo(LARGEUR - 130, 45, 80, p.initiales, c));
  el.push(texte(p.nomComplet, 55, y, { taille: 19, gras: true }));
  y += 20;
  el.push(texte(p.titrePro, 55, y, { taille: 11, couleur: c }));
  y += 16;
  el.push(texte(p.email, 55, y, { taille: 8.5 }));
  y += 11;
  el.push(texte(`${p.telephone}  ·  ${p.ville}`, 55, y, { taille: 8.5 }));
  y += 26;

  el.push(...replier(p.accroche, 400).map((l, i) =>
    texte(l, 55, y + i * 11, { taille: 9, italique: true })));
  y += replier(p.accroche, 400).length * 11 + 16;

  const section = (titre) => {
    el.push(texte(titre.toUpperCase(), 55, y, { taille: 10.5, gras: true, couleur: c }));
    el.push(trait(55, y + 5, 485, c));
    y += 20;
  };

  section('Formation');
  el.push(texte(`${p.niveau} — ${p.filiere}`, 55, y, { taille: 9.5, gras: true })); y += 12;
  if (p.specialisation) { el.push(texte(`Spécialisation : ${p.specialisation}`, 55, y, { taille: 9 })); y += 12; }
  if (p.universite) { el.push(texte(p.universite, 55, y, { taille: 9 })); y += 12; }
  if (p.matricule) { el.push(texte(`Matricule : ${p.matricule}`, 55, y, { taille: 8.5 })); y += 12; }
  el.push(texte(p.baccalaureat, 55, y, { taille: 8.5 })); y += 16;

  section('Langues');
  for (const [lg, niv] of p.langues) {
    el.push(texte(`• ${lg} — ${niv}`, 62, y, { taille: 9 })); y += 12;
  }
  y += 10;

  section('Compétences techniques');
  for (const comp of p.competences) {
    el.push(texte(`• ${comp.nom} — niveau ${comp.niveau.toLowerCase()}`, 62, y, { taille: 9 }));
    y += 12;
  }
  y += 10;

  if (p.parcours.length) {
    section('Expériences et projets');
    for (const ex of p.parcours) {
      el.push(texte(`${ex.titre}${ex.entreprise ? ' — ' + ex.entreprise : ''}`, 55, y, { taille: 9.5, gras: true }));
      y += 12;
      if (ex.description) {
        for (const l of replier(ex.description, 470)) { el.push(texte(l, 62, y, { taille: 8.5 })); y += 10; }
      }
      y += 6;
    }
    y += 4;
  }

  section('Logiciels maîtrisés');
  el.push(texte(p.logiciels.join('  ·  '), 62, y, { taille: 9 })); y += 22;

  section('Qualités personnelles');
  el.push(texte(p.qualites.join('  ·  '), 62, y, { taille: 9 })); y += 22;

  section('Centres d\'intérêt');
  el.push(texte(p.loisirs.join('  ·  '), 62, y, { taille: 9 })); y += 22;

  section('Divers');
  for (const cert of p.certifications) { el.push(texte(`• ${cert}`, 62, y, { taille: 8.5 })); y += 11; }
  el.push(texte('Références disponibles sur demande.', 62, y + 4, { taille: 8.5, italique: true }));

  return el;
}

/* --- Maquette 2 : deux colonnes, bandeau latéral coloré --- */
function maquetteDeuxColonnes(p) {
  const el = [];
  const c = p.couleur;
  const LB = 200; // largeur du bandeau

  el.push(bloc(0, 0, LB, HAUTEUR, c.map(v => Math.min(1, v + 0.55))));

  // --- Bandeau latéral ---
  let y = 50;
  el.push(...photo(LB / 2 - 40, y, 80, p.initiales, c));
  y += 100;

  el.push(texte(p.nomComplet, 24, y, { taille: 13, gras: true })); y += 16;
  el.push(texte(p.titrePro, 24, y, { taille: 8.5, couleur: c })); y += 26;

  const sectionBandeau = (titre) => {
    el.push(texte(titre.toUpperCase(), 24, y, { taille: 9, gras: true, couleur: c }));
    el.push(trait(24, y + 4, 150, c));
    y += 16;
  };

  sectionBandeau('Contact');
  for (const l of replier(p.email, 165, 4.4)) { el.push(texte(l, 24, y, { taille: 7.5 })); y += 10; }
  el.push(texte(p.telephone, 24, y, { taille: 7.5 })); y += 10;
  el.push(texte(p.ville, 24, y, { taille: 7.5 })); y += 20;

  sectionBandeau('Compétences');
  for (const comp of p.competences) {
    el.push(texte(comp.nom, 24, y, { taille: 8.5 })); y += 10;
    el.push(texte(comp.niveau, 24, y, { taille: 7, couleur: [0.45, 0.45, 0.45] })); y += 13;
  }
  y += 8;

  sectionBandeau('Logiciels');
  for (const lg of p.logiciels) { el.push(texte(lg, 24, y, { taille: 8 })); y += 10; }
  y += 12;

  sectionBandeau('Loisirs');
  for (const lo of p.loisirs) { el.push(texte(lo, 24, y, { taille: 8 })); y += 10; }

  // --- Colonne principale ---
  let z = 60;
  const X = LB + 34;
  const sectionPrincipale = (titre) => {
    el.push(texte(titre.toUpperCase(), X, z, { taille: 10.5, gras: true, couleur: c }));
    el.push(trait(X, z + 5, 320, c));
    z += 20;
  };

  sectionPrincipale('Profil');
  for (const l of replier(p.accroche, 320)) { el.push(texte(l, X, z, { taille: 8.5 })); z += 11; }
  z += 12;

  sectionPrincipale('Formation');
  el.push(texte(`${p.niveau} — ${p.filiere}`, X, z, { taille: 9.5, gras: true })); z += 12;
  if (p.specialisation) { el.push(texte(p.specialisation, X, z, { taille: 8.5 })); z += 11; }
  if (p.universite) { for (const l of replier(p.universite, 320)) { el.push(texte(l, X, z, { taille: 8.5 })); z += 11; } }
  el.push(texte(p.baccalaureat, X, z, { taille: 8 })); z += 18;

  sectionPrincipale('Langues');
  for (const [lg, niv] of p.langues) { el.push(texte(`${lg} — ${niv}`, X, z, { taille: 8.5 })); z += 11; }
  z += 14;

  if (p.parcours.length) {
    sectionPrincipale('Expériences');
    for (const ex of p.parcours) {
      el.push(texte(ex.titre, X, z, { taille: 9, gras: true })); z += 11;
      if (ex.entreprise) { el.push(texte(ex.entreprise, X, z, { taille: 8, couleur: [0.4, 0.4, 0.4] })); z += 10; }
      if (ex.description) {
        for (const l of replier(ex.description, 320)) { el.push(texte(l, X, z, { taille: 8 })); z += 10; }
      }
      z += 8;
    }
    z += 6;
  }

  sectionPrincipale('Qualités');
  for (const q of p.qualites) { el.push(texte(`• ${q}`, X, z, { taille: 8.5 })); z += 11; }
  z += 12;

  sectionPrincipale('Divers');
  for (const cert of p.certifications) { el.push(texte(`• ${cert}`, X, z, { taille: 8 })); z += 10; }

  return el;
}

/* --- Maquette 3 : bandeau d'en-tête coloré pleine largeur --- */
function maquetteBandeau(p) {
  const el = [];
  const c = p.couleur;

  el.push(bloc(0, 0, LARGEUR, 130, c));
  el.push(...photo(45, 28, 74, p.initiales, c.map(v => Math.max(0, v - 0.15))));

  el.push(texte(p.nomComplet, 140, 58, { taille: 20, gras: true, couleur: [1, 1, 1] }));
  el.push(texte(p.titrePro, 140, 78, { taille: 10.5, couleur: [1, 1, 1] }));
  el.push(texte(`${p.email}  ·  ${p.telephone}`, 140, 98, { taille: 8.5, couleur: [1, 1, 1] }));
  el.push(texte(p.ville, 140, 112, { taille: 8.5, couleur: [1, 1, 1] }));

  let y = 160;
  const section = (titre) => {
    el.push(texte(titre.toUpperCase(), 45, y, { taille: 10, gras: true, couleur: c }));
    y += 16;
  };

  section('À propos');
  for (const l of replier(p.accroche, 500)) { el.push(texte(l, 45, y, { taille: 9 })); y += 11; }
  y += 14;

  // Deux colonnes de contenu sous le bandeau
  const gauche = 45, droite = 320;
  let yg = y, yd = y;

  el.push(texte('FORMATION', gauche, yg, { taille: 10, gras: true, couleur: c })); yg += 16;
  el.push(texte(p.niveau, gauche, yg, { taille: 9, gras: true })); yg += 11;
  el.push(texte(p.filiere, gauche, yg, { taille: 8.5 })); yg += 11;
  if (p.specialisation) { el.push(texte(p.specialisation, gauche, yg, { taille: 8.5 })); yg += 11; }
  if (p.universite) { for (const l of replier(p.universite, 240)) { el.push(texte(l, gauche, yg, { taille: 8 })); yg += 10; } }
  el.push(texte(p.baccalaureat, gauche, yg, { taille: 8 })); yg += 20;

  el.push(texte('LANGUES', gauche, yg, { taille: 10, gras: true, couleur: c })); yg += 16;
  for (const [lg, niv] of p.langues) { el.push(texte(`${lg} — ${niv}`, gauche, yg, { taille: 8.5 })); yg += 11; }
  yg += 16;

  el.push(texte('COMPÉTENCES', gauche, yg, { taille: 10, gras: true, couleur: c })); yg += 16;
  el.push(texte(p.competences.map(x => x.nom).join(', '), gauche, yg, { taille: 8.5 }));
  for (const l of replier(p.competences.map(x => x.nom).join(', '), 240).slice(1)) {
    yg += 10; el.push(texte(l, gauche, yg, { taille: 8.5 }));
  }
  yg += 24;

  el.push(texte('LOGICIELS', gauche, yg, { taille: 10, gras: true, couleur: c })); yg += 16;
  for (const lg of p.logiciels) { el.push(texte(`• ${lg}`, gauche, yg, { taille: 8.5 })); yg += 11; }

  el.push(texte('EXPÉRIENCES', droite, yd, { taille: 10, gras: true, couleur: c })); yd += 16;
  for (const ex of p.parcours) {
    el.push(texte(ex.titre, droite, yd, { taille: 9, gras: true })); yd += 11;
    if (ex.description) {
      for (const l of replier(ex.description, 230)) { el.push(texte(l, droite, yd, { taille: 8 })); yd += 10; }
    }
    yd += 8;
  }
  yd += 8;

  el.push(texte('QUALITÉS', droite, yd, { taille: 10, gras: true, couleur: c })); yd += 16;
  el.push(texte(p.qualites.join(', '), droite, yd, { taille: 8.5 })); yd += 22;

  el.push(texte('CENTRES D\'INTÉRÊT', droite, yd, { taille: 10, gras: true, couleur: c })); yd += 16;
  el.push(texte(p.loisirs.join(', '), droite, yd, { taille: 8.5 })); yd += 22;

  el.push(texte('DIVERS', droite, yd, { taille: 10, gras: true, couleur: c })); yd += 16;
  for (const cert of p.certifications) { el.push(texte(cert, droite, yd, { taille: 8 })); yd += 10; }

  return el;
}

/* --- Maquette 4 : compacte, dense, sans fioriture --- */
function maquetteCompacte(p) {
  const el = [];
  const c = p.couleur;
  let y = 48;

  el.push(...photo(LARGEUR - 105, 38, 58, p.initiales, c));
  el.push(texte(p.nomComplet, 42, y, { taille: 15, gras: true })); y += 14;
  el.push(texte(`${p.titrePro}  |  ${p.email}  |  ${p.telephone}  |  ${p.ville}`, 42, y, { taille: 7.5 }));
  y += 10;
  el.push(trait(42, y, 430, c)); y += 16;

  const ligne = (etiquette, valeur, taille = 8.5) => {
    el.push(texte(`${etiquette} :`, 42, y, { taille, gras: true, couleur: c }));
    const lignes = replier(valeur, 380);
    el.push(texte(lignes[0] || '', 130, y, { taille }));
    for (const l of lignes.slice(1)) { y += 10; el.push(texte(l, 130, y, { taille })); }
    y += 13;
  };

  ligne('Objectif', p.accroche);
  ligne('Formation', `${p.niveau}, ${p.filiere}${p.specialisation ? ' — ' + p.specialisation : ''}`);
  if (p.universite) ligne('Établissement', p.universite);
  if (p.matricule) ligne('Matricule', p.matricule);
  ligne('Baccalauréat', p.baccalaureat);
  ligne('Langues', p.langues.map(([l, n]) => `${l} (${n})`).join(', '));
  y += 6;

  ligne('Compétences', p.competences.map(x => `${x.nom} (${x.niveau})`).join(', '));
  ligne('Logiciels', p.logiciels.join(', '));
  ligne('Qualités', p.qualites.join(', '));
  ligne('Loisirs', p.loisirs.join(', '));
  ligne('Divers', p.certifications.join(' ; '));
  y += 8;

  if (p.parcours.length) {
    el.push(texte('PARCOURS', 42, y, { taille: 9.5, gras: true, couleur: c }));
    el.push(trait(42, y + 4, 430, c));
    y += 16;
    for (const ex of p.parcours) {
      el.push(texte(`${ex.titre}${ex.entreprise ? ' — ' + ex.entreprise : ''}`, 42, y, { taille: 8.5, gras: true }));
      y += 11;
      if (ex.description) {
        for (const l of replier(ex.description, 430)) { el.push(texte(l, 50, y, { taille: 8 })); y += 10; }
      }
      y += 6;
    }
  }

  el.push(texte('Références professionnelles disponibles sur demande.', 42, y + 8, { taille: 8, italique: true }));
  return el;
}

/* Les profils de la base comportent peu d'éléments : sans correction, le
   contenu se tasse dans la moitié haute et laisse un bas de page vide,
   ce qui ne ressemble à aucun CV réel. On répartit donc verticalement ce
   qui se trouve sous l'en-tête, jusqu'à occuper la page.

   L'étirement est plafonné : au-delà, l'interligne devient invraisemblable. */
function etaler(elements, yEnTete) {
  const dessous = elements.filter(e => e.y > yEnTete && e.type !== 'bloc');
  if (dessous.length === 0) return elements;
  const bas = Math.max(...dessous.map(e => e.y));
  if (bas >= HAUTEUR - 140) return elements;

  const facteur = Math.min(1.75, (HAUTEUR - 70 - yEnTete) / (bas - yEnTete));
  if (facteur <= 1.05) return elements;

  return elements.map(e =>
    e.type === 'bloc' || e.y <= yEnTete
      ? e
      : { ...e, y: yEnTete + (e.y - yEnTete) * facteur }
  );
}

const MAQUETTES = [
  { nom: 'classique', dessiner: maquetteClassique, yEnTete: 100 },
  { nom: 'deux-colonnes', dessiner: maquetteDeuxColonnes, yEnTete: 60 },
  { nom: 'bandeau', dessiner: maquetteBandeau, yEnTete: 140 },
  { nom: 'compacte', dessiner: maquetteCompacte, yEnTete: 90 }
];

const PALETTES = [
  [0.16, 0.34, 0.55], [0.55, 0.25, 0.20], [0.20, 0.45, 0.35],
  [0.35, 0.25, 0.50], [0.66, 0.55, 0.46], [0.15, 0.40, 0.48]
];

/* =====================================================================
   RENDU — PDF natif
   ===================================================================== */
async function rendrePdf(elements) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([LARGEUR, HAUTEUR]);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);
  const italique = await doc.embedFont(StandardFonts.HelveticaOblique);

  for (const e of elements) {
    if (e.y > HAUTEUR - 10) continue;             // déborde de la page
    const yPdf = HAUTEUR - e.y;                    // origine en bas pour pdf-lib

    if (e.type === 'bloc') {
      page.drawRectangle({
        x: e.x, y: HAUTEUR - e.y - e.h, width: e.l, height: e.h,
        color: rgb(...e.couleur)
      });
    } else if (e.type === 'trait') {
      page.drawRectangle({
        x: e.x, y: yPdf, width: e.l, height: 0.8, color: rgb(...e.couleur)
      });
    } else {
      page.drawText(String(e.t), {
        x: e.x, y: yPdf,
        size: e.taille || 9,
        font: e.gras ? gras : (e.italique ? italique : normal),
        color: rgb(...(e.couleur || [0.12, 0.12, 0.12]))
      });
    }
  }
  return doc.save();
}

/* =====================================================================
   RENDU — image dégradée, pour simuler un scan

   La dégradation est essentielle : un rendu propre n'éprouverait pas
   l'OCR dans des conditions réalistes. On simule une photocopie ou une
   photo de téléphone — légère inclinaison, bruit, contraste imparfait.
   ===================================================================== */
function rendreImage(elements, degradation = 1) {
  const echelle = 2.1;                            // ~150 dpi
  const L = Math.round(LARGEUR * echelle);
  const H = Math.round(HAUTEUR * echelle);
  const img = PI.make(L, H);
  const ctx = img.getContext('2d');

  const fond = 255 - Math.round(9 * degradation);
  ctx.fillStyle = `rgb(${fond},${fond},${fond})`;
  ctx.fillRect(0, 0, L, H);

  const angle = (Math.random() - 0.5) * 0.016 * degradation;
  const salissure = Math.round(22 * degradation);

  for (const e of elements) {
    if (e.y > HAUTEUR - 10) continue;
    const decalage = Math.round(angle * (e.y * echelle - H / 2));
    const x = Math.round(e.x * echelle) + decalage;
    const y = Math.round(e.y * echelle);

    if (e.type === 'bloc') {
      const [r, g, b] = (e.couleur || [0.5, 0.5, 0.5]).map(v =>
        Math.max(0, Math.min(255, Math.round(v * 255) + salissure)));
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, y, Math.round(e.l * echelle), Math.round(e.h * echelle));
    } else if (e.type === 'trait') {
      ctx.fillStyle = 'rgb(150,150,150)';
      ctx.fillRect(x, y, Math.round(e.l * echelle), 2);
    } else {
      const base = (e.couleur || [0.12, 0.12, 0.12]).map(v =>
        Math.max(0, Math.min(255, Math.round(v * 255) + salissure)));
      ctx.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`;
      ctx.font = `${Math.round((e.taille || 9) * echelle)}pt 'CVFont'`;
      ctx.fillText(String(e.t), x, y);
    }
  }

  // Grains de poussière du scanner
  const grains = Math.round(5000 * degradation);
  for (let i = 0; i < grains; i++) {
    const n = 190 + Math.floor(Math.random() * 50);
    ctx.fillStyle = `rgb(${n},${n},${n})`;
    ctx.fillRect(Math.floor(Math.random() * L), Math.floor(Math.random() * H), 1, 1);
  }
  return img;
}

async function rendrePdfScanne(elements, tmp, degradation = 1) {
  const img = rendreImage(elements, degradation);
  await PI.encodePNGToStream(img, fs.createWriteStream(tmp));
  const png = fs.readFileSync(tmp);

  const doc = await PDFDocument.create();
  const page = doc.addPage([LARGEUR, HAUTEUR]);
  const image = await doc.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: LARGEUR, height: HAUTEUR });
  return doc.save();
}

/* PDF mixte : page 1 native (le CV), page 2 scannée (un justificatif).
   Valide le routage page par page. */
async function rendrePdfMixte(elements, tmp) {
  const justificatif = [
    bloc(0, 0, LARGEUR, 70, [0.85, 0.85, 0.85]),
    texte('ATTESTATION DE SCOLARITE', 150, 42, { taille: 14, gras: true }),
    texte('Document numerise - copie conforme', 150, 60, { taille: 9 }),
    ...elements.filter(e => e.type === 'texte').slice(0, 14)
      .map((e, i) => texte(e.t, 60, 120 + i * 16, { taille: 9 }))
  ];

  const natif = await PDFDocument.load(await rendrePdf(elements));
  const scanne = await PDFDocument.load(await rendrePdfScanne(justificatif, tmp, 1.2));

  const doc = await PDFDocument.create();
  const [p1] = await doc.copyPages(natif, [0]);
  const [p2] = await doc.copyPages(scanne, [0]);
  doc.addPage(p1);
  doc.addPage(p2);
  return doc.save();
}

/* =====================================================================
   PROGRAMME PRINCIPAL
   ===================================================================== */
async function main() {
  if (!fs.existsSync(POLICE)) {
    console.error(`Police introuvable : ${POLICE}`);
    process.exit(1);
  }
  PI.registerFont(POLICE, 'CVFont').loadSync();

  fs.rmSync(DOSSIER, { recursive: true, force: true });
  fs.mkdirSync(DOSSIER, { recursive: true });

  const client = await pool.connect();
  try {
    const etudiants = await client.query(`
      SELECT e."idEtudiant", e."nomEtudiant", e."prenomEtudiant", e."telephoneEtudiant",
             e."adresse", e."matricule", e."filiere", e."specialisation",
             e."niveauAcademique", u."emailUtilisateur" AS email,
             univ."nomUniversite"
      FROM etudiant e
      INNER JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
      LEFT JOIN universite univ ON univ."idUniversite" = e."idUniversite"
      WHERE EXISTS (SELECT 1 FROM "CompetenceEtudiant" ce WHERE ce."idEtudiant" = e."idEtudiant")
      ORDER BY e."filiere", e."idEtudiant"
    `);

    /* Le référentiel, indexé par nom : sert à savoir lesquelles des
       langues écrites sur le CV sont de véritables compétences. */
    const referentiel = await client.query(
      'SELECT "idCompetenceReference", "nomCompetenceReference" FROM "CompetenceReference"'
    );
    const referentielParNom = new Map(
      referentiel.rows.map(c => [c.nomCompetenceReference.toLowerCase(), c])
    );

    const verite = [];
    let index = 0;

    for (const etu of etudiants.rows) {
      const [competences, parcours] = await Promise.all([
        client.query(`
          SELECT cr."nomCompetenceReference" AS nom, ce."niveau", ce."idCompetenceReference"
          FROM "CompetenceEtudiant" ce
          INNER JOIN "CompetenceReference" cr
            ON cr."idCompetenceReference" = ce."idCompetenceReference"
          WHERE ce."idEtudiant" = $1
        `, [etu.idEtudiant]),
        client.query(`
          SELECT titre, entreprise, description FROM "parcours-realisation"
          WHERE "idEtudiant" = $1 LIMIT 2
        `, [etu.idEtudiant])
      ]);
      if (competences.rows.length === 0) continue;

      const logiciels = tirer(LOGICIELS_NON_REFERENCES, 3 + (index % 3));
      const qualites = tirer(QUALITES, 3 + (index % 2));
      const loisirs = tirer(LOISIRS, 3 + (index % 3));
      const certifications = tirer(CERTIFICATIONS, 1 + (index % 2));

      const profil = {
        nomComplet: `${etu.prenomEtudiant} ${etu.nomEtudiant}`,
        initiales: `${etu.prenomEtudiant[0]}${etu.nomEtudiant[0]}`.toUpperCase(),
        titrePro: etu.specialisation || etu.filiere || 'Étudiant',
        email: etu.email,
        telephone: etu.telephoneEtudiant || '+261 34 00 000 00',
        ville: etu.adresse || 'Antananarivo, Madagascar',
        niveau: etu.niveauAcademique || 'Étudiant',
        filiere: etu.filiere || '',
        specialisation: etu.specialisation || '',
        universite: etu.nomUniversite || '',
        matricule: etu.matricule || '',
        accroche: ACCROCHES[index % ACCROCHES.length],
        competences: competences.rows,
        parcours: [
          ...parcours.rows,
          ...tirer(EXPERIENCES_COMPLEMENTAIRES, 1 + (index % 2))
        ],
        baccalaureat: BACCALAUREATS[index % BACCALAUREATS.length],
        langues: LANGUES.slice(0, 3 + (index % 2)),
        logiciels, qualites, loisirs, certifications,
        couleur: PALETTES[index % PALETTES.length]
      };

      const maquette = MAQUETTES[index % MAQUETTES.length];
      const elements = etaler(maquette.dessiner(profil), maquette.yEnTete);

      const reste = index % 5;
      const tmp = path.join(DOSSIER, `.tmp-${index}.png`);
      let nature, octets;

      if (reste === 1 || reste === 3) {
        nature = 'scanne';
        octets = await rendrePdfScanne(elements, tmp, reste === 3 ? 1.4 : 0.7);
      } else if (reste === 4) {
        nature = 'mixte';
        octets = await rendrePdfMixte(elements, tmp);
      } else {
        nature = 'natif';
        octets = await rendrePdf(elements);
      }
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

      const nomFichier =
        `cv-${nature}-${maquette.nom}-${etu.prenomEtudiant}-${etu.nomEtudiant}`
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]+/g, '-') + '.pdf';

      fs.writeFileSync(path.join(DOSSIER, nomFichier), octets);

      verite.push({
        fichier: nomFichier,
        nature,
        maquette: maquette.nom,
        idEtudiant: etu.idEtudiant,
        nom: profil.nomComplet,
        filiere: etu.filiere,
        niveauAcademique: etu.niveauAcademique,
        /* Ce que l'extraction DOIT retrouver.

           Les compétences du profil, plus les LANGUES effectivement
           écrites sur le CV qui figurent au référentiel.

           Cette seconde part avait été omise, et l'omission a faussé la
           première mesure : « Malagasy » est écrit sur chaque CV et
           existe au référentiel, donc l'extraction le retrouvait — et
           était comptée en faux positif quarante fois pour avoir eu
           raison. La précision affichée tombait à 75 % au lieu de 98 %.

           Une vérité terrain incomplète ne rend pas la mesure sévère,
           elle la rend fausse. */
        competencesAttendues: [
          ...competences.rows.map(c => ({
            idCompetenceReference: c.idCompetenceReference,
            nom: c.nom, niveau: c.niveau
          })),
          ...profil.langues
            .map(([lg]) => referentielParNom.get(lg.toLowerCase()))
            .filter(Boolean)
            .filter(c => !competences.rows.some(
              x => x.idCompetenceReference === c.idCompetenceReference))
            .map(c => ({
              idCompetenceReference: c.idCompetenceReference,
              nom: c.nomCompetenceReference, niveau: null
            }))
        ],
        /* Ce que l'extraction ne doit PAS retenir comme compétence du
           référentiel. Mesure la précision : sans ces termes, on ne
           mesurerait que le rappel. */
        termesParasites: { logiciels, qualites, loisirs, certifications }
      });

      index++;
    }

    fs.writeFileSync(
      path.join(DOSSIER, 'verite.json'),
      JSON.stringify({ genereLe: new Date().toISOString(), cvs: verite }, null, 2)
    );

    const compte = (cle) => verite.reduce((a, v) => {
      a[v[cle]] = (a[v[cle]] || 0) + 1; return a;
    }, {});

    console.log(`${verite.length} CV générés dans ${DOSSIER}`);
    console.log('  natures   :', JSON.stringify(compte('nature')));
    console.log('  maquettes :', JSON.stringify(compte('maquette')));
    console.log('  compétences à retrouver :',
      verite.reduce((n, v) => n + v.competencesAttendues.length, 0));
    console.log('  termes parasites        :',
      verite.reduce((n, v) => n + Object.values(v.termesParasites).flat().length, 0));
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('Erreur :', e); process.exit(1); });
