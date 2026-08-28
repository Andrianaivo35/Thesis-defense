import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/jwt';
import {
  identifierAppelant, verifierLimite, reinitialiserLimite, messageLimiteAtteinte
} from '@/lib/limiteDebit';

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

    /* Limitation de debit : la cle combine l'adresse IP et l'e-mail vise,
       pour bloquer le martelage d'un compte sans penaliser tous les
       utilisateurs partageant une meme sortie reseau. */
    const cleLimite = identifierAppelant(req, email);
    const limite = verifierLimite(cleLimite);
    if (!limite.autorise) {
      return NextResponse.json(
        { error: messageLimiteAtteinte(limite.secondesAttente) },
        { status: 429 }
      );
    }

    // 1. Chercher l'utilisateur de type Entreprise avec cet email
    const utilisateurResult = await client.query(
      `SELECT "idUtilisateur", "emailUtilisateur", "motDePasse", "typeUtilisateur"
       FROM utilisateur
       WHERE "emailUtilisateur" = $1 AND "typeUtilisateur" = $2`,
      [email, 'Etudiant']
    );

    if (utilisateurResult.rows.length === 0) {
      // Message générique pour éviter de révéler si l'email existe ou non
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

    // 3. Récupérer les infos de l'entreprise
    const etudiantResult = await client.query(
      `SELECT "idEtudiant", "nomEtudiant"
       FROM etudiant
       WHERE "idUtilisateur" = $1`,
      [utilisateur.idUtilisateur]
    );

    if (etudiantResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Profil etudiant introuvable' },
        { status: 404 }
      );
    }

    const etudiant = etudiantResult.rows[0];

    // Connexion reussie : seules les tentatives infructueuses doivent peser
    reinitialiserLimite(cleLimite);

    // 4. Générer le JWT
    const token = signToken({
      idUtilisateur: utilisateur.idUtilisateur,
      idEtudiant: etudiant.idEtudiant, 
      typeUtilisateur: 'Etudiant',
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
          idEtudiant: etudiant.idEtudiant,
          nomEtudiant: etudiant.nomEtudiant,
          typeUtilisateur: 'Etudiant', 
          email: utilisateur.emailUtilisateur
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erreur login entreprise:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}