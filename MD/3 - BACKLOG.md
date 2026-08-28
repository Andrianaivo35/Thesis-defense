# Backlog d'implémentation — Stage Share

Document de référence unique pour la mise en œuvre. Il rassemble, dans l'ordre d'exécution,
**tout ce qui doit être modifié, pourquoi, et ce qui doit être fait avant**.

Sources : [REVUE-CODE.md](1%20-%20REVUE-CODE.md) (anomalies) · [AMELIORATIONS.md](2%20-%20AMELIORATIONS.md)
(ergonomie et fonctionnalités) · [PLAN.md](PLAN.md) (nouvelles fonctionnalités du mémoire).

---

## Mode d'emploi

- Les lots sont **ordonnés par dépendance** : ne pas commencer un lot tant que le précédent
  n'est pas terminé et vérifié.
- Chaque tâche indique : **Pourquoi** (la justification), **Prérequis** (ce qui doit être
  fait avant), **Fichiers**, **À faire**, **Vérification**.
- Toute l'interface, tous les messages et tous les commentaires restent **en français**.
- Après chaque lot : vérifier sur l'instance Docker en cours d'exécution avant de continuer.

### Légende des statuts

| Symbole | Sens |
|---|---|
| ⬜ | À faire |
| 🔄 | En cours |
| ✅ | Terminé et vérifié |

---

## Vue d'ensemble

| Lot | Objet | Pourquoi maintenant |
|---|---|---|
| **0** | Déblocage et nettoyage | Rien d'autre n'est testable ni fiable avant |
| **1** | Structuration de la saisie | Socle de données propre exigé par le Lot 5 |
| **2** | Fermeture de la boucle fonctionnelle | Rend l'application cohérente pour la démonstration |
| **3** | Refonte du stockage des CV | Prépare l'ingestion de CV du mémoire |
| **4** | Passage à l'échelle et finitions | Reprend les points d'abord écartés ; prépare le Lot 5 |
| **5** | Cœur du mémoire (co-occurrence) | Arrive sur des données déjà normalisées |
| **6** | Gestion des étudiants par l'université | Valeur produit, hors contribution scientifique : après le Lot 5 |

**Principe de séquencement :** chaque lot prépare le suivant. Le Lot 5 — la contribution
scientifique — doit s'exécuter sur des données propres et structurées, sinon les métriques
d'évaluation ne voudront rien dire. C'est toute la raison de cet ordre.

---

# LOT 0 — Déblocage et nettoyage

> **Pourquoi ce lot d'abord :** il lève un verrou fonctionnel total (aucune université ne
> peut s'inscrire puis se connecter) et supprime des données parasites qui, laissées en
> place, fausseraient la matrice de co-occurrence du Lot 5. Le faire maintenant évite de
> devoir relancer l'évaluation plus tard.

## 0.1 ⬜ Unifier la valeur de `typeUtilisateur` pour les universités

**Pourquoi.** Anomalie bloquante prouvée ([REVUE-CODE C2/C3](1%20-%20REVUE-CODE.md)) :
- l'inscription écrit `'Universite'` (sans accent), la connexion cherche `'Université'`
  (avec accent) → **une université qui s'inscrit ne peut jamais se connecter** ;
- le jeton émis contient `'Université'` alors que les routes comparent à `'Universite'`
  → **une université connectée reçoit 401 sur ses propres écrans**.

**Prérequis.** Aucun. C'est le point de départ.

**Décision retenue.** Valeur canonique = **`'Universite'` sans accent**, par cohérence avec
les trois autres types (`Etudiant`, `Entreprise`, `Admin`) déjà sans accent, et pour écarter
tout problème d'encodage.

**Fichiers.**
- `src/app/api/universiteLogin/route.js` — paramètre de requête (l. 26) + `typeUtilisateur`
  signé dans le jeton (l. 68) + `typeUtilisateur` renvoyé (l. 84)
- `src/app/api/universiteRegistreInfo/route.js` — déjà correct (`'Universite'`), à laisser
- `scripts/seed-dummy-data.js` et `scripts/seed-dummy-data-2.js` — utilisent la forme
  accentuée, à aligner
- Migration SQL sur les données existantes

**À faire.**
1. Remplacer les trois occurrences accentuées dans `universiteLogin`.
2. Aligner les deux scripts de seed.
3. Migrer :
   `UPDATE utilisateur SET "typeUtilisateur" = 'Universite' WHERE "typeUtilisateur" = 'Université';`

⚠️ **Les trois doivent être faits ensemble.** Corriger le code sans migrer les données
couperait l'accès aux 15 universités existantes.

**Vérification.** Inscrire une université de test → se connecter avec → appeler
`GET /api/universiteEtudiant` → doit renvoyer 200 (et non 401). Supprimer le compte de test.

---

## 0.2 ⬜ Corriger `adminLogin` : `typeUtilisateur` manquant

**Pourquoi.** [REVUE-CODE M2](1%20-%20REVUE-CODE.md) — la réponse ne contient pas
`typeUtilisateur: 'Admin'`, contrairement aux trois autres routes de connexion.
`src/lib/auth.js` s'en sert pour choisir la page de redirection : un admin déconnecté
atterrit sur `/` au lieu de `/pages/adminLogin`.

**Prérequis.** Aucun.

**Fichiers.** `src/app/api/adminLogin/route.js` (objet `utilisateur` renvoyé, l. 77-83).

**Vérification.** Se connecter en admin, se déconnecter → doit arriver sur
`/pages/adminLogin`.

---

## 0.3 ⬜ Nettoyer les données de test résiduelles

**Pourquoi.** [AMELIORATIONS D5](2%20-%20AMELIORATIONS.md). Ces valeurs parasites polluent le
référentiel de compétences et les champs sur lesquels le moteur calcule ses scores. Elles
doivent disparaître **avant** le Lot 5, sous peine de fausser la matrice de co-occurrence et
les métriques d'évaluation. Elles apparaîtraient aussi sur les captures d'écran du mémoire.

**Prérequis.** Aucun.

**Éléments identifiés.**

| Table | Valeur parasite | Traitement |
|---|---|---|
| `CompetenceReference` | `nom = 'kjhd'`, catégorie `'welk'` | Supprimer si non référencée |
| `etudiant` | `filiere = 'filiere'` | Corriger la valeur |
| `etudiant` | `niveauAcademique = 'master'` | Normaliser en `'Master 1'` |
| `offre` | titre `'fafah'`, domaine `'bla'` | À arbitrer (voir ci-dessous) |
| `entreprise` | `'Fanomezantsoa Andrianaivo'`, adresse `'adresse'` | À arbitrer |

⚠️ **Prudence exigée.** L'entreprise n° 1 et l'étudiant n° 5 sont les comptes de test
d'origine du dépôt, et des candidatures réelles y sont rattachées (les 4 PDF de
`public/uploads/`). Une suppression en cascade détruirait ces données.
→ **Ne rien supprimer sans vérifier les références.** Par défaut : corriger les valeurs
plutôt que supprimer les entités ; demander avant toute suppression d'entité.

**Vérification.** Plus aucune valeur parasite dans les colonnes concernées ; les comptes et
candidatures existants sont intacts.

---

# LOT 1 — Structuration de la saisie

> **Pourquoi ce lot :** c'est le fil conducteur de [AMELIORATIONS](2%20-%20AMELIORATIONS.md). Des
> données structurées sont aujourd'hui saisies en texte libre, puis rattachées après coup par
> comparaison de chaînes. Cela dégrade l'ergonomie **et** la pertinence du moteur de
> recommandation, qui compare précisément ces champs.
>
> **Prérequis global du lot :** Lot 0 terminé (sans 0.1, le parcours université n'est pas
> testable).

## 1.1 ⬜ Compétences d'offre : passer par le référentiel

**Pourquoi.** [AMELIORATIONS A2](2%20-%20AMELIORATIONS.md). Incohérence au sein d'une même
fonctionnalité : la **création** d'offre saisit les compétences en texte libre, alors que la
**modification** de la même offre utilise le référentiel. Le serveur applique un
*find-or-create* : toute compétence inconnue crée une ligne dans `CompetenceReference`.
C'est l'origine exacte de l'entrée `kjhd`.

**C'est le prérequis n° 1 du [PLAN §3](PLAN.md)** : si « JavaScript », « Javascript » et
« JS » deviennent trois compétences distinctes, la matrice de co-occurrence n'a aucun sens.

**Prérequis.** 0.3 (nettoyage du référentiel).

**Fichiers.**
- `src/app/pages/entrepriseRegistreOffre/page.js` (l. 257-302) — formulaire
- `src/app/api/entrepriseRegistreOffre/route.js` (l. 74-101) — logique *find-or-create*
- Modèle à reprendre : `src/app/pages/entrepriseModifierOffre/[idOffre]/page.js`

**À faire.**
1. Charger `/api/competenceReference` dans le formulaire de création (comme le fait déjà
   l'écran de modification).
2. Remplacer les deux champs libres (nom + catégorie) par une sélection dans le référentiel
   avec recherche ; la catégorie découle de la compétence choisie.
3. Côté API : n'accepter que des `idCompetenceReference` existants ; ne plus créer de
   compétence à la volée.
4. Prévoir la proposition d'une compétence absente, marquée **en attente de validation**,
   sans injection directe dans le référentiel.

**Vérification.** Créer une offre → aucune nouvelle ligne dans `CompetenceReference` ;
proposer une compétence inconnue → elle n'apparaît pas dans le référentiel actif.

---

## 1.2 ⬜ Université : capturer `idUniversite`, pas une chaîne

**Pourquoi.** [AMELIORATIONS A1](2%20-%20AMELIORATIONS.md). Le champ est un `<datalist>` : il ne
transmet que le **texte** saisi, jamais l'identifiant. Le serveur retrouve ensuite
l'université par normalisation de chaîne, et échoue silencieusement en laissant
`idUniversite = NULL`.

Trois défauts annexes : la recherche ne porte pas sur le **sigle** (« ESPA » ne trouve rien),
`universiteList` masque les universités non vérifiées, et la route fait `SELECT *` — donc
renvoie le `logo` en base64 sur une route publique.

**Prérequis.** 0.1 (sinon le parcours université n'est pas testable de bout en bout).

**Fichiers.**
- `src/app/pages/etudiantRegistreInfo/page.js` (l. 333-356)
- `src/app/api/etudiantRegistreInfo/route.js` (l. 56-71)
- `src/app/api/universiteList/route.js`

**À faire.**
1. Composant de sélection avec recherche, stockant `idUniversite` dans l'état du formulaire.
2. Recherche tolérante côté client, sur **nom et sigle**, sans accents ni casse.
3. Case « Mon université n'est pas dans la liste » débloquant seule la saisie libre — le
   rattachement différé reste possible, mais devient l'exception.
4. API : accepter `idUniversite` en priorité, ne recourir au nom qu'à défaut.
5. `universiteList` : colonnes explicites (`idUniversite`, `nomUniversite`,
   `sigleUniversitaire`, `ville`), **sans le logo**, et ne plus filtrer sur `estVerifie`.

**Vérification.** Inscrire un étudiant en choisissant une université dans la liste →
`etudiant.idUniversite` renseigné en base (et non `NULL`).

---

## 1.3 ⬜ Listes fermées : niveau, ville, durée

**Pourquoi.** [AMELIORATIONS A3](2%20-%20AMELIORATIONS.md). Ces champs alimentent directement le
calcul de score, et la saisie libre y produit des variantes que les heuristiques doivent
deviner. Constat en base : `'Licence 3'`, `'Master 1'`, `'Master 2'` … et `'master'`.

| Champ | Fonction concernée | Effet de la normalisation |
|---|---|---|
| `niveauAcademique` / `niveauRequis` | `valeurNiveau()` | correspondance exacte au lieu d'heuristique |
| `ville` | `scoreLocalisation()` | égalité fiable |
| `duree` | `dureeEnMois()` | plus d'échec d'extraction |

**Gain pour le mémoire :** une *baseline* plus solide rend le gain mesuré du nouveau moteur
([PLAN §7](PLAN.md)) plus crédible, pas moins.

**Prérequis.** Aucun technique, mais à faire avant le Lot 5.

**Décision de périmètre.** On traite **niveau, ville, durée** (listes courtes et évidentes).
**La filière est volontairement reportée** : elle demande un vrai travail de taxonomie, et
`scoreFiliere()` tolère déjà correctement l'à-peu-près. Prévoir « Autre » partout pour ne
jamais bloquer un cas non anticipé.

---

# LOT 2 — Fermeture de la boucle fonctionnelle

> **Pourquoi ce lot :** aujourd'hui un étudiant constitue un dossier complet (CV, lettre,
> QCM chronométré) puis n'a **plus aucune visibilité**. C'est la boucle principale de
> l'application qui reste ouverte — un jury le remarquera. Les briques nécessaires existent
> déjà : il s'agit d'assemblage, pas de développement nouveau.
>
> **Prérequis global :** Lot 0. (Indépendant du Lot 1, peut être mené en parallèle.)

## 2.1 ⬜ Page « Mes candidatures » (étudiant)

**Pourquoi.** [AMELIORATIONS B1](2%20-%20AMELIORATIONS.md). Vérifié : le menu étudiant ne comporte
que 4 entrées et **il n'existe ni page ni route API** permettant à un étudiant de consulter
ses propres candidatures.

**Fichiers.** Nouvelle route API + nouvelle page + entrée dans
`src/components/etudiantNavbar.js`.

**À faire.** Liste des candidatures de l'étudiant connecté : offre, entreprise, date,
statut, note au QCM, lien vers l'offre.

---

## 2.2 ⬜ Notifier l'étudiant du changement de statut

**Pourquoi.** [AMELIORATIONS B2](2%20-%20AMELIORATIONS.md). Quand une entreprise passe une
candidature à `Recruté` ou `Refusé`, l'étudiant n'est prévenu par **aucun canal**.

Les deux mécanismes existent déjà : messagerie interne
(`trouverOuCreerConversation` dans `admin/verification/route.js`) et email
(`src/lib/mail.js`). On réutilise la messagerie interne, par cohérence avec ce qui est déjà
fait pour la validation des comptes.

**Prérequis.** 2.1 (pour que l'étudiant ait où consulter le résultat).

**Fichiers.** `src/app/api/valideRecrutementEtudiant/[idCandidature]/route.js`.

⚠️ Encadrer l'envoi par un **`SAVEPOINT`** — voir 2.4 : le même piège PostgreSQL s'applique.

---

## 2.3 ⬜ Indiquer « déjà postulé » dans la liste des offres

**Pourquoi.** [AMELIORATIONS B3](2%20-%20AMELIORATIONS.md). L'étudiant ne le découvre qu'après avoir
ouvert le QCM, via une erreur 409.

**Fichiers.** `src/app/api/listeOffre/route.js`, `src/app/pages/listeOffre/page.js`.

⚠️ `listeOffre` est une route **non authentifiée** : lire le jeton **s'il est présent**,
sans le rendre obligatoire — l'offre doit rester consultable par un visiteur non connecté.

---

## 2.4 ⬜ `SAVEPOINT` sur la vérification de compte

**Pourquoi.** [REVUE-CODE M1](1%20-%20REVUE-CODE.md). Le commentaire du code affirme que l'échec de
l'envoi du message ne doit pas annuler la vérification — or en PostgreSQL, **toute
instruction en échec avorte la transaction entière**. Le `COMMIT` échoue donc et la
vérification est perdue, alors que l'API répond « Statut mis à jour ».

**Fichiers.** `src/app/api/admin/verification/route.js` (l. 99-138).

---

# LOT 3 — Refonte du stockage des CV

> **Pourquoi ce lot :** [REVUE-CODE E2](1%20-%20REVUE-CODE.md) et [PLAN §5.4](PLAN.md) sont **le même
> chantier**. Les traiter séparément reviendrait à écrire deux fois la couche de stockage.
>
> **Prérequis :** Lot 0. À faire avant le Lot 5 si l'ingestion de CV est retenue.

**Constat prouvé.** Les CV sont écrits dans `public/uploads/candidatures/`. Or Next.js ne
sert `public/` que d'après son état **au moment du build** : un fichier ajouté à chaud
renvoie 404. En production (Docker), **une entreprise ne peut donc jamais ouvrir le CV d'un
candidat**. Le défaut est invisible en `npm run dev`. Aggravant : aucun volume Docker n'est
monté, donc chaque reconstruction d'image détruit les CV déposés.

**À faire.**
1. Sortir les fichiers de `public/` ; les stocker sur un volume Docker persistant.
2. Créer une route API authentifiée de téléchargement, vérifiant que le demandeur est bien
   l'entreprise propriétaire de l'offre ou l'étudiant lui-même.
3. Introduire l'entité `CV` du [PLAN §5.4](PLAN.md) (multi-CV, périmètre minimal).
4. Retirer les CV réels du dépôt et ajouter `public/uploads/` au `.gitignore`
   ([REVUE-CODE E1](1%20-%20REVUE-CODE.md)).

---

# LOT 4 — Passage à l'échelle et finitions

> **Pourquoi ce lot :** ces tâches avaient été volontairement écartées du périmètre initial,
> au motif qu'elles n'apportaient pas de points au mémoire. Décision revue : elles sont
> reprises ici, avant le cœur du mémoire.
>
> Deux d'entre elles ont un intérêt direct pour le Lot 5 : la pagination et la recherche
> côté serveur (4.1) deviennent nécessaires dès que les recommandations bidirectionnelles
> produiront des listes de candidats, et le référentiel de filières (4.4) est le dernier
> champ libre qui alimente encore le calcul de score.
>
> **Prérequis global :** Lots 0 à 3 terminés.

## 4.1 ⬜ Pagination et recherche côté serveur

**Pourquoi.** [AMELIORATIONS C1/C2](2%20-%20AMELIORATIONS.md). Aucune clause `LIMIT`/`OFFSET` sur
`listeOffre`, `rechercheCandidat`, `rechercheEntreprise`, `listeEntreprises` et
`messages/utilisateurs`. `GET /api/listeOffre` renvoie déjà 47 Ko pour 51 offres, et la
recherche d'offres s'effectue entièrement dans le navigateur — sur des données toutes
téléchargées, et **sans porter sur les compétences**, pourtant le critère le plus pertinent.

Le motif existe déjà dans le projet : `universiteEtudiant` et `admin/donnees` paginent.

**À faire.**
1. Pagination côté serveur sur les cinq routes, en reprenant le motif existant.
2. Déplacer la recherche d'offres côté serveur et **inclure les compétences** dans les
   champs interrogés.
3. Conserver le score de recommandation sur les résultats de recherche
   ([AMELIORATIONS C3](2%20-%20AMELIORATIONS.md)) : aujourd'hui le bloc de recommandations
   disparaît dès que l'étudiant tape un caractère, c'est-à-dire au moment précis où il
   cherche activement.

**Vérification.** Une réponse paginée reste de taille constante quel que soit le nombre
d'offres ; une recherche par nom de compétence retourne les offres correspondantes.

---

## 4.2 ⬜ Avertissement avant le QCM

**Pourquoi.** [AMELIORATIONS B4](2%20-%20AMELIORATIONS.md). La candidature et le QCM sont
indissociables : une fois envoyé, la contrainte `UNIQUE (idEtudiant, idOffre)` interdit
toute reprise. Un problème réseau ou une fermeture d'onglet en cours de QCM coûte donc
définitivement l'offre à l'étudiant, sans qu'il en ait été prévenu.

**À faire.** Avertir explicitement avant de démarrer : tentative unique, durée, ne pas
fermer la fenêtre.

**Périmètre.** La sauvegarde des réponses en cours (reprise après interruption) reste hors
périmètre : elle suppose un brouillon de candidature, donc un changement de modèle.
À mentionner en « perspectives » du mémoire.

---

## 4.3 ⬜ Durcissement des comptes

**Pourquoi.** [REVUE-CODE F2/F3/F4](1%20-%20REVUE-CODE.md).

| Point | État actuel |
|---|---|
| Politique de mot de passe | minimum 6 caractères, aucune exigence de complexité |
| Limitation de débit | aucune sur les routes de connexion → force brute possible |
| Stockage du jeton | `localStorage`, donc lisible par tout script en cas de faille XSS |

Les deux premiers ont été corrigés. **Le troisième est écarté après évaluation :** passer à
un cookie `httpOnly` impose de modifier la lecture du jeton dans les 41 routes, les quatre
routes de connexion, `fetchAuth`, la déconnexion et le téléchargement de documents — pour un
risque de régression élevé sur l'ensemble de ce qui a été construit, et un bénéfice
conditionné à l'existence d'une faille XSS par ailleurs. Le rapport coût/bénéfice ne le
justifie pas à ce stade du mémoire : à traiter en « limites et perspectives ».

⚠️ Le mot de passe administrateur ([REVUE-CODE C1](1%20-%20REVUE-CODE.md)) reste hors périmètre :
environnement de test, changement déjà prévu de votre côté.

---

## 4.4 ⬜ Référentiel de filières

**Pourquoi.** [AMELIORATIONS A3](2%20-%20AMELIORATIONS.md), volet reporté au Lot 1. La filière, la
spécialisation et le domaine restent saisis en texte libre, alors que `scoreFiliere()` les
compare par recouvrement de mots. C'est **le dernier champ libre qui alimente encore le
calcul de score**, et il sera aussi utilisé au Lot 5.

**Pourquoi c'était reporté.** Contrairement au niveau ou à la ville, une taxonomie de
filières demande un vrai travail de conception : granularité, regroupements, cas non
prévus. À traiter maintenant, mais sans sous-estimer cette part de réflexion.

**À faire.** Référentiel léger sur le modèle de `CompetenceReference`, avec « Autre » et
précision libre pour ne jamais bloquer un cas non anticipé. Normaliser les valeurs
existantes.

---

## 4.5 ⬜ Cohérence de l'interface

**Pourquoi.** [AMELIORATIONS D1 à D4](2%20-%20AMELIORATIONS.md). Sans effet sur les données, mais
directement visible sur les captures d'écran du mémoire.

- **D1** — uniformiser le vocabulaire des messages d'erreur entre les 41 routes.
- **D2** — `entrepriseRegistreOffre` impose au moins une question de QCM : une entreprise ne
  peut pas publier d'offre sans QCM. **À confirmer** — si c'est involontaire, rendre le QCM
  facultatif.
- **D3** — ✅ *évalué, portée réduite.* 18 pages sur 30 utilisent déjà `LoadingState` ; les
  12 autres sont des formulaires qui ne chargent pas de données et n'ont donc rien à
  afficher pendant un chargement. Ajouter un indicateur partout serait du bruit.
- **D4** — ✅ *évalué, reporté.* Seul `etudiantRegistreInfo` dispose d'un `StepIndicator`.
  Le candidat suivant serait `entrepriseRegistreOffre` (448 lignes), mais le convertir en
  assistant multi-étapes est une refonte, pas une finition — et ses sections sont déjà
  numérotées (1. Détails, 2. Compétences, 3. QCM), ce qui donne un repère. À traiter comme
  une amélioration d'ergonomie à part entière si le temps le permet.

---

## Extensions du Lot 4 — pages manquantes et liens morts

> **Origine :** audit des pages incomplètes mené avant d'engager le Lot 5. Rien de tout
> cela ne bloquait le moteur de recommandation, mais plusieurs de ces défauts cassent un
> parcours nominal — donc se verraient en démonstration.

## 4.6 ⬜ Tableau de bord entreprise

**Pourquoi.** Il existe un `adminDashboard` et un `universiteDashboard`, mais **aucun
`entrepriseDashboard`** — alors que l'entreprise est le rôle le plus actif. Cette absence
provoque directement **deux liens morts vérifiés (HTTP 404)** :

- `entrepriseRegistreOffre` redirige vers `/pages/entrepriseDashboard` après publication :
  l'entreprise voit « Offre publiée avec succès », puis atterrit sur une page inexistante
  deux secondes plus tard ;
- le **logo du menu entreprise** (version mobile et barre latérale) pointe vers
  `/pages/entrepriseOffre`, qui n'existe pas non plus.

**À faire.** Créer le tableau de bord : offres publiées, candidatures reçues, accès rapides.
Rediriger les deux liens morts vers cette page.

---

## 4.7 ⬜ Page « Toutes les entreprises »

**Pourquoi.** `/api/listeEntreprises` est la **seule route API sans aucun consommateur**.
Elle a pourtant été paginée et nettoyée de son `SELECT *` au Lot 4.1 — une route améliorée
que personne n'appelle. Le menu étudiant référence par ailleurs `/pages/listeEntreprises`
dans son test d'état actif, alors que la page n'existe pas.

**À faire.** Créer la page qui consomme cette route, et corriger le menu étudiant.

---

## 4.8 ⬜ Page « À propos »

**Pourquoi.** Le pied de page de l'accueil pointe vers `/pages/aPropos` → **404**.

**À faire.** Page de présentation de la plateforme.

---

## 4.9 ⬜ Ajout d'un étudiant par l'université

**Pourquoi.** `universiteAjoutEtudiant` est une **coquille vide** : 8 lignes retournant un
fragment vide, et **orpheline** — aucun lien ne pointe vers elle.

**Périmètre volontairement restreint.** On implémente l'ajout **d'un seul étudiant**.
L'import de masse relève du [Lot 6.3](#63--import-csv--excel-avec-prévisualisation) : les
deux se complètent, une université ajoutant ponctuellement un étudiant isolé après un
import de promotion.

**À faire.** Formulaire de création d'un compte étudiant rattaché à l'université connectée,
avec rattachement directement `Valide` — c'est l'université elle-même qui le crée, elle n'a
pas à valider sa propre demande.

---

## 4.10 ⬜ Statistiques du tableau de bord université

**Pourquoi.** `universiteDashboard` affiche explicitement « Statistiques détaillées à
venir » : la page existe, mais son contenu principal est un encart d'attente, avec un seul
accès rapide.

**À faire.** Remplacer l'encart par de vraies statistiques : effectifs, rattachements en
attente, candidatures, placements.

---

## 4.11 ⬜ Retirer le faux assistant conversationnel

**Pourquoi.** L'écran de messagerie contient un « Assistant Stage Share » codé en dur, qui
répond *« je ne peux pas encore te répondre intelligemment, mais bientôt je serai connecté
à une IA »*. C'est une promesse non tenue affichée à l'utilisateur.

Le [PLAN §9](PLAN.md) écarte par ailleurs explicitement tout assistant conversationnel du
périmètre du mémoire. Laisser cette amorce visible en soutenance inviterait une question
sur une fonctionnalité qu'on a justement décidé de ne pas traiter.

**À faire.** Retirer l'assistant. Le mentionner en « perspectives » du mémoire si souhaité.

---

# LOT 5 — Cœur du mémoire

> **Prérequis impératifs :** Lot 4 terminé, ainsi que 0.3 (référentiel nettoyé) et 1.1 (plus de compétences créées à
> la volée). Sans eux, la matrice de co-occurrence est calculée sur un vocabulaire pollué et
> l'évaluation ne veut rien dire.

Le détail est dans [PLAN.md](PLAN.md). Rappel de l'enchaînement :

1. **5.1** Matrice de co-occurrence des compétences ([PLAN §3](PLAN.md)) — calculable
   immédiatement sur les 51 offres existantes.
2. **5.2** Correspondance bidirectionnelle (offre → candidats), qui découle de la matrice.
3. **5.3** Conseiller contrefactuel ([PLAN §4](PLAN.md)) — réutilise le scoreur, sans
   nouvel algorithme.
4. **5.4** Ingestion de CV : OCR + extraction ([PLAN §5](PLAN.md)).
5. **5.5** Évaluation ([PLAN §7](PLAN.md)) — **à mener en parallèle de 5.1 et 5.2**, pas à la
   fin : il faut journaliser les prédictions au fil de l'eau.

Avant 5.1, trancher **[REVUE-CODE M5](1%20-%20REVUE-CODE.md)** : la colonne `Candidature.scoreMatching`
contient en réalité la **note au QCM**. Deux notions distinctes ne peuvent pas cohabiter sous
un nom ambigu → renommer l'existante `noteQCM` et réserver `scoreMatching` au score
d'adéquation.

---

# LOT 6 — Gestion des étudiants par l'université

> **Pourquoi ce lot :** une université ne s'inscrira jamais sur la plateforme si elle doit
> créer 300 comptes à la main. Aujourd'hui, `universiteAjoutEtudiant` est une **coquille
> vide** — la page existe mais ne fait aucun appel API. Et sans cycle de vie, une université
> traîne au bout de trois ans des centaines d'étudiants qui ont quitté l'établissement.
>
> **Pourquoi après le Lot 5 :** c'est de la valeur produit, pas de la contribution
> scientifique. Le Lot 5 est ce qui porte le mémoire. Ce lot garde néanmoins un intérêt en
> soutenance : à la question « comment une université intègre-t-elle 300 étudiants ? »,
> répondre « un par un » est faible.
>
> **Prérequis global :** Lots 0 à 5 terminés.

## Principe directeur : la promotion, pas l'étudiant

Une université ne raisonne pas en individus mais en **promotions**. « La L3 Informatique
2026 est diplômée » doit être une action en un geste, pas quatre-vingts.

Toute la conception en découle : l'import crée une promotion, les actions de cycle de vie
s'appliquent à une promotion entière (avec exclusion possible de quelques individus), et
l'écran université s'organise par promotion plutôt qu'en une liste de plusieurs centaines
de noms.

---

## 6.1 ⬜ Contrainte d'unicité sur l'e-mail — **prérequis strict**

**Pourquoi.** [REVUE-CODE E3](1%20-%20REVUE-CODE.md). Il n'existe **aucune contrainte
`UNIQUE`** sur `utilisateur."emailUtilisateur"`, et les routes d'inscription font
« vérifier puis insérer » sans verrou.

Ce défaut est aujourd'hui théorique. Avec un import de masse, il devient **garanti** : un
double import créerait des centaines de comptes en double, et la connexion — qui fait
`rows[0]` — deviendrait arbitraire.

**À faire.** `ALTER TABLE utilisateur ADD CONSTRAINT ... UNIQUE ("emailUtilisateur")`, et
gérer le code `23505` dans les routes d'inscription (le motif existe déjà dans
`candidature/route.js`). Ajouter également `UNIQUE ("idUtilisateur")` sur `etudiant`,
`entreprise` et `universite` — seule la table `admin` la possède.

⚠️ **Rien de ce lot ne doit être commencé avant cette tâche.**

---

## 6.2 ⬜ Jetons à usage unique : activation et réinitialisation

**Pourquoi.** Deux besoins, une seule mécanique. Plutôt qu'un mot de passe temporaire envoyé
en clair, l'étudiant reçoit un **lien d'activation à usage unique** :

- aucun mot de passe ne circule dans un e-mail qui restera dans la boîte de réception ;
- l'étudiant choisit son mot de passe, donc il respecte la politique posée au Lot 4.3 ;
- c'est **exactement le même mécanisme que la réinitialisation** que doit pouvoir demander
  un étudiant. On construit une fois, on utilise deux fois.

**À faire.**
- Table de jetons : `idUtilisateur`, type (`activation` / `reinitialisation`), jeton
  **haché** (jamais en clair en base), date d'expiration, date d'utilisation.
- Usage unique et expiration courte (24 h pour l'activation, 1 h pour la réinitialisation).
- Route de demande de réinitialisation qui **ne révèle pas si l'e-mail existe** — sinon elle
  devient un outil d'énumération de comptes.
- Réutiliser la limitation de débit du Lot 4.3 sur ces routes.

**Vérification.** Un jeton ne fonctionne qu'une fois ; un jeton expiré est refusé ; une
demande sur un e-mail inexistant renvoie la même réponse qu'un e-mail valide.

---

## 6.3 ⬜ Import CSV / Excel avec prévisualisation

**Pourquoi.** C'est la fonctionnalité qui rend la plateforme adoptable par un établissement.

**À faire.**
1. **Prévisualisation obligatoire.** Le fichier est d'abord entièrement validé, puis un
   récapitulatif est affiché — « 287 comptes seront créés, 11 e-mails déjà existants,
   2 niveaux inconnus » — avant toute écriture. Un import qui échoue à la ligne 47 sans
   prévisualisation laisse l'université dans un état qu'elle ne comprend pas.
2. Création **en une transaction** après confirmation.
3. Colonnes attendues : nom, prénom, e-mail, matricule, niveau, filière, spécialisation.
   Les trois derniers sont validés contre les référentiels des Lots 1.3 et 4.4.
4. **CSV en priorité** ; le format XLSX impose une dépendance de parsing supplémentaire, à
   n'ajouter que si le besoin est confirmé.

⚠️ **Point de performance.** bcrypt au coût 10, multiplié par 300 étudiants, représente 15 à
30 secondes dans une seule requête HTTP. Il faut traiter par lots ou en tâche de fond, sinon
la requête expire.

---

## 6.4 ⬜ Promotions

**Pourquoi.** Unité de gestion (voir le principe directeur). Sans elle, les actions du 6.5
sont inutilisables à l'échelle réelle.

**À faire.** Rattacher chaque étudiant importé à une promotion (libellé + année), et
organiser l'écran université par promotion.

**À trancher pendant la conception :** l'articulation avec `AnnonceCohorte` et
`EtudiantExterne`, qui constituent aujourd'hui une **seconde notion parallèle** d'étudiant
rattaché à une université (3 lignes en base, sans compte, avec CV). Soit la promotion les
remplace, soit les deux cohabitent avec un rôle clairement distinct — mais laisser deux
mécanismes concurrents sans arbitrage serait une dette.

---

## 6.5 ⬜ Cycle de vie du rattachement

**Pourquoi.** Une université doit pouvoir signaler qu'un étudiant a terminé ses études, ou
qu'il a quitté l'établissement. Sans cela, sa liste ne cesse de croître.

**À faire.** Étendre `statutRattachement`, créé au Lot 1.2b :

| Statut | Effet |
|---|---|
| `En attente`, `Valide`, `Refuse` | existants |
| `Diplome` | **conserve** `idUniversite` — l'étudiant reste sur la plateforme, affiché « Ancien étudiant de X » |
| `Sorti` | détache : départ ou exclusion |

Un diplômé continue de recevoir des recommandations et de candidater : c'est l'intention.
L'écran université sépare les étudiants actifs des anciens, et les statistiques les comptent
distinctement.

Actions applicables à une promotion entière, avec exclusion possible de quelques individus.
Notifier l'étudiant du changement, en réutilisant la messagerie interne du Lot 2.2.

---

## 6.6 ⬜ Intégration de l'envoi d'e-mails — **en dernier**

**Pourquoi en dernier.** C'est une intégration technique, pas une conception : elle n'apporte
aucune décision structurante et peut être branchée à la fin.

**État actuel.** `src/lib/mail.js` existe et contient déjà un modèle de message (validation de
compte), mais **l'envoi n'a jamais fonctionné** : `EMAIL_USER` et `EMAIL_PASSWORD` sont vides
dans `.env`. Aucun e-mail n'a donc jamais été émis par l'application.

**Ce qui peut être préparé en amont, sans attendre l'intégration :**
- les **modèles de messages** (activation, réinitialisation, bienvenue après import,
  notification de diplomation), sur le modèle de `envoyerEmailValidation` déjà écrit ;
- une **couche d'envoi neutre** qui journalise le message en développement et l'envoie
  réellement en production, pour que tout le reste du lot soit testable sans serveur SMTP.

**Ce qui reste à l'intégration finale :** configurer un compte d'envoi réel (Gmail exige un
mot de passe d'application, pas le mot de passe du compte), et gérer l'envoi **par lots** —
300 e-mails synchrones dans une requête expireraient.

---

# Volontairement écarté

Nommé ici pour que le périmètre ne dérive pas.

| Écarté | Raison |
|---|---|
| **[REVUE-CODE C1](1%20-%20REVUE-CODE.md)** — mot de passe admin | Écarté à votre demande : environnement de test, changement déjà prévu. |
| **Reprise d'un QCM interrompu** | Suppose un brouillon de candidature, donc un changement de modèle. Voir 4.2 : on se limite à l'avertissement. Relève des « perspectives ». |
| **Validation du rattachement par l'université** | ✅ Finalement implémenté au Lot 1.2b. |

---

# Journal d'avancement

| Lot | Tâche | Statut | Date |
|---|---|---|---|
| 0 | 0.1 Unification `typeUtilisateur` | ✅ | 27/08/2026 |
| 0 | 0.2 `adminLogin` — `typeUtilisateur` | ✅ | 27/08/2026 |
| 0 | 0.3 Nettoyage des données de test | ✅ | 27/08/2026 |
| 1 | 1.1 Compétences d'offre par référentiel | ✅ | 27/08/2026 |
| 1 | 1.2 Sélecteur d'université | ✅ | 27/08/2026 |
| 1 | 1.2b Rattachement validé par l'université | ✅ | 27/08/2026 |
| 1 | 1.3 Listes fermées niveau/ville/durée | ✅ | 27/08/2026 |
| 2 | 2.1 Page « Mes candidatures » | ✅ | 28/08/2026 |
| 2 | 2.2 Notification de statut | ✅ | 28/08/2026 |
| 2 | 2.3 Indicateur « déjà postulé » | ✅ | 28/08/2026 |
| 2 | 2.4 `SAVEPOINT` vérification | ✅ | 28/08/2026 |
| 3 | Refonte stockage CV + multi-CV | ✅ | 28/08/2026 |
| 4 | 4.1 Pagination et recherche serveur | ✅ | 28/08/2026 |
| 4 | 4.2 Avertissement avant le QCM | ✅ | 28/08/2026 |
| 4 | 4.3 Durcissement des comptes | ✅ | 28/08/2026 |
| 4 | 4.4 Référentiel de filières | ✅ | 28/08/2026 |
| 4 | 4.5 Cohérence de l'interface | ✅ | 28/08/2026 |
| 4 | 4.6 Tableau de bord entreprise | ✅ | 28/08/2026 |
| 4 | 4.7 Page « Toutes les entreprises » | ✅ | 28/08/2026 |
| 4 | 4.8 Page « À propos » | ✅ | 28/08/2026 |
| 4 | 4.9 Ajout d'un étudiant par l'université | ✅ | 28/08/2026 |
| 4 | 4.10 Statistiques tableau de bord université | ✅ | 28/08/2026 |
| 4 | 4.11 Retrait du faux assistant | ✅ | 28/08/2026 |
| 5 | Cœur du mémoire | ⬜ | |
| 6 | 6.1 Unicité de l'e-mail (prérequis) | ⬜ | |
| 6 | 6.2 Jetons activation / réinitialisation | ⬜ | |
| 6 | 6.3 Import CSV avec prévisualisation | ⬜ | |
| 6 | 6.4 Promotions | ⬜ | |
| 6 | 6.5 Cycle de vie du rattachement | ⬜ | |
| 6 | 6.6 Intégration e-mail | ⬜ | |
