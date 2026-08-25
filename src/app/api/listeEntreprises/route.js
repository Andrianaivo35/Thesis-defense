import pool from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM entreprise
      ORDER BY "nomEntreprise" ASC
    `);

    return NextResponse.json(
      { entreprises: result.rows },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur liste entreprises:', error);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}