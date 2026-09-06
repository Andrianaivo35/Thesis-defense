/* Donnees brutes : les contextes (offres + etudiants) ou apparaissent
   les competences d'une paire, pour verifier les comptages a la main. */
import pg from 'pg';
const pool = new pg.Pool({ user:'postgres', host:'localhost', database:'stage-share', password: process.env.DB_PASSWORD || 'fafah', port:5432 });
const c = await pool.connect();

const CIBLES = process.argv.slice(2).length ? process.argv.slice(2)
  : ['React', 'Vue.js', 'Laravel', 'Symfony'];

const ref = (await c.query(`SELECT "idCompetenceReference" id, "nomCompetenceReference" nom FROM "CompetenceReference"`)).rows;
const nomDe = new Map(ref.map(r => [Number(r.id), r.nom]));
const idDe  = new Map(ref.map(r => [r.nom, Number(r.id)]));

const co = (await c.query(`SELECT "idOffre" ctx, "idCompetenceReference" comp FROM "CompetenceOffre"`)).rows;
const ce = (await c.query(`SELECT "idEtudiant" ctx, "idCompetenceReference" comp FROM "CompetenceEtudiant"`)).rows;
const nomEtu = new Map((await c.query(`SELECT "idEtudiant" id, "prenomEtudiant" || ' ' || "nomEtudiant" n, "filiere" f FROM "etudiant"`)).rows.map(r => [Number(r.id), `${r.n}, ${r.f}`]));
const titres = new Map((await c.query(`SELECT "idOffre" id, "titre" t FROM "offre"`)).rows.map(r => [Number(r.id), r.t]));

const parCtx = new Map();
const add = (p, rows) => { for (const {ctx, comp} of rows) {
  const k = `${p}${ctx}`; if (!parCtx.has(k)) parCtx.set(k, new Set()); parCtx.get(k).add(Number(comp)); } };
add('o', co); add('e', ce);
const contextes = [...parCtx].filter(([, s]) => s.size >= 2);

console.log(`Contextes retenus (>= 2 competences) : ${contextes.length}\n`);
for (const nom of CIBLES) {
  const id = idDe.get(nom);
  if (!id) { console.log(`!! ${nom} introuvable`); continue; }
  const ou = contextes.filter(([, s]) => s.has(id));
  console.log('='.repeat(70));
  console.log(`${nom}  (id ${id})  ->  apparait dans ${ou.length} contexte(s)`);
  console.log('='.repeat(70));
  for (const [cle, s] of ou) {
    const etiq = cle[0] === 'o' ? `offre ${cle.slice(1)} « ${titres.get(Number(cle.slice(1))) ?? '?'} »`
                                : `etudiant ${cle.slice(1)} (${nomEtu.get(Number(cle.slice(1))) ?? "?"})`;
    console.log(`  ${cle.padEnd(6)} ${etiq}`);
    console.log(`         voisins : ${[...s].filter(x => x !== id).map(x => nomDe.get(x)).join(', ')}`);
  }
  console.log();
}
await c.release(); await pool.end();
