# Installer Stage Share sur un poste, sans Docker

> Procédure complète pour reprendre le projet avec ses données réelles sur une machine
> disposant de PostgreSQL installé normalement — sans Docker.
>
> Comptez une vingtaine de minutes, dont l'essentiel en téléchargements.

---

## 1. Ce dont vous avez besoin

| Logiciel | Version | Vérifier avec |
|---|---|---|
| **Node.js** | 20 ou plus | `node --version` |
| **PostgreSQL** | 16 ou plus | `psql --version` |
| **Git** | — | `git --version` |

Sur Windows, `psql` n'est pas dans le `PATH` par défaut. Il se trouve dans
`C:\Program Files\PostgreSQL\16\bin`. Ajoutez-le, ou donnez le chemin complet à chaque
commande.

Et les trois fichiers de ce dossier :

| Fichier | Contenu |
|---|---|
| `donnees.sql` | toutes les données : comptes, offres, candidatures, CV, promotions… |
| `uploads.tar.gz` | les fichiers PDF des CV |
| `INSTALLATION.md` | ce document |

---

## 2. Récupérer le code

```bash
git clone git@github.com:Andrianaivo35/Thesis-defense.git stage-share
cd stage-share
npm install
```

`npm install` télécharge aussi le moteur de reconnaissance de caractères. **Les données
linguistiques sont déjà dans le dépôt** (`ocr-data/fra.traineddata`) : la lecture des CV
numérisés fonctionnera même sans connexion.

---

## 3. Créer la base

Le nom contient un tiret. **Il doit toujours être entre guillemets**, sans quoi PostgreSQL
lit une soustraction.

```bash
psql -U postgres -c "CREATE DATABASE \"stage-share\";"
```

---

## 4. Configurer

```bash
cp .env.example .env
```

Puis ouvrez `.env` et renseignez **deux** choses. Les autres peuvent rester vides.

**a. Le mot de passe PostgreSQL**

```
DB_PASSWORD=votre_mot_de_passe_postgres
```

**b. La clé de signature des sessions** — sans elle, l'application refuse de démarrer, avec
un message qui n'indique pas la cause.

Engendrez-en une :

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

et recopiez le résultat :

```
JWT_SECRET=le_resultat_de_la_commande
```

> **Laissez `EMAIL_USER` et `EMAIL_PASSWORD` vides.** L'envoi de courriel se désactive alors
> proprement : l'application fonctionne, les messages sont mis en file sans être expédiés,
> et les liens d'activation sont rendus à l'écran pour être transmis à la main.

---

## 5. Charger le schéma et les données

Une seule commande. Elle applique les migrations, puis charge les données **si la base est
vide**.

```bash
npm run base:init
```

Vous devez voir :

```
[base] application des migrations...
[base] base vide — chargement du jeu de donnees...
[base] jeu de donnees charge — 79 utilisateurs
```

> Si vous préférez charger les données à la main, `donnees.sql` de ce dossier est le même
> fichier que `prisma/seed.sql` du dépôt :
> `psql -U postgres -d "stage-share" -f donnees.sql`
> — mais lancez d'abord `npm run base:migrer` pour créer les tables.

---

## 6. Installer les CV

Les fichiers PDF ne sont **pas** dans le dépôt : ce sont des données personnelles, et
`uploads/` est volontairement exclu de git.

```bash
mkdir -p uploads
tar --force-local -xzf ../uploads.tar.gz -C uploads/
```

**Le `mkdir` n'est pas facultatif.** `uploads/` est exclu de git : il n'existe pas après un
clone, et `tar` ne crée jamais son dossier de destination. Sans lui :
`tar: uploads: Cannot open: No such file or directory`.

**`--force-local` est nécessaire sous Windows** dès que le chemin de l'archive commence par
une lettre de lecteur. `tar` lit le `C:` de `C:/Users/...` comme un nom de machine distante
et tente de s'y connecter : `tar (child): Cannot connect to c: resolve failed`. L'option lui
dit que le chemin est local. Un chemin **relatif** (`../uploads.tar.gz`) évite le problème
sans elle.

Sous Windows sans `tar`, décompressez l'archive avec l'explorateur de façon à obtenir :

```
stage-share/
  uploads/
    cv/       ← 38 fichiers PDF
    lettres/
```

**Sans cette étape, les CV existent en base mais aucun ne s'ouvre** — l'écran affiche
« document indisponible ».

---

## 7. Démarrer

```bash
npm run dev
```

L'application répond sur **http://localhost:3000**.

---

## 8. Se connecter

Tous les comptes de démonstration partagent le mot de passe **`Demo1234!`**.

| Rôle | Adresse |
|---|---|
| Étudiant | `malala.rakotoarivelo@demo.stageshare.mg` |
| Étudiant *(CV numérisé, pour voir l'OCR)* | `lova.razanadrakoto@demo.stageshare.mg` |
| Entreprise | `contact@telma.demo.stageshare.mg` |
| Université | `contact@ua.demo.stageshare.mg` |
| Administration | `admin@stageshare.mg` |

---

## 9. Vérifier que tout fonctionne

Trois gestes qui éprouvent la chaîne entière :

1. **Connectez-vous en étudiant** et ouvrez « Offres de stage ». Le bloc de recommandations
   doit afficher des offres avec le motif du rapprochement.
2. **Ouvrez « Mes CV »**, puis « Analyser ce CV ». Sur le compte `lova.razanadrakoto`, le CV
   est numérisé : l'analyse doit annoncer une lecture par reconnaissance de caractères et
   proposer des compétences.
3. **Connectez-vous en université** et ouvrez « Mes étudiants ». Les promotions doivent
   apparaître, avec leurs effectifs.

---

## Si quelque chose ne va pas

| Message | Cause | Solution |
|---|---|---|
| `JWT_SECRET n'est pas défini` | étape 4b oubliée | renseignez `JWT_SECRET` dans `.env` |
| `database "stage-share" does not exist` | étape 3 | les guillemets autour du nom |
| `password authentication failed` | `DB_PASSWORD` | vérifiez le mot de passe PostgreSQL |
| `Document indisponible` sur un CV | étape 6 | l'archive n'est pas décompressée au bon endroit |
| `[base] ... utilisateurs deja presents` | la base n'est pas vide | normal si vous relancez ; pour repartir de zéro, supprimez et recréez la base |
| `ECONNREFUSED ::1:5432` | PostgreSQL n'écoute pas | démarrez le service, ou mettez `DB_HOST=127.0.0.1` |

### Repartir de zéro

```bash
psql -U postgres -c "DROP DATABASE IF EXISTS \"stage-share\";"
psql -U postgres -c "CREATE DATABASE \"stage-share\";"
npm run base:init
```

---

## Pour information : ce que fait `npm run base:init`

Deux choses, dans cet ordre.

1. **`prisma migrate deploy`** applique les migrations manquantes. Prisma tient un registre
   en base (`_prisma_migrations`) : une base à jour ne rejoue rien, une base en retard
   rattrape exactement ce qui lui manque. C'est aussi la commande à relancer après un `git
   pull` qui apporterait une migration.
2. **Le chargement des données**, **uniquement si la base est vide**. Sans cette condition,
   chaque démarrage écraserait le travail en cours.

Les deux autres commandes utiles :

```bash
npm run base:etat      # où en est la base
npm run base:migrer    # appliquer les migrations sans toucher aux données
```
