/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  reactCompiler: true,
  compiler: {
    styledComponents: true,
  },
  devIndicators: false,

  /* pdf-parse et tesseract.js ne doivent PAS entrer dans le paquet
     serveur.

     Tous deux chargent des fichiers annexes A L'EXECUTION, par chemin :
     pdf-parse s'appuie sur pdfjs, qui va chercher son worker
     (pdf.worker.mjs), et tesseract.js charge son propre worker ainsi que
     les donnees linguistiques. Le bundler reecrit les chemins des
     modules qu'il absorbe, mais n'emet pas ces fichiers annexes : au
     premier appel, l'analyse echouait sur

       Setting up fake worker failed: Cannot find module
       '/app/.next/server/chunks/pdf.worker.mjs'

     Le defaut est invisible hors de Next — les mesures en ligne de
     commande passaient toutes. Seul un essai de bout en bout contre le
     conteneur l'a revele.

     Les declarer externes les laisse charges depuis node_modules, avec
     leurs fichiers annexes a cote. */
  serverExternalPackages: ['pdf-parse', 'tesseract.js'],
};

export default nextConfig;