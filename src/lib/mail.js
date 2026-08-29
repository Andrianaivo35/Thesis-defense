import nodemailer from 'nodemailer';

/* =====================================================================
   ENVOI DE COURRIEL

   L'application ne PARLE PAS à un serveur SMTP pendant une requête. Elle
   écrit ses courriels dans une file, et un vidage les expédie ensuite.

   POURQUOI

   Un envoi SMTP prend de 0,3 à 2 secondes. L'import d'une promotion en
   engendre trois cents : deux à dix minutes dans le cycle d'une requête
   HTTP, qui expire bien avant. Le plan l'avait identifié comme le
   dernier point technique du lot.

   Mais le délai n'est que le symptôme le plus visible. Le vrai risque
   est la PERTE : un redémarrage, une coupure, une erreur
   d'authentification, et trois cents étudiants n'ont jamais reçu leur
   lien — leur seul moyen d'accéder à la plateforme.

   La mise en file se fait donc DANS LA MÊME TRANSACTION que l'action qui
   la motive. Si l'import échoue, aucun courriel n'est mis en file : on
   n'annonce pas un compte qui n'existe pas. S'il réussit, le courriel
   est garanti d'être tenté.

   LE GARDE-FOU SUR LES DOMAINES

   Le jeu de démonstration compte trente-huit adresses en
   « @demo.stageshare.mg », un domaine qui n'existe pas. Les expédier
   produirait autant de rebonds depuis le compte d'envoi réel — c'est
   ainsi qu'une adresse Gmail se fait suspendre.

   Ces domaines sont donc refusés à l'entrée de la file, et non au
   moment de l'envoi : mieux vaut ne rien mettre en attente que de
   remplir la file de courriels condamnés.
   ===================================================================== */

const SMTP_CONFIGURE = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);

const transporter = SMTP_CONFIGURE
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    })
  : null;

export const BASE_URL = process.env.APP_URL || 'http://localhost:3000';

/** L'envoi est-il possible ? Les routes s'en servent pour décider si
    elles doivent transmettre le lien par un autre canal. */
export function envoiConfigure() {
  return SMTP_CONFIGURE;
}

/* Domaines dont les adresses ne sont jamais expédiées.

   Le jeu de démonstration en fait partie : ses adresses ne mènent nulle
   part, et chaque rebond dégrade la réputation de l'expéditeur.
   Surchargeable par COURRIEL_DOMAINES_EXCLUS, séparés par des virgules. */
const DOMAINES_EXCLUS = (process.env.COURRIEL_DOMAINES_EXCLUS ||
  'demo.stageshare.mg,exemple.mg,example.com,test.com')
  .split(',').map(d => d.trim().toLowerCase()).filter(Boolean);

/* LISTE BLANCHE — le garde-fou décisif hors production.

   La liste noire de domaines ne protège que des domaines qu'on a pensé
   à y mettre. Or une adresse inventée pour un essai peut parfaitement
   appartenir à quelqu'un de réel : rien ne distingue
   « jean.rakoto@gmail.com » fabriqué pour un test de la vraie boîte
   d'un inconnu qui la relève.

   Quand COURRIEL_DESTINATAIRES_AUTORISES est renseignée, SEULES ces
   adresses sont mises en file. Tout le reste est ignoré, y compris ce
   qu'aucune liste noire n'aurait attrapé. C'est la seule façon de
   garantir qu'un essai n'écrit à personne d'autre qu'à soi-même.

   Laisser la variable vide rend l'envoi ouvert : c'est le réglage de
   production, à ne poser qu'en connaissance de cause. */
const DESTINATAIRES_AUTORISES = (process.env.COURRIEL_DESTINATAIRES_AUTORISES || '')
  .split(',').map(a => a.trim().toLowerCase()).filter(Boolean);

/** L'adresse peut-elle recevoir du courrier réel ? */
export function adresseExpediable(adresse) {
  const forme = String(adresse || '').toLowerCase();
  const domaine = forme.split('@')[1];
  if (!domaine) return false;

  if (DESTINATAIRES_AUTORISES.length > 0) {
    return DESTINATAIRES_AUTORISES.includes(forme);
  }
  return !DOMAINES_EXCLUS.includes(domaine);
}

/* Au-delà de ce nombre de tentatives, le courriel est abandonné.
   S'acharner sur une adresse inexistante ne la fait pas apparaître, et
   fait chuter la réputation de l'expéditeur. */
const TENTATIVES_MAX = 3;

/**
 * Met un courriel en file, dans la transaction en cours.
 *
 * @param {object} client connexion PostgreSQL, transaction déjà ouverte
 * @returns {Promise<{enFile: boolean, motif?: string}>}
 */
export async function mettreEnFile(client, { to, subject, html, categorie = null }) {
  if (!to || !subject || !html) return { enFile: false, motif: 'incomplet' };

  if (!adresseExpediable(to)) {
    /* Ni erreur ni file : c'est un cas normal en développement. On le
       signale sans le destinataire complet, pour ne pas déverser des
       adresses dans les journaux. */
    console.info(
      DESTINATAIRES_AUTORISES.length > 0
        ? '[courriel ignoré] destinataire hors de la liste blanche'
        : `[courriel ignoré] domaine non expédiable : @${String(to).split('@')[1]}`);
    return { enFile: false, motif: 'destinataire_non_autorise' };
  }

  await client.query(
    `INSERT INTO "FileCourriel" ("destinataire", "sujet", "corpsHtml", "categorie")
     VALUES ($1, $2, $3, $4)`,
    [to, subject, html, categorie]
  );
  return { enFile: true };
}

/**
 * Vide la file : expédie les courriels en attente, par lots.
 *
 * Séquentiel et non parallèle. Un fournisseur comme Gmail limite le
 * débit et considère une rafale simultanée comme un comportement
 * suspect ; la lenteur n'est pas un problème puisque personne n'attend.
 *
 * @param {object} client connexion PostgreSQL
 * @param {number} limite nombre maximal de courriels traités
 */
export async function viderFile(client, limite = 50) {
  if (!SMTP_CONFIGURE) return { envoyes: 0, echecs: 0, motif: 'non_configure' };

  const { rows } = await client.query(
    `SELECT "idCourriel", "destinataire", "sujet", "corpsHtml", "tentatives"
       FROM "FileCourriel"
      WHERE "statut" = 'en_attente'
      ORDER BY "idCourriel"
      LIMIT $1`,
    [limite]
  );

  let envoyes = 0, echecs = 0, abandonnes = 0;

  for (const courriel of rows) {
    const resultat = await envoyer({
      to: courriel.destinataire,
      subject: courriel.sujet,
      html: courriel.corpsHtml
    });

    if (resultat.envoye) {
      await client.query(
        `UPDATE "FileCourriel" SET "statut" = 'envoye', "dateEnvoi" = now(),
                "tentatives" = "tentatives" + 1
          WHERE "idCourriel" = $1`, [courriel.idCourriel]);
      envoyes++;
    } else {
      const tentatives = courriel.tentatives + 1;
      const fini = tentatives >= TENTATIVES_MAX;
      await client.query(
        `UPDATE "FileCourriel"
            SET "statut" = $2, "tentatives" = $3, "derniereErreur" = $4
          WHERE "idCourriel" = $1`,
        [courriel.idCourriel, fini ? 'abandonne' : 'en_attente',
         tentatives, resultat.motif || 'erreur inconnue']);
      if (fini) abandonnes++; else echecs++;
    }
  }

  return { envoyes, echecs, abandonnes, traites: rows.length };
}

/**
 * Envoie un courriel, ou explique pourquoi il n'est pas parti.
 * Ne lève jamais : l'échec d'un courriel n'annule pas l'action métier.
 *
 * @returns {Promise<{envoye: boolean, motif?: string}>}
 */
export async function envoyer({ to, subject, html }) {
  if (!SMTP_CONFIGURE) {
    console.warn(`[courriel non configuré] destinataire=${to} sujet="${subject}"`);
    return { envoye: false, motif: 'non_configure' };
  }
  try {
    await transporter.sendMail({
      from: `"Stage Share" <${process.env.EMAIL_USER}>`,
      to, subject, html
    });
    return { envoye: true };
  } catch (erreur) {
    console.error('Envoi de courriel impossible :', erreur.message);
    return { envoye: false, motif: 'erreur_envoi' };
  }
}

/* Enveloppe commune : les gabarits partagent la même présentation, pour
   que les messages de la plateforme soient reconnaissables. */
function gabarit({ titre, couleur, corps }) {
  return `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:${couleur};padding:28px 24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">${titre}</h1>
        </div>
        <div style="padding:28px 24px;color:#334155;line-height:1.6;">${corps}</div>
        <div style="padding:16px 24px;background:#f1f5f9;text-align:center;color:#94a3b8;font-size:12px;">
          Stage Share — Plateforme de mise en relation pour les stages
        </div>
      </div>
    </div>`;
}

function bouton(lien, libelle) {
  return `
    <p style="text-align:center;margin:24px 0;">
      <a href="${lien}" style="display:inline-block;background:#4f46e5;color:#ffffff;
         text-decoration:none;padding:13px 26px;border-radius:9px;font-weight:bold;">
        ${libelle}
      </a>
    </p>
    <p style="margin:0 0 6px;color:#64748b;font-size:13px;">
      Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :
    </p>
    <p style="margin:0 0 14px;color:#64748b;font-size:12px;word-break:break-all;">${lien}</p>`;
}

/** Adresse du formulaire d'activation portant ce jeton. */
export function lienActivation(jeton) {
  return `${BASE_URL}/pages/activerCompte?jeton=${encodeURIComponent(jeton)}`;
}

/** Adresse du formulaire de réinitialisation portant ce jeton. */
export function lienReinitialisation(jeton) {
  return `${BASE_URL}/pages/reinitialiserMotDePasse?jeton=${encodeURIComponent(jeton)}`;
}

/**
 * Lien d'activation, pour un compte créé par une université.
 *
 * Le message dit QUI a créé le compte. Recevoir un accès qu'on n'a pas
 * demandé, sans savoir de qui il vient, ressemble à une tentative
 * d'hameçonnage et finit dans la corbeille.
 */
export async function envoyerLienActivation(client, { to, nom, nomUniversite, jeton, expiration }) {
  const lien = lienActivation(jeton);
  return mettreEnFile(client, {
    to,
    categorie: 'activation',
    subject: 'Activez votre compte Stage Share',
    html: gabarit({
      titre: 'Bienvenue sur Stage Share',
      couleur: 'linear-gradient(135deg,#4f46e5,#7c3aed)',
      corps: `
        <p style="margin:0 0 14px;">Bonjour <strong>${nom}</strong>,</p>
        <p style="margin:0 0 14px;">
          ${nomUniversite ? `<strong>${nomUniversite}</strong> a créé` : 'Un compte a été créé'}
          un compte Stage Share à votre nom, afin que vous puissiez déposer votre CV et
          consulter les offres de stage.
        </p>
        <p style="margin:0 0 14px;">
          Il ne vous reste qu'à <strong>choisir votre mot de passe</strong> :
        </p>
        ${bouton(lien, 'Activer mon compte')}
        <p style="margin:0;color:#64748b;font-size:13px;">
          Ce lien est valable jusqu'au ${new Date(expiration).toLocaleString('fr-FR')}
          et ne peut servir qu'une seule fois.
        </p>`
    })
  });
}

/**
 * Lien de réinitialisation.
 *
 * Le message précise qu'il suffit d'ignorer le courriel si la demande ne
 * vient pas du destinataire : quelqu'un qui reçoit cela sans l'avoir
 * demandé doit savoir que son compte n'a pas été compromis.
 */
export async function envoyerLienReinitialisation(client, { to, jeton, expiration }) {
  const lien = lienReinitialisation(jeton);
  return mettreEnFile(client, {
    to,
    categorie: 'reinitialisation',
    subject: 'Réinitialisation de votre mot de passe Stage Share',
    html: gabarit({
      titre: 'Mot de passe oublié',
      couleur: 'linear-gradient(135deg,#0f766e,#14b8a6)',
      corps: `
        <p style="margin:0 0 14px;">Bonjour,</p>
        <p style="margin:0 0 14px;">
          Une réinitialisation du mot de passe a été demandée pour ce compte.
          Choisissez un nouveau mot de passe :
        </p>
        ${bouton(lien, 'Choisir un nouveau mot de passe')}
        <p style="margin:0 0 10px;color:#64748b;font-size:13px;">
          Ce lien expire dans une heure et ne peut servir qu'une seule fois.
        </p>
        <p style="margin:0;color:#64748b;font-size:13px;">
          Si vous n'êtes pas à l'origine de cette demande, ignorez ce message :
          votre mot de passe actuel reste valable et votre compte n'a pas été modifié.
        </p>`
    })
  });
}

/** Courriel envoyé par l'administration quand elle valide un compte. */
export async function envoyerEmailValidation(client, { to, nom, type }) {
  const typeLabel = type === 'entreprise' ? 'entreprise' : 'université';
  const lienLogin = type === 'entreprise'
    ? `${BASE_URL}/pages/entrepriseLogin`
    : `${BASE_URL}/pages/universiteLogin`;

  return mettreEnFile(client, {
    to,
    categorie: 'validation',
    subject: 'Votre compte Stage Share a été validé ✓',
    html: gabarit({
      titre: '✓ Compte validé',
      couleur: 'linear-gradient(135deg,#059669,#10b981)',
      corps: `
        <p style="margin:0 0 14px;">Bonjour <strong>${nom}</strong>,</p>
        <p style="margin:0 0 14px;">
          Le compte ${typeLabel} <strong>${nom}</strong> vient d'être
          <strong>vérifié et validé</strong> par l'administration de Stage Share.
        </p>
        <p style="margin:0 0 14px;">
          Vous pouvez dès maintenant vous connecter et profiter pleinement de toutes
          les fonctionnalités de la plateforme.
        </p>
        ${bouton(lienLogin, 'Me connecter')}`
    })
  });
}

/**
 * Courriel de fin de cursus (Lot 6.5).
 *
 * Le message insiste sur ce qui NE change pas : le compte reste actif.
 * Recevoir « votre rattachement a pris fin » sans cette précision se lit
 * comme une fermeture de compte, et l'étudiant cesse de se connecter au
 * moment précis où la plateforme lui sert le plus.
 */
export async function envoyerFinRattachement(client, { to, nom, nomUniversite, statut, motif }) {
  const diplome = statut === 'Diplome';
  return mettreEnFile(client, {
    to,
    categorie: 'cycleVie',
    subject: diplome
      ? 'Félicitations — vous êtes diplômé'
      : 'Votre rattachement à votre établissement a pris fin',
    html: gabarit({
      titre: diplome ? '🎓 Félicitations' : 'Fin de rattachement',
      couleur: diplome
        ? 'linear-gradient(135deg,#059669,#10b981)'
        : 'linear-gradient(135deg,#475569,#64748b)',
      corps: `
        <p style="margin:0 0 14px;">Bonjour <strong>${nom}</strong>,</p>
        <p style="margin:0 0 14px;">
          ${diplome
            ? `<strong>${nomUniversite}</strong> vous a déclaré diplômé. Félicitations pour l'aboutissement de votre cursus.`
            : `<strong>${nomUniversite}</strong> a mis fin à votre rattachement à l'établissement${motif ? ` (motif : ${motif})` : ''}.`}
        </p>
        <p style="margin:0 0 14px;">
          <strong>Votre compte Stage Share reste actif.</strong>
          ${diplome
            ? `Vous continuez à recevoir des recommandations et à candidater, désormais en tant qu'ancien étudiant de l'établissement.`
            : `Vous pouvez continuer à utiliser la plateforme, et rattacher un autre établissement depuis votre profil.`}
        </p>
        ${bouton(`${BASE_URL}/pages/etudiantLogin`, 'Accéder à mon compte')}`
    })
  });
}
