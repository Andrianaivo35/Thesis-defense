import { Pool } from 'pg';

const pool = new Pool({
  user: 'postgres',              // Votre nom d'utilisateur PostgreSQL
  host: 'localhost',
  database: 'stage-share', // Le nom de votre base de données
  password: 'fafah',
  port: 5432,
});

export default pool;