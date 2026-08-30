# Migrations SQL historiques (001 à 014)

> **Ces fichiers ne sont plus exécutés.** Ils sont conservés comme trace du
> raisonnement, pas comme mécanisme.

## Ce qu'ils étaient

Quatorze fichiers SQL, montés un par un dans `/docker-entrypoint-initdb.d/` via
`docker-compose.yml`, et rejoués par-dessus le dump d'origine `stage_share.sql`.

Le dispositif fonctionnait, mais il reposait sur une convention fragile :

- chaque migration devait être **montée à la main** dans `docker-compose.yml`, dans le bon
  ordre alphabétique — un oubli ne produisait aucune erreur, la base partait simplement
  sans elle ;
- **rien n'enregistrait ce qui avait été appliqué.** Les fichiers ne tenaient que par des
  `IF NOT EXISTS` ; impossible de savoir, devant une base donnée, où elle en était ;
- l'entrypoint PostgreSQL ne s'exécute **qu'à la première création du volume**. Une base
  existante ne recevait donc jamais les migrations suivantes — elles étaient appliquées à
  la main, ce qui est exactement ce qu'un outil de migration doit éviter.

## Ce qui les remplace

`prisma/migrations/`, avec un registre en base (`_prisma_migrations`). Une base à jour ne
rejoue rien ; une base en retard rattrape exactement ce qui lui manque.

| Fichier | Rôle |
|---|---|
| `0_init/migration.sql` | le schéma complet, engendré **depuis la base réelle** (`prisma migrate diff --from-empty --to-config-datasource`) |
| `0_init_complements/migration.sql` | ce que Prisma ne sait pas exprimer : trois index **fonctionnels** (`lower(...)`) et quatre contraintes `CHECK` |

Le second fichier n'est pas un détail. Sans lui, une base recréée accepterait
« Jean@Univ.mg » et « jean@univ.mg » comme deux comptes distincts — le défaut même que la
migration 008 avait fermé, et le manque serait **silencieux**.

## Pourquoi les garder

Chaque fichier porte, en tête, l'explication du problème qu'il corrige : le CV en 404, le
`typeUtilisateur` incohérent, le mot de passe provisoire, la file d'attente des courriels.
C'est le journal de conception du projet, et le mémoire s'y réfère.

Le fichier `stage_share.sql` à la racine est, pour la même raison, l'état initial du projet
avant tout ce travail. Il n'est plus chargé nulle part.
