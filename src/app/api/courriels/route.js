import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';
import { viderMaintenant, etatFile } from '@/lib/fileCourriel';
import { envoiConfigure } from '@/lib/mail';

/* =====================================================================
   /api/courriels — surveillance et relance de la file

   GET   l'état de la file
   POST  forcer un vidage

   Réservé à l'administration. Un envoi silencieux n'est pas vérifiable :
   sans cette route, personne ne saurait qu'une promotion entière attend
   son lien d'activation parce que le mot de passe SMTP a expiré.
   ===================================================================== */

function authentifierAdmin(req) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  const payload = verifyToken(token);
  if (!payload || payload.typeUtilisateur !== 'Admin') return null;
  return payload;
}

export async function GET(req) {
  if (!authentifierAdmin(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  try {
    return NextResponse.json({
      envoiConfigure: envoiConfigure(),
      file: await etatFile()
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur état de la file :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!authentifierAdmin(req)) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  if (!envoiConfigure()) {
    return NextResponse.json(
      { error: "L'envoi de courriel n'est pas configuré sur ce serveur." },
      { status: 400 }
    );
  }
  try {
    /* Vidage ATTENDU ici, contrairement au déclenchement automatique :
       l'administrateur qui relance veut voir le résultat, c'est le but
       même de son geste. */
    const bilan = await viderMaintenant(50);
    return NextResponse.json({
      success: true, ...bilan,
      message: `${bilan.envoyes} courriel${bilan.envoyes > 1 ? 's' : ''} envoyé${bilan.envoyes > 1 ? 's' : ''}` +
               `${bilan.echecs > 0 ? `, ${bilan.echecs} à réessayer` : ''}` +
               `${bilan.abandonnes > 0 ? `, ${bilan.abandonnes} abandonné(s)` : ''}.`
    }, { status: 200 });
  } catch (error) {
    console.error('Erreur vidage de la file :', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
