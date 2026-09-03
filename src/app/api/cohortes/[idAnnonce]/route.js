import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

export async function GET(req, { params }) {
  const client = await pool.connect();
  try {
    const { idAnnonce } = await params;
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || !['Entreprise', 'Admin'].includes(payload.typeUtilisateur)) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const annonceResult = await client.query(`
      SELECT 
        a.*,
        u."idUniversite", u."nomUniversite", u."sigleUniversitaire",
        u."adresseUniversite", u."ville" AS "villeUniversite",
        u."telephoneUniversite", u."siteWeb", u."logo" AS "logoUniversite",
        u."estVerifie",
        ut."idUtilisateur" AS "idUtilisateurUniversite",
        ut."emailUtilisateur" AS "emailUniversite",
        p."idPromotion", p."libelle" AS "promotionLibelle",
        p."annee" AS "promotionAnnee", p."statut" AS "promotionStatut"
      FROM "AnnonceCohorte" a
      LEFT JOIN "Promotion" p ON p."idPromotion" = a."idPromotion"
      INNER JOIN universite u ON a."idUniversite" = u."idUniversite"
      INNER JOIN utilisateur ut ON u."idUtilisateur" = ut."idUtilisateur"
      WHERE a."idAnnonceCohorte" = $1 AND a."statut" = 'Active'
    `, [idAnnonce]);

    if (annonceResult.rows.length === 0) {
      return NextResponse.json({ error: 'Annonce introuvable ou non disponible' }, { status: 404 });
    }

    /* Les étudiants de la promotion désignée, avec ce qui permet
       réellement d'agir : un identifiant de profil, des compétences, un
       CV. L'ancienne liste ne portait qu'un nom et un fichier en base64,
       sur lesquels une entreprise ne pouvait rien faire — pas même
       envoyer un message.

       L'adresse électronique n'est PAS exposée : le contact passe par la
       messagerie interne, qui laisse à l'étudiant la maîtrise de son
       adresse. */
    const annonce = annonceResult.rows[0];
    const etudiantsResult = annonce.idPromotion
      ? await client.query(`
          SELECT e."idEtudiant", e."nomEtudiant" AS "nom", e."prenomEtudiant" AS "prenom",
                 e."niveauAcademique", e."filiere", e."specialisation", e."photoProfil",
                 u."idUtilisateur", u."compteActive",
                 EXISTS (SELECT 1 FROM "CV" cv WHERE cv."idEtudiant" = e."idEtudiant") AS "aUnCV",
                 COALESCE(json_agg(DISTINCT cr."nomCompetenceReference")
                          FILTER (WHERE cr."nomCompetenceReference" IS NOT NULL), '[]') AS "competences"
            FROM etudiant e
            INNER JOIN utilisateur u ON u."idUtilisateur" = e."idUtilisateur"
            LEFT JOIN "CompetenceEtudiant" ce ON ce."idEtudiant" = e."idEtudiant"
            LEFT JOIN "CompetenceReference" cr
              ON cr."idCompetenceReference" = ce."idCompetenceReference"
           WHERE e."idPromotion" = $1
             AND COALESCE(e."statutRattachement", 'Valide') = 'Valide'
           GROUP BY e."idEtudiant", u."idUtilisateur"
           ORDER BY e."nomEtudiant"`, [annonce.idPromotion])
      : { rows: [] };

    return NextResponse.json({
      annonce: annonceResult.rows[0],
      etudiants: etudiantsResult.rows
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur GET cohorte detail:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}