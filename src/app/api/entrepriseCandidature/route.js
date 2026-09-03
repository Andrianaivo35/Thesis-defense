import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { evaluerCouple } from '@/lib/appariement';
import { obtenirMatrice } from '@/lib/cooccurrence';

export async function GET(req) {
  const client = await pool.connect();

  try {
    // === Auth ===
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Entreprise') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const idEntreprise = payload.idEntreprise;

    // === Récupère uniquement les candidatures des offres de cette entreprise ===
    const result = await client.query(`
      SELECT
        c."idCandidature",
        c."dateCandidature",
        c."statut",
        c."noteQCM",
        c."idCV",
        cv."libelle" AS "libelleCv",
        cv."nomFichierOriginal" AS "nomFichierCvOriginal",
        c."nomFichierLettre",
        e."idEtudiant",
        e."nomEtudiant",
        e."prenomEtudiant",
        e."telephoneEtudiant",
        e."filiere",
        e."niveauAcademique",
        e."specialisation",
        u."emailUtilisateur",
        u."idUtilisateur" AS "idUtilisateurEtudiant",
        univ."nomUniversite",
        o."idOffre",
        o."titre" AS "titreOffre",
        o."domaine",
        o."niveauRequis",
        o."ville",
        o."accepteTeletravail",
        o."typeStage",
        o."duree",
        o."dateDebut",
        COALESCE(
          (SELECT json_agg(
              json_build_object(
                'idDocument', d."idDocument",
                'nomFichierOriginal', d."nomFichierOriginal",
                'dateAjout', d."dateAjout"
              ) ORDER BY d."dateAjout"
            )
           FROM "DocumentCandidature" d
           WHERE d."idCandidature" = c."idCandidature"),
          '[]'::json
        ) AS documents
      FROM "Candidature" c
      INNER JOIN etudiant e ON c."idEtudiant" = e."idEtudiant"
      INNER JOIN utilisateur u ON e."idUtilisateur" = u."idUtilisateur"
      LEFT JOIN universite univ ON e."idUniversite" = univ."idUniversite"
      LEFT JOIN "CV" cv ON cv."idCV" = c."idCV"
      INNER JOIN offre o ON c."idOffre" = o."idOffre"
      WHERE o."idEntreprise" = $1
      ORDER BY c."noteQCM" DESC NULLS LAST, c."dateCandidature" DESC
    `, [idEntreprise]);

    const candidatures = result.rows;

    /* === Score de pertinence CV/profil, pour les candidatures réellement
       reçues (EN4) ===

       Réutilise le moteur d'appariement existant (lib/appariement.js), déjà
       utilisé pour les suggestions de profils non postulés
       (api/offreCandidats/[idOffre]/route.js). Même fonction, même poids —
       le sous-score "compétence" (40/100, le plus élevé du barème) est celui
       alimenté par les compétences détectées dans le CV et confirmées par
       l'étudiant : c'est déjà lui qui pèse le plus dans le score global,
       sans logique nouvelle à écrire.

       Portée volontairement limitée à cette liste (candidatures déjà
       reçues) : la même fonction pourrait servir plus tard à classer des
       profils qui n'ont pas encore postulé, si le besoin se présente — se
       reporter à offreCandidats/[idOffre]/route.js qui le fait déjà pour
       les suggestions. */
    if (candidatures.length > 0) {
      const idsOffres = [...new Set(candidatures.map(c => c.idOffre))];
      const idsEtudiants = [...new Set(candidatures.map(c => c.idEtudiant))];

      const [competencesOffreResult, competencesEtudiantResult, preferencesResult, interetsResult] =
        await Promise.all([
          client.query(`
            SELECT co."idOffre", co."idCompetenceReference", co."niveauSouhaitee",
                   co."estObligatoire", cr."nomCompetenceReference"
            FROM "CompetenceOffre" co
            INNER JOIN "CompetenceReference" cr
              ON cr."idCompetenceReference" = co."idCompetenceReference"
            WHERE co."idOffre" = ANY($1::int[])
          `, [idsOffres]),
          client.query(`
            SELECT ce."idEtudiant", ce."idCompetenceReference", ce."niveau",
                   cr."nomCompetenceReference"
            FROM "CompetenceEtudiant" ce
            INNER JOIN "CompetenceReference" cr
              ON cr."idCompetenceReference" = ce."idCompetenceReference"
            WHERE ce."idEtudiant" = ANY($1::int[])
          `, [idsEtudiants]),
          client.query(`SELECT * FROM "preference-stage" WHERE "idEtudiant" = ANY($1::int[])`, [idsEtudiants]),
          client.query(`
            SELECT "idEtudiant", "domaineInteret", "missionPreferee"
            FROM "centre-interet" WHERE "idEtudiant" = ANY($1::int[])
          `, [idsEtudiants])
        ]);

      const grouper = (lignes, cleChamp) => {
        const carte = new Map();
        for (const l of lignes) {
          const cle = String(l[cleChamp]);
          if (!carte.has(cle)) carte.set(cle, []);
          carte.get(cle).push(l);
        }
        return carte;
      };
      const competencesOffreParOffre = grouper(competencesOffreResult.rows, 'idOffre');
      const competencesEtudiantParEtudiant = grouper(competencesEtudiantResult.rows, 'idEtudiant');
      const interetsParEtudiant = grouper(interetsResult.rows, 'idEtudiant');
      const preferenceParEtudiant = new Map(
        preferencesResult.rows.map(p => [String(p.idEtudiant), p])
      );

      let matrice = null;
      try {
        matrice = await obtenirMatrice(client);
      } catch (erreurMatrice) {
        console.error('Matrice de co-occurrence indisponible :', erreurMatrice.message);
      }

      for (const c of candidatures) {
        const resultat = evaluerCouple({
          offre: {
            domaine: c.domaine,
            titre: c.titreOffre,
            niveauRequis: c.niveauRequis,
            ville: c.ville,
            accepteTeletravail: c.accepteTeletravail,
            typeStage: c.typeStage,
            duree: c.duree,
            dateDebut: c.dateDebut
          },
          etudiant: {
            filiere: c.filiere,
            specialisation: c.specialisation,
            niveauAcademique: c.niveauAcademique
          },
          competencesOffre: competencesOffreParOffre.get(String(c.idOffre)) || [],
          competencesEtudiant: competencesEtudiantParEtudiant.get(String(c.idEtudiant)) || [],
          preference: preferenceParEtudiant.get(String(c.idEtudiant)) || null,
          centresInteret: interetsParEtudiant.get(String(c.idEtudiant)) || [],
          matrice
        });
        c.scorePertinence = resultat.global;
        c.raisonsPertinence = resultat.raisons;
      }
    }

    return NextResponse.json(
      { candidatures },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur candidatures entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
