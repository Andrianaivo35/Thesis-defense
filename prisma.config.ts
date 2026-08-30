// Configuration Prisma — MIGRATIONS UNIQUEMENT.
//
// Les requetes de l'application passent par `pg` (src/lib/db.js) et lisent
// DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT. Prisma, lui, veut une
// DATABASE_URL.
//
// Deux sources de verite pour la meme chose, c'est deux occasions de
// diverger : on finit avec une application qui parle a une base et des
// migrations qui en modifient une autre, sans que rien ne le signale.
//
// DATABASE_URL est donc DEDUITE des variables DB_* quand elle n'est pas
// fournie. La renseigner explicitement reste possible — c'est ce que fait
// docker-compose, ou le nom d'hote est celui du service et non localhost.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const url =
  process.env.DATABASE_URL ||
  (() => {
    const utilisateur = encodeURIComponent(process.env.DB_USER || "postgres");
    const motDePasse = encodeURIComponent(process.env.DB_PASSWORD || "");
    const hote = process.env.DB_HOST || "localhost";
    const port = process.env.DB_PORT || "5432";
    // Le nom de base contient un tiret : il doit etre encode dans l'URL.
    const base = encodeURIComponent(process.env.DB_NAME || "stage-share");
    return `postgresql://${utilisateur}:${motDePasse}@${hote}:${port}/${base}`;
  })();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url },
});
