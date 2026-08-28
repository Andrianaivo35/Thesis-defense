# Backlog d'implémentation — Stage Share

Document de référence unique pour la mise en œuvre. Il rassemble, dans l'ordre d'exécution,
**tout ce qui doit être modifié, pourquoi, et ce qui doit être fait avant**.

Sources : [REVUE-CODE.md](REVUE-CODE.md) (anomalies) · [AMELIORATIONS.md](AMELIORATIONS.md)
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
| **1** | Structuration de la saisie | Socle de données propre exigé par le Lot 4 |
| **2** | Fermeture de la boucle fonctionnelle | Rend l'application cohérente pour la démonstration |
| **3** | Refonte du stockage des CV | Prépare l'ingestion de CV du mémoire |
| **4** | Cœur du mémoire (co-occurrence) | Arrive sur des données déjà normalisées |

**Principe de séquencement :** chaque lot prépare le suivant. Le Lot 4 — la contribution
scientifique — doit s'exécuter sur des données propres et structurées, sinon les métriques
d'évaluation ne voudront rien dire. C'est toute la raison de cet ordre.

---

# LOT 0 — Déblocage et nettoyage

> **Pourquoi ce lot d'abord :** il lève un verrou fonctionnel total (aucune université ne
> peut s'inscrire puis se connecter) et supprime des données parasites qui, laissées en
> place, fausseraient la matrice de co-occurrence du Lot 4. Le faire maintenant évite de
> devoir relancer l'évaluation plus tard.

## 0.1 ⬜ Unifier la valeur de `typeUtilisateur` pour les universités

**Pourquoi.** Anomalie bloquante prouvée ([REVUE-CODE C2/C3](REVUE-CODE.md)) :
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

**Pourquoi.** [REVUE-CODE M2](REVUE-CODE.md) — la réponse ne contient pas
`typeUtilisateur: 'Admin'`, contrairement aux trois autres routes de connexion.
`src/lib/auth.js` s'en sert pour choisir la page de redirection : un admin déconnecté
atterrit sur `/` au lieu de `/pages/adminLogin`.

**Prérequis.** Aucun.

**Fichiers.** `src/app/api/adminLogin/route.js` (objet `utilisateur` renvoyé, l. 77-83).

**Vérification.** Se connecter en admin, se déconnecter → doit arriver sur
`/pages/adminLogin`.

---

## 0.3 ⬜ Nettoyer les données de test résiduelles

**Pourquoi.** [AMELIORATIONS D5](AMELIORATIONS.md). Ces valeurs parasites polluent le
référentiel de compétences et les champs sur lesquels le moteur calcule ses scores. Elles
doivent disparaître **avant** le Lot 4, sous peine de fausser la matrice de co-occurrence et
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

> **Pourquoi ce lot :** c'est le fil conducteur de [AMELIORATIONS](AMELIORATIONS.md). Des
> données structurées sont aujourd'hui saisies en texte libre, puis rattachées après coup par
> comparaison de chaînes. Cela dégrade l'ergonomie **et** la pertinence du moteur de
> recommandation, qui compare précisément ces champs.
>
> **Prérequis global du lot :** Lot 0 terminé (sans 0.1, le parcours université n'est pas
> testable).

## 1.1 ⬜ Compétences d'offre : passer par le référentiel

**Pourquoi.** [AMELIORATIONS A2](AMELIORATIONS.md). Incohérence au sein d'une même
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

**Pourquoi.** [AMELIORATIONS A1](AMELIORATIONS.md). Le champ est un `<datalist>` : il ne
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

**Pourquoi.** [AMELIORATIONS A3](AMELIORATIONS.md). Ces champs alimentent directement le
calcul de score, et la saisie libre y produit des variantes que les heuristiques doivent
deviner. Constat en base : `'Licence 3'`, `'Master 1'`, `'Master 2'` … et `'master'`.

| Champ | Fonction concernée | Effet de la normalisation |
|---|---|---|
| `niveauAcademique` / `niveauRequis` | `valeurNiveau()` | correspondance exacte au lieu d'heuristique |
| `ville` | `scoreLocalisation()` | égalité fiable |
| `duree` | `dureeEnMois()` | plus d'échec d'extraction |

**Gain pour le mémoire :** une *baseline* plus solide rend le gain mesuré du nouveau moteur
([PLAN §7](PLAN.md)) plus crédible, pas moins.

**Prérequis.** Aucun technique, mais à faire avant le Lot 4.

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

**Pourquoi.** [AMELIORATIONS B1](AMELIORATIONS.md). Vérifié : le menu étudiant ne comporte
que 4 entrées et **il n'existe ni page ni route API** permettant à un étudiant de consulter
ses propres candidatures.

**Fichiers.** Nouvelle route API + nouvelle page + entrée dans
`src/components/etudiantNavbar.js`.

**À faire.** Liste des candidatures de l'étudiant connecté : offre, entreprise, date,
statut, note au QCM, lien vers l'offre.

---

## 2.2 ⬜ Notifier l'étudiant du changement de statut

**Pourquoi.** [AMELIORATIONS B2](AMELIORATIONS.md). Quand une entreprise passe une
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

**Pourquoi.** [AMELIORATIONS B3](AMELIORATIONS.md). L'étudiant ne le découvre qu'après avoir
ouvert le QCM, via une erreur 409.

**Fichiers.** `src/app/api/listeOffre/route.js`, `src/app/pages/listeOffre/page.js`.

⚠️ `listeOffre` est une route **non authentifiée** : lire le jeton **s'il est présent**,
sans le rendre obligatoire — l'offre doit rester consultable par un visiteur non connecté.

---

## 2.4 ⬜ `SAVEPOINT` sur la vérification de compte

**Pourquoi.** [REVUE-CODE M1](REVUE-CODE.md). Le commentaire du code affirme que l'échec de
l'envoi du message ne doit pas annuler la vérification — or en PostgreSQL, **toute
instruction en échec avorte la transaction entière**. Le `COMMIT` échoue donc et la
vérification est perdue, alors que l'API répond « Statut mis à jour ».

**Fichiers.** `src/app/api/admin/verification/route.js` (l. 99-138).

---

# LOT 3 — Refonte du stockage des CV

> **Pourquoi ce lot :** [REVUE-CODE E2](REVUE-CODE.md) et [PLAN §5.4](PLAN.md) sont **le même
> chantier**. Les traiter séparément reviendrait à écrire deux fois la couche de stockage.
>
> **Prérequis :** Lot 0. À faire avant le Lot 4 si l'ingestion de CV est retenue.

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
   ([REVUE-CODE E1](REVUE-CODE.md)).

---

# LOT 4 — Cœur du mémoire

> **Prérequis impératifs :** 0.3 (référentiel nettoyé) et 1.1 (plus de compétences créées à
> la volée). Sans eux, la matrice de co-occurrence est calculée sur un vocabulaire pollué et
> l'évaluation ne veut rien dire.

Le détail est dans [PLAN.md](PLAN.md). Rappel de l'enchaînement :

1. **1.4** Matrice de co-occurrence des compétences ([PLAN §3](PLAN.md)) — calculable
   immédiatement sur les 51 offres existantes.
2. **4.2** Correspondance bidirectionnelle (offre → candidats), qui découle de la matrice.
3. **4.3** Conseiller contrefactuel ([PLAN §4](PLAN.md)) — réutilise le scoreur, sans
   nouvel algorithme.
4. **4.4** Ingestion de CV : OCR + extraction ([PLAN §5](PLAN.md)).
5. **4.5** Évaluation ([PLAN §7](PLAN.md)) — **à mener en parallèle de 4.1 et 4.2**, pas à la
   fin : il faut journaliser les prédictions au fil de l'eau.

Avant 4.1, trancher **[REVUE-CODE M5](REVUE-CODE.md)** : la colonne `Candidature.scoreMatching`
contient en réalité la **note au QCM**. Deux notions distinctes ne peuvent pas cohabiter sous
un nom ambigu → renommer l'existante `noteQCM` et réserver `scoreMatching` au score
d'adéquation.

---

# Volontairement écarté

Nommé ici pour que le périmètre ne dérive pas.

| Écarté | Raison |
|---|---|
| **C1/C2/C3** — pagination, recherche serveur | À 51 offres, ce n'est pas un problème réel et cela n'apporte aucun point au mémoire. Relève des « perspectives ». |
| **B4** — reprise du QCM en cours | On se limite à un **avertissement clair** avant de démarrer. |
| **D1 à D4** — finitions d'interface | À traiter seulement s'il reste du temps. |
| **A3 (filière)** | Reporté : demande un vrai travail de taxonomie ; `scoreFiliere()` tolère déjà l'à-peu-près. |
| **F2, F3, F4** — politique de mot de passe, limitation de débit, stockage du jeton | Durcissement de production ; leur place est dans « limites et perspectives ». |
| **[REVUE-CODE C1](REVUE-CODE.md)** — mot de passe admin | Écarté à la demande : environnement de test, changement déjà prévu. |

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
| 3 | Refonte stockage CV + multi-CV | ⬜ | |
| 4 | Cœur du mémoire | ⬜ | |
