import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

export async function GET(req, { params }) {
  const { idEntreprise } = await params;
  const client = await pool.connect();

  try {
    // === Infos de l'entreprise ===
    const entrepriseResult = await client.query(`
      SELECT 
        "idEntreprise",
        "idUtilisateur",
        "nomEntreprise",
        "formeJuridique",
        "secteurActivitePrincipal",
        "adresseSiegeSocial",
        "telephonePrincipal", 
        "telephoneSecondaire",
        "siteWeb",
        "reseauxSociaux",
        "description",
        "logo",
        "dateInscription",
        "estVerifie"
      FROM entreprise
      WHERE "idEntreprise" = $1
    `, [idEntreprise]);

    if (entrepriseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    // === Offres actives + compétences (pour le modal) ===
    const offresResult = await client.query(`
      SELECT 
        o."idOffre", o."titre", o."description", o."domaine", o."niveauRequis",
        o."duree", o."dateDebut", o."dateFin", o."dateLimites", o."datePublication",
        o."remuneration", o."lieu", o."ville", o."accepteTeletravail", o."typeStage",
        COALESCE(
          json_agg(
            json_build_object(
              'nom', cr."nomCompetenceReference",
              'categorie', cr."categorieCompetenceReference",
              'niveauSouhaitee', co."niveauSouhaitee",
              'estObligatoire', co."estObligatoire"
            )
          ) FILTER (WHERE cr."idCompetenceReference" IS NOT NULL),
          '[]'::json
        ) AS competences
      FROM offre o
      LEFT JOIN "CompetenceOffre" co ON o."idOffre" = co."idOffre"
      LEFT JOIN "CompetenceReference" cr ON co."idCompetenceReference" = cr."idCompetenceReference"
      WHERE o."idEntreprise" = $1 AND o."statut" = 'Active'
      GROUP BY o."idOffre"
      ORDER BY o."datePublication" DESC
    `, [idEntreprise]);

    return NextResponse.json({
      entreprise: entrepriseResult.rows[0],
      offres: offresResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur profil entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


/* ============================================================
   DELETE — suppression définitive du compte entreprise
   ============================================================
   Le GET ci-dessus est public (profil consultable par tous) ; ce
   DELETE ne l'est évidemment pas et vérifie le jeton lui-même.

   Seule l'entreprise elle-même peut déclencher cette action. Deux
   preuves sont exigées : le mot de passe (l'identité) et la saisie
   du mot SUPPRIMER (l'intention) — un jeton volé ne suffit pas.
*/
export async function DELETE(req, { params }) {
  const { idEntreprise } = await params;
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (
      payload.typeUtilisateur !== 'Entreprise' ||
      parseInt(payload.idEntreprise) !== parseInt(idEntreprise)
    ) {
      return NextResponse.json(
        { error: 'Vous ne pouvez supprimer que votre propre compte' },
        { status: 403 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { motDePasse, confirmation, forcer } = body;

    if (confirmation !== 'SUPPRIMER') {
      return NextResponse.json(
        { error: 'Confirmation invalide : tapez SUPPRIMER en majuscules.' },
        { status: 400 }
      );
    }
    if (!motDePasse) {
      return NextResponse.json({ error: 'Mot de passe requis' }, { status: 400 });
    }

    // === Vérification du mot de passe ===
    const compte = await client.query(
      `SELECT u."idUtilisateur", u."motDePasse"
       FROM entreprise e
       INNER JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
       WHERE e."idEntreprise" = $1`,
      [idEntreprise]
    );

    if (compte.rows.length === 0) {
      return NextResponse.json({ error: 'Entreprise introuvable' }, { status: 404 });
    }

    const { idUtilisateur, motDePasse: hash } = compte.rows[0];

    const motDePasseValide = await bcrypt.compare(motDePasse, hash || '');
    if (!motDePasseValide) {
      // 401 et non 403 : ce n'est pas le droit qui manque, c'est la preuve d'identité
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    /* === Garde-fou ===
       Contrairement à l'étudiant, une entreprise engage des tiers : des
       candidats attendent une réponse, des stagiaires sont en poste. On
       compte les trois cas pour dire précisément ce qui sera perdu, puis
       on exige un second clic explicite. */
    const engagements = await client.query(`
      SELECT
        COUNT(DISTINCT o."idOffre") FILTER (WHERE o."statut" = 'Active') AS "offresActives",
        COUNT(c."idCandidature") FILTER (WHERE c."statut" = 'Recruté')   AS "stagiaires",
        COUNT(c."idCandidature") FILTER (WHERE c."statut" NOT IN ('Recruté', 'Refusé')) AS "enAttente"
      FROM offre o
      LEFT JOIN "Candidature" c ON c."idOffre" = o."idOffre"
      WHERE o."idEntreprise" = $1
    `, [idEntreprise]);

    const { offresActives, stagiaires, enAttente } = engagements.rows[0];
    const aDesEngagements =
      Number(offresActives) > 0 || Number(stagiaires) > 0 || Number(enAttente) > 0;

    if (aDesEngagements && forcer !== true) {
      const details = [];
      if (Number(offresActives) > 0) {
        details.push(`${offresActives} offre${Number(offresActives) > 1 ? 's' : ''} active${Number(offresActives) > 1 ? 's' : ''}`);
      }
      if (Number(enAttente) > 0) {
        details.push(`${enAttente} candidature${Number(enAttente) > 1 ? 's' : ''} sans réponse`);
      }
      if (Number(stagiaires) > 0) {
        details.push(`${stagiaires} stagiaire${Number(stagiaires) > 1 ? 's' : ''} recruté${Number(stagiaires) > 1 ? 's' : ''}`);
      }

      return NextResponse.json(
        {
          error: `Votre compte a encore ${details.join(', ')}. Ces éléments seront définitivement perdus et les étudiants concernés ne verront plus leur candidature.`,
          code: 'ENGAGEMENTS_EN_COURS'
        },
        { status: 409 }
      );
    }

    /* Chemin du logo relevé AVANT la suppression. Si tu stockes le logo
       en data-URI dans la colonne (ce que fait entrepriseModifierProfil),
       il n'y a aucun fichier sur disque et le nettoyage plus bas ne fera
       rien — c'est déjà géré par le test sur « data: ». */
    let logo = null;
    try {
      const r = await client.query(
        `SELECT "logo" FROM entreprise WHERE "idEntreprise" = $1`,
        [idEntreprise]
      );
      logo = r.rows[0]?.logo || null;
    } catch {
      // colonne absente : rien à nettoyer
    }

    // === Suppression en transaction ===
    await client.query('BEGIN');

    /* Les enfants d'abord, sinon les clés étrangères refusent.
       Tout ce qui pend aux offres part avant les offres elles-mêmes.

       Chaque table passe par un SAVEPOINT : si l'une n'existe pas sous
       ce nom dans ton schéma (42P01), on l'ignore au lieu de faire
       échouer toute la transaction. Toute autre erreur remonte. */
    const sousRequeteOffres = `SELECT "idOffre" FROM offre WHERE "idEntreprise" = $1`;

    const tablesLiees = [
      // Candidatures reçues sur les offres de cette entreprise
      { sql: `DELETE FROM "Candidature" WHERE "idOffre" IN (${sousRequeteOffres})`, valeur: idEntreprise },
      // QCM rattachés aux offres — adapte les noms à ton schéma
      { sql: `DELETE FROM "ReponseQCM" WHERE "idQuestionQCM" IN (SELECT "idQuestionQCM" FROM "QuestionQCM" WHERE "idOffre" IN (${sousRequeteOffres}))`, valeur: idEntreprise },
      { sql: `DELETE FROM "QuestionQCM" WHERE "idOffre" IN (${sousRequeteOffres})`, valeur: idEntreprise },
      // Compétences exigées par les offres
      { sql: `DELETE FROM "CompetenceOffre" WHERE "idOffre" IN (${sousRequeteOffres})`, valeur: idEntreprise },
      // Les offres elles-mêmes
      { sql: `DELETE FROM offre WHERE "idEntreprise" = $1`, valeur: idEntreprise },
      // Rattachés à l'utilisateur, pas à l'entreprise
      { sql: `DELETE FROM message WHERE "idExpediteur" = $1 OR "idDestinataire" = $1`, valeur: idUtilisateur },
      { sql: `DELETE FROM notification WHERE "idUtilisateur" = $1`, valeur: idUtilisateur },
    ];

    for (const t of tablesLiees) {
      await client.query('SAVEPOINT sp_suppression');
      try {
        await client.query(t.sql, [t.valeur]);
        await client.query('RELEASE SAVEPOINT sp_suppression');
      } catch (e) {
        await client.query('ROLLBACK TO SAVEPOINT sp_suppression');
        if (e.code !== '42P01') throw e; // 42P01 = relation inexistante
        console.warn('Table absente du schéma, ignorée :', t.sql);
      }
    }

    // Le cœur : aucune tolérance ici, ces deux lignes doivent partir
    await client.query(`DELETE FROM entreprise WHERE "idEntreprise" = $1`, [idEntreprise]);
    await client.query(`DELETE FROM utilisateur WHERE "idUtilisateur" = $1`, [idUtilisateur]);

    await client.query('COMMIT');

    /* Fichier physique : hors transaction. Un échec d'unlink ne doit pas
       ressusciter un compte déjà effacé en base. On ne touche qu'à un
       vrai chemin : un logo en data-URI n'en est pas un. */
    if (logo && !logo.startsWith('data:') && !logo.startsWith('http')) {
      await fs.unlink(logo).catch(() => {});
    }

    return NextResponse.json(
      { message: 'Compte supprimé définitivement' },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur suppression compte entreprise:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}