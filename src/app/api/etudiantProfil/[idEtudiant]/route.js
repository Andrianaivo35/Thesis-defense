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
      preferenceStage: preferenceResult.rows[0] || null,
      parcours: parcoursResult.rows,
      centresInteret: centresResult.rows,
      stageRecrute: stageResult.rows[0] || null
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