import { createHash } from 'crypto';
import { lireCSV } from './csv.js';
import { normaliserEmail, estEmailValide } from './email.js';
import { NIVEAUX_ACADEMIQUES, DOMAINES, filieresDuDomaine } from './referentiels.js';
import { normaliserMatricule, memeNom } from './matricule.js';

/* =====================================================================
   IMPORT D'UNE PROMOTION — analyse et validation

   LA PRÉVISUALISATION EST OBLIGATOIRE

   C'est la décision structurante de ce lot. Un import qui écrit au fil de
   sa lecture et échoue à la ligne 47 laisse l'université dans un état
   qu'elle ne comprend pas : quarante-six comptes créés, deux cent
   quarante manquants, et aucun moyen de savoir lesquels sans comparer à
   la main.

   Le fichier est donc INTÉGRALEMENT validé avant la moindre écriture.
   L'université voit « 287 comptes seront créés, 11 adresses déjà
   utilisées, 2 niveaux inconnus », corrige son fichier si besoin, puis
   confirme. L'écriture se fait ensuite en une seule transaction : tout
   passe, ou rien.

   POURQUOI UNE EMPREINTE DU CONTENU

   L'analyse et la confirmation sont deux requêtes. Rien n'empêcherait de
   prévisualiser un fichier puis d'en confirmer un autre — par erreur, en
   changeant de fichier entre les deux clics.

   L'analyse renvoie donc l'empreinte de ce qu'elle a lu, et la
   confirmation la réclame. Ce que l'université a validé est exactement
   ce qui sera écrit.

   LE COÛT N'EST PLUS UN PROBLÈME

   Le plan redoutait bcrypt au coût 10 multiplié par trois cents
   étudiants — quinze à trente secondes, au-delà du délai d'une requête.
   Le Lot 6.2 a supprimé la difficulté sans qu'on la cherche : les
   comptes naissent SANS mot de passe. Il n'y a plus un seul appel à
   bcrypt dans l'import, seulement un tirage aléatoire et une empreinte
   SHA-256 par étudiant, de l'ordre de la microseconde.
   ===================================================================== */

/* Alias acceptés par colonne. Une université ne rebaptisera pas ses
   colonnes pour nous : mieux vaut reconnaître ce qu'elle écrit
   naturellement que renvoyer « colonne manquante » sur un fichier
   parfaitement lisible. */
const COLONNES = {
  nom: ['nom', 'nom etudiant', 'nom de famille', 'last name', 'lastname'],
  prenom: ['prenom', 'prenoms', 'prenom etudiant', 'first name', 'firstname'],
  email: ['email', 'e mail', 'mail', 'adresse email', 'courriel', 'adresse electronique'],
  matricule: ['matricule', 'numero etudiant', 'num etudiant', 'no matricule', 'immatriculation'],
  niveau: ['niveau', 'niveau academique', 'niveau d etudes', 'annee', 'classe'],
  filiere: ['filiere', 'domaine', 'departement', 'mention'],
  specialisation: ['specialisation', 'specialite', 'parcours', 'option'],
  telephone: ['telephone', 'tel', 'numero', 'contact', 'portable']
};

export const COLONNES_OBLIGATOIRES = ['nom', 'prenom', 'email'];

/** Associe les en-têtes du fichier aux champs attendus. */
export function reconnaitreColonnes(entetes) {
  const trouvees = {};
  for (const [champ, alias] of Object.entries(COLONNES)) {
    const entete = entetes.find(e => alias.includes(e));
    if (entete) trouvees[champ] = entete;
  }
  return trouvees;
}

const DOMAINES_CONNUS = DOMAINES.map(d => d.libelle);

/* Comparaison souple : l'université écrit « informatique et numerique »
   sans accent ni majuscule, et cela doit correspondre. Refuser sur une
   question de casse serait absurde. */
function comparerSouple(valeur) {
  return String(valeur || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function apparierReferentiel(valeur, liste) {
  if (!valeur) return null;
  const cible = comparerSouple(valeur);
  return liste.find(v => comparerSouple(v) === cible) || null;
}

/**
 * Analyse un fichier : valide chaque ligne, sans rien écrire.
 *
 * @param {Buffer} tampon contenu du fichier
 * @param {Set<string>} emailsExistants adresses déjà en base, normalisées
 * @param {Map<string, object>} matricules matricules déjà occupés dans
 *   l'établissement, indexés par leur forme normalisée (lib/matricule.js)
 *
 * RAPPROCHEMENT PAR MATRICULE
 *
 * Une ligne dont le matricule est déjà occupé dans l'établissement ne crée
 * pas de compte :
 *   - si le titulaire porte le même nom et le même prénom, c'est la même
 *     personne, qui s'est inscrite d'elle-même : elle est RAPPROCHÉE, donc
 *     rattachée à la promotion, et son rattachement est validé s'il était
 *     en attente. Le fichier officiel de l'établissement vaut confirmation ;
 *   - sinon, deux personnes revendiquent le même matricule : la ligne est
 *     rejetée, et l'établissement doit trancher.
 * @returns {object} récapitulatif complet, prêt à afficher
 */
export function analyserFichier(tampon, emailsExistants = new Set(), matricules = new Map()) {
  const { entetes, lignes, separateur, total } = lireCSV(tampon);

  if (total === 0) {
    return {
      valide: false,
      erreurGlobale: 'Le fichier est vide, ou ne contient que sa ligne d\'en-tête.',
      entetes, separateur, lignes: [], statistiques: vides()
    };
  }

  const colonnes = reconnaitreColonnes(entetes);
  const manquantes = COLONNES_OBLIGATOIRES.filter(c => !colonnes[c]);
  if (manquantes.length > 0) {
    return {
      valide: false,
      erreurGlobale:
        `Colonnes introuvables : ${manquantes.join(', ')}. ` +
        `Le fichier contient : ${entetes.filter(Boolean).join(', ')}.`,
      entetes, separateur, colonnes, lignes: [], statistiques: vides()
    };
  }

  /* Les doublons INTERNES au fichier doivent être détectés séparément
     des adresses déjà en base : ce ne sont pas la même erreur, et
     l'université ne les corrige pas de la même façon. */
  const vues = new Map();
  const matriculesVus = new Map();
  const analysees = [];

  for (const brute of lignes) {
    const lire = (champ) => colonnes[champ] ? String(brute[colonnes[champ]] || '').trim() : '';

    const ligne = {
      ligne: brute.__ligne,
      nom: lire('nom'),
      prenom: lire('prenom'),
      email: normaliserEmail(lire('email')),
      matricule: lire('matricule') || null,
      telephone: lire('telephone') || null,
      niveauBrut: lire('niveau'),
      filiereBrut: lire('filiere'),
      specialisationBrut: lire('specialisation'),
      erreurs: [],
      avertissements: [],
      action: 'creer',
      rapprochement: null
    };

    if (!ligne.nom) ligne.erreurs.push('nom manquant');
    if (!ligne.prenom) ligne.erreurs.push('prénom manquant');

    const cleMatricule = normaliserMatricule(ligne.matricule);
    if (cleMatricule) {
      if (matriculesVus.has(cleMatricule)) {
        ligne.erreurs.push(`matricule en double dans le fichier (ligne ${matriculesVus.get(cleMatricule)})`);
      } else {
        matriculesVus.set(cleMatricule, ligne.ligne);
      }
      const titulaire = matricules.get(cleMatricule);
      if (titulaire) {
        const qui = `${titulaire.prenomEtudiant || ''} ${titulaire.nomEtudiant || ''}`.trim();
        if (memeNom(titulaire.nomEtudiant, ligne.nom) && memeNom(titulaire.prenomEtudiant, ligne.prenom)) {
          ligne.action = 'rapprocher';
          ligne.rapprochement = {
            idEtudiant: titulaire.idEtudiant,
            statut: titulaire.statutRattachement
          };
        } else {
          ligne.erreurs.push(`matricule déjà attribué à ${qui} dans votre établissement, sous un autre nom`);
        }
      }
    }

    /* Un étudiant rapproché a déjà son compte : l'adresse du fichier n'a
       ni à être nouvelle, ni à être celle de son compte. */
    if (ligne.action === 'rapprocher') {
      // aucune vérification d'adresse
    } else if (!ligne.email) {
      ligne.erreurs.push('adresse manquante');
    } else if (!estEmailValide(ligne.email)) {
      ligne.erreurs.push('adresse invalide');
    } else if (emailsExistants.has(ligne.email)) {
      ligne.erreurs.push('adresse déjà utilisée sur la plateforme');
    } else if (vues.has(ligne.email)) {
      ligne.erreurs.push(`adresse en double dans le fichier (ligne ${vues.get(ligne.email)})`);
    } else {
      vues.set(ligne.email, ligne.ligne);
    }

    /* Niveau, filière et spécialisation sont des AVERTISSEMENTS, pas des
       erreurs : ce sont des informations de confort. Refuser un étudiant
       entier parce que sa filière est mal orthographiée serait une
       rigueur mal placée — le compte est créé, le champ reste vide, et
       l'étudiant le complétera. */
    ligne.niveau = apparierReferentiel(ligne.niveauBrut, NIVEAUX_ACADEMIQUES);
    if (ligne.niveauBrut && !ligne.niveau) {
      ligne.avertissements.push(`niveau inconnu « ${ligne.niveauBrut} », laissé vide`);
    }

    ligne.filiere = apparierReferentiel(ligne.filiereBrut, DOMAINES_CONNUS);
    if (ligne.filiereBrut && !ligne.filiere) {
      ligne.avertissements.push(`filière inconnue « ${ligne.filiereBrut} », laissée vide`);
    }

    ligne.specialisation = ligne.filiere
      ? apparierReferentiel(ligne.specialisationBrut, filieresDuDomaine(ligne.filiere))
      : null;
    if (ligne.specialisationBrut && !ligne.specialisation) {
      ligne.avertissements.push(
        ligne.filiere
          ? `spécialisation « ${ligne.specialisationBrut} » absente de la filière, laissée vide`
          : `spécialisation ignorée : la filière n'a pas été reconnue`
      );
    }

    ligne.importable = ligne.erreurs.length === 0;
    analysees.push(ligne);
  }

  const statistiques = {
    total: analysees.length,
    importables: analysees.filter(l => l.importable && l.action === 'creer').length,
    rapprochements: analysees.filter(l => l.importable && l.action === 'rapprocher').length,
    rejetees: analysees.filter(l => !l.importable).length,
    avecAvertissement: analysees.filter(l => l.importable && l.avertissements.length > 0).length,
    dejaInscrits: analysees.filter(l => l.erreurs.some(e => e.startsWith('adresse déjà'))).length,
    doublonsFichier: analysees.filter(l => l.erreurs.some(e => e.startsWith('adresse en double'))).length,
    sansNiveau: analysees.filter(l => l.importable && !l.niveau).length,
    sansFiliere: analysees.filter(l => l.importable && !l.filiere).length
  };

  return {
    valide: statistiques.importables + statistiques.rapprochements > 0,
    erreurGlobale: statistiques.importables + statistiques.rapprochements === 0
      ? 'Aucune ligne de ce fichier ne peut être importée. Corrigez les erreurs signalées ci-dessous.'
      : null,
    entetes, separateur, colonnes,
    lignes: analysees,
    statistiques,
    empreinte: empreinteContenu(analysees)
  };
}

function vides() {
  return {
    total: 0, importables: 0, rapprochements: 0, rejetees: 0, avecAvertissement: 0,
    dejaInscrits: 0, doublonsFichier: 0, sansNiveau: 0, sansFiliere: 0
  };
}

/* Empreinte des seules lignes importables, dans l'ordre. Elle lie la
   prévisualisation à la confirmation : si le fichier change entre les
   deux, l'empreinte diffère et la confirmation est refusée. */
export function empreinteContenu(lignes) {
  const utile = lignes
    .filter(l => l.importable)
    .map(l => [l.action, l.rapprochement?.idEtudiant ?? '', l.email, l.nom, l.prenom,
               l.matricule, l.niveau, l.filiere, l.specialisation].join('|'))
    .join('\n');
  return createHash('sha256').update(utile).digest('hex');
}
