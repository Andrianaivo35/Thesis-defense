# Améliorations des fonctionnalités existantes — Stage Share

Date : 27/08/2026
Périmètre : **amélioration fonctionnelle et ergonomique de l'existant**, avant l'ajout des
nouvelles fonctionnalités décrites dans [PLAN.md](PLAN.md).
Les failles de sécurité sont traitées séparément dans [REVUE-CODE.md](REVUE-CODE.md).

> **Aucune modification n'a été appliquée.** Ce document est une liste de travail destinée à
> être implémentée ensuite.
>
> **Rappel de langue :** toute l'interface, tous les messages et tous les commentaires
> doivent rester **en français**, conformément à l'existant.

---

## Le fil conducteur : la saisie libre

La quasi-totalité des problèmes ci-dessous relève d'une même cause : **des informations
structurées sont saisies en texte libre**, puis le serveur tente de les rattacher après coup
par comparaison de chaînes.

L'exemple de l'université est le plus visible, mais le même schéma se répète pour les
compétences, la filière, le niveau académique et la ville.

**Ce n'est pas qu'un problème de confort.** Le moteur de recommandation compare ces champs
par similarité de texte (`recouvrement()`, `valeurNiveau()` dans
`src/app/api/recommandations/route.js`). Chaque variante d'écriture dégrade directement la
qualité des correspondances — et dégradera encore plus la matrice de co-occurrence prévue
au [PLAN §3](PLAN.md), qui suppose un vocabulaire de compétences propre.

**Preuve en base aujourd'hui :**

```
niveauAcademique : 'Licence 3' · 'Master 1' · 'Master 2' · 'master'   ← 4e variante parasite
filiere          : 'Informatique' · 'Gestion' · … · 'filiere'          ← valeur littérale « filiere »
CompetenceReference : 'Javascript' · 'React' · 'SQL' · 'kjhd' (catégorie « welk »)
```

Structurer la saisie améliore donc **à la fois** l'ergonomie **et** la pertinence de la
recommandation. C'est le meilleur rapport effort/valeur de cette liste.

---

## 🔴 PRIORITÉ 1 — Données structurées

### A1. Le choix de l'université ne capture jamais son identifiant

**Fichiers :** `src/app/pages/etudiantRegistreInfo/page.js:333-356`,
`src/app/api/etudiantRegistreInfo/route.js:56-71`, `src/app/api/universiteList/route.js`

**Constat.** Le champ est un `<input list="liste-universites">` (datalist). Un `datalist`
n'est qu'une **suggestion** : il n'oblige à rien et, surtout, **il ne transmet que le texte
saisi — jamais `idUniversite`**.

Le serveur tente ensuite de retrouver l'université par normalisation de chaîne
(`normalizeName` + `regexp_replace` SQL). En cas d'échec : `idUniversite = NULL`, et le nom
brut est conservé dans `nomUniversiteSaisi` en espérant un rattachement futur.

Conséquences concrètes :
- L'étudiant peut sélectionner la bonne université dans la liste et **rester quand même non
  rattaché** si la normalisation échoue (ponctuation, apostrophe typographique `'` vs `'`,
  abréviation).
- Un étudiant tapant « ESPA » ne trouve **rien** : la liste ne contient que les noms
  complets, pas les sigles. Or `sigleUniversitaire` existe en base.
- `universiteList` ne renvoie que les universités `estVerifie = true` → les universités
  inscrites mais non encore validées sont invisibles.
- La route fait `SELECT *` : elle renvoie tout, **y compris `logo`** (stocké en base64).
  C'est une route publique, sans authentification.

**Amélioration.**
1. Remplacer le `datalist` par un vrai composant de sélection avec recherche (autocomplete)
   qui stocke `idUniversite` dans l'état du formulaire et l'envoie au serveur.
2. Rendre la recherche tolérante côté client : sur le **nom ET le sigle**, sans accents ni
   casse.
3. Conserver une porte de sortie explicite — case à cocher
   « Mon université n'est pas dans la liste » — qui seule débloque la saisie libre. Le
   rattachement différé actuel reste alors le repli, mais devient l'exception assumée plutôt
   que le cas courant.
4. Côté API : accepter `idUniversite` en priorité ; ne recourir au rapprochement par nom que
   si l'identifiant est absent.
5. Corriger `universiteList` : sélectionner explicitement les colonnes utiles
   (`idUniversite`, `nomUniversite`, `sigleUniversitaire`, `ville`) — **sans le logo** — et
   ne plus filtrer sur `estVerifie` (ou exposer le statut pour l'afficher).

---

### A2. Les compétences d'une offre sont saisies en texte libre — et polluent le référentiel

**Fichiers :** `src/app/pages/entrepriseRegistreOffre/page.js:270-274`,
`src/app/api/entrepriseRegistreOffre/route.js:74-101`

**Constat — incohérence flagrante au sein d'une même fonctionnalité :**

| Écran | Mode de saisie |
|---|---|
| Inscription étudiant (`etudiantRegistreInfo`) | ✅ liste déroulante par `idCompetenceReference` |
| Modification profil étudiant | ✅ liste déroulante |
| **Création d'offre** (`entrepriseRegistreOffre`) | ❌ **deux champs texte libres** (nom + catégorie) |
| Modification d'offre (`entrepriseModifierOffre`) | ✅ liste déroulante |

Créer une offre se fait en texte libre, mais **modifier la même offre** utilise le
référentiel. Le formulaire de création n'appelle même pas `/api/competenceReference`, qui
existe pourtant déjà.

Côté serveur, la logique est un *find-or-create* insensible à la casse : toute compétence
inconnue **crée une nouvelle ligne** dans `CompetenceReference`. C'est très exactement
l'origine de l'entrée `kjhd` / catégorie `welk` présente en base.

Sans correction, on obtiendra « JavaScript », « Javascript », « JS » et « java script »
comme quatre compétences distinctes — et la matrice de co-occurrence du [PLAN §3](PLAN.md)
n'aura **aucun sens**.

**Amélioration.**
1. Aligner le formulaire de création sur celui de modification : sélection dans le
   référentiel, avec recherche.
2. Autoriser la proposition d'une compétence absente, mais la marquer **« en attente de
   validation »** plutôt que de l'injecter directement dans le référentiel (cf. le principe
   déjà retenu au [PLAN §5.2, étape 5](PLAN.md)).
3. La catégorie ne doit plus être un champ libre : elle découle de la compétence choisie.
4. Nettoyer les entrées parasites existantes avant tout calcul de co-occurrence.

---

### A3. Filière, niveau, ville et durée : saisie libre sur des champs que le moteur compare

**Fichiers :** `etudiantRegistreInfo/page.js:325-361`, `entrepriseRegistreOffre/page.js`,
`etudiantModifierProfil/page.js`

Ces champs alimentent directement le calcul de score :

| Champ | Utilisé par | Risque actuel |
|---|---|---|
| `niveauAcademique` / `niveauRequis` | `valeurNiveau()` | `'master'` ≠ `'Master 1'` ≠ `'M1'` ≠ `'Bac+4'` |
| `filiere` / `specialisation` / `domaine` | `scoreFiliere()` (recouvrement de mots) | toute variante fait chuter le score |
| `ville` | `scoreLocalisation()` (égalité stricte après normalisation) | `'Tana'` ≠ `'Antananarivo'` |
| `duree` | `dureeEnMois()` (extraction par regex) | `'6 mois'` OK, `'un semestre'` → `null` |

**Amélioration.** Passer ces champs en listes fermées :
- **Niveau académique** : liste fixe (Licence 1/2/3, Master 1/2, Doctorat, BTS/DUT).
  `valeurNiveau()` devient alors une simple correspondance, plus une heuristique.
- **Ville** : liste des principales villes malgaches + « Autre ».
- **Durée** : liste (1, 2, 3, 4, 6 mois, 12 mois).
- **Filière / domaine** : référentiel léger, sur le modèle de `CompetenceReference`.
  ⚠️ C'est le point qui demande le plus de réflexion — prévoir « Autre » avec précision
  libre pour ne pas bloquer un cas non prévu.

> 💡 **Gain direct sur le mémoire :** une fois ces champs normalisés, les scores
> `niveau`/`localisation`/`préférence` deviennent exacts au lieu d'heuristiques. Cela renforce
> la *baseline* du chapitre évaluation ([PLAN §7](PLAN.md)) — et une baseline plus solide rend
> le gain mesuré du nouveau moteur **plus crédible**, pas moins.

---

## 🟠 PRIORITÉ 2 — Parcours incomplets

### B1. L'étudiant ne peut pas suivre ses candidatures

**Constat.** ✅ Vérifié : le menu étudiant (`src/components/etudiantNavbar.js`) ne comporte
que 4 destinations — Offres, Messages, Entreprises, Profil. **Il n'existe ni page ni route
API permettant à un étudiant de consulter ses propres candidatures.**

`entrepriseCandidature` existe (vue entreprise), mais aucun équivalent côté étudiant.

Aujourd'hui, un étudiant qui a constitué un dossier complet — CV, lettre de motivation, QCM
chronométré — n'a **plus aucune visibilité** ensuite : ni la liste de ses candidatures, ni
leur statut (`En attente` / `Recruté` / `Refusé`), ni la date, ni sa note au QCM.

C'est la boucle principale de l'application qui reste ouverte.

**Amélioration.** Créer une page « Mes candidatures » + la route API correspondante :
liste des candidatures de l'étudiant connecté avec offre, entreprise, date, statut, note au
QCM, et lien vers l'offre. Ajouter l'entrée au menu.

---

### B2. Aucune notification lors d'un changement de statut

**Fichier :** `src/app/api/valideRecrutementEtudiant/[idCandidature]/route.js`

Quand une entreprise passe une candidature à `Recruté` ou `Refusé`, **rien n'est notifié à
l'étudiant**. Il n'y a ni message interne, ni email.

Pourtant les deux mécanismes existent déjà dans le projet :
- messagerie interne — `admin/verification/route.js` sait créer une conversation et poster
  un message automatique (`trouverOuCreerConversation`) ;
- email — `src/lib/mail.js` (`envoyerEmailValidation`).

**Amélioration.** Réutiliser `trouverOuCreerConversation` pour envoyer un message interne
automatique à l'étudiant lors du changement de statut. C'est cohérent avec ce qui est déjà
fait pour la validation des comptes, et cela ne demande aucune brique nouvelle.
⚠️ Encadrer par un `SAVEPOINT` — voir [REVUE-CODE.md M1](REVUE-CODE.md), le même piège
s'applique.

---

### B3. On ne découvre qu'on a déjà postulé qu'après avoir cliqué

**Fichiers :** `src/app/api/listeOffre/route.js` (aucune jointure sur `Candidature`),
`src/app/api/qcm/[idOffre]/route.js:28-33`

La liste des offres n'indique pas lesquelles ont déjà fait l'objet d'une candidature.
L'étudiant clique, ouvre le QCM, et reçoit alors une erreur 409 « Vous avez déjà postulé ».

**Amélioration.** Dans `listeOffre`, ajouter pour un étudiant connecté un booléen
`dejaPostule` (et le statut), puis afficher un badge sur la carte de l'offre et désactiver
le bouton « Postuler ».

> Remarque : `listeOffre` est actuellement une route **non authentifiée**. Il faudra lire le
> jeton s'il est présent, sans le rendre obligatoire (l'offre doit rester consultable par un
> visiteur non connecté).

---

### B4. Le QCM est à tentative unique, sans avertissement clair

**Fichier :** `src/app/pages/qcm/[idOffre]/page.js`

La candidature et le QCM sont indissociables : une fois envoyé, `Candidature` est créé et
la contrainte `UNIQUE (idEtudiant, idOffre)` interdit toute reprise. Un problème réseau ou
une fermeture d'onglet en cours de QCM peut donc coûter définitivement l'offre à l'étudiant.

**Amélioration.** À arbitrer selon l'intention pédagogique :
- au minimum, **avertir explicitement** avant de démarrer (« une seule tentative, durée X
  minutes, ne fermez pas la fenêtre ») ;
- idéalement, sauvegarder les réponses en cours pour permettre une reprise.

---

## 🟡 PRIORITÉ 3 — Listes et recherche

### C1. Aucune pagination sur les listes

✅ Vérifié — aucune clause `LIMIT`/`OFFSET` dans : `listeOffre`, `rechercheCandidat`,
`rechercheEntreprise`, `listeEntreprises`, `messages/utilisateurs`.
*(`universiteEtudiant` et `admin/donnees` en ont : le motif existe déjà dans le projet.)*

`GET /api/listeOffre` renvoie aujourd'hui **47 Ko pour 51 offres**, compétences incluses.
La croissance est linéaire et sans limite.

**Amélioration.** Pagination côté serveur sur ces cinq routes, en reprenant le motif déjà
présent dans `universiteEtudiant`.

### C2. La recherche d'offres est entièrement côté client

**Fichier :** `src/app/pages/listeOffre/page.js:69-77`

Toutes les offres sont téléchargées, puis filtrées en mémoire dans le navigateur. Le filtre
porte sur titre, description, entreprise, ville et domaine — **mais pas sur les
compétences**, alors que c'est le critère le plus pertinent pour un étudiant.

**Amélioration.** Déplacer la recherche côté serveur (elle devient de toute façon
nécessaire avec la pagination C1) et **inclure les compétences** dans le champ de recherche.

### C3. Les recommandations disparaissent pendant une recherche

**Fichier :** `src/app/pages/listeOffre/page.js:145` — condition `estEtudiant && !searchTerm`.

Dès que l'étudiant tape un caractère, le bloc de recommandations disparaît entièrement.

**Amélioration.** Conserver le score de recommandation sur les résultats de recherche (par
exemple en affichant le score sur chaque carte), plutôt que de masquer la fonctionnalité au
moment précis où l'étudiant cherche activement.

---

## 🔵 PRIORITÉ 4 — Cohérence et finitions

- **D1.** Uniformiser les intitulés et le vocabulaire des messages d'erreur entre les 41
  routes (« Non autorisé » vs « Non autorisée », etc.).
- **D2.** `entrepriseRegistreOffre` impose au moins une question de QCM
  (`route.js:37-39`) : une entreprise ne peut pas publier une offre sans QCM. À confirmer —
  si c'est involontaire, rendre le QCM facultatif.
- **D3.** Les indicateurs de chargement sont hétérogènes (`LoadingState`, texte brut,
  parfois rien). Uniformiser.
- **D4.** Aucun retour visuel de progression sur les formulaires longs
  (`etudiantRegistreInfo` fait plus de 500 lignes et enchaîne plusieurs sections) :
  un fil d'Ariane ou une barre d'étapes améliorerait nettement le taux de complétion.
- **D5.** Nettoyer les données de test résiduelles (offre « fafah » / domaine « bla »,
  entreprise « Fanomezantsoa Andrianaivo », compétence « kjhd », filière « filiere »,
  niveau « master ») — indispensable avant le calcul de la matrice de co-occurrence et
  avant toute capture d'écran pour le mémoire.

---

## Ordre d'implémentation conseillé

L'ordre est choisi pour que chaque étape prépare la suivante, et pour que les nouvelles
fonctionnalités du PLAN arrivent sur des données déjà propres.

**Étape 1 — Structurer la saisie** *(le socle : tout le reste en dépend)*
1. D5 — nettoyage des données de test
2. A2 — compétences d'offre via le référentiel *(débloque la co-occurrence du PLAN)*
3. A1 — sélecteur d'université avec `idUniversite`
4. A3 — listes fermées pour niveau, ville, durée, filière

**Étape 2 — Fermer la boucle fonctionnelle**
5. B1 — page « Mes candidatures » + route API
6. B2 — notification de changement de statut
7. B3 — indicateur « déjà postulé » dans la liste des offres

**Étape 3 — Passage à l'échelle**
8. C1 — pagination
9. C2 — recherche côté serveur, compétences incluses
10. C3 — recommandations conservées pendant la recherche

**Étape 4 — Finitions**
11. B4, D1 à D4

---

## Articulation avec les autres documents

| Sujet | Document |
|---|---|
| Failles de sécurité et anomalies bloquantes | [REVUE-CODE.md](REVUE-CODE.md) |
| Nouvelles fonctionnalités (OCR, co-occurrence, conseiller) | [PLAN.md](PLAN.md) |
| Améliorations de l'existant | **ce document** |

**Points de jonction à ne pas manquer :**
- **A2 est un prérequis du [PLAN §3](PLAN.md)** : la matrice de co-occurrence exige un
  référentiel de compétences propre. À faire avant, pas après.
- **A3 renforce la *baseline* du [PLAN §7](PLAN.md)** : des champs normalisés rendent la
  comparaison baseline / nouveau moteur plus honnête et plus défendable.
- **[REVUE-CODE.md E2](REVUE-CODE.md) (stockage des CV cassé en production) doit être traité
  en même temps que le multi-CV du [PLAN §5.4](PLAN.md)** — c'est la même refonte.
- Le mot de passe administrateur ([REVUE-CODE.md C1](REVUE-CODE.md)) est **volontairement
  écarté** : environnement de test, changement prévu.
- ⚠️ En revanche, [REVUE-CODE.md C2/C3](REVUE-CODE.md) (valeur `typeUtilisateur` des
  universités) reste **bloquant** : tant que ce n'est pas corrigé, aucune université ne peut
  s'inscrire puis se connecter, ce qui empêche de tester correctement A1.
