import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { obtenirMatrice } from '@/lib/cooccurrence';
import { evaluerCouple, SEUIL_MINIMUM_APPARIEMENT } from '@/lib/appariement';

/* =====================================================================
   GET : candidats recommandés pour une offre

   Sens inverse de /api/recommandations. Le moteur ne fonctionnait que
   dans un seul sens : un étudiant recevait des offres, mais une
   entreprise n'avait aucun moyen de savoir quels profils correspondaient
   aux siennes — `rechercheCandidat` se contentait de lister tous les
   étudiants par ordre alphabétique.

   Point essentiel : cette route **n'implémente aucun calcul**. Elle
   réutilise `evaluerCouple` de lib/appariement, exactement comme la
   route étudiante. Deux implémentations parallèles divergeraient
   inévitablement, et l'étudiant comme l'entreprise verraient alors des
   scores différents pour un même couple.

   Seuls les candidats ayant explicitement rendu leur profil actif sont
   considérés.
   ===================================================================== */

const NOMBRE_MAX = 20;

export async function GET(req, { params }) {
  const client = await pool.connect();

  try {
    const { idOffre } = await params;

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    /* L'offre doit appartenir à l'entreprise connectée : sans ce
       contrôle, n'importe quelle entreprise pourrait obtenir le
       classement des candidats d'une offre concurrente. */
    const offreResult = await client.query(`
      SELECT o.*
      FROM offre o
      WHERE o."idOffre" = $1 AND o."idEntreprise" = $2
    `, [idOffre, payload.idEntreprise]);

    if (offreResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Offre introuvable ou ne vous appartient pas" },
        { status: 404 }
      );
    }
    const offre = offreResult.rows[0];

    // Compétences exigées par l'offre
    const competencesOffreResult = await client.query(`
      SELECT co."idCompetenceReference", co."niveauSouhaitee", co."estObligatoire",
             cr."nomCompetenceReference"
      FROM "CompetenceOffre" co
      INNER JOIN "CompetenceReference" cr
        ON cr."idCompetenceReference" = co."idCompetenceReference"
      WHERE co."idOffre" = $1
    `, [idOffre]);
    const competencesOffre = competencesOffreResult.rows;

    /* Candidats : étudiants actifs, hors ceux ayant déjà postulé — leur
       dossier figure déjà dans l'écran des candidatures. */
    const etudiantsResult = await client.query(`
      SELECT
        e."idEtudiant", e."nomEtudiant", e."prenomEtudiant", e."photoProfil",
        e."filiere", e."specialisation", e."niveauAcademique", e."bio",
        e."idUniversite", u."idUtilisateur",
        univ."nomUniversite", univ."sigleUniversitaire"
      FROM etudiant e
      INNER JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
      LEFT JOIN universite univ ON univ."idUniversite" = e."idUniversite"
      WHERE e."estActif" = true
        AND NOT EXISTS (
          SELECT 1 FROM "Candidature" c
          WHERE c."idEtudiant" = e."idEtudiant" AND c."idOffre" = $1
        )
    `, [idOffre]);
    const etudiants = etudiantsResult.rows;

    if (etudiants.length === 0) {
      return NextResponse.json(
        { offre, candidats: [], total: 0 },
        { status: 200 }
      );
    }

    const ids = etudiants.map(e => e.idEtudiant);

    // Compétences, préférences et centres d'intérêt, en trois requêtes
    const [competences, preferences, interets] = await Promise.all([
      client.query(`
        SELECT ce."idEtudiant", ce."idCompetenceReference", ce."niveau",
               cr."nomCompetenceReference"
        FROM "CompetenceEtudiant" ce
        INNER JOIN "CompetenceReference" cr
          ON cr."idCompetenceReference" = ce."idCompetenceReference"
        WHERE ce."idEtudiant" = ANY($1::int[])
      `, [ids]),
      client.query(`SELECT * FROM "preference-stage" WHERE "idEtudiant" = ANY($1::int[])`, [ids]),
      client.query(`
        SELECT "idEtudiant", "domaineInteret", "missionPreferee"
        FROM "centre-interet" WHERE "idEtudiant" = ANY($1::int[])
      `, [ids])
    ]);

    const grouper = (lignes) => {
      const carte = new Map();
      for (const l of lignes) {
        const cle = String(l.idEtudiant);
        if (!carte.has(cle)) carte.set(cle, []);
        carte.get(cle).push(l);
      }
      return carte;
    };
    const competencesParEtudiant = grouper(competences.rows);
    const interetsParEtudiant = grouper(interets.rows);
    const preferenceParEtudiant = new Map(
      preferences.rows.map(p => [String(p.idEtudiant), p])
    );

    let matrice = null;
    try {
      matrice = await obtenirMatrice(client);
    } catch (erreurMatrice) {
      console.error('Matrice de co-occurrence indisponible :', erreurMatrice.message);
    }

    /* Évaluation : même fonction que le sens étudiant → offres. */
    const evalues = etudiants.map(etudiant => {
      const cle = String(etudiant.idEtudiant);
      const resultat = evaluerCouple({
        offre,
        etudiant,
        competencesOffre,
        competencesEtudiant: competencesParEtudiant.get(cle) || [],
        preference: preferenceParEtudiant.get(cle) || null,
        centresInteret: interetsParEtudiant.get(cle) || [],
        matrice
      });

      // Le mot de passe et l'e-mail ne sont jamais exposés ici
      const { idUtilisateur, ...profil } = etudiant;
      return {
        ...profil,
        idUtilisateurEtudiant: idUtilisateur,
        score: resultat.global,
        detailScores: resultat.scores,
        raisons: resultat.raisons
      };
    });

    const retenus = evalues
      .filter(c => c.score >= SEUIL_MINIMUM_APPARIEMENT)
      .sort((a, b) => b.score - a.score)
      .slice(0, NOMBRE_MAX);

    return NextResponse.json({
      offre: {
        idOffre: offre.idOffre,
        titre: offre.titre,
        domaine: offre.domaine,
        ville: offre.ville,
        niveauRequis: offre.niveauRequis
      },
      competencesExigees: competencesOffre.map(c => ({
        nom: c.nomCompetenceReference,
        niveauSouhaitee: c.niveauSouhaitee,
        estObligatoire: c.estObligatoire
      })),
      candidats: retenus,
      total: retenus.length,
      candidatsEvalues: evalues.length
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur candidats pour offre:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
