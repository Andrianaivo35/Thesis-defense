# Scripts du projet

Quatre familles, selon ce qu'on cherche à faire. **Toutes les commandes se lancent depuis
la racine du projet**, jamais depuis un sous-dossier.

Chaque dossier porte son propre `README.md`, qui explique le fonctionnement de ses scripts,
ce qu'ils attendent en entrée et ce qu'ils produisent. Cette page-ci n'en donne que la vue
d'ensemble.

| Dossier | Pour quoi faire | Touche à la base ? |
|---|---|---|
| [`base/`](base/README.md) | créer, peupler, nettoyer, exporter la base | **oui, en écriture** |
| [`corpus/`](corpus/README.md) | engendrer le corpus de CV du mémoire | non |
| [`mesures/`](mesures/README.md) | mesurer extraction et recommandations | lecture seule |
| [`memoire/`](memoire/README.md) | captures d'écran, document du chapitre 3, images des diagrammes | lecture seule |
| [`migrations/`](migrations/README.md) | les 14 migrations SQL **historiques**, plus exécutées | — |

---

## `base/` — cycle de vie de la base

> ⚠️ Ces scripts **écrivent**. Lisez ce que fait chacun avant de le lancer.

| Script | Ce qu'il fait | Sans danger ? |
|---|---|---|
| `initialiser-base.mjs` | applique les migrations, puis charge les données **si la base est vide** | **oui** — ne touche à rien sur une base peuplée |
| `exporter-donnees.mjs` | produit `export/donnees.sql` et `export/uploads.tar.gz` | **oui** — lecture seule |
| `seed-candidatures.mjs` | (re)crée CV, candidatures, réponses au QCM, promotions | **non** — *efface* candidatures et CV avant de recréer |
| `nettoyer-base.mjs` | retire comptes d'essai et incohérences | **non** — supprime des comptes |
| `seed-dummy-data*.js` | peuplement d'origine : entreprises, universités, offres | **non** — à ne rejouer que sur une base vide |

```bash
npm run base:init      # le geste courant : mettre une base à niveau
npm run base:etat      # où en est la base
npm run base:migrer    # migrations seules, sans toucher aux données
```

**L'ordre sur une base vierge** — c'est celui que le conteneur applique tout seul :

```bash
npm run base:init                          # schéma + données
```

**Pour reconstruire le jeu de démonstration** à partir d'une base déjà peuplée :

```bash
node scripts/base/nettoyer-base.mjs        # retire les résidus
node scripts/corpus/generer-cv-test.js     # régénère les CV
node scripts/base/seed-candidatures.mjs    # attribue CV, candidatures, promotions
```

> Régénérer le corpus **change les chiffres du mémoire** : les CV sont tirés au hasard pour
> leur mise en page et leur contenu parasite. Relancez les mesures ensuite, et mettez à jour
> [MD/5](../MD/5%20-%20INGESTION-CV.md) et [MD/6](../MD/6%20-%20EVALUATION.md) si les valeurs
> bougent.

Détail de chaque script : [`base/README.md`](base/README.md).

---

## `corpus/` — jeu de CV de référence

```bash
node scripts/corpus/generer-cv-test.js
```

Engendre 38 CV en PDF dans `corpus/cv-test/`, à partir des **profils réels de la base**, et
le fichier `verite.json` qui dit pour chacun quelles compétences il contient — et quels
termes il contient **sans** être des compétences.

C'est cette double liste qui rend les mesures possibles : la première donne le rappel, la
seconde la précision. Voir [MD/5](../MD/5%20-%20INGESTION-CV.md).

Ce qui rend le corpus exigeant — quatre maquettes, trois natures de PDF dont un cas mixte —
et ce qu'il faut refaire après une régénération : [`corpus/README.md`](corpus/README.md).

---

## `mesures/` — ce qui produit les chiffres du mémoire

Lecture seule. Ce sont aussi les **tests de non-régression** : un écart signale que quelque
chose a changé.

| Script | Mesure | Valeurs attendues |
|---|---|---|
| `test-ingestion-cv.mjs` | extraction de compétences | routage 38/38 · précision 98,2 % · rappel 95,2 % |
| `evaluer-recommandations.mjs` | co-occurrence contre correspondance exacte | protocole D : précision@1 9,9 → 22,2 % |
| `test-ingestion-bout-en-bout.mjs` | la chaîne complète, par HTTP | 4/4 compétences · tiers refusé 404 |
| `test-cooccurrence.mjs` | inspection de la matrice | — |

```bash
node scripts/mesures/test-ingestion-cv.mjs
node scripts/mesures/evaluer-recommandations.mjs
node scripts/mesures/test-ingestion-bout-en-bout.mjs   # exige l'application démarrée
```

Ce que mesure chaque protocole, et quoi regarder quand un chiffre ne correspond plus :
[`mesures/README.md`](mesures/README.md).

---

## `memoire/` — chapitre 3 du mémoire

Trois étapes **séparées à dessein** : régénérer les captures ne force pas à refaire les
annotations, et recomposer le document ne force pas à tout recapturer.

```bash
node scripts/memoire/capturer-ecrans.mjs      # 1. captures, par rôle
python scripts/memoire/annoter-captures.py    # 2. pastilles numérotées
python scripts/memoire/generer-chapitre3.py   # 3. le document .docx
```

Ce qu'il faut avant : l'application démarrée sur `http://localhost:3000`, et
`npx playwright install chromium` fait une fois.

Ce qui est produit : `chapitre3/figures/*.png`, puis **deux documents** —
`Chapitre3-Essentiel.docx` (17 figures, ce qui porte le mémoire) et `Chapitre3-Complet.docx`
(les 44 écrans, chacun marqué selon qu'on peut le retirer ou non).

Ce qui se règle sans toucher au code : `scripts/memoire/ecrans.json` — la liste des pages,
leur rôle, leur légende et leurs annotations. Voir
[memoire/README.md](memoire/README.md).

---

## Conventions

- **Toujours lancer depuis la racine.** Les scripts qui écrivent des fichiers s'appuient sur
  le dossier courant.
- **Le français est la langue du projet**, y compris dans les noms de variables et les
  messages.
- **Aucun script ne prend de mot de passe en argument.** Ils lisent `.env`, comme
  l'application.
- **`.mjs` ou `.js` ?** Les scripts qui importent `src/lib/` sont en `.mjs` ; les autres,
  autonomes, sont en `.js`.
