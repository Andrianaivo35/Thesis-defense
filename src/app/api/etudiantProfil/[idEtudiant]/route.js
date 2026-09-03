import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

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