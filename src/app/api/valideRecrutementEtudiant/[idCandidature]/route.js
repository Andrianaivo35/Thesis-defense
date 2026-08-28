import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { envoyerMessageInterne } from '@/lib/messagerie';

const STATUTS_VALIDES = ['En attente', 'Recruté', 'Refusé'];

export async function PATCH(req, { params }) {
  const { idCandidature } = await params;
  const client = await pool.connect();

  try {
    // === Auth : entreprise uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;
    const body = await req.json();
    const { statut } = body;

    if (!statut || !STATUTS_VALIDES.includes(statut)) {
      return NextResponse.json(
        { error: `Statut invalide. Valeurs acceptées : ${STATUTS_VALIDES.join(', ')}` },
        { status: 400 }
      );
    }

    await client.query('BEGIN');

    /* Met à jour SEULEMENT si la candidature appartient à une offre de cette
       entreprise. On récupère au passage de quoi notifier l'étudiant. */
    const result = await client.query(`
      UPDATE "Candidature" c
      SET "statut" = $1
      FROM offre o, etudiant e, entreprise ent
      WHERE c."idCandidature" = $2
        AND c."idOffre" = o."idOffre"
        AND o."idEntreprise" = $3
        AND e."idEtudiant" = c."idEtudiant"
        AND ent."idEntreprise" = o."idEntreprise"
      RETURNING c."idCandidature", c."statut",
                o."titre" AS "titreOffre",
                e."idUtilisateur" AS "idUtilisateurEtudiant",
                e."prenomEtudiant",
                ent."nomEntreprise",
                ent."idUtilisateur" AS "idUtilisateurEntreprise"
    `, [statut, idCandidature, idEntreprise]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        { error: "Candidature introuvable ou ne vous appartient pas" },
        { status: 404 }
      );
    }

    const candidature = result.rows[0];

    /* === Notification de l'étudiant ===
       Auparavant, une entreprise pouvait retenir ou refuser un candidat
       sans que celui-ci en soit informé par aucun canal. On réutilise la
       messagerie interne, comme pour la validation des comptes.

       L'envoi est protégé par un SAVEPOINT : un échec de notification ne
       doit jamais empêcher l'enregistrement de la décision. */
    let notificationEnvoyee = false;

    if (statut === 'Recruté' || statut === 'Refusé') {
      const contenu = statut === 'Recruté'
        ? `🎉 Bonne nouvelle ${candidature.prenomEtudiant} !

Votre candidature au poste « ${candidature.titreOffre} » chez ${candidature.nomEntreprise} a été retenue.

L'entreprise reviendra vers vous pour la suite du processus. Vous pouvez également lui répondre directement dans cette conversation.

— Stage Share`
        : `Bonjour ${candidature.prenomEtudiant},

Votre candidature au poste « ${candidature.titreOffre} » chez ${candidature.nomEntreprise} n'a pas été retenue.

Ne vous découragez pas : d'autres offres correspondant à votre profil vous sont proposées sur la plateforme.

— Stage Share`;

      notificationEnvoyee = await envoyerMessageInterne(client, {
        idExpediteur: candidature.idUtilisateurEntreprise,
        idDestinataire: candidature.idUtilisateurEtudiant,
        contenu
      });
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        message: 'Statut mis à jour',
        candidature: {
          idCandidature: candidature.idCandidature,
          statut: candidature.statut
        },
        notificationEnvoyee
      },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur mise à jour statut:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}