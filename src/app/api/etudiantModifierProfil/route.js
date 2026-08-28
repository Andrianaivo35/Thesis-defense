import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

// === GET : récupérer toutes les infos modifiables de l'étudiant connecté ===
export async function GET(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;

    const etudiantResult = await client.query(`
      SELECT 
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant",
        e."telephoneEtudiant", e."genre", e."adresse",
        e."photoProfil", e."bio",
        e."matricule", e."filiere", e."specialisation", e."niveauAcademique",
        e."idUniversite", e."nomUniversiteSaisi",
        e."statutRattachement",
        univ."nomUniversite"
      FROM etudiant e
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      WHERE e."idEtudiant" = $1
    `, [idEtudiant]);

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }

    const prefResult = await client.query(`
      SELECT * FROM "preference-stage" WHERE "idEtudiant" = $1
    `, [idEtudiant]);

    const parcoursResult = await client.query(`
      SELECT * FROM "parcours-realisation" 
      WHERE "idEtudiant" = $1 
      ORDER BY "idParcoursRealisation" ASC
    `, [idEtudiant]);

    const interetsResult = await client.query(`
      SELECT * FROM "centre-interet" 
      WHERE "idEtudiant" = $1
      ORDER BY "idCentreInteret" ASC
    `, [idEtudiant]);

    const competencesResult = await client.query(`
      SELECT
        ce."idCompetenceEtudiant",
        ce."idCompetenceReference",
        ce."niveau",
        ce."dateAjout",
        cr."nomCompetenceReference",
        cr."categorieCompetenceReference"
      FROM "CompetenceEtudiant" ce
      JOIN "CompetenceReference" cr
        ON cr."idCompetenceReference" = ce."idCompetenceReference"
      WHERE ce."idEtudiant" = $1
      ORDER BY cr."categorieCompetenceReference" ASC, cr."nomCompetenceReference" ASC
    `, [idEtudiant]);

    return NextResponse.json({
      etudiant: etudiantResult.rows[0],
      preferenceStage: prefResult.rows[0] || null,
      parcours: parcoursResult.rows,
      centresInteret: interetsResult.rows,
      competences: competencesResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET etudiantModifierProfil:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}

// === PATCH : sauvegarder les modifications ===
export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Etudiant') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEtudiant = payload.idEtudiant;
    const body = await req.json();
    const {
      nomEtudiant, prenomEtudiant, telephoneEtudiant, genre, adresse,
      photoProfil, bio,
      matricule, filiere, specialisation, niveauAcademique,
      nomUniversite, idUniversite,
      preferenceStage,
      parcoursActions,
      interetsActions,
      competencesActions
    } = body;

    await client.query('BEGIN');

    /* === 1. Rattachement à une université ===
       Priorité à l'identifiant choisi dans la liste ; le rapprochement par
       nom ne sert que de repli lorsque l'étudiant a saisi librement le nom
       d'un établissement pas encore inscrit. */
    let idUniversiteMatched = null;

    if (idUniversite) {
      const choisie = await client.query(
        'SELECT "idUniversite" FROM universite WHERE "idUniversite" = $1',
        [parseInt(idUniversite, 10)]
      );
      if (choisie.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: 'Université introuvable' }, { status: 400 });
      }
      idUniversiteMatched = choisie.rows[0].idUniversite;
    } else if (nomUniversite && nomUniversite.trim() !== '') {
      const { normalizeName } = await import('@/lib/normalize');
      const nomNormalise = normalizeName(nomUniversite);
      const matchResult = await client.query(`
        SELECT "idUniversite" FROM universite
        WHERE LOWER(
          regexp_replace(
            translate("nomUniversite", 'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ', 'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC'),
            '[^a-zA-Z0-9]+', ' ', 'g'
          )
        ) = $1
      `, [nomNormalise]);
      idUniversiteMatched = matchResult.rows[0]?.idUniversite || null;
    }

    /* Changer d'université remet le rattachement en attente : c'est au
       nouvel établissement de confirmer. Le statut n'est pas touché si
       l'étudiant reste dans la même université. */
    const rattachementActuel = await client.query(
      'SELECT "idUniversite" FROM etudiant WHERE "idEtudiant" = $1',
      [idEtudiant]
    );
    const ancienIdUniversite = rattachementActuel.rows[0]?.idUniversite || null;
    const universiteChangee =
      idUniversiteMatched !== null &&
      String(idUniversiteMatched) !== String(ancienIdUniversite);

    await client.query(`
      UPDATE etudiant SET
        "nomEtudiant" = COALESCE($1, "nomEtudiant"),
        "prenomEtudiant" = COALESCE($2, "prenomEtudiant"),
        "telephoneEtudiant" = COALESCE($3, "telephoneEtudiant"),
        "genre" = COALESCE($4, "genre"),
        "adresse" = COALESCE($5, "adresse"),
        "photoProfil" = $6,
        "bio" = $7,
        "matricule" = COALESCE($8, "matricule"),
        "filiere" = COALESCE($9, "filiere"),
        "specialisation" = COALESCE($10, "specialisation"),
        "niveauAcademique" = COALESCE($11, "niveauAcademique"),
        "idUniversite" = COALESCE($12, "idUniversite"),
        "nomUniversiteSaisi" = COALESCE($13, "nomUniversiteSaisi"),
        "statutRattachement" = CASE WHEN $14 THEN 'En attente' ELSE "statutRattachement" END,
        "dateRattachement" = CASE WHEN $14 THEN now() ELSE "dateRattachement" END
      WHERE "idEtudiant" = $15
    `, [
      nomEtudiant, prenomEtudiant, telephoneEtudiant, genre, adresse,
      photoProfil || null, bio || null,
      matricule, filiere, specialisation, niveauAcademique,
      idUniversiteMatched, nomUniversite?.trim() || null,
      universiteChangee,
      idEtudiant
    ]);

    // === 2. Préférences de stage ===
    if (preferenceStage) {
      const p = preferenceStage;
      await client.query(`
        UPDATE "preference-stage" SET
          "villePreferee" = $1,
          "accepteTeletravail" = $2,
          "rayonDeplacement" = $3,
          "mobiliteNational" = $4,
          "typeStagePreferee" = $5,
          "dureeSouhaitee" = $6,
          "dateDebutDisponibilite" = $7,
          "dateFinDisponibilite" = $8,
          "typeEntreprisePreferee" = $9,
          "disponibiliteImmediate" = $10
        WHERE "idEtudiant" = $11
      `, [
        p.villePreferee, p.accepteTeletravail, p.rayonDeplacement,
        p.mobiliteNational === 'true' || p.mobiliteNational === true,
        p.typeStagePreferee, p.dureeSouhaitee,
        p.dateDebutDisponibilite || null, p.dateFinDisponibilite || null,
        p.typeEntreprisePreferee,
        p.disponibiliteImmediate === 'true' || p.disponibiliteImmediate === true,
        idEtudiant
      ]);
    }

    // === 3. Parcours ===
    if (Array.isArray(parcoursActions)) {
      for (const a of parcoursActions) {
        if (a.action === 'create' && a.data?.titrePoste?.trim()) {
          await client.query(`
            INSERT INTO "parcours-realisation" (
              "idEtudiant", "type", "titre", "description",
              "entreprise", "dateDebut", "dateFin", "lien"
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
          `, [
            idEtudiant, a.data.type || '', a.data.titrePoste.trim(),
            a.data.description || '', a.data.entreprise || '',
            a.data.dateDebut || null, a.data.dateFin || null,
            a.data.lien || ''
          ]);
        } else if (a.action === 'update' && a.id) {
          await client.query(`
            UPDATE "parcours-realisation" SET
              "type" = $1, "titre" = $2, "description" = $3,
              "entreprise" = $4, "dateDebut" = $5, "dateFin" = $6, "lien" = $7
            WHERE "idParcoursRealisation" = $8 AND "idEtudiant" = $9
          `, [
            a.data.type || '', a.data.titrePoste, a.data.description || '',
            a.data.entreprise || '', a.data.dateDebut || null,
            a.data.dateFin || null, a.data.lien || '',
            a.id, idEtudiant
          ]);
        } else if (a.action === 'delete' && a.id) {
          await client.query(`
            DELETE FROM "parcours-realisation"
            WHERE "idParcoursRealisation" = $1 AND "idEtudiant" = $2
          `, [a.id, idEtudiant]);
        }
      }
    }

    // === 4. Centres d'intérêt ===
    if (Array.isArray(interetsActions)) {
      for (const a of interetsActions) {
        if (a.action === 'create' && a.data?.domaine?.trim()) {
          await client.query(`
            INSERT INTO "centre-interet" (
              "idEtudiant", "domaineInteret", "missionPreferee"
            ) VALUES ($1, $2, $3)
          `, [idEtudiant, a.data.domaine.trim(), a.data.mission || '']);
        } else if (a.action === 'update' && a.id) {
          await client.query(`
            UPDATE "centre-interet" SET
              "domaineInteret" = $1, "missionPreferee" = $2
            WHERE "idCentreInteret" = $3 AND "idEtudiant" = $4
          `, [a.data.domaine, a.data.mission || '', a.id, idEtudiant]);
        } else if (a.action === 'delete' && a.id) {
          await client.query(`
            DELETE FROM "centre-interet"
            WHERE "idCentreInteret" = $1 AND "idEtudiant" = $2
          `, [a.id, idEtudiant]);
        }
      }
    }

    /* === 5. Compétences ===
       Le formulaire envoie l'identifiant du référentiel, plus un nom saisi
       librement. La création à la volée a été supprimée : elle permettait
       d'introduire des doublons ("JavaScript", "Javascript", "JS") et
       rendait le référentiel inexploitable — c'est la même correction que
       celle appliquée à la création d'offre. */
    if (Array.isArray(competencesActions)) {
      for (const a of competencesActions) {

        if (a.action === 'create' && a.data?.idCompetenceReference) {
          const idRef = parseInt(a.data.idCompetenceReference, 10);
          if (!idRef || isNaN(idRef)) continue;

          const existe = await client.query(
            'SELECT 1 FROM "CompetenceReference" WHERE "idCompetenceReference" = $1',
            [idRef]
          );
          if (existe.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
              { error: 'Compétence inconnue dans le référentiel' },
              { status: 400 }
            );
          }

          await client.query(`
            INSERT INTO "CompetenceEtudiant" (
              "idEtudiant", "idCompetenceReference", "niveau"
            ) VALUES ($1, $2, $3)
            ON CONFLICT ("idEtudiant", "idCompetenceReference") DO UPDATE
              SET "niveau" = EXCLUDED."niveau"
          `, [idEtudiant, idRef, a.data.niveau || 'Débutant']);

        } else if (a.action === 'update' && a.id) {
          /* Seul le niveau de maîtrise est modifiable : changer la
             compétence elle-même revient à en supprimer une et en ajouter
             une autre. */
          await client.query(`
            UPDATE "CompetenceEtudiant" SET "niveau" = $1
            WHERE "idCompetenceEtudiant" = $2 AND "idEtudiant" = $3
          `, [a.data?.niveau || 'Débutant', a.id, idEtudiant]);

        } else if (a.action === 'delete' && a.id) {
          await client.query(`
            DELETE FROM "CompetenceEtudiant"
            WHERE "idCompetenceEtudiant" = $1 AND "idEtudiant" = $2
          `, [a.id, idEtudiant]);
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    }, { status: 200 });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur PATCH etudiantModifierProfil:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}