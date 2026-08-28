import pool from '@/lib/db';
import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';
import { validerMotDePasse } from '@/lib/motDePasse';

export async function PATCH(req) {
  const client = await pool.connect();
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    const payload = verifyToken(token);

    if (!payload || payload.typeUtilisateur !== 'Universite') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { ancienMotDePasse, nouveauMotDePasse } = await req.json();

    if (!ancienMotDePasse || !nouveauMotDePasse) {
      return NextResponse.json(
        { error: 'Ancien et nouveau mot de passe requis' },
        { status: 400 }
      );
    }

    const erreurMotDePasse = validerMotDePasse(nouveauMotDePasse);
    if (erreurMotDePasse) {
      return NextResponse.json({ error: erreurMotDePasse }, { status: 400 });
    }

    const result = await client.query(
      'SELECT "motDePasse" FROM utilisateur WHERE "idUtilisateur" = $1',
      [payload.idUtilisateur]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });
    }

    const valide = await bcrypt.compare(ancienMotDePasse, result.rows[0].motDePasse);
    if (!valide) {
      return NextResponse.json(
        { error: 'Ancien mot de passe incorrect' },
        { status: 401 }
      );
    }

    const nouveauHash = await bcrypt.hash(nouveauMotDePasse, 10);
    await client.query(
      'UPDATE utilisateur SET "motDePasse" = $1 WHERE "idUtilisateur" = $2',
      [nouveauHash, payload.idUtilisateur]
    );

    return NextResponse.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    }, { status: 200 });

  } catch (error) {
    console.error('Erreur changement mot de passe université:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}