import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

export async function POST(req) {
  const client = await pool.connect();

  try {
    const { email, motDePasse } = await req.json();

    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // 1. Chercher l'utilisateur de type Admin avec cet email
    const utilisateurResult = await client.query(
      `SELECT "idUtilisateur", "emailUtilisateur", "motDePasse", "typeUtilisateur"
       FROM utilisateur
       WHERE "emailUtilisateur" = $1 AND "typeUtilisateur" = $2`,
      [email, 'Admin']
    );

    if (utilisateurResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    const utilisateur = utilisateurResult.rows[0];

    // 2. Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasse);

    if (!motDePasseValide) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      );
    }

    // 3. Récupérer les infos de l'admin
    const adminResult = await client.query(
      `SELECT "idAdmin", "nomAdmin", "prenomAdmin"
       FROM admin
       WHERE "idUtilisateur" = $1`,
      [utilisateur.idUtilisateur]
    );

    if (adminResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profil admin introuvable' },
        { status: 404 }
      );
    }

    const admin = adminResult.rows[0];

    // 4. Générer le JWT
    const token = signToken({
      idUtilisateur: utilisateur.idUtilisateur,
      idAdmin: admin.idAdmin,
      typeUtilisateur: 'Admin',
      email: utilisateur.emailUtilisateur
    });

    // 5. Réponse avec le token et infos basiques
    return NextResponse.json(
      {
        success: true,
        message: 'Connexion réussie',
        token,
        utilisateur: {
          idUtilisateur: utilisateur.idUtilisateur,
          idAdmin: admin.idAdmin,
          nomAdmin: admin.nomAdmin,
          prenomAdmin: admin.prenomAdmin,
          typeUtilisateur: 'Admin',
          email: utilisateur.emailUtilisateur
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur login admin:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}