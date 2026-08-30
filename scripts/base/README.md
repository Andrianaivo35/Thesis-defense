# `base/` — cycle de vie de la base de données

> ⚠️ **La plupart de ces scripts écrivent.** Le tableau ci-dessous dit lequel fait quoi.
> Lisez-le avant de lancer : deux d'entre eux effacent des données.

Toutes les commandes se lancent **depuis la racine du projet**, jamais depuis ce dossier :
plusieurs scripts résolvent leurs chemins à partir du dossier courant.

---

## En un coup d'œil

| Script | Ce qu'il fait | Sans danger ? |
|---|---|---|
| `initialiser-base.mjs` | applique les migrations, puis charge les données **si la base est vide** | **oui** |
| `exporter-donnees.mjs` | produit `export/donnees.sql` et `export/uploads.tar.gz` | **oui**, lecture seule |
| `seed-candidatures.mjs` | (re)crée CV, candidatures, réponses au QCM, promotions | **non** — *efface* d'abord |
| `nettoyer-base.mjs` | retire comptes d'essai et incohérences | **non** — supprime des comptes |
| `seed-dummy-data*.js` | peuplement d'origine : entreprises, universités, offres | **non** — pour base vide |

---

## `initialiser-base.mjs` — le geste courant

```bash
npm run base:init
```

C'est ce que le conteneur exécute à chaque démarrage, et c'est aussi la commande à lancer
après un `git pull` qui apporterait une migration.

**Deux étapes, dans cet ordre.**

1. **Les migrations**, via `prisma migrate deploy`. Prisma tient un registre en base
   (`_prisma_migrations`) : une base à jour ne rejoue rien, une base en retard rattrape
   exactement ce qui lui manque.
2. **Le jeu de données**, `prisma/seed.sql`, **uniquement si la base est vide**. Sans cette
   condition, chaque redémarrage écraserait le travail en cours.

**Pourquoi ce script existe.** Les migrations étaient auparavant montées une par une dans
`/docker-entrypoint-initdb.d/`. Ce dispositif ne s'exécute qu'à la **première création du
volume** et n'enregistre rien : une base existante ne recevait jamais les migrations
suivantes, et rien ne le signalait.

**Deux pièges qu'il contourne**, et qui vous mordront si vous chargez le dump autrement :

- `pg_dump` émet `\restrict` et `\unrestrict` en tête et en pied — des méta-commandes de
  `psql` que le pilote refuse avec « syntax error at or near \ ». Elles sont filtrées.
- Le dump vide le `search_path`. Toute requête non qualifiée échoue **après** le `COMMIT`,
  ce qui fait passer un chargement réussi pour un échec. Le chemin est rétabli.

---

## `exporter-donnees.mjs` — remettre le projet à quelqu'un

```bash
node scripts/base/exporter-donnees.mjs
```

Produit dans `export/` :

| Fichier | Contenu |
|---|---|
| `donnees.sql` | toutes les données, en `INSERT` explicites |
| `uploads.tar.gz` | les fichiers PDF des CV |

**Ni l'un ni l'autre n'est versionné** : l'archive contient des CV, donc des données
personnelles, et `uploads/` est déjà exclu de git pour cette raison. Ils se transmettent par
clé USB ou lien privé. La procédure d'installation, elle, est versionnée :
[`export/INSTALLATION.md`](../../export/INSTALLATION.md).

**Pourquoi des `INSERT` et non des `COPY`** — la forme par défaut de `pg_dump` est
`COPY … FROM stdin`, propre à `psql`. Le script d'initialisation devant charger ce fichier
sans `psql`, on exporte en `INSERT` nommant leurs colonnes : plus volumineux, mais
chargeable par n'importe quel client.

---

## `seed-candidatures.mjs` — le jeu de démonstration

```bash
node scripts/base/seed-candidatures.mjs
```

**Efface d'abord** candidatures, réponses au QCM, CV et détections, puis recrée :

1. **38 CV réels**, repris du corpus de test — dont des numérisés, ce qui rend la lecture
   automatique démontrable sans déposer un fichier à la main ;
2. **des candidatures** avec leur note au QCM et leur issue ;
3. **les réponses au QCM**, cohérentes avec la note affichée ;
4. **les promotions**, pour les groupes d'au moins deux inscrits ;
5. **une promotion diplômée**, pour que l'écran « anciens » ne soit pas vide.

> ⚠️ **Ces candidatures ne sont pas une vérité terrain.** Leurs issues suivent un modèle de
> comportement écrit à la main, dont les hypothèses recoupent celles du moteur de
> recommandation. S'en servir pour évaluer les recommandations reviendrait à mesurer le
> système contre ses propres hypothèses. Le chapitre d'évaluation
> ([MD/6](../../MD/6%20-%20EVALUATION.md)) s'appuie sur l'ablation de compétences déclarées,
> pas sur cette table.

Le tirage est **reproductible** : deux exécutions donnent la même base, sans quoi une
capture d'écran ne correspondrait plus au rechargement suivant.

---

## `nettoyer-base.mjs` — retirer les traces d'essai

```bash
node scripts/base/nettoyer-base.mjs
```

**Deux traitements, selon ce que la donnée porte.** Supprimer n'est pas toujours le bon
geste : une entité d'essai qui ne porte rien se supprime, une entité qui porte du corpus
utile se **renomme** — sinon on détruit des offres et des candidatures pour un problème
d'étiquette.

Le script est **idempotent** : le relancer sur une base déjà propre ne fait rien.

---

## `seed-dummy-data*.js` — le peuplement d'origine

Trois scripts hérités, à ne rejouer **que sur une base vide**. Ils créent les entreprises,
universités, offres, QCM et compétences de référence — c'est-à-dire ce que `prisma/seed.sql`
contient déjà.

En pratique, `npm run base:init` les rend inutiles : le dump porte leur résultat. Ils sont
conservés pour montrer comment le corpus a été construit.

---

## Reconstruire entièrement le jeu de démonstration

```bash
node scripts/base/nettoyer-base.mjs        # retirer les résidus
node scripts/corpus/generer-cv-test.js     # régénérer les CV
node scripts/base/seed-candidatures.mjs    # CV, candidatures, promotions
```

> **Attention.** Régénérer le corpus **change les chiffres du mémoire** : les CV sont tirés
> au hasard pour leur mise en page et leur contenu parasite. Relancez ensuite les mesures
> ([`../mesures/`](../mesures/README.md)) et mettez à jour
> [MD/5](../../MD/5%20-%20INGESTION-CV.md) et [MD/6](../../MD/6%20-%20EVALUATION.md) si les
> valeurs bougent.
