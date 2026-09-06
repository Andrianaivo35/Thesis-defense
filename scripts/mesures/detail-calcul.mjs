/* Detail complet du calcul de similarite, pour verification manuelle. */
import pg from 'pg';
import { construireMatrice, similarite } from '../../src/lib/cooccurrence.js';

const pool = new pg.Pool({
  user: 'postgres', host: 'localhost', database: 'stage-share',
  password: process.env.DB_PASSWORD || 'fafah', port: 5432,
});
const client = await pool.connect();
const m = await construireMatrice(client);
const parNom = new Map([...m.competences].map(([id, i]) => [i.nom, id]));
const nom = id => m.competences.get(id)?.nom ?? `#${id}`;

const PAIRES = [
  ['React', 'Vue.js'], ['Laravel', 'Symfony'], ['Git', 'SQL'],
  ['MySQL', 'PostgreSQL'], ['Javascript', 'TypeScript'],
  ['Comptabilité', 'Docker'],
];

// --- constantes du module (recopiees pour l'affichage) ---
const K = 5, W_COMPL = 0.8, W_TEXTE = 0.6, W_APRIORI = 0.25, SEUIL = 0.4;
const W_OBS = 1 - W_TEXTE - W_APRIORI;

function detail(a, b) {
  const na = m.occurrences.get(a) || 0, nb = m.occurrences.get(b) || 0;
  const preuves = Math.min(na, nb);
  const confiance = preuves / (preuves + K);
  const direct = m.cooc.get(a)?.get(b) || 0;
  const taux = preuves > 0 ? Math.min(1, direct / preuves) : 0;
  const fSub = 1 - W_COMPL * taux;

  // cosinus contexte
  const va = m.cooc.get(a), vb = m.cooc.get(b);
  let prodC = 0; const partages = [];
  if (va && vb) for (const [v, val] of va) {
    const o = vb.get(v);
    if (o) { prodC += val * o; partages.push([nom(v), val, o]); }
  }
  const nCa = m.normes.get(a) || 0, nCb = m.normes.get(b) || 0;
  const cosC = (nCa && nCb) ? prodC / (nCa * nCb) : 0;

  // cosinus texte
  const ta = m.texte.vecteurs.get(a), tb = m.texte.vecteurs.get(b);
  let prodT = 0; const motsPartages = [];
  if (ta && tb) for (const [mot, p] of ta) {
    const o = tb.get(mot);
    if (o) { prodT += p * o; motsPartages.push([mot, p, o, p * o]); }
  }
  const nTa = m.texte.normes.get(a) || 0, nTb = m.texte.normes.get(b) || 0;
  const cosT = (nTa && nTb) ? prodT / (nTa * nTb) : 0;

  const catA = m.competences.get(a).categorie, catB = m.competences.get(b).categorie;
  const apriori = catA === catB ? 1 : 0;
  const observee = cosC * confiance * fSub;
  const melange = W_TEXTE * cosT + W_OBS * observee + W_APRIORI * apriori;
  const final = melange < SEUIL ? 0 : Math.min(1, melange);

  console.log('\n' + '='.repeat(72));
  console.log(`  ${nom(a)}  ↔  ${nom(b)}`);
  console.log('='.repeat(72));
  console.log(`\nDESCRIPTIONS (donnee brute, table CompetenceReference)`);
  console.log(`  ${nom(a)} : « ${m.competences.get(a).description} »`);
  console.log(`  ${nom(b)} : « ${m.competences.get(b).description} »`);
  console.log(`  categories : ${catA}  /  ${catB}   -> apriori = ${apriori}`);

  console.log(`\n1) SIGNAL TEXTE — cosinus TF-IDF`);
  if (motsPartages.length === 0) console.log('   aucun terme partage -> cosinusTexte = 0');
  else {
    console.log('   termes partages (apres racinisation)  poids_A   poids_B   produit');
    motsPartages.sort((x, y) => y[3] - x[3]);
    for (const [mot, pa, pb, pr] of motsPartages)
      console.log(`     ${mot.padEnd(22)} ${pa.toFixed(3).padStart(8)} ${pb.toFixed(3).padStart(9)} ${pr.toFixed(3).padStart(9)}`);
    console.log(`   produit scalaire = ${prodT.toFixed(4)}`);
    console.log(`   ||A|| = ${nTa.toFixed(4)}   ||B|| = ${nTb.toFixed(4)}`);
    console.log(`   cosinusTexte = ${prodT.toFixed(4)} / (${nTa.toFixed(4)} x ${nTb.toFixed(4)}) = ${cosT.toFixed(4)}`);
  }

  console.log(`\n2) SIGNAL CO-OCCURRENCE — cosinus du second ordre`);
  console.log(`   contextes de ${nom(a)} : n = ${na}`);
  console.log(`   contextes de ${nom(b)} : n = ${nb}`);
  console.log(`   co-occurrence DIRECTE(${nom(a)},${nom(b)}) = ${direct}`);
  if (partages.length === 0) console.log('   aucun voisin commun -> cosinusContexte = 0');
  else {
    console.log('   voisins communs                       compte_A  compte_B   produit');
    partages.sort((x, y) => y[1] * y[2] - x[1] * x[2]);
    for (const [v, x, y] of partages.slice(0, 12))
      console.log(`     ${v.padEnd(22)} ${String(x).padStart(8)} ${String(y).padStart(9)} ${String(x * y).padStart(9)}`);
    if (partages.length > 12) console.log(`     ... (${partages.length - 12} autres)`);
    console.log(`   produit scalaire = ${prodC}`);
    console.log(`   ||A|| = ${nCa.toFixed(4)}   ||B|| = ${nCb.toFixed(4)}`);
    console.log(`   cosinusContexte = ${prodC} / (${nCa.toFixed(4)} x ${nCb.toFixed(4)}) = ${cosC.toFixed(4)}`);
  }
  console.log(`   confiance      = min(${na},${nb}) / (min + 5) = ${preuves}/${preuves + K} = ${confiance.toFixed(4)}`);
  console.log(`   tauxDirect     = ${direct}/${preuves} = ${taux.toFixed(4)}`);
  console.log(`   substituabilite= 1 - 0.8 x ${taux.toFixed(4)} = ${fSub.toFixed(4)}`);
  console.log(`   observee       = ${cosC.toFixed(4)} x ${confiance.toFixed(4)} x ${fSub.toFixed(4)} = ${observee.toFixed(4)}`);

  console.log(`\n3) COMBINAISON FINALE`);
  console.log(`   0.60 x texte     = 0.60 x ${cosT.toFixed(4)} = ${(W_TEXTE * cosT).toFixed(4)}`);
  console.log(`   0.15 x observee  = 0.15 x ${observee.toFixed(4)} = ${(W_OBS * observee).toFixed(4)}`);
  console.log(`   0.25 x apriori   = 0.25 x ${apriori} = ${(W_APRIORI * apriori).toFixed(4)}`);
  console.log(`   somme            = ${melange.toFixed(4)}`);
  console.log(`   seuil 0.40       -> ${melange < SEUIL ? 'ECARTE (0)' : 'CONSERVE'}`);
  console.log(`   SIMILARITE       = ${final.toFixed(3)}   [module: ${similarite(m, a, b).toFixed(3)}]`);
}

console.log('CORPUS : ' + JSON.stringify(m.statistiques));
for (const [x, y] of PAIRES) {
  const a = parNom.get(x), b = parNom.get(y);
  if (a && b) detail(a, b); else console.log(`\n!! introuvable : ${x} / ${y}`);
}
await client.release(); await pool.end();
