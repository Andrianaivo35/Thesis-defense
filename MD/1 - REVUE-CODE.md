# Revue de code — Stage Share (état avant nouvelles fonctionnalités)

Date de la revue : 27/08/2026
Périmètre : 41 routes API, couche `src/lib/`, schéma PostgreSQL, configuration Docker.
Méthode : lecture du code + **vérification empirique** de chaque anomalie sur l'instance
Docker en cours d'exécution. Les constats marqués ✅ **PROUVÉ** ont été reproduits.

> **Aucune correction n'a été appliquée.** Ce document liste les anomalies et propose un
> ordre de traitement, à valider avant modification.

---

## Ce qui est déjà bien fait

Il faut le dire, parce que c'est vrai et défendable en soutenance :

- **Aucune injection SQL.** Les 41 routes utilisent exclusivement des requêtes
  paramétrées (`$1, $2, …`). Aucune concaténation de chaîne dans une requête.
- **Mots de passe correctement hachés** avec bcrypt (coût 10), jamais stockés en clair.
- **Messages de connexion génériques** (« Email ou mot de passe incorrect ») : ne révèlent
  pas si un email existe — bonne pratique anti-énumération.
- **Contrôles de propriété rigoureux** sur les routes sensibles :
  `entrepriseModifierOffre`, `valideRecrutementEtudiant`, `universiteCohortes`,
  `etudiantProfil` vérifient tous que la ressource appartient bien à l'appelant.
- **Le QCM ne fuit pas les réponses** : `GET /api/qcm/[idOffre]` exclut explicitement
  `estCorrect` de la réponse JSON. C'est un piège classique, évité.
- **Transactions** (`BEGIN`/`COMMIT`/`ROLLBACK`) utilisées sur les écritures multi-tables.
- **Contraintes d'unicité métier** bien posées (`Candidature`, `CompetenceEtudiant`,
  `CompetenceOffre`, `participantConversation`).

---

## 🔴 CRITIQUE — à corriger avant toute démonstration publique

### C1. Le mot de passe administrateur est publié dans le dépôt GitHub

**Fichier :** `hash.js` (racine, versionné dans git)

```js
const motDePasse = 'admin123';   // ⚠️ choisis TON mot de passe
```

✅ **PROUVÉ** — `POST /api/adminLogin` avec `admin@gmail.com` / `admin123` retourne
`{"success":true, "token":"..."}`. Le compte admin est réellement ouvert par ce mot de passe.

Le dépôt étant sur GitHub, **n'importe qui connaissant l'URL dispose des identifiants
administrateur** : validation/dévalidation de comptes, accès aux données globales.

**Correction :**
1. Changer immédiatement le mot de passe admin.
2. Supprimer `hash.js` du dépôt et l'ajouter à `.gitignore` (c'est un utilitaire de
   développement, il n'a rien à faire dans le code livré).
3. Le mot de passe ayant été publié, il faut considérer l'historique git comme compromis :
   purge de l'historique ou, plus simple à ce stade, rotation du mot de passe suffit tant
   que l'ancien n'est plus valide nulle part.

---

### C2. Une université qui s'inscrit ne peut jamais se connecter

**Fichiers :** `src/app/api/universiteRegistreInfo/route.js:7` et
`src/app/api/universiteLogin/route.js:26`

| Opération | Valeur `typeUtilisateur` |
|---|---|
| Inscription (écriture) | `'Universite'` — **sans accent** |
| Connexion (lecture) | `'Université'` — **avec accent** |

La requête de connexion filtre sur `typeUtilisateur = 'Université'` : elle ne trouvera
jamais un compte créé par le formulaire d'inscription.

✅ **PROUVÉ** — inscription d'une université de test :
`{"message":"Enregistrement réussi","idUtilisateur":84}` → valeur stockée : `Universite` →
connexion avec le bon mot de passe : `{"error":"Email ou mot de passe incorrect"}`.
*(Le compte de test a été supprimé après vérification.)*

C'est un **verrouillage total** du parcours université : le compte est créé, l'utilisateur
croit son inscription réussie, et il ne pourra jamais entrer.

> Les 15 universités actuellement en base sont stockées avec l'accent (`'Université'`) et
> se connectent donc correctement — l'anomalie ne se voit pas avec les données de
> démonstration, elle n'apparaît qu'à la **première inscription réelle**.

---

### C3. Le jeton d'une université est refusé par les routes université

**Fichiers concernés :**
- `src/app/api/universiteLogin/route.js:68` signe le jeton avec `'Université'` (accent)
- `src/app/api/universiteEtudiant/route.js:14` compare à `'Universite'` (sans accent)
- `src/app/api/etudiantProfil/[idEtudiant]/route.js:30,32` idem
- `src/lib/auth.js:28,76` idem (redirection après déconnexion)

✅ **PROUVÉ** — connexion réussie d'une université (jeton valide obtenu), puis appel de
`GET /api/universiteEtudiant` avec ce jeton → **HTTP 401 `{"error":"Non autorisé"}`**.

Conséquence : une université connectée ne peut pas consulter ses étudiants, ni les profils
étudiants ; sa redirection de déconnexion tombe sur la page d'accueil au lieu de la page de
connexion université.

**Correction (C2 + C3 ensemble) :** choisir **une seule** valeur canonique et l'appliquer
partout. Recommandation : `'Universite'` **sans accent**, comme les trois autres types
(`Etudiant`, `Entreprise`, `Admin`) qui sont déjà sans accent — cela évite tout problème
d'encodage. Il faudra alors :
- corriger `universiteLogin` (requête + les deux `typeUtilisateur` signés/renvoyés) ;
- migrer les données existantes :
  `UPDATE utilisateur SET "typeUtilisateur"='Universite' WHERE "typeUtilisateur"='Université';`
- corriger le script de seed (`scripts/base/seed-dummy-data*.js`) qui utilise la forme accentuée.

⚠️ **Ces trois fichiers doivent être modifiés dans le même commit**, sinon on casse la
connexion des comptes existants.

---

## 🟠 ÉLEVÉ

### E1. Des CV réels de candidats sont versionnés dans le dépôt

✅ **PROUVÉ** — `git ls-files public/uploads/` retourne 4 fichiers PDF produits par le
formulaire de candidature :

```
public/uploads/candidatures/cv-5c164b25-….pdf        (157 Ko)
public/uploads/candidatures/cv-e76656b9-….pdf        (4,0 Mo)
public/uploads/candidatures/lettre-3abcdab9-….pdf    (1,5 Mo)
public/uploads/candidatures/lettre-44d066f1-….pdf    (547 Ko)
```

Ce sont des documents personnels (identité, téléphone, adresse, parcours). Ils sont dans un
dépôt Git, donc dans son historique.

✅ **PROUVÉ** également : ils sont **téléchargeables sans aucune authentification** —
`GET /uploads/candidatures/cv-5c164b25-….pdf` → **HTTP 200**.

**Correction :** retirer ces fichiers du dépôt, ajouter `public/uploads/` au `.gitignore`,
et purger l'historique si les documents concernent de vraies personnes.
*(Je n'ai pas ouvert ces PDF — à vérifier de votre côté s'il s'agit de vraies personnes ou
de fichiers de test.)*

---

### E2. Les CV téléversés sont introuvables en production (fonctionnalité cassée)

**Fichier :** `src/app/api/candidature/route.js:53-66`

Les fichiers sont écrits dans `public/uploads/candidatures/` au moment de la candidature.
Or Next.js ne sert le dossier `public/` que d'après son état **au moment du build** : un
fichier ajouté à chaud n'est pas servi.

✅ **PROUVÉ** — dans le conteneur de production :
- fichier présent au build → `HTTP 200`
- fichier créé après le build → `HTTP 404` (alors qu'il existe bien sur le disque)

Conséquence : **en production, une entreprise ne peut jamais ouvrir le CV d'un candidat.**
La candidature s'enregistre, l'URL est stockée, et le lien renvoie 404. Le défaut est
invisible en `npm run dev` (qui sert `public/` depuis le disque) et n'apparaît qu'en
`next start` — donc exactement dans le Docker que nous venons de mettre en place.

**Aggravant :** aucun volume Docker n'est monté sur ce dossier → **toute reconstruction de
l'image détruit les CV déjà déposés**.

**Correction :** ne pas stocker de fichiers utilisateur dans `public/`. Servir les CV via
une route API authentifiée (qui vérifie que le demandeur est bien l'entreprise propriétaire
de l'offre ou l'étudiant lui-même) et stocker les fichiers hors de `public/`, sur un volume
Docker persistant.

> 💡 Ce point rejoint directement le **PLAN §5.4** : la refonte du stockage des CV est de
> toute façon nécessaire pour le multi-CV. Autant traiter les deux ensemble.

---

### E3. Aucune contrainte d'unicité sur l'email

✅ **PROUVÉ** — `\d utilisateur` ne montre qu'un index : la clé primaire. La colonne
`emailUtilisateur` n'a **ni contrainte `UNIQUE` ni index**.

Les 4 routes d'inscription font `SELECT … WHERE emailUtilisateur = $1` puis `INSERT` :
c'est un schéma **TOCTOU** (vérification puis écriture, sans verrou). Deux inscriptions
simultanées avec le même email passent toutes les deux le contrôle et créent deux comptes.

Ensuite, toutes les routes de connexion font `rows[0]` : le compte retenu devient
arbitraire. L'utilisateur peut « perdre » son compte sans explication.

**Correction :**
```sql
ALTER TABLE utilisateur ADD CONSTRAINT utilisateur_email_key UNIQUE ("emailUtilisateur");
```
et gérer le code d'erreur `23505` dans les routes d'inscription (le motif existe déjà dans
`candidature/route.js:139`, il suffit de le reproduire).

*(Aucun doublon en base actuellement — la correction passera sans nettoyage préalable.)*

À ajouter aussi : `UNIQUE ("idUtilisateur")` sur `etudiant`, `entreprise` et `universite`
(seule la table `admin` la possède aujourd'hui), sinon un même compte peut porter plusieurs
profils.

---

### E4. Fuite des adresses email de tous les utilisateurs

**Fichier :** `src/app/api/messages/utilisateurs/route.js:23`

La requête retourne `u."emailUtilisateur"` pour **tous** les utilisateurs de la plateforme,
à **tout** utilisateur authentifié. N'importe quel étudiant peut ainsi récupérer l'annuaire
complet des emails (étudiants, entreprises, universités).

**Correction :** retirer `emailUtilisateur` de cette requête — l'écran de messagerie n'a
besoin que de `idUtilisateur`, `nomAffichage`, `typeUtilisateur` et `photo`.

---

### E5. Les 41 routes exposent les détails d'erreur interne

Le motif `{ error: 'Erreur serveur', details: error.message }` est présent dans
**41 routes sur 41**. En cas d'erreur SQL, le client reçoit le message PostgreSQL brut :
noms de tables, de colonnes, contraintes violées — une cartographie du schéma offerte à un
attaquant.

**Correction :** conserver `console.error(...)` côté serveur, mais ne renvoyer au client
qu'un message générique. Un utilitaire partagé (`src/lib/apiError.js`) éviterait de
répéter la correction 41 fois, et pourrait ne renvoyer `details` qu'en développement
(`process.env.NODE_ENV !== 'production'`).

---

## 🟡 MOYEN

### M1. La vérification d'un compte peut être silencieusement annulée

**Fichier :** `src/app/api/admin/verification/route.js:99-138`

Le `try/catch` interne porte ce commentaire :
> `// L'échec du message NE DOIT PAS annuler la vérification`

Or en PostgreSQL, **toute instruction en échec avorte la transaction entière** : les
commandes suivantes échouent jusqu'au `ROLLBACK`. Si l'insertion du message échoue, le
`COMMIT` de la ligne 140 échouera à son tour et **la vérification sera perdue** — l'inverse
exact de l'intention. L'API renverra pourtant « Statut de vérification mis à jour ».

**Correction :** encadrer la partie messagerie par un `SAVEPOINT` :
```sql
SAVEPOINT envoi_message;   -- avant
ROLLBACK TO SAVEPOINT envoi_message;   -- dans le catch
```

### M2. `adminLogin` omet `typeUtilisateur` dans sa réponse

**Fichier :** `src/app/api/adminLogin/route.js:77-83`

L'objet `utilisateur` renvoyé ne contient pas `typeUtilisateur: 'Admin'`, contrairement aux
trois autres routes de connexion. Or `src/lib/auth.js` s'en sert pour choisir la page de
redirection : un admin déconnecté atterrit sur `/` au lieu de `/pages/adminLogin`.

### M3. Code mort dans la gestion du 401

**Fichier :** `src/lib/auth.js:59-82`

`logout()` est appelé ligne 60 : il vide `localStorage` **et** effectue déjà une
redirection. Les lignes 62-81 lisent ensuite `getUtilisateur()` — qui vaut désormais
toujours `null` — pour calculer une « redirection intelligente » qui ne peut donc jamais
utiliser le type d'utilisateur, et déclenchent une seconde redirection.

**Correction :** calculer la destination **avant** d'appeler `logout()`, ou confier
entièrement la redirection à `logout()`.

### M4. Fichiers orphelins et absence de contrôle sur l'offre

**Fichier :** `src/app/api/candidature/route.js`

- Les fichiers sont écrits sur disque (l. 62-63) **avant** le `BEGIN` (l. 69). Si la
  transaction échoue (candidature en double), les PDF restent sur le disque sans référence.
- Aucune vérification que l'offre **existe**, est **`Active`**, et que `dateLimites` n'est
  pas dépassée : on peut candidater à une offre clôturée ou expirée.
- Le type MIME provient du client (`cv.type`) : il n'est pas vérifié à partir du contenu
  réel du fichier.

### M5. `Candidature.scoreMatching` contient en réalité la note du QCM

**Fichier :** `src/app/api/candidature/route.js:124-137`

La colonne s'appelle `scoreMatching` mais reçoit `(points obtenus / points totaux) × 100`,
c'est-à-dire **la note au QCM**, pas un score d'adéquation profil/offre.

⚠️ **À trancher avant d'implémenter le nouveau moteur** (PLAN §3) : celui-ci produira un
véritable score d'adéquation. Deux notions différentes ne peuvent pas cohabiter dans une
colonne au nom ambigu. Proposition : renommer l'existante `noteQCM` et réserver
`scoreMatching` au score de recommandation.

---

## 🔵 FAIBLE / QUALITÉ

- **F1.** `etudiantLogin/route.js:91` journalise `'Erreur login entreprise:'` — copier-coller
  depuis la route entreprise. Idem à vérifier sur les autres routes dupliquées.
- **F2.** Mot de passe : minimum 6 caractères, aucune exigence de complexité
  (`etudiantChangerMotDePasse:26` et équivalents).
- **F3.** Aucune limitation de débit sur les routes de connexion → attaque par force brute
  possible, d'autant plus que F2 autorise des mots de passe faibles.
- **F4.** Le jeton JWT est stocké dans `localStorage` (`src/lib/auth.js:4`), donc lisible
  par tout script en cas de faille XSS. Un cookie `httpOnly` serait préférable — à
  mentionner au moins dans les limites du mémoire.
- **F5.** Données de test résiduelles dans `CompetenceReference` :
  ligne `idCompetenceReference = 2` → `nom = 'kjhd'`, `catégorie = 'welk'`.
  ⚠️ **À nettoyer avant le calcul de la matrice de co-occurrence** (PLAN §3), sinon cette
  entrée parasite le référentiel de compétences.
- **F6.** Offres de test résiduelles : `offre` n° 2 (« fafah », domaine « bla »), et
  l'entreprise n° 1 nommée « Fanomezantsoa Andrianaivo » avec l'adresse « adresse ».
  Même remarque : à nettoyer avant l'évaluation, pour ne pas fausser les métriques.
- **F7.** Incohérences de nommage assumées mais à documenter : `offre."dateLimites"` (avec
  un s), `CompetenceOffre."niveauSouhaitee"` (avec un e final), tables mêlant `CamelCase`,
  `minuscule` et `avec-tiret`.

---

## Ordre de traitement proposé

**Étape 1 — Sécurité, avant toute démonstration publique**
1. C1 — rotation du mot de passe admin + suppression de `hash.js`
2. E1 — retrait des CV réels du dépôt

**Étape 2 — Fonctionnalités cassées (bloquant pour la soutenance)**
3. C2 + C3 — unification de `typeUtilisateur` (même commit + migration SQL)
4. E2 — refonte du stockage des CV → **à fusionner avec le multi-CV du PLAN §5.4**

**Étape 3 — Intégrité et confidentialité**
5. E3 — contrainte `UNIQUE` sur l'email (+ `idUtilisateur` des profils)
6. E4 — retrait de l'email dans `messages/utilisateurs`
7. E5 — utilitaire d'erreur partagé
8. M1 — `SAVEPOINT` sur la vérification

**Étape 4 — À traiter dans le même mouvement que les nouvelles fonctionnalités**
9. M5 — clarification `noteQCM` / `scoreMatching` (avant PLAN §3)
10. F5 + F6 — nettoyage des données de test (avant la matrice de co-occurrence)
11. M2, M3, M4, F1 — corrections de confort

**Non traité volontairement à ce stade :** F2, F3, F4 (politique de mot de passe,
limitation de débit, stockage du jeton). Ce sont de vrais sujets, mais ils relèvent du
durcissement en vue d'une mise en production ; ils ont davantage leur place dans la section
« limites et perspectives » du mémoire que dans le périmètre de développement actuel.

---

## Remarque de langue

Toute correction devra respecter la langue de l'application : **messages d'erreur,
libellés d'interface et commentaires en français**, conformément à l'existant
(« Non autorisé », « Email ou mot de passe incorrect », « Offre introuvable », …).
