import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { envoyerMessageInterne } from '@/lib/messagerie';

// =====================================================================
// PATCH : valider ou retirer la vérification d'un compte
// =====================================================================
export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);
    if (!payload || payload.typeUtilisateur !== 'Admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { type, id, estVerifie } = await req.json();

    if (!['entreprise', 'universite'].includes(type) || !id || typeof estVerifie !== 'boolean') {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    await client.query('BEGIN');

    // === 1. UPDATE du statut + récupération des infos ===
    let result;
    if (type === 'entreprise') {
      result = await client.query(`
        UPDATE entreprise e
        SET "estVerifie" = $1,
            "dateVerification" = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM utilisateur u
        WHERE e."idEntreprise" = $2 AND e."idUtilisateur" = u."idUtilisateur"
        RETURNING e."idEntreprise", e."estVerifie",
                  e."nomEntreprise" AS "nom",
                  u."idUtilisateur", u."emailUtilisateur"
      `, [estVerifie, id]);
    } else {
      result = await client.query(`
        UPDATE universite univ
        SET "estVerifie" = $1,
            "dateVerification" = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END
        FROM utilisateur u
        WHERE univ."idUniversite" = $2 AND univ."idUtilisateur" = u."idUtilisateur"
        RETURNING univ."idUniversite", univ."estVerifie",
                  univ."nomUniversite" AS "nom",
                  u."idUtilisateur", u."emailUtilisateur"
      `, [estVerifie, id]);
    }

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: 'Compte introuvable' }, { status: 404 });
    }

    const compte = result.rows[0];
    let messageEnvoye = false;

    /* === 2. Message interne, uniquement lors d'une validation ===
       L'envoi passe par un SAVEPOINT (cf. lib/messagerie) : un échec ne
       doit pas annuler la vérification. L'ancienne version le prétendait
       mais faisait l'inverse — en PostgreSQL, une instruction en échec
       avorte toute la transaction, donc le COMMIT échouait et la
       vérification était silencieusement perdue. */
    if (estVerifie === true) {
      const typeAffiche = type === 'entreprise' ? 'entreprise' : 'université';
      const contenu = `🎉 Félicitations ! Votre compte ${typeAffiche} « ${compte.nom} » a été officiellement vérifié par notre équipe.

Vous bénéficiez désormais du badge « ✓ Vérifiée » qui sera visible sur votre profil par tous les utilisateurs de la plateforme. Cela renforce votre crédibilité et inspire confiance auprès des ${type === 'entreprise' ? 'étudiants et universités' : 'étudiants et entreprises'}.

Bienvenue dans la communauté Stage Share ! 🚀

— L'équipe d'administration`;

      messageEnvoye = await envoyerMessageInterne(client, {
        idExpediteur: payload.idUtilisateur,
        idDestinataire: compte.idUtilisateur,
        contenu
      });
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        message: 'Statut de vérification mis à jour',
        resultat: compte,
        emailEnvoye: messageEnvoye
      },
      { status: 200 }
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur vérification:', error);
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
  } finally {
    client.release();
  }
}