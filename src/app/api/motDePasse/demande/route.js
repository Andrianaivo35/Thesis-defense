import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { normaliserEmail } from '@/lib/email';
import { creerJeton, TYPE_REINITIALISATION } from '@/lib/jetons';
import { envoyerLienReinitialisation } from '@/lib/mail';
import {
  identifierAppelant, verifierLimite, messageLimiteAtteinte
} from '@/lib/limiteDebit';

/* =====================================================================
   POST /api/motDePasse/demande — demander un lien de réinitialisation

   LA RÉPONSE EST TOUJOURS LA MÊME

   C'est le point central de cette route, et c'est contre-intuitif : dire
   « aucun compte avec cette adresse » serait plus aimable, et c'est
   exactement ce qu'il ne faut pas faire.

   Une réponse qui distingue les deux cas transforme ce formulaire en
   outil d'ÉNUMÉRATION DE COMPTES : n'importe qui peut y essayer une
   liste d'adresses et apprendre lesquelles sont inscrites. Sur une
   plateforme d'étudiants, cela revient à publier qui cherche un stage.

   La réponse est donc identique dans tous les cas — adresse inconnue,
   compte inactif, ou courriel réellement expédié. Y compris en durée :
   voir plus bas.
   ===================================================================== */

/* Durée plancher de la réponse.

   La réponse a beau être identique, sa DURÉE ne l'était pas : créer un
   jeton et préparer un courriel prend du temps, ne rien faire n'en prend
   pas. La mesure sur cette route donnait 97 ms pour une adresse
   existante contre 15 ms pour une inconnue — un écart de six fois, très
   au-dessus du bruit d'un réseau local. L'énumération redevenait
   possible, au chronomètre.

   On aligne donc les deux chemins sur un plancher commun. 400 ms couvre
   confortablement la création du jeton observée.

   Limite assumée : une fois l'envoi de courriel branché (Lot 6.6), un
   serveur SMTP lent pourrait de nouveau dépasser ce plancher. La réponse
   propre sera alors de sortir l'envoi du cycle de la requête — une file
   d'attente — plutôt que d'allonger indéfiniment le plancher. */
const DUREE_PLANCHER_MS = 400;

const attendreJusquA = async (debut) => {
  const reste = DUREE_PLANCHER_MS - (Date.now() - debut);
  if (reste > 0) await new Promise(r => setTimeout(r, reste));
};

const REPONSE_UNIFORME = {
  success: true,
  message: 'Si un compte existe avec cette adresse, un lien de réinitialisation ' +
           'vient de lui être envoyé. Pensez à regarder vos courriers indésirables.'
};

export async function POST(req) {
  const debut = Date.now();
  const client = await pool.connect();
  try {
    const { email: emailSaisi } = await req.json();
    const email = normaliserEmail(emailSaisi);

    if (!email) {
      return NextResponse.json(
        { error: 'Veuillez indiquer votre adresse électronique.' },
        { status: 400 }
      );
    }

    /* La limitation du Lot 4.3 s'applique ici aussi. Sans elle, la
       réponse uniforme ne protégerait de rien : il suffirait d'essayer
       des milliers d'adresses et de mesurer autre chose — la charge, les
       courriels effectivement partis. */
    const cle = identifierAppelant(req, email);
    const limite = verifierLimite(cle);
    if (!limite.autorise) {
      return NextResponse.json(
        { error: messageLimiteAtteinte(limite.secondesAttente) },
        { status: 429 }
      );
    }

    const { rows } = await client.query(
      `SELECT "idUtilisateur", "emailUtilisateur", "compteActive"
         FROM utilisateur WHERE lower("emailUtilisateur") = $1`,
      [email]
    );
    const utilisateur = rows[0];

    /* Un compte jamais activé n'a pas de mot de passe à réinitialiser :
       c'est un lien d'ACTIVATION qu'il lui faut. On ne le dit pas ici —
       ce serait révéler l'existence du compte — mais on n'engendre pas
       non plus un jeton qui mènerait à un formulaire trompeur. */
    if (utilisateur && utilisateur.compteActive) {
      await client.query('BEGIN');
      try {
        const { jeton, expiration } = await creerJeton(
          client, utilisateur.idUtilisateur, TYPE_REINITIALISATION);
        await client.query('COMMIT');

        /* L'envoi a lieu hors transaction : un serveur de courriel lent
           ne doit pas maintenir une transaction ouverte. */
        await envoyerLienReinitialisation({
          to: utilisateur.emailUtilisateur, jeton, expiration
        });
      } catch (erreur) {
        await client.query('ROLLBACK').catch(() => {});
        /* Même en cas d'échec, la réponse reste uniforme : une erreur
           500 sur les seules adresses existantes serait elle-même un
           signal exploitable. */
        console.error('Création du jeton de réinitialisation impossible :', erreur.message);
      }
    }

    await attendreJusquA(debut);
    return NextResponse.json(REPONSE_UNIFORME, { status: 200 });

  } catch (error) {
    console.error('Erreur demande de réinitialisation :', error);
    await attendreJusquA(debut);
    /* Y compris ici : un corps de requête malformé ne doit pas non plus
       permettre de distinguer les cas. */
    return NextResponse.json(REPONSE_UNIFORME, { status: 200 });
  } finally {
    client.release();
  }
}
