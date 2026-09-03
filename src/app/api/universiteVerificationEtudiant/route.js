import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/* =====================================================================
   PATCH : vérifier ou retirer la vérification d'identité d'un étudiant

   Distinct du rattachement (statutRattachement) : le rattachement dit
   « cet étudiant appartient à mon établissement », la vérification dit
   « j'ai personnellement confirmé son identité » — un badge à la LinkedIn/
   Facebook, jamais accordé automatiquement, même à l'import d'une
   promotion entière.

   Marge de sécurité volontaire, à la demande de l'université :
     - impossible sur un étudiant qui n'est pas déjà `Valide` (on ne
       vérifie pas l'identité de quelqu'un dont l'appartenance même n'est
       pas confirmée) ;
     - impossible sans matricule renseigné au dossier (pas de vérification
       sans identifiant officiel).

   Corps attendu : { idEtudiant, verifie: true | false }
   ===================================================================== */
export async function PATCH(req) {
  const client = await pool.connect();

  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { idEtudiant, verifie } = await req.json();

    if (!idEtudiant || typeof verifie !== 'boolean') {
      return NextResponse.json(
        { error: 'Paramètres invalides : idEtudiant et verifie (booléen) requis' },
        { status: 400 }
      );
    }

    const etudiantResult = await client.query(`
      SELECT "idEtudiant", "idUniversite", "statutRattachement", "matricule"
      FROM etudiant
      WHERE "idEtudiant" = $1
    `, [idEtudiant]);

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json({ error: 'Étudiant introuvable' }, { status: 404 });
    }
    const etudiant = etudiantResult.rows[0];

    if (String(etudiant.idUniversite) !== String(payload.idUniversite)) {
      return NextResponse.json(
        { error: "Cet étudiant ne fait pas partie de votre université" },
        { status: 403 }
      );
    }

    if (etudiant.statutRattachement !== 'Valide') {
      return NextResponse.json(
        { error: "Le rattachement de cet étudiant doit être validé avant de pouvoir vérifier son identité" },
        { status: 409 }
      );
    }

    if (verifie && !etudiant.matricule?.trim()) {
      return NextResponse.json(
        { error: "Impossible de vérifier l'identité sans matricule renseigné au dossier" },
        { status: 400 }
      );
    }

    const result = await client.query(`
      UPDATE etudiant
      SET "estVerifieIdentite" = $1,
          "dateVerificationIdentite" = CASE WHEN $1 THEN CURRENT_DATE ELSE NULL END
      WHERE "idEtudiant" = $2
      RETURNING "idEtudiant", "estVerifieIdentite", "dateVerificationIdentite"
    `, [verifie, idEtudiant]);

    return NextResponse.json(
      {
        success: true,
        message: verifie ? 'Identité vérifiée' : 'Vérification retirée',
        etudiant: result.rows[0]
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur vérification identité étudiant:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  } finally {
    client.release();
  }
}
