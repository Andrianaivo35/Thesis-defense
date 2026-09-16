import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import fs from 'fs/promises';

export async function GET(req, { params }) {
  const { idEtudiant } = await params;
  const client = await pool.connect();

  try {
    // === Auth : entreprise, université OU l'étudiant lui-même ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Cas 1 : étudiant consultant son propre profil
    if (payload.typeUtilisateur === 'Etudiant') {
      if (parseInt(payload.idEtudiant) !== parseInt(idEtudiant)) {
        return NextResponse.json(
          { error: 'Vous ne pouvez consulter que votre propre profil' },
          { status: 403 }
        );
      }
      // OK : l'étudiant consulte son propre profil, on continue
    }
    // Cas 2 : entreprise ou université
    else if (payload.typeUtilisateur === 'Entreprise' || payload.typeUtilisateur === 'Universite') {
      // Si université : vérifier que l'étudiant lui appartient
      if (payload.typeUtilisateur === 'Universite') {
        const check = await client.query(
          `SELECT 1 FROM etudiant WHERE "idEtudiant" = $1 AND "idUniversite" = $2`,
          [idEtudiant, payload.idUniversite]
        );
        if (check.rows.length === 0) {
          return NextResponse.json(
            { error: "Cet étudiant ne fait pas partie de votre université" },
            { status: 403 }
          );
        }
      }
      // Entreprise : accès libre (recherche candidat)
    }
    else {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // === Infos étudiant ===
    const etudiantResult = await client.query(`
      SELECT 
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."telephoneEtudiant",
        e."genre",
        e."adresse",
        e."photoProfil",
        e."bio",
        e."matricule",
        e."filiere",
        e."specialisation",
        e."niveauAcademique",
        e."dateInscription",
        e."estActif",
        u."emailUtilisateur",
        u."idUtilisateur",
        e."statutRattachement",
        e."dateFinRattachement",
        /* Un SORTI n'affiche plus son établissement : le rattachement
           est rompu, et laisser le nom donnerait à croire qu'il en fait
           encore partie. Il reste en base pour l'historique et pour
           pouvoir revenir sur une décision, pas pour être montré.

           Un DIPLÔMÉ le conserve — l'interface l'annonce en « ancien
           étudiant de X », ce qui est l'information juste et reste utile
           à une entreprise. */
        CASE WHEN e."statutRattachement" = 'Sorti' THEN NULL
             ELSE univ."nomUniversite" END AS "nomUniversite",
        CASE WHEN e."statutRattachement" = 'Sorti' THEN NULL
             ELSE univ."sigleUniversitaire" END AS "sigleUniversitaire"
      FROM etudiant e
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      WHERE e."idEtudiant" = $1
    `, [idEtudiant]);

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }

    // === Compétences ===
    // Section absente jusqu'ici : les compétences confirmées depuis un CV
    // (appliquerDecisions, lib/ingestionCV.js) ou ajoutées à la main
    // s'écrivent bien dans CompetenceEtudiant, mais cette page ne les a
    // jamais lues — l'étudiant les ajoute, puis ne les revoit nulle part.
    const competencesResult = await client.query(`
      SELECT
        ce."idCompetenceEtudiant",
        ce."niveau",
        cr."nomCompetenceReference",
        cr."categorieCompetenceReference"
      FROM "CompetenceEtudiant" ce
      INNER JOIN "CompetenceReference" cr
        ON cr."idCompetenceReference" = ce."idCompetenceReference"
      WHERE ce."idEtudiant" = $1
      ORDER BY cr."categorieCompetenceReference" ASC NULLS LAST, cr."nomCompetenceReference" ASC
    `, [idEtudiant]);

    // === Préférences de stage ===
    const preferenceResult = await client.query(
      `SELECT * FROM "preference-stage" WHERE "idEtudiant" = $1`,
      [idEtudiant]
    );

    // === Parcours et réalisations ===
    const parcoursResult = await client.query(
      `SELECT * FROM "parcours-realisation" 
       WHERE "idEtudiant" = $1 
       ORDER BY "dateDebut" DESC NULLS LAST`,
      [idEtudiant]
    );

    // === Centres d'intérêt ===
    const centresResult = await client.query(
      `SELECT * FROM "centre-interet" WHERE "idEtudiant" = $1`,
      [idEtudiant]
    );

    /* === CV : uniquement quand le lien existe déjà ===
       L'étudiant voit toujours son propre CV. Une entreprise ne le voit que
       si elle a réellement reçu ce CV via une candidature (pas la simple
       consultation d'un profil parcouru dans le répertoire) — même règle
       que /api/fichier/cv/[id]. Une université le voit pour ses étudiants
       rattachés (Valide/Diplome), même règle également. */
    let cv = null;
    if (payload.typeUtilisateur === 'Etudiant') {
      const r = await client.query(`
        SELECT "idCV", "libelle", "nomFichierOriginal"
        FROM "CV" WHERE "idEtudiant" = $1
        ORDER BY "estPrincipal" DESC LIMIT 1
      `, [idEtudiant]);
      cv = r.rows[0] || null;
    } else if (payload.typeUtilisateur === 'Entreprise') {
      const r = await client.query(`
        SELECT cv."idCV", cv."libelle", cv."nomFichierOriginal"
        FROM "CV" cv
        WHERE cv."idEtudiant" = $1
          AND EXISTS (
            SELECT 1 FROM "Candidature" c
            INNER JOIN offre o ON o."idOffre" = c."idOffre"
            WHERE c."idCV" = cv."idCV" AND o."idEntreprise" = $2
          )
        ORDER BY cv."estPrincipal" DESC LIMIT 1
      `, [idEtudiant, payload.idEntreprise]);
      cv = r.rows[0] || null;
    } else if (payload.typeUtilisateur === 'Universite') {
      const r = await client.query(`
        SELECT cv."idCV", cv."libelle", cv."nomFichierOriginal"
        FROM "CV" cv
        INNER JOIN etudiant e2 ON e2."idEtudiant" = cv."idEtudiant"
        WHERE cv."idEtudiant" = $1
          AND e2."idUniversite" = $2
          AND e2."statutRattachement" IN ('Valide', 'Diplome')
        ORDER BY cv."estPrincipal" DESC LIMIT 1
      `, [idEtudiant, payload.idUniversite]);
      cv = r.rows[0] || null;
    }

    // === Stage en cours (candidature recrutée) ===
    const stageResult = await client.query(`
      SELECT 
        c."idCandidature",
        c."dateCandidature",
        o."titre" AS "posteOffre",
        o."duree",
        o."typeStage",
        o."dateDebut",
        o."dateFin",
        o."lieu",
        o."ville",
        ent."idEntreprise",
        ent."nomEntreprise",
        ent."logo" AS "logoEntreprise"
      FROM "Candidature" c
      INNER JOIN offre o ON c."idOffre" = o."idOffre"
      INNER JOIN entreprise ent ON o."idEntreprise" = ent."idEntreprise"
      WHERE c."idEtudiant" = $1 AND c."statut" = 'Recruté'
      ORDER BY c."dateCandidature" DESC
      LIMIT 1
    `, [idEtudiant]);

    return NextResponse.json({
      etudiant: etudiantResult.rows[0],
      competences: competencesResult.rows,
      preferenceStage: preferenceResult.rows[0] || null,
      parcours: parcoursResult.rows,
      centresInteret: centresResult.rows,
      stageRecrute: stageResult.rows[0] || null,
      cv
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur profil étudiant:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}


/* ============================================================
   DELETE — suppression définitive du compte étudiant
   ============================================================
   Seul l'étudiant lui-même peut déclencher cette action : ni
   l'université ni l'entreprise n'ont ce pouvoir. Une université
   qui veut « retirer » un étudiant passe par
   statutRattachement = 'Sorti', pas par la destruction du compte.

   Deux preuves sont exigées avant d'effacer quoi que ce soit :
   le mot de passe (l'identité) et la saisie du mot SUPPRIMER
   (l'intention). Un jeton volé ne suffit donc pas.
*/
export async function DELETE(req, { params }) {
  const { idEtudiant } = await params;
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (
      payload.typeUtilisateur !== 'Etudiant' ||
      parseInt(payload.idEtudiant) !== parseInt(idEtudiant)
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
       FROM etudiant e
       INNER JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
       WHERE e."idEtudiant" = $1`,
      [idEtudiant]
    );

    if (compte.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }

    const { idUtilisateur, motDePasse: hash } = compte.rows[0];

    const motDePasseValide = await bcrypt.compare(motDePasse, hash || '');
    if (!motDePasseValide) {
      // 401 et non 403 : ce n'est pas le droit qui manque, c'est la preuve d'identité
      return NextResponse.json({ error: 'Mot de passe incorrect' }, { status: 401 });
    }

    /* === Garde-fou : stage en cours ===
       Un étudiant recruté a un engagement vivant côté entreprise.
       On ne bloque pas définitivement — c'est son compte — mais on
       l'avertit et on exige un second clic explicite (forcer). */
    const stage = await client.query(
      `SELECT 1 FROM "Candidature"
       WHERE "idEtudiant" = $1 AND "statut" = 'Recruté' LIMIT 1`,
      [idEtudiant]
    );
    if (stage.rows.length > 0 && forcer !== true) {
      return NextResponse.json(
        {
          error:
            "Vous avez un stage en cours. L'entreprise perdra définitivement l'accès à votre dossier.",
          code: 'STAGE_EN_COURS'
        },
        { status: 409 }
      );
    }

    /* Chemins des fichiers relevés AVANT la suppression : une fois les
       lignes parties, plus moyen de savoir quoi effacer du disque.
       Le nom de colonne varie selon les projets — si le tien diffère,
       adapte ici (la requête est tolérante à son absence). */
    let fichiers = [];
    try {
      const r = await client.query(
        `SELECT "cheminFichier" FROM "CV" WHERE "idEtudiant" = $1`,
        [idEtudiant]
      );
      fichiers = r.rows;
    } catch {
      // colonne nommée autrement : on supprimera les lignes sans toucher au disque
    }

    // === Suppression en transaction ===
    await client.query('BEGIN');

    /* Les enfants d'abord, sinon les clés étrangères refusent.
       Candidature avant CV : la candidature référence le CV.

       Chaque table passe par un SAVEPOINT : si l'une d'elles n'existe
       pas sous ce nom dans ton schéma (42P01), on l'ignore au lieu de
       faire échouer toute la transaction. Toute autre erreur remonte. */
    const tablesLiees = [
      { sql: `DELETE FROM "Candidature" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      { sql: `DELETE FROM "CV" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      { sql: `DELETE FROM "CompetenceEtudiant" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      { sql: `DELETE FROM "preference-stage" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      { sql: `DELETE FROM "parcours-realisation" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      { sql: `DELETE FROM "centre-interet" WHERE "idEtudiant" = $1`, valeur: idEtudiant },
      // Rattachés à l'utilisateur, pas à l'étudiant — adapte les noms si besoin
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
    await client.query(`DELETE FROM etudiant WHERE "idEtudiant" = $1`, [idEtudiant]);
    await client.query(`DELETE FROM utilisateur WHERE "idUtilisateur" = $1`, [idUtilisateur]);

    await client.query('COMMIT');

    /* Fichiers physiques : hors transaction. Un échec d'unlink ne doit
       pas ressusciter un compte déjà effacé en base. */
    for (const f of fichiers) {
      if (f.cheminFichier) {
        await fs.unlink(f.cheminFichier).catch(() => {});
      }
    }

    return NextResponse.json(
      { message: 'Compte supprimé définitivement' },
      { status: 200 }
    );

  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Erreur suppression compte étudiant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}