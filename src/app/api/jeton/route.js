import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';
import {
  verifierJeton, consommerJeton, MESSAGES_MOTIF,
  TYPE_ACTIVATION, TYPE_REINITIALISATION
} from '@/lib/jetons';

/* =====================================================================
   /api/jeton — activation de compte et réinitialisation de mot de passe

   Une seule route pour les deux, parce que c'est un seul geste :
   présenter une preuve de contrôle de l'adresse, puis poser un mot de
   passe. Les séparer aurait dupliqué la validation, la consommation du
   jeton et le hachage — trois endroits où deux copies finissent par
   diverger.

   GET  ?jeton=…&type=…   le lien est-il encore valable ?
   POST { jeton, type, motDePasse }   poser le mot de passe

   POURQUOI UN GET DE VÉRIFICATION

   Pour ne pas faire saisir deux fois un mot de passe et n'annoncer
   qu'ensuite que le lien avait expiré. La page interroge d'abord, puis
   affiche soit le formulaire, soit l'explication et le moyen d'obtenir
   un nouveau lien.

   Ce GET ne consomme rien : ouvrir le lien ne doit pas le brûler. Un
   client de messagerie qui pré-visite les URL rendrait sinon tous les
   liens inutilisables avant même que l'utilisateur ne clique.
   ===================================================================== */

const TYPES = [TYPE_ACTIVATION, TYPE_REINITIALISATION];

export async function GET(req) {
  const client = await pool.connect();
  try {
    const params = new URL(req.url).searchParams;
    const jeton = params.get('jeton');
    const type = params.get('type');

    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: 'Type de lien inconnu.' }, { status: 400 });
    }

    const controle = await verifierJeton(client, jeton, type);
    if (!controle.valide) {
      return NextResponse.json(
        { valide: false, motif: controle.motif, message: MESSAGES_MOTIF[controle.motif] },
        { status: 200 }
      );
    }

    /* On renvoie l'adresse pour que la page puisse l'afficher — « vous
       définissez le mot de passe de jean@… » évite d'activer le mauvais
       compte quand plusieurs liens traînent dans une boîte. Rien d'autre
       n'est exposé : le jeton seul ne doit pas donner accès au profil. */
    return NextResponse.json({ valide: true, email: controle.email }, { status: 200 });

  } catch (error) {
    console.error('Erreur vérification de jeton :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

export async function POST(req) {
  const client = await pool.connect();
  try {
    const { jeton, type, motDePasse } = await req.json();

    if (!TYPES.includes(type)) {
      return NextResponse.json({ error: 'Type de lien inconnu.' }, { status: 400 });
    }

    /* Le mot de passe est validé AVANT de consommer le jeton. Dans
       l'ordre inverse, un mot de passe trop court brûlerait le lien et
       obligerait l'utilisateur à en redemander un — pour une faute de
       frappe. */
    const erreurMotDePasse = validerMotDePasse(motDePasse);
    if (erreurMotDePasse) {
      return NextResponse.json({ error: erreurMotDePasse }, { status: 400 });
    }

    await client.query('BEGIN');

    const consomme = await consommerJeton(client, jeton, type);
    if (!consomme.valide) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: MESSAGES_MOTIF[consomme.motif] || 'Ce lien n\'est pas valide.' },
        { status: 400 }
      );
    }

    const empreinte = await bcrypt.hash(motDePasse, 10);

    /* L'activation pose le mot de passe ET ouvre le compte ; la
       réinitialisation ne touche qu'au mot de passe. Écrire
       "compteActive" = true dans les deux cas serait sans effet sur un
       compte déjà actif, mais réactiverait silencieusement un compte
       que le Lot 6.5 aura désactivé. */
    if (type === TYPE_ACTIVATION) {
      await client.query(
        `UPDATE utilisateur SET "motDePasse" = $1, "compteActive" = true
          WHERE "idUtilisateur" = $2`,
        [empreinte, consomme.idUtilisateur]);
    } else {
      await client.query(
        `UPDATE utilisateur SET "motDePasse" = $1 WHERE "idUtilisateur" = $2`,
        [empreinte, consomme.idUtilisateur]);
    }

    /* Tous les autres jetons en cours du même utilisateur sont périmés.
       Quelqu'un qui vient de reprendre la main sur son compte ne doit
       pas laisser derrière lui un lien encore ouvert. */
    await client.query(
      `UPDATE "JetonUtilisateur" SET "dateUtilisation" = now()
        WHERE "idUtilisateur" = $1 AND "dateUtilisation" IS NULL`,
      [consomme.idUtilisateur]);

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      typeUtilisateur: consomme.typeUtilisateur,
      message: type === TYPE_ACTIVATION
        ? 'Votre compte est activé. Vous pouvez maintenant vous connecter.'
        : 'Votre mot de passe a été modifié. Vous pouvez vous connecter.'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur consommation de jeton :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
