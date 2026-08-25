import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

export async function envoyerEmailValidation({ to, nom, type }) {
  const typeLabel = type === 'entreprise' ? 'entreprise' : 'université';
  const lienLogin = type === 'entreprise'
    ? '/pages/entrepriseLogin'
    : '/pages/universiteLogin';

  const html = `
    <div style="max-width:560px;margin:0 auto;font-family:Arial,sans-serif;background:#f8fafc;padding:24px;">
      <div style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
        <div style="background:linear-gradient(135deg,#059669,#10b981);padding:28px 24px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:22px;">✓ Compte validé</h1>
        </div>
        <div style="padding:28px 24px;color:#334155;line-height:1.6;">
          <p style="margin:0 0 14px;">Bonjour <strong>${nom}</strong>,</p>
          <p style="margin:0 0 14px;">
            Bonne nouvelle ! Le compte ${typeLabel} <strong>${nom}</strong> vient d'être
            <strong>vérifié et validé</strong> par l'administration de Stage Share.
          </p>
          <p style="margin:0 0 14px;">
            Vous pouvez dès maintenant vous connecter et profiter pleinement de toutes
            les fonctionnalités de la plateforme.
          </p>
          <p style="margin:0 0 6px;color:#64748b;font-size:14px;">
            Connectez-vous avec vos identifiants sur la page de connexion
            ${typeLabel} (<em>${lienLogin}</em>).
          </p>
        </div>
        <div style="padding:16px 24px;background:#f1f5f9;text-align:center;color:#94a3b8;font-size:12px;">
          Stage Share — Plateforme de mise en relation pour les stages
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"Stage Share" <${process.env.EMAIL_USER}>`,
    to,
    subject: 'Votre compte Stage Share a été validé ✓',
    html
  });
}