import pool from './db.js';
import { viderFile, envoiConfigure } from './mail.js';

/* =====================================================================
   DÉCLENCHEMENT DU VIDAGE DE LA FILE

   Séparé de `mail.js` parce que ce module ouvre sa propre connexion :
   `mail.js` ne connaît que la transaction qu'on lui passe, et doit le
   rester pour être appelable depuis n'importe quel contexte.

   POURQUOI « SANS ATTENDRE »

   L'import d'une promotion met trois cents courriels en file. Les
   expédier prend plusieurs minutes ; la requête HTTP, elle, doit rendre
   la main tout de suite. On lance donc le vidage et l'on répond.

   C'est possible SANS RISQUE parce que la file est durable. Si le
   processus s'arrête au cent-cinquantième courriel, les cent cinquante
   restants sont toujours en base, à l'état « en_attente », et le
   prochain vidage reprendra où il en était. Le déclenchement n'est
   qu'une commodité, jamais la garantie.

   UN SEUL VIDAGE À LA FOIS

   Deux vidages simultanés liraient les mêmes lignes et expédieraient
   deux fois le même courriel. Le verrou ci-dessous suffit à l'échelle
   d'un processus unique.

   Limite assumée, à signaler : sur plusieurs instances, il faudrait un
   verrou partagé — un `SELECT … FOR UPDATE SKIP LOCKED` sur les lignes
   traitées. La table s'y prête ; ce n'est pas fait ici parce que le
   déploiement est mono-instance.
   ===================================================================== */

const TAILLE_LOT = 25;

let vidageEnCours = false;

/**
 * Lance un vidage sans l'attendre.
 *
 * Ne lève jamais et ne renvoie rien d'utile : l'appelant a déjà répondu
 * à son utilisateur, l'échec d'un envoi ne le concerne plus.
 */
export function declencherVidage() {
  if (!envoiConfigure() || vidageEnCours) return;

  vidageEnCours = true;
  (async () => {
    const client = await pool.connect();
    try {
      /* On boucle par lots tant qu'il reste des courriels : un seul lot
         laisserait la file pleine après un import de trois cents. */
      let restant = true;
      while (restant) {
        const bilan = await viderFile(client, TAILLE_LOT);
        restant = bilan.traites === TAILLE_LOT;
        if (bilan.traites > 0) {
          console.info(`[file de courriels] ${bilan.envoyes} envoyés, ` +
                       `${bilan.echecs} à réessayer, ${bilan.abandonnes} abandonnés`);
        }
      }
    } catch (erreur) {
      console.error('Vidage de la file de courriels interrompu :', erreur.message);
    } finally {
      client.release();
      vidageEnCours = false;
    }
  })();
}

/**
 * Vide la file et attend le résultat.
 * Réservé aux appels explicites — route d'administration, script.
 */
export async function viderMaintenant(limite = TAILLE_LOT) {
  const client = await pool.connect();
  try {
    return await viderFile(client, limite);
  } finally {
    client.release();
  }
}

/** État de la file, pour l'écran d'administration. */
export async function etatFile() {
  const { rows } = await pool.query(`
    SELECT "statut", count(*)::int AS n,
           max("dateCreation") AS "plusRecent"
      FROM "FileCourriel" GROUP BY "statut"`);
  const etat = { en_attente: 0, envoye: 0, echec: 0, abandonne: 0 };
  for (const r of rows) etat[r.statut] = r.n;
  return etat;
}
