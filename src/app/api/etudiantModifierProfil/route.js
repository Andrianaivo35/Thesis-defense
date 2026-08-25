import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   HELPER : trouver ou créer une compétence dans le référentiel

   L'étudiant saisit librement le nom de sa compétence. On cherche
   d'abord une correspondance insensible à la casse et aux accents.
   Si rien ne correspond, la compétence est ajoutée au référentiel :
   celui-ci s'enrichit au fil des inscriptions, tout en gardant une
   seule ligne par compétence réelle.
   ===================================================================== */
async function trouverOuCreerCompetence(client, nomSaisi, categorie = null) {
  const nom = (nomSaisi || '').trim();
  if (!nom) return null;

  // Recherche insensible à la casse et aux accents
  const existante = await client.query(`
    SELECT "idCompetenceReference"
    FROM "CompetenceReference"
    WHERE LOWER(
      translate("nomCompetenceReference",
        'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ',
        'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC')
    ) = LOWER(
      translate($1,
        'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ',
        'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC')
    )
    LIMIT 1
  `, [nom]);

  if (existante.rows.length > 0) {
    return existante.rows[0].idCompetenceReference;
  }

  // Création dans le référentiel
  const creee = await client.query(`
    INSERT INTO "CompetenceReference"
      ("nomCompetenceReference", "categorieCompetenceReference", "description")
    VALUES ($1, $2, NULL)
    ON CONFLICT ("nomCompetenceReference") DO UPDATE
      SET "nomCompetenceReference" = EXCLUDED."nomCompetenceReference"
    RETURNING "idCompetenceReference"
  `, [nom, categorie?.trim() || 'Autre']);

  return creee.rows[0].idCompetenceReference;
}

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
    return NextResponse.json({ error: 'Erreur serveur', details: error.message }, { status: 500 });
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
      matricule, filiere, specialisation, niveauAcademique, nomUniversite,
      preferenceStage,
      parcoursActions,
      interetsActions,
      competencesActions
    } = body;

    await client.query('BEGIN');

    // === 1. Mise à jour table etudiant ===
    let idUniversiteMatched = null;
    if (nomUniversite && nomUniversite.trim() !== '') {
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
        "nomUniversiteSaisi" = COALESCE($13, "nomUniversiteSaisi")
      WHERE "idEtudiant" = $14
    `, [
      nomEtudiant, prenomEtudiant, telephoneEtudiant, genre, adresse,
      photoProfil || null, bio || null,
      matricule, filiere, specialisation, niveauAcademique,
      idUniversiteMatched, nomUniversite?.trim() || null,
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

    // === 5. Compétences ===
    // Le front envoie le NOM saisi : on le résout en identifiant,
    // en créant la compétence dans le référentiel si elle est nouvelle.
    if (Array.isArray(competencesActions)) {
      for (const a of competencesActions) {

        if (a.action === 'create' && a.data?.nomCompetence?.trim()) {
          const idRef = await trouverOuCreerCompetence(
            client, a.data.nomCompetence, a.data.categorie
          );
          if (!idRef) continue;

          await client.query(`
            INSERT INTO "CompetenceEtudiant" (
              "idEtudiant", "idCompetenceReference", "niveau"
            ) VALUES ($1, $2, $3)
            ON CONFLICT ("idEtudiant", "idCompetenceReference") DO UPDATE
              SET "niveau" = EXCLUDED."niveau"
          `, [idEtudiant, idRef, a.data.niveau || 'Débutant']);

        } else if (a.action === 'update' && a.id && a.data?.nomCompetence?.trim()) {
          const idRef = await trouverOuCreerCompetence(
            client, a.data.nomCompetence, a.data.categorie
          );
          if (!idRef) continue;

          /* Si la nouvelle compétence est déjà déclarée sur une autre ligne,
             on supprime la ligne courante plutôt que de violer la contrainte
             d'unicité. */
          const doublon = await client.query(`
            SELECT "idCompetenceEtudiant" FROM "CompetenceEtudiant"
            WHERE "idEtudiant" = $1 AND "idCompetenceReference" = $2
              AND "idCompetenceEtudiant" <> $3
          `, [idEtudiant, idRef, a.id]);

          if (doublon.rows.length > 0) {
            await client.query(`
              DELETE FROM "CompetenceEtudiant"
              WHERE "idCompetenceEtudiant" = $1 AND "idEtudiant" = $2
            `, [a.id, idEtudiant]);
          } else {
            await client.query(`
              UPDATE "CompetenceEtudiant" SET
                "idCompetenceReference" = $1, "niveau" = $2
              WHERE "idCompetenceEtudiant" = $3 AND "idEtudiant" = $4
            `, [idRef, a.data.niveau || 'Débutant', a.id, idEtudiant]);
          }

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
      { error: 'Erreur lors de la mise à jour', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}