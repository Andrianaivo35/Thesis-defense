import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { normalizeName } from '@/lib/normalize';

export async function POST(req) {
  const client = await pool.connect();
  const typeUtilisateur = 'Etudiant';

  try {
    const {
      idUniversite,
      nomUniversite,
      nom,
      prenom,
      email,
      adresse,
      telephone,
      sexe,
      motDePasse,
      matricule,
      niveauAcademique,
      specialisation,
      filiere,
      ville,
      rayonDeplacement,
      accepteTeletravail,
      mobiliteNational,
      typeStagePreferee,
      typeEntreprisePreferee,
      dureeSouhaitee,
      dateDebutDisponibilite,
      dateFinDisponibilite,
      disponibiliteImmediate,
      experiences,
      centresInteret,
      competences          // [{ idCompetenceReference, niveau }]
    } = await req.json();

    // === Validation de l'université ===
    // Soit un identifiant choisi dans la liste, soit un nom saisi librement.
    if (!idUniversite && (!nomUniversite || nomUniversite.trim() === '')) {
      return NextResponse.json(
        { error: 'Veuillez sélectionner votre université ou saisir son nom' },
        { status: 400 }
      );
    }

    // === Validation email ===
    if (!email || !motDePasse || !nom || !prenom) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    /* === Rattachement à une université ===
       Priorité à l'identifiant transmis par le formulaire : c'est un choix
       explicite de l'étudiant, il n'y a rien à deviner.

       Le rapprochement par nom n'intervient plus qu'en repli, lorsque
       l'étudiant a déclaré que son université n'est pas dans la liste. Il
       reste utile : si l'établissement s'inscrit plus tard sous le même nom,
       le rattachement pourra se faire. */
    let idUniversiteMatched = null;
    let nomUniversiteFinal = (nomUniversite || '').trim();

    if (idUniversite) {
      const choisie = await client.query(
        'SELECT "idUniversite", "nomUniversite" FROM universite WHERE "idUniversite" = $1',
        [parseInt(idUniversite, 10)]
      );

      if (choisie.rows.length === 0) {
        return NextResponse.json(
          { error: 'Université introuvable' },
          { status: 400 }
        );
      }

      idUniversiteMatched = choisie.rows[0].idUniversite;
      // On enregistre le nom officiel, pas une éventuelle saisie approximative
      nomUniversiteFinal = choisie.rows[0].nomUniversite;
    } else {
      const nomNormalise = normalizeName(nomUniversiteFinal);

      const matchResult = await client.query(`
        SELECT "idUniversite", "nomUniversite"
        FROM universite
        WHERE LOWER(
          regexp_replace(
            translate("nomUniversite", 'àâäéèêëîïôöùûüÿçÀÂÄÉÈÊËÎÏÔÖÙÛÜŸÇ', 'aaaeeeeiioouuuycAAAEEEEIIOOUUUYC'),
            '[^a-zA-Z0-9]+', ' ', 'g'
          )
        ) = $1
      `, [nomNormalise]);

      if (matchResult.rows.length > 0) {
        idUniversiteMatched = matchResult.rows[0].idUniversite;
        nomUniversiteFinal = matchResult.rows[0].nomUniversite;
      }
    }

    // === Vérification email AVANT la transaction ===
    const checkEmail = await client.query(
      'SELECT 1 FROM utilisateur WHERE "emailUtilisateur" = $1',
      [email]
    );

    if (checkEmail.rows.length > 0) {
      return NextResponse.json(
        { error: 'Cet email existe déjà' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(motDePasse, 10);
    const dateInscription = new Date();
    const estActif = true;

    const mobiliteNationalBool = mobiliteNational === 'true';
    const disponibiliteImmediateBool = disponibiliteImmediate === 'true';

    await client.query('BEGIN');

    // === 1. Insertion utilisateur ===
    const utilisateurResult = await client.query(
      `INSERT INTO utilisateur (
        "typeUtilisateur",
        "emailUtilisateur",
        "motDePasse"
      ) VALUES ($1, $2, $3)
      RETURNING "idUtilisateur"`,
      [typeUtilisateur, email, hashedPassword]
    );

    const idUtilisateur = utilisateurResult.rows[0].idUtilisateur;

    // === 2. Insertion etudiant ===
    const etudiantResult = await client.query(
      `INSERT INTO etudiant (
        "idUtilisateur",
        "nomEtudiant",
        "prenomEtudiant",
        "telephoneEtudiant",
        "genre",
        "adresse",
        "photoProfil",
        "bio",
        "idUniversite",
        "nomUniversiteSaisi",
        "matricule",
        "filiere",
        "specialisation",
        "niveauAcademique",
        "dateInscription",
        "estActif",
        "statutRattachement",
        "dateRattachement"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING "idEtudiant"`,
      [
        idUtilisateur,
        nom,
        prenom,
        telephone,
        sexe,
        adresse,
        null,                      // photoProfil
        null,                      // bio
        idUniversiteMatched,       // peut être NULL si université pas encore inscrite
        nomUniversiteFinal,        // nom officiel si rattachée, sinon nom saisi
        matricule,
        filiere,
        specialisation,
        niveauAcademique,
        dateInscription,
        estActif,
        // Le rattachement est une simple déclaration de l'étudiant : il reste
        // en attente tant que l'université ne l'a pas validé.
        idUniversiteMatched ? 'En attente' : null,
        idUniversiteMatched ? new Date() : null
      ]
    );

    const idEtudiant = etudiantResult.rows[0].idEtudiant;

    // === 3. Insertion preference-stage ===
    await client.query(
      `INSERT INTO "preference-stage" (
        "idEtudiant",
        "villePreferee",
        "accepteTeletravail",
        "rayonDeplacement",
        "mobiliteNational",
        "typeStagePreferee",
        "dureeSouhaitee",
        "dateDebutDisponibilite",
        "dateFinDisponibilite",
        "typeEntreprisePreferee",
        "disponibiliteImmediate"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        idEtudiant,
        ville,
        accepteTeletravail,
        rayonDeplacement,
        mobiliteNationalBool,
        typeStagePreferee,
        dureeSouhaitee,
        dateDebutDisponibilite || null,
        dateFinDisponibilite || null,
        typeEntreprisePreferee,
        disponibiliteImmediateBool
      ]
    );

    // === 4. Insertion parcours-realisation ===
    if (Array.isArray(experiences) && experiences.length > 0) {
      for (const exp of experiences) {
        if (exp.titrePoste && exp.titrePoste.trim() !== '') {
          await client.query(
            `INSERT INTO "parcours-realisation" (
              "idEtudiant",
              "type",
              "titre",
              "description",
              "entreprise",
              "dateDebut",
              "dateFin",
              "lien"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              idEtudiant,
              exp.type || '',
              exp.titrePoste.trim(),
              exp.description || '',
              exp.entreprise || '',
              exp.dateDebut || null,
              exp.dateFin || null,
              exp.lien || ''
            ]
          );
        }
      }
    }

    // === 5. Insertion centre-interet ===
    if (Array.isArray(centresInteret) && centresInteret.length > 0) {
      for (const centre of centresInteret) {
        if (centre.domaine && centre.domaine.trim() !== '') {
          await client.query(
            `INSERT INTO "centre-interet" (
              "idEtudiant",
              "domaineInteret",
              "missionPreferee"
            ) VALUES ($1, $2, $3)`,
            [idEtudiant, centre.domaine.trim(), centre.mission || '']
          );
        }
      }
    }

    // === 6. Insertion CompetenceEtudiant ===
    // ON CONFLICT : la contrainte UNIQUE évite les doublons si l'étudiant
    // a sélectionné deux fois la même compétence dans le formulaire.
    if (Array.isArray(competences) && competences.length > 0) {
      for (const comp of competences) {
        if (comp.idCompetenceReference) {
          await client.query(
            `INSERT INTO "CompetenceEtudiant" (
              "idEtudiant",
              "idCompetenceReference",
              "niveau"
            ) VALUES ($1, $2, $3)
            ON CONFLICT ("idEtudiant", "idCompetenceReference") DO NOTHING`,
            [
              idEtudiant,
              parseInt(comp.idCompetenceReference, 10),
              comp.niveau || 'Débutant'
            ]
          );
        }
      }
    }

    await client.query('COMMIT');

    return NextResponse.json(
      {
        success: true,
        message: idUniversiteMatched
          ? 'Inscription réussie ! Votre demande de rattachement a été transmise à votre université, qui doit la valider.'
          : 'Inscription réussie ! Votre université n\'est pas encore inscrite sur Stage Share : vous lui serez rattaché automatiquement dès qu\'elle créera son compte.',
        idEtudiant,
        universiteRattachee: idUniversiteMatched !== null
      },
      { status: 201 }
    );

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur complète:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de l\'inscription',
        details: error.message
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}