# Plan de la prochaine session

> **Ce fichier n'est pas destiné au dépôt.** Il contient « ce qu'on pense encore faire »,
> que la poussée d'aujourd'hui doit exclure. Il est laissé **non suivi par git** : il ne
> partira pas, et il survit localement. Commencer son nom par `_` le distingue aussi des
> documents du mémoire.

## Ordre d'exécution

Le premier point conditionne la poussée d'aujourd'hui ; les autres peuvent suivre.

| # | Chantier | Durée estimée | Bloquant pour la poussée |
|---|---|---|---|
| 1 | Inspection du code | ~30 min | **oui** |
| 2 | Bilan (fichier poussé) | ~20 min | **oui** |
| 3 | Export des données + procédure sans Docker | ~40 min | non |
| 4 | Document Word du chapitre 3 | 1 à 2 sessions | non |

---

## 1. Inspection du code

Objectif : ne rien pousser de cassé. Vérifications, dans l'ordre.

### 1.1 Ce qui se vérifie par une commande

```bash
JWT_SECRET=test npx next build        # doit compiler sans erreur
npx eslint src --max-warnings=0       # imports morts, variables inutilisées
git status --short                    # doit être vide
git check-ignore -v .env              # doit être ignoré
git log --oneline main..HEAD | wc -l  # nombre de commits à pousser
```

### 1.2 Migrations : le point le plus risqué

Quatorze migrations existent. Il faut prouver qu'un **volume vierge** produit exactement le
schéma de la base actuelle — sinon l'ami du point 3 obtiendra une base différente.

```bash
# Projet Docker isolé, ports décalés, sans toucher aux données actuelles
docker compose -p stageshare-neuf -f docker-compose.yml -f docker-compose.neuf.yml up -d db
# puis comparer les schémas
```

Comparer : liste des tables, colonnes, contraintes, index. Le motif a déjà servi lors des
lots précédents.

**À vérifier aussi** : les 14 migrations sont-elles toutes montées dans `docker-compose.yml` ?
Les migrations 001 à 014 doivent y figurer ; la dernière ajoutée est la 014.

### 1.3 Ce qui demande une lecture

- **Authentification sur chaque route.** Parcourir `src/app/api/**/route.js` et vérifier que
  toute route non publique appelle `verifyToken` et contrôle le `typeUtilisateur`.
  Les routes publiques légitimes : `universiteList`, `etudiantLogin` et les autres
  connexions, les inscriptions, `jeton`, `motDePasse/demande`.
- **Pages sans issue.** Refaire le balayage qui a trouvé `universiteEtudiant` et
  `entrepriseRegistreOffre` :
  ```bash
  for f in $(find src/app/pages -name page.js); do
    grep -q "fetchAuth\|getUtilisateur" "$f" && ! grep -q "Navbar\|BackButton\|AdminHeader" "$f" && echo "$f"
  done
  ```
  `adminRegistreInfo` reste dans la liste — décider s'il est atteignable depuis
  `adminDashboard` et, si oui, lui ajouter un retour.
- **Cartes sans action.** Le même reproche que sur `universiteEtudiant` peut valoir
  ailleurs : passer en revue les cartes d'offre, de candidature, d'entreprise, et vérifier
  que chacune propose au moins une action.
- **Scripts résiduels.** `ls scripts/_*` doit ne rien renvoyer.

### 1.4 Vérification fonctionnelle

Rejouer les trois mesures, qui servent aussi de tests de non-régression :

```bash
node scripts/mesures/test-ingestion-cv.mjs          # attendu : précision 98,2 % rappel 95,2 %
node scripts/mesures/evaluer-recommandations.mjs    # attendu : protocole D, P@1 9,9 -> 22,2 %
node scripts/mesures/test-ingestion-bout-en-bout.mjs
```

Tout écart signale une régression introduite depuis.

---

## 2. Bilan — `MD/9 - BILAN.md` *(celui-ci est poussé)*

Le fichier que la poussée d'aujourd'hui doit contenir. **Il ne parle que du passé** : ce qui
existait, ce qui a été fait. Rien de ce qui reste à faire — cela vit ici et dans
`MD/8 - PERSPECTIVES-PRODUIT.md`.

Structure proposée :

1. **État initial** — ce que le projet était au départ : les défauts trouvés à la revue de
   code (E1 à E3, C1, F2-F4, M5), la base sans contrainte d'unicité, les CV en 404, le
   `typeUtilisateur` incohérent.
2. **Ce qui a été fait, par lot** — un paragraphe par lot, du 0 au 6, avec pour chacun le
   problème réel et ce qui le règle. Renvoyer aux documents détaillés plutôt que répéter.
3. **Les chiffres** — 14 migrations, 44 pages, N routes, extraction 98,2 %/95,2 %,
   recommandation P@1 9,9 → 22,2 % isolée, 300 comptes importés en 1,25 s.
4. **Les décisions structurantes** — celles qu'un lecteur doit connaître : pas de LLM,
   Postgres plutôt que Neo4j, jetons plutôt que mots de passe provisoires, l'argent hors du
   score.
5. **Les erreurs trouvées par la mesure** — Jaro-Winkler, la détection de section, la fuite
   par temporisation, le `COUNT` sans `DISTINCT`, la vérité terrain fausse. C'est la partie
   la plus utile au mémoire.

---

## 3. Reprise des données sur un poste sans Docker

### 3.1 Ce qu'il faut produire

| Artefact | Contenu | Commande |
|---|---|---|
| `export/stage-share.sql` | schéma **et** données | `docker exec stage-share-db pg_dump -U postgres -d stage-share --no-owner --no-privileges` |
| `export/uploads.zip` | les CV du volume | copie de `/app/uploads` depuis le conteneur |
| `export/INSTALLATION.md` | la procédure | à rédiger |

Le dump contient le schéma final : **les migrations n'ont pas à être rejouées** sur le poste
de destination. C'est ce qui rend la reprise simple.

### 3.2 Ce que la procédure doit couvrir

1. **Prérequis** : Node 20 ou plus, PostgreSQL 16, npm.
2. **Créer la base** : `createdb -U postgres "stage-share"` — attention au tiret, le nom
   contient un caractère qui impose les guillemets.
3. **Restaurer** : `psql -U postgres -d "stage-share" -f stage-share.sql`.
4. **Les fichiers** : décompresser `uploads.zip` à la racine du projet. Sans cela, les CV
   existent en base mais aucun ne s'ouvre.
5. **Le fichier `.env`** — le point le plus oublié. Fournir un modèle **sans les
   identifiants de courriel**, avec :
   - `DB_HOST=localhost`, `DB_PORT=5432`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=stage-share`
   - `JWT_SECRET` — n'importe quelle chaîne longue ; **le préciser**, sinon l'application
     refuse de démarrer avec une erreur peu parlante
   - `UPLOADS_DIR` — laisser vide, la valeur par défaut convient hors Docker
   - `OCR_DATA_DIR` — idem, `ocr-data/` est dans le dépôt
   - `EMAIL_USER` / `EMAIL_PASSWORD` — **vides**. L'envoi se désactive proprement.
   - `COURRIEL_DESTINATAIRES_AUTORISES` — expliquer que le laisser vide n'a d'effet que si
     SMTP est configuré.
6. **Lancer** : `npm install` puis `npm run dev`.
7. **Comptes de démonstration** : mot de passe `Demo1234!`, avec deux ou trois adresses
   d'exemple par rôle, plus `admin@stageshare.mg`.

### 3.3 Pièges à signaler explicitement

- **`npm install` télécharge `tesseract.js`**, mais les données linguistiques sont déjà dans
  `ocr-data/`. Aucune connexion n'est requise à la première analyse de CV.
- **Le dossier `uploads/` est ignoré par git** : il ne viendra pas avec le dépôt, d'où le
  zip séparé.
- **Le nom de base contient un tiret** : toujours entre guillemets.
- **Windows** : préciser que `psql` doit être dans le `PATH`, ou donner le chemin complet.

---

## 4. Document Word du chapitre 3

Le chantier le plus long. Objectif : un document avec **captures de chaque page**,
**annotations numérotées**, **légendes**, de niveau dissertation.

### 4.1 Outillage — décidé, vérifié disponible

| Besoin | Outil | État |
|---|---|---|
| Captures d'écran | **Playwright** | à installer (`npm i -D playwright` + `npx playwright install chromium`) |
| Annotations numérotées | **Pillow** | déjà présent |
| Génération `.docx` | **python-docx** | déjà présent |

Pandoc est absent — inutile, `python-docx` produit directement le `.docx` avec styles,
légendes et numérotation.

### 4.2 Pourquoi automatiser plutôt que capturer à la main

Quarante-quatre pages, quatre rôles, des écrans qui dépendent de données. Une capture
manuelle est à refaire entièrement au moindre changement d'interface, et rien ne garantit
que deux captures montrent le même état de la base.

Un script rejoue tout à l'identique : même jeu de données, mêmes comptes, mêmes captures.

### 4.3 Le point technique intéressant

Playwright donne la **boîte englobante** de n'importe quel élément
(`locator.boundingBox()`). On peut donc :

1. désigner par sélecteur les éléments à annoter — « le bloc de recommandations », « le
   bouton Analyser » ;
2. récupérer leurs coordonnées réelles ;
3. dessiner à ces coordonnées, avec Pillow, une pastille numérotée et un cadre.

Les annotations sont ainsi **exactes et reproductibles**, au lieu d'être placées à l'œil.

### 4.4 Ce que le script doit gérer

- **Quatre rôles** : étudiant, entreprise, université, administration. Se connecter avec les
  comptes de démonstration, conserver le jeton, capturer les pages de chacun.
- **Les pages à paramètre** : `etudiantProfil/[id]`, `offreCandidats/[id]`,
  `entrepriseModifierOffre/[id]`, `universiteCohortes/[id]`, `qcm/[id]`. Choisir des
  identifiants **réels et représentatifs**, listés dans un fichier de configuration.
- **Les pages à jeton** : `activerCompte`, `reinitialiserMotDePasse`. Créer un jeton exprès
  pour la capture, puis le laisser expirer.
- **Les états intéressants** : un profil incomplet, une liste vide, un CV analysé avec ses
  compétences détectées. Un chapitre qui ne montre que des écrans pleins ne montre pas
  l'application.
- **Résolution fixe** (1440 × 900) pour que toutes les figures aient la même échelle.

### 4.5 Structure du chapitre proposée

Un plan par **parcours** plutôt que par écran : une dissertation suit un raisonnement, pas
une arborescence de fichiers.

1. **Présentation générale** — architecture, rôles, technologies
2. **Le parcours de l'étudiant** — inscription, profil, dépôt et lecture du CV,
   recommandations, candidature, QCM, suivi
3. **Le parcours de l'entreprise** — publication d'offre, candidats suggérés, traitement
4. **Le parcours de l'université** — import d'une promotion, activation, suivi, cycle de vie
5. **L'administration** — validation des comptes, référentiel, file de courriels
6. **Les mécanismes transverses** — messagerie, sécurité, courriels

Chaque figure : **numéro** (`Figure 3.12`), **légende** sous l'image, **renvoi dans le
texte**, et un **paragraphe d'explication** qui dit ce que la figure montre et pourquoi cela
compte. Les annotations numérotées sont reprises dans le paragraphe : « ① le bloc de
recommandations, ② l'explication du rapprochement… ».

### 4.6 Livrables

- `scripts/capturer-ecrans.mjs` — les captures
- `scripts/annoter-captures.py` — les pastilles numérotées
- `scripts/generer-chapitre3.py` — le `.docx`
- `chapitre3/figures/*.png` — les images
- `chapitre3/Chapitre3.docx` — le document

Séparer les trois étapes permet de régénérer les captures sans refaire les annotations, et
inversement.

---

## Décisions à prendre au démarrage

1. **`adminRegistreInfo`** : atteignable depuis le tableau de bord d'administration ? Si
   oui, lui ajouter un retour ; sinon, la retirer.
2. **Réordonnancements de `MD/7 - UI-UX.md`** : lesquels appliquer avant les captures ? Les
   faire **après** obligerait à tout recapturer. Le rang 1 — les raisons en tête de carte de
   recommandation — a un effet direct sur ce que le chapitre 3 montrera du moteur.
3. **Langue des captures** : l'interface est en français, donc rien à faire — mais vérifier
   qu'aucun libellé anglais ne subsiste avant de capturer.
