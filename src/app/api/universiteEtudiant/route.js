import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req) {
  const client = await pool.connect();

  try {
    // === Auth : université uniquement ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idUniversite = payload.idUniversite;

    // === Tous les étudiants de cette université ===
    // LEFT JOIN LATERAL : récupère le stage en cours le plus récent (si recruté)
    const result = await client.query(`
      SELECT 
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."photoProfil",
        e."niveauAcademique",
        e."filiere",
        e."specialisation",
        e."estActif",
        u."emailUtilisateur",
        stage."nomEntreprise" AS "stageEntreprise",
        stage."posteOffre" AS "stagePoste",
        COUNT(DISTINCT cand."idCandidature") AS "nombreCandidatures"
      FROM etudiant e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN "Candidature" cand ON cand."idEtudiant" = e."idEtudiant"
      LEFT JOIN LATERAL (
        SELECT ent."nomEntreprise", o."titre" AS "posteOffre"
        FROM "Candidature" c2
        INNER JOIN offre o ON c2."idOffre" = o."idOffre"
        INNER JOIN entreprise ent ON o."idEntreprise" = ent."idEntreprise"
        WHERE c2."idEtudiant" = e."idEtudiant" AND c2."statut" = 'Recruté'
        ORDER BY c2."dateCandidature" DESC
        LIMIT 1
      ) stage ON true
      WHERE e."idUniversite" = $1
        AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
      GROUP BY e."idEtudiant", u."emailUtilisateur", stage."nomEntreprise", stage."posteOffre"
      ORDER BY e."nomEtudiant" ASC
    `, [idUniversite]);

    /* === Demandes de rattachement en attente ===
       Un étudiant qui se déclare membre de cette université n'y apparaît pas
       tant qu'elle ne l'a pas validé : c'est elle seule qui sait qui sont
       réellement ses étudiants. */
    const enAttente = await client.query(`
      SELECT
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."photoProfil",
        e."niveauAcademique",
        e."filiere",
        e."specialisation",
        e."matricule",
        e."dateRattachement",
        u."emailUtilisateur"
      FROM etudiant e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      WHERE e."idUniversite" = $1
        AND e."statutRattachement" = 'En attente'
      ORDER BY e."dateRattachement" ASC NULLS LAST, e."nomEtudiant" ASC
    `, [idUniversite]);

    return NextResponse.json(
      {
        etudiants: result.rows,
        demandesRattachement: enAttente.rows
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur étudiants université:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

/* =====================================================================
   PATCH : valider ou refuser une demande de rattachement
   Corps attendu : { idEtudiant, decision: 'Valide' | 'Refuse' }
   ===================================================================== */
export async function PATCH(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { idEtudiant, decision } = await req.json();

    if (!idEtudiant || !['Valide', 'Refuse'].includes(decision)) {
      return NextResponse.json(
        { error: 'Paramètres invalides : décision attendue « Valide » ou « Refuse »' },
        { status: 400 }
      );
    }

    /* Un refus détache l'étudiant : son idUniversite est remis à NULL pour
       qu'il puisse déclarer un autre établissement. Le nom saisi est
       conservé, mais le statut « Refuse » empêche un rattachement
       automatique en boucle vers la même université. */
    const estValide = decision === 'Valide';

    const result = await client.query(`
      UPDATE etudiant
      SET "statutRattachement" = $1,
          "idUniversite" = CASE WHEN $2 THEN "idUniversite" ELSE NULL END,
          "dateRattachement" = now()
      WHERE "idEtudiant" = $3
        AND "idUniversite" = $4
        AND "statutRattachement" = 'En attente'
      RETURNING "idEtudiant", "statutRattachement"
    `, [decision, estValide, idEtudiant, payload.idUniversite]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Demande introuvable ou déjà traitée' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: estValide
          ? 'Étudiant rattaché à votre établissement'
          : 'Demande de rattachement refusée',
        etudiant: result.rows[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur traitement rattachement:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}