import nodemailer from 'nodemailer';

/* =====================================================================
   ENVOI DE COURRIEL

   L'intégration réelle est le Lot 6.6. Les gabarits, eux, sont écrits
   dès maintenant : leur contenu conditionne la conception des routes —
   un lien d'activation n'a de sens que si l'on sait ce qui l'accompagne.

   TANT QUE L'ENVOI N'EST PAS CONFIGURÉ

   Le module ne doit pas faire échouer l'opération qui l'appelle. Créer
   un compte étudiant et voir l'inscription entière échouer parce
   qu'aucun serveur SMTP n'est renseigné serait absurde : le compte est
   valide, seul son courriel de bienvenue manque.

   `envoyer()` renvoie donc un compte rendu au lieu de lever. L'appelant
   décide quoi en faire — typiquement, afficher le lien à l'université
   pour qu'elle le transmette elle-même.

   ⚠️ Le lien est journalisé côté serveur quand l'envoi est impossible.
   C'est un dispositif de DÉVELOPPEMENT. En production, un lien
   d'activation dans les journaux est une fuite ; le Lot 6.6 doit retirer
   cette trace en même temps qu'il branche l'envoi réel.
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
export async function envoyerLienActivation({ to, nom, nomUniversite, jeton, expiration }) {
  const lien = lienActivation(jeton);
  return envoyer({
    to,
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
export async function envoyerLienReinitialisation({ to, jeton, expiration }) {
  const lien = lienReinitialisation(jeton);
  return envoyer({
    to,
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
export async function envoyerEmailValidation({ to, nom, type }) {
  const typeLabel = type === 'entreprise' ? 'entreprise' : 'université';
  const lienLogin = type === 'entreprise'
    ? `${BASE_URL}/pages/entrepriseLogin`
    : `${BASE_URL}/pages/universiteLogin`;

  return envoyer({
    to,
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
