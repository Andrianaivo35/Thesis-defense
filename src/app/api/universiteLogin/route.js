import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';

export async function POST(req) {
  const client = await pool.connect();

  try {
    const { email, motDePasse } = await req.json();

    // Validation basique
    if (!email || !motDePasse) {
      return NextResponse.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      );
    }

    // 1. Chercher l'utilisateur de type Universite avec cet email
    const utilisateurResult = await client.query(
      `SELECT "idUtilisateur", "emailUtilisateur", "motDePasse", "typeUtilisateur"
       FROM utilisateur
       WHERE "emailUtilisateur" = $1 AND "typeUtilisateur" = $2`,
      [email, 'Université']
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

    // 3. Récupérer les infos de l'université
    const universiteResult = await client.query(
      `SELECT "idUniversite", "nomUniversite", "sigleUniversitaire"
       FROM universite
       WHERE "idUtilisateur" = $1`,
      [utilisateur.idUtilisateur]
    );

    if (universiteResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profil université introuvable' },
        { status: 404 }
      );
    }

    const universite = universiteResult.rows[0];

    // 4. Générer le JWT
    const token = signToken({
      idUtilisateur: utilisateur.idUtilisateur,
      idUniversite: universite.idUniversite,
      typeUtilisateur: 'Université',
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
          idUniversite: universite.idUniversite,
          nomUniversite: universite.nomUniversite,
          sigleUniversitaire: universite.sigleUniversitaire,
          email: utilisateur.emailUtilisateur,
          typeUtilisateur: 'Université',
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur login université:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}