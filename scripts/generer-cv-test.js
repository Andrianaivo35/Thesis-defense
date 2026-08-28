/*
 * Générateur de CV de test pour le pipeline d'ingestion (Lot 5.4).
 *
 * POURQUOI GÉNÉRER PLUTÔT QUE TÉLÉCHARGER
 *
 *   Les générateurs existants (fakedin, jsonresume-fake, datasets Hugging
 *   Face) produisent des CV en anglais, en PDF natif uniquement, et sans
 *   rapport avec notre référentiel de compétences.
 *
 *   L'argument décisif est ailleurs : en générant les CV **à partir des
 *   profils réels de la base**, on dispose d'une VÉRITÉ TERRAIN. On sait
 *   exactement quelles compétences figurent dans chaque CV, puisqu'on les
 *   y a écrites. L'extraction peut donc être mesurée en précision et en
 *   rappel — ce qu'aucun corpus aléatoire ne permet.
 *
 *   C'est le chapitre évaluation du mémoire (Lot 5.5) qui en dépend.
 *
 * DEUX NATURES DE PDF
 *
 *   natif   : le texte est intégré, extractible directement
 *   scanné  : le CV est rendu en image, dégradé (rotation, bruit,
 *             contraste), puis embarqué dans un PDF. Aucune couche texte :
 *             seul l'OCR peut le lire.
 *
 *   Un troisième cas, « mixte », produit un CV dont la première page est
 *   native et la seconde scannée — c'est le cas qui valide le routage
 *   page par page.
 *
 * SORTIE
 *   scripts/cv-test/*.pdf          les CV
 *   scripts/cv-test/verite.json    la vérité terrain (compétences par CV)
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

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});

/* ---------------------------------------------------------------------
   Composition du contenu d'un CV
   ------------------------------------------------------------------ */
function composerCV(profil) {
  const lignes = [];
  const nomComplet = `${profil.prenomEtudiant} ${profil.nomEtudiant}`.toUpperCase();

  lignes.push({ texte: nomComplet, taille: 20, gras: true });
  lignes.push({ texte: profil.specialisation || profil.filiere || 'Étudiant', taille: 12 });
  lignes.push({ texte: '' });

  lignes.push({ texte: 'COORDONNEES', taille: 13, gras: true });
  lignes.push({ texte: `Courriel : ${profil.email}` });
  if (profil.telephoneEtudiant) lignes.push({ texte: `Telephone : ${profil.telephoneEtudiant}` });
  if (profil.adresse) lignes.push({ texte: `Adresse : ${profil.adresse}` });
  lignes.push({ texte: '' });

  lignes.push({ texte: 'FORMATION', taille: 13, gras: true });
  lignes.push({ texte: `${profil.niveauAcademique || 'Etudiant'} - ${profil.filiere || ''}` });
  if (profil.specialisation) lignes.push({ texte: `Specialisation : ${profil.specialisation}` });
  if (profil.nomUniversite) lignes.push({ texte: profil.nomUniversite });
  if (profil.matricule) lignes.push({ texte: `Matricule : ${profil.matricule}` });
  lignes.push({ texte: '' });

  /* Section compétences : c'est elle que l'extraction doit retrouver.
     Le format varie d'un CV à l'autre (liste à puces, ligne séparée par
     des virgules) pour que le pipeline ne soit pas calibré sur une seule
     mise en forme. */
  lignes.push({ texte: 'COMPETENCES', taille: 13, gras: true });
  if (profil.formatCompetences === 'virgules') {
    lignes.push({ texte: profil.competences.map(c => c.nom).join(', ') });
  } else {
    for (const c of profil.competences) {
      lignes.push({ texte: `- ${c.nom} (${c.niveau})` });
    }
  }
  lignes.push({ texte: '' });

  if (profil.parcours?.length > 0) {
    lignes.push({ texte: 'EXPERIENCES ET PROJETS', taille: 13, gras: true });
    for (const p of profil.parcours) {
      lignes.push({ texte: `${p.titre || 'Projet'}${p.entreprise ? ' - ' + p.entreprise : ''}` });
      if (p.description) lignes.push({ texte: p.description.slice(0, 110) });
    }
    lignes.push({ texte: '' });
  }

  if (profil.interets?.length > 0) {
    lignes.push({ texte: "CENTRES D'INTERET", taille: 13, gras: true });
    for (const i of profil.interets) {
      lignes.push({ texte: `- ${i.domaineInteret}` });
    }
  }

  return lignes;
}

/* ---------------------------------------------------------------------
   PDF natif : le texte est intégré et extractible
   ------------------------------------------------------------------ */
async function genererPdfNatif(lignes) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const normal = await doc.embedFont(StandardFonts.Helvetica);
  const gras = await doc.embedFont(StandardFonts.HelveticaBold);

  let y = 790;
  for (const l of lignes) {
    if (!l.texte) { y -= 10; continue; }
    if (y < 50) break;
    page.drawText(l.texte, {
      x: 50, y,
      size: l.taille || 10,
      font: l.gras ? gras : normal,
      color: rgb(0.1, 0.1, 0.1)
    });
    y -= (l.taille || 10) + 6;
  }
  return doc.save();
}

/* ---------------------------------------------------------------------
   PDF scanné : rendu en image puis dégradé

   La dégradation est essentielle : un rendu propre ne testerait pas
   l'OCR dans des conditions réalistes. On simule une photocopie ou une
   photo de téléphone — légère inclinaison, bruit, contraste imparfait.
   ------------------------------------------------------------------ */
function rendreImage(lignes, degradation = 1) {
  const largeur = 1240;   // ~150 dpi pour une page A4
  const hauteur = 1754;
  const img = PI.make(largeur, hauteur);
  const ctx = img.getContext('2d');

  // Fond légèrement grisé, comme un papier photocopié
  const fond = 255 - Math.round(8 * degradation);
  ctx.fillStyle = `rgb(${fond},${fond},${fond})`;
  ctx.fillRect(0, 0, largeur, hauteur);

  // Inclinaison : une page posée de travers sur la vitre du scanner
  const angle = (Math.random() - 0.5) * 0.02 * degradation;

  const encre = Math.round(30 + 25 * degradation);
  ctx.fillStyle = `rgb(${encre},${encre},${encre})`;

  let y = 110;
  for (const l of lignes) {
    if (!l.texte) { y -= 0; y += 22; continue; }
    if (y > hauteur - 80) break;
    const taille = Math.round((l.taille || 10) * 1.9);
    ctx.font = `${taille}pt 'CVFont'`;
    // Décalage horizontal proportionnel à la hauteur : simule l'inclinaison
    const decalage = Math.round(angle * (y - hauteur / 2));
    ctx.fillText(l.texte, 100 + decalage, y);
    y += taille + 14;
  }

  // Bruit : grains de poussière du scanner
  const grains = Math.round(4000 * degradation);
  for (let i = 0; i < grains; i++) {
    const x = Math.floor(Math.random() * largeur);
    const yy = Math.floor(Math.random() * hauteur);
    const n = 200 + Math.floor(Math.random() * 40);
    ctx.fillStyle = `rgb(${n},${n},${n})`;
    ctx.fillRect(x, yy, 1, 1);
  }

  return img;
}

async function imageVersPng(img, chemin) {
  await PI.encodePNGToStream(img, fs.createWriteStream(chemin));
  return fs.readFileSync(chemin);
}

async function genererPdfScanne(lignes, cheminTemporaire, degradation = 1) {
  const img = rendreImage(lignes, degradation);
  const png = await imageVersPng(img, cheminTemporaire);

  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const image = await doc.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: 595, height: 842 });
  return doc.save();
}

/* PDF mixte : page 1 native, page 2 scannée. Valide le routage page par
   page — un CV peut mêler une page exportée et un diplôme photocopié. */
async function genererPdfMixte(lignes, cheminTemporaire) {
  const moitie = Math.ceil(lignes.length / 2);
  const natif = await PDFDocument.load(await genererPdfNatif(lignes.slice(0, moitie)));
  const scanne = await PDFDocument.load(
    await genererPdfScanne(lignes.slice(moitie), cheminTemporaire, 0.8)
  );

  const doc = await PDFDocument.create();
  const [p1] = await doc.copyPages(natif, [0]);
  const [p2] = await doc.copyPages(scanne, [0]);
  doc.addPage(p1);
  doc.addPage(p2);
  return doc.save();
}

/* ---------------------------------------------------------------------
   Programme principal
   ------------------------------------------------------------------ */
async function main() {
  if (!fs.existsSync(POLICE)) {
    console.error(`Police introuvable : ${POLICE}`);
    process.exit(1);
  }
  PI.registerFont(POLICE, 'CVFont').loadSync();

  fs.mkdirSync(DOSSIER, { recursive: true });

  const client = await pool.connect();
  try {
    /* On choisit des étudiants couvrant des domaines variés, pour que le
       corpus de test ne soit pas uniquement informatique. */
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

    const verite = [];
    let index = 0;

    for (const etudiant of etudiants.rows) {
      const [competences, parcours, interets] = await Promise.all([
        client.query(`
          SELECT cr."nomCompetenceReference" AS nom, ce."niveau",
                 ce."idCompetenceReference"
          FROM "CompetenceEtudiant" ce
          INNER JOIN "CompetenceReference" cr
            ON cr."idCompetenceReference" = ce."idCompetenceReference"
          WHERE ce."idEtudiant" = $1
        `, [etudiant.idEtudiant]),
        client.query(`
          SELECT titre, entreprise, description FROM "parcours-realisation"
          WHERE "idEtudiant" = $1 LIMIT 2
        `, [etudiant.idEtudiant]),
        client.query(`
          SELECT "domaineInteret" FROM "centre-interet"
          WHERE "idEtudiant" = $1 LIMIT 2
        `, [etudiant.idEtudiant])
      ]);

      if (competences.rows.length === 0) continue;

      const profil = {
        ...etudiant,
        competences: competences.rows,
        parcours: parcours.rows,
        interets: interets.rows,
        formatCompetences: index % 3 === 0 ? 'virgules' : 'liste'
      };

      const lignes = composerCV(profil);

      /* Répartition : une majorité de PDF natifs, comme dans la réalité,
         mais assez de scannés pour éprouver l'OCR. */
      const reste = index % 5;
      let nature, octets;
      const tmp = path.join(DOSSIER, `.tmp-${index}.png`);

      if (reste === 1 || reste === 3) {
        nature = 'scanne';
        octets = await genererPdfScanne(lignes, tmp, reste === 3 ? 1.4 : 0.7);
      } else if (reste === 4) {
        nature = 'mixte';
        octets = await genererPdfMixte(lignes, tmp);
      } else {
        nature = 'natif';
        octets = await genererPdfNatif(lignes);
      }
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

      const nomFichier =
        `cv-${nature}-${etudiant.prenomEtudiant}-${etudiant.nomEtudiant}`
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9-]+/g, '-') + '.pdf';

      fs.writeFileSync(path.join(DOSSIER, nomFichier), octets);

      verite.push({
        fichier: nomFichier,
        nature,
        idEtudiant: etudiant.idEtudiant,
        nom: `${etudiant.prenomEtudiant} ${etudiant.nomEtudiant}`,
        filiere: etudiant.filiere,
        niveauAcademique: etudiant.niveauAcademique,
        // Vérité terrain : ce que l'extraction doit retrouver
        competencesAttendues: competences.rows.map(c => ({
          idCompetenceReference: c.idCompetenceReference,
          nom: c.nom,
          niveau: c.niveau
        }))
      });

      index++;
    }

    fs.writeFileSync(
      path.join(DOSSIER, 'verite.json'),
      JSON.stringify({ genereLe: new Date().toISOString(), cvs: verite }, null, 2)
    );

    const parNature = verite.reduce((acc, v) => {
      acc[v.nature] = (acc[v.nature] || 0) + 1; return acc;
    }, {});

    console.log(`${verite.length} CV générés dans ${DOSSIER}`);
    console.log('  répartition :', JSON.stringify(parNature));
    console.log('  compétences à retrouver :',
      verite.reduce((n, v) => n + v.competencesAttendues.length, 0));
    console.log('  vérité terrain : scripts/cv-test/verite.json');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error('Erreur :', e); process.exit(1); });
