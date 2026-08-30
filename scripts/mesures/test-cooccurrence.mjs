/* Script de vérification de la matrice de co-occurrence.
   Usage : node scripts/test-cooccurrence.mjs */
import pg from 'pg';
import { construireMatrice, similarite, competencesProches } from '../../src/lib/cooccurrence.js';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah',
  port: Number(process.env.DB_PORT) || 5432,
});
const client = await pool.connect();
const m = await construireMatrice(client);

console.log('=== Densite du corpus ===');
console.log('  ', JSON.stringify(m.statistiques));
console.log('   densite :', (m.statistiques.pairesObservees / m.statistiques.pairesPossibles * 100).toFixed(1) + '%');

const parNom = new Map([...m.competences].map(([id, i]) => [i.nom, id]));

console.log('\n=== Competences les plus proches (calculees, jamais declarees) ===');
for (const nom of ['React', 'Javascript', 'Python', 'Comptabilite', 'Comptabilité', 'Genie civil', 'Génie civil', 'Aquaculture']) {
  const id = parNom.get(nom);
  if (!id) continue;
  const p = competencesProches(m, id, 4);
  console.log('  ', nom.padEnd(16), '->', p.length ? p.map(x => `${x.nom} (${x.similarite})`).join(', ') : '(aucune)');
}

console.log('\n=== Test decisif : React vs Vue.js ===');
const react = parNom.get('React'), vue = parNom.get('Vue.js');
if (react && vue) {
  console.log('   co-occurrence DIRECTE :', m.cooc.get(react)?.get(vue) || 0, '(0 attendu : ce sont des alternatives)');
  console.log('   similarite calculee   :', similarite(m, react, vue).toFixed(3));
} else {
  console.log('   Vue.js absente du referentiel actif');
}

await client.release();
await pool.end();
