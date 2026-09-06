# Modèle de données — pourquoi ces tables, pourquoi ces liaisons, pourquoi ces NULL

Document d'accompagnement de `11 - DIAGRAMME-DE-CLASSES.md`.
Il répond à trois questions, dans cet ordre :

1. **Pourquoi chaque table existe** — quel besoin métier elle porte, et ce qui casse sans elle.
2. **Pourquoi les tables sont reliées comme elles le sont** — sens de la clé étrangère, cardinalité, comportement à la suppression.
3. **Pourquoi certaines colonnes acceptent NULL** — il y a six raisons distinctes, et elles ne se valent pas.

Toutes les affirmations proviennent de `prisma/schema.prisma`, des migrations
(`prisma/migrations/`, `scripts/migrations/`) et du code des routes `src/app/api/`.

---

## Partie I — Les entités et leur raison d'être

### 1. Le socle : un compte, quatre rôles

| Table | Ce qu'elle porte | Pourquoi elle existe séparément |
|---|---|---|
| `utilisateur` | e-mail, mot de passe haché, type de compte, activation | **Un seul point d'authentification.** Sans elle, chaque rôle porterait son propre couple identifiant/mot de passe, et la même adresse pourrait exister trois fois avec trois mots de passe différents. |
| `admin` | identité de l'administrateur | Les quatre rôles n'ont **rien en commun au-delà de la connexion**. Un étudiant a une filière et un matricule, une entreprise un numéro fiscal, une université un sigle. |
| `etudiant` | profil académique | Tout regrouper dans `utilisateur` donnerait une table de ~50 colonnes dont 80 % seraient NULL pour chaque ligne — et rendrait impossible toute contrainte `NOT NULL` utile. |
| `entreprise` | profil légal et commercial | idem |
| `universite` | profil de l'établissement | idem |

C'est le motif **table par sous-type** (*class table inheritance*). Le lien est une
clé étrangère **unique** de chaque table de rôle vers `utilisateur` : `1 → 0..1`.

**Pourquoi la FK est du côté du rôle et non l'inverse.** Si `utilisateur` portait
`idEtudiant`, `idEntreprise`, `idUniversite`, `idAdmin`, on aurait quatre colonnes
dont trois seraient toujours NULL, et aucune contrainte n'empêcherait un compte
d'être à la fois étudiant et entreprise. Avec la FK du côté du rôle, l'unicité sur
`idUtilisateur` garantit **au plus un profil de chaque type par compte**.

**`ON DELETE CASCADE`** : supprimer le compte supprime le profil. C'est le
comportement attendu d'un droit à l'effacement — laisser un profil orphelin sans
moyen de s'y connecter n'a aucun usage.

---

### 2. `JetonUtilisateur` — activation et réinitialisation

Un compte créé par import d'une promotion n'a pas de mot de passe : l'étudiant le
choisit via un lien reçu par courriel. Ce lien doit être **à usage unique, daté,
et invérifiable côté serveur sans le connaître**.

D'où une table plutôt qu'une colonne sur `utilisateur` :

- un utilisateur peut avoir **plusieurs jetons vivants** (activation demandée deux fois, réinitialisation en parallèle) — une colonne n'en garderait qu'un ;
- `jetonHache` stocke un SHA-256, **jamais le jeton en clair** : une fuite de la base ne permet pas de prendre la main sur les comptes ;
- `dateUtilisation` conserve la trace de la consommation au lieu de supprimer la ligne — on peut prouver *quand* un compte a été activé.

Contrainte `CHECK` sur `type` : `activation` ou `reinitialisation`, rien d'autre
(migration 009). Sans elle, une faute de frappe dans une route créerait un type
fantôme qui ne serait jamais consommé, sans qu'aucune erreur ne soit levée.

---

### 3. `Promotion`, `UniversiteDomaine`, `AnnonceCohorte` — l'université

#### `Promotion` (migration 010)

> « Une université ne raisonne pas en individus mais en promotions. *La L3
> Informatique 2026 est diplômée* doit être une action en un geste, pas quatre-vingts. »

Sans cette table, l'écran université est une liste de plusieurs centaines de noms
et les actions de cycle de vie sont inutilisables à l'échelle réelle.
`etudiant.idPromotion` est **facultatif** : un étudiant inscrit spontanément n'a pas
de promotion tant que l'université ne l'y range pas.

`ON DELETE SET NULL` : supprimer une promotion **ne supprime pas ses étudiants**.
Le CASCADE serait catastrophique — une erreur de manipulation effacerait quatre-vingts
comptes, leurs CV et leurs candidatures.

#### `UniversiteDomaine` (migration 014)

> « Rien n'empêche de déclarer *École Nationale d'Informatique* et *Hôtellerie et
> Tourisme*. La saisie est fausse, personne ne le remarque, et elle se propage : le
> score de filière compare une spécialité inexistante. »

Table d'association `1 → 0..*` avec `UNIQUE (idUniversite, domaine)`. Une table
plutôt qu'une colonne texte parce qu'un établissement pluridisciplinaire en a
plusieurs, et qu'on veut les filtrer en SQL, pas parser une chaîne.
**Liste vide ≠ liste fermée** : aucune ligne signifie « aucune restriction connue »,
pas « n'enseigne rien ».

#### `AnnonceCohorte`

L'université publie « je cherche des stages pour ce groupe d'étudiants » : une
**demande adressée aux entreprises**, symétrique de l'offre d'entreprise.

`idPromotion` est facultatif et pointe vers une promotion réelle (migration 013).
Auparavant l'annonce s'appuyait sur `EtudiantExterne` — des noms sans compte, avec
un CV en base64. Cette table a été **supprimée** : l'entreprise intéressée n'avait
aucun moyen de contacter qui que ce soit. L'annonce désigne désormais des profils
véritables, avec compétences et CV analysables.

---

### 4. `CV`, `CompetenceDetectee`, `CompetenceReference` — le cœur du sujet

#### `CV` (migration 002)

Avant : le CV n'existait qu'au niveau de la candidature, comme **chaîne de caractères**
(`Candidature.cv`). L'étudiant redéposait son fichier à chaque candidature, et les
fichiers écrits dans `public/uploads/` renvoyaient 404 en production.

La table `CV` est la **bibliothèque** de l'étudiant : `1 → 0..*`.

L'unicité du CV principal est garantie par un **index unique partiel** :

```sql
CREATE UNIQUE INDEX "idx_cv_principal_unique"
  ON public."CV" ("idEtudiant") WHERE "estPrincipal";
```

C'est la base qui l'impose, pas le code applicatif. Une route buguée ne peut pas
créer deux CV principaux ; elle reçoit une violation d'unicité.

#### `CompetenceDetectee` — pourquoi une table séparée du profil

C'est **l'arbitrage le plus important du modèle**, et il est directement défendable
en soutenance (migration 007) :

> « L'OCR et l'extraction ne seront jamais fiables à 100 %. Écrire directement dans
> `CompetenceEtudiant` reviendrait à corrompre silencieusement les données de
> l'étudiant sur une erreur de lecture. La détection est donc une **proposition**,
> que l'étudiant confirme ou rejette. »

Second usage, décisif : la table conserve l'état **avant et après l'arbitrage humain**.
C'est exactement ce qu'il faut pour mesurer précision et rappel de l'extraction.
Sans cette séparation, la correction humaine effacerait la trace de l'erreur — et
le chapitre d'évaluation n'aurait rien à mesurer.

Les colonnes `page`, `section`, `contexte` servent la **traçabilité** : « ce terme
a été lu page 2, section Compétences, dans ce fragment de phrase ». L'étudiant
arbitre en connaissance de cause au lieu de valider une liste hors-sol.

#### `CompetenceReference` — le référentiel

Trois tables pointent vers elle : `CompetenceEtudiant`, `CompetenceOffre`,
`CompetenceDetectee`.

Sans référentiel, l'appariement compare du texte libre : « React », « ReactJS »,
« react.js » et « React " » (avec un espace) sont quatre compétences distinctes, et
`scoreCompetence()` renvoie 0 là où un recruteur humain voit une correspondance
évidente. La migration 003 documente le cas réel : deux valeurs « Informatique »
en base, dont une suivie d'espaces invisibles à l'affichage.

`CompetenceDetectee.idCompetenceReference` est **facultatif** : le pipeline peut lire
un terme qu'aucune entrée du référentiel ne couvre. On garde alors le `termeDetecte`
brut avec un rapprochement vide — c'est précisément la matière du chapitre
« couverture du référentiel ».

> ⚠️ Cette FK est en `ON DELETE CASCADE` alors que la colonne est nullable.
> Supprimer une compétence de référence **efface les détections** qui la citaient,
> au lieu de les ramener à « non rapprochée ». `SET NULL` serait plus cohérent avec
> l'intention. À corriger si le référentiel devient éditable.

#### `CompetenceEtudiant` vs `CompetenceOffre`

Deux tables d'association N-N, avec chacune leurs attributs propres :
`niveau` maîtrisé côté étudiant, `niveauSouhaitee` et `estObligatoire` côté offre.
C'est ce qui les empêche d'être une seule table : la même compétence ne porte pas la
même information selon qu'on l'offre ou qu'on la demande.

`UNIQUE (idEtudiant, idCompetenceReference)` et `UNIQUE (idOffre, idCompetenceReference)` :
déclarer deux fois la même compétence n'a pas de sens et fausserait le score.

---

### 5. `centre_interet`, `parcours_realisation`, `preference_stage`

Trois tables `1 → 0..*` accrochées à `etudiant`, pour trois raisons identiques :
**ce sont des listes**, pas des attributs.

Un étudiant a plusieurs expériences, plusieurs centres d'intérêt. Les mettre dans
`etudiant` imposerait soit des colonnes numérotées (`experience1`, `experience2`…),
soit du texte concaténé — impossible à filtrer, à trier, à compter.

`preference_stage` alimente `scorePreference` (poids 10) et `scoreLocalisation`
(poids 15) du moteur d'appariement.

---

### 6. `offre`, `Candidature`, `DocumentCandidature`

`offre` appartient à une entreprise (`1 → 0..*`, CASCADE : une entreprise supprimée
emporte ses offres, qui n'ont plus d'interlocuteur).

`Candidature` est l'**association N-N entre `etudiant` et `offre`**, avec ses propres
attributs : date, statut, note au QCM, lettre.

```
UNIQUE (idEtudiant, idOffre)
```

Une seule candidature par étudiant et par offre. La route
`src/app/api/candidature/route.js` s'appuie dessus : elle intercepte le code
PostgreSQL `23505` et répond « Vous avez déjà postulé à cette offre » — au lieu de
faire un `SELECT` puis un `INSERT`, qui laisserait passer un double clic.

`Candidature.idCV` référence un CV de la bibliothèque, en `SET NULL` : l'étudiant
qui supprime un CV ne fait pas disparaître ses candidatures passées.

`DocumentCandidature` existe parce qu'un dossier comporte **plusieurs pièces**
(relevés de notes, attestations, portfolio) et que leur nombre n'est pas connu à
l'avance. `1 → 0..*`, CASCADE : les pièces n'ont aucune existence hors du dossier.

---

### 7. `QCM`, `Question`, `ChoixReponse`, `ReponseEtudiant`

Chaîne de composition stricte : `offre 1—0..1 QCM 1—* Question 1—* ChoixReponse`.
Tout est en CASCADE, car aucun de ces niveaux n'a de sens détaché de celui du dessus.

`QCM.idOffre` est **unique** : au plus un questionnaire par offre.

`ReponseEtudiant` relie une candidature, une question et le choix retenu, avec
`UNIQUE (idCandidature, idQuestion)` — une réponse par question, pas deux.

**Pourquoi `ReponseEtudiant.enonce` duplique le libellé du choix.** C'est une
dénormalisation volontaire : l'entreprise peut modifier son QCM après coup. Sans
copie, relire une candidature ancienne afficherait le **nouvel** énoncé en face de
l'ancienne réponse — un contresens. La copie fige ce que l'étudiant a réellement lu.
Le même raisonnement vaut pour `Candidature.noteQCM`, calculée à la soumission et
stockée : recalculer plus tard sur un barème modifié changerait rétroactivement la
note d'un candidat déjà départagé.

---

### 8. `recommandation` — un cache, pas une source

Table `N-N` entre `etudiant` et `offre`, portant les six scores et la date de génération.

Elle ne stocke **rien qui ne puisse être recalculé** : `src/lib/appariement.js` est la
seule implémentation, et `src/app/api/recommandations/route.js` fait
`DELETE FROM recommandation WHERE "idEtudiant" = $1` avant de réinsérer.

Elle existe pour deux raisons :

1. **l'affichage** — le tableau de bord n'a pas à relancer le moteur de cooccurrence à chaque chargement ;
2. **l'évaluation** — conserver le détail des cinq sous-scores (compétence 40, filière 20, niveau 15, localisation 15, préférence 10) permet de répondre à « pourquoi ce classement ? » par de l'arithmétique, ce qui est le principe directeur du projet.

`UNIQUE (idEtudiant, idOffre)` interdit les doublons si un recalcul se chevauche.

---

### 9. `Conversation`, `participantConversation`, `Message`

`participantConversation` est une **table d'association N-N** entre `utilisateur` et
`Conversation`, avec `UNIQUE (idConversation, idUtilisateur)`.

Pourquoi ne pas mettre `idEmetteur` / `idDestinataire` directement sur `Conversation` ?
Parce que cela figerait le fil à deux personnes. Avec la table d'association, une
conversation à trois (entreprise + étudiant + université) ne demande aucune migration.

`Message.idExpediteur` pointe vers `utilisateur` et non vers un rôle : un fil peut
mêler une entreprise et un étudiant, et le champ doit accepter les deux.

`Conversation.dateDernierMessage` est dénormalisée pour trier la liste des fils sans
agrégat sur `Message` à chaque affichage.

---

### 10. `FileCourriel` — la table sans clé étrangère

Volontairement **isolée du reste du schéma** (migration 012).

> « Un envoi SMTP prend entre 0,3 et 2 secondes. Trois cents envois dans le cycle
> d'une requête HTTP, c'est deux à dix minutes : la requête expire, le navigateur
> abandonne, et l'université ne sait pas combien de ses étudiants ont reçu leur lien. »

Et pourquoi une table plutôt qu'un simple envoi asynchrone :

> « Un redémarrage du serveur, une coupure réseau, une erreur d'authentification
> SMTP : les courriels sont perdus, sans trace. Or c'est leur **seul** moyen d'accéder
> à la plateforme. »

C'est le motif **boîte d'envoi transactionnelle** : le courriel est écrit en base
*dans la même transaction* que l'action qui le motive. Import échoué → aucun courriel
en file. Import réussi → envoi garanti d'être tenté, même si le serveur tombe juste après.

`destinataire` est une **adresse littérale**, pas un `idUtilisateur` : le courriel
doit rester envoyable même si le compte est supprimé entre la mise en file et l'envoi.
D'où l'absence de clé étrangère.

L'index est **partiel** — `WHERE statut = 'en_attente'` — parce que le collecteur ne
lit jamais que les courriels en attente. L'index ne grossit pas avec l'historique.

---

## Partie II — Les colonnes NULL : six raisons distinctes

Un NULL n'est pas un NULL. Dans ce schéma il en existe six espèces, dont **deux sont
des choix de conception défendables, deux sont acceptables, et deux sont des dettes**.

### Raison 1 — NULL porteur de sens (three-valued volontaire) ✅

Le NULL **est** l'information. Le remplacer par une valeur par défaut détruirait le sens.

| Colonne | Ce que NULL signifie |
|---|---|
| `CompetenceDetectee.decision` | l'étudiant **n'a pas encore arbitré**. Distinct de « rejeté ». C'est la file de travail. |
| `CompetenceDetectee.dateDecision` | idem, corollaire |
| `CV.confianceOcr` | **aucune page n'a nécessité l'OCR** — le CV était nativement textuel. `0` voudrait dire « OCR de confiance nulle », le contraire. |
| `CV.dateAnalyse` | analyse jamais terminée |
| `CV.messageAnalyse` | aucune erreur (rempli seulement si `statutAnalyse = 'echec'`) |
| `JetonUtilisateur.dateUtilisation` | **jeton non consommé** : c'est exactement le test de validité |
| `FileCourriel.dateEnvoi` | jamais envoyé |
| `FileCourriel.derniereErreur` | aucune tentative en échec |
| `etudiant.statutRattachement` | **aucune université revendiquée**. La contrainte `CHECK` l'autorise explicitement : `CHECK ("statutRattachement" IS NULL OR ... IN (...))`. |
| `etudiant.dateFinRattachement` / `motifFinRattachement` | rattachement toujours en cours |

C'est la catégorie la plus solide du modèle : chaque NULL y remplace un état, et
l'alternative (une colonne booléenne de plus, ou une valeur sentinelle) serait pire.

---

### Raison 2 — Lien facultatif (FK nullable) ✅

La relation est optionnelle par nature. La FK nullable est la traduction correcte
d'une cardinalité `0..1`.

| Colonne | Pourquoi le lien est optionnel |
|---|---|
| `etudiant.idPromotion` | un étudiant inscrit spontanément n'appartient à aucune promotion |
| `AnnonceCohorte.idPromotion` | une annonce peut précéder la création de la promotion |
| `Candidature.idCV` | candidature déposée sans CV de bibliothèque (ou CV supprimé depuis → `SET NULL`) |
| `CompetenceDetectee.idCompetenceReference` | terme lu dans le CV mais absent du référentiel |
| `Message.pieceJointe` | la plupart des messages n'en ont pas |
| `centre_interet.idEtudiant`, `parcours_realisation.idEtudiant`, `preference_stage.idEtudiant` | *techniquement* nullable, mais **sans justification** : une ligne orpheline n'a aucun sens. Voir Raison 6. |

---

### Raison 3 — Champ déclaratif optionnel ✅

L'utilisateur n'est pas obligé de tout renseigner. Imposer `NOT NULL` bloquerait
l'inscription sur un champ facultatif.

`etudiant.bio`, `photoProfil`, `adresse`, `genre` · `entreprise.siteWeb`,
`reseauxSociaux`, `logo`, `telephoneSecondaire`, `description` · `universite.logo`,
`siteWeb`, `ville` · `offre.remuneration`, `lieu`, `typeStage` ·
`Promotion.filiere`, `specialisation`, `niveauAcademique` ·
`Question.explication` · `CompetenceReference.description`, `categorieCompetenceReference` ·
`CV.nomFichierOriginal`, `tailleOctets` · `admin.telephone`

Rien à redire : c'est le cas nominal.

---

### Raison 4 — Rempli plus tard dans le cycle de vie ✅

La colonne se remplit à une **étape ultérieure** du processus.

`entreprise.dateVerification` / `estVerifie` · `universite.dateVerification` ·
`etudiant.dateVerificationIdentite` · `etudiant.dateRattachement` ·
`CV.texteExtrait`, `nombrePages`, `pagesOcr` · `Candidature.noteQCM` (NULL si l'offre
n'a pas de QCM) · `offre.dateDebut`, `dateFin`, `dateLimites`

---

### Raison 5 — Nullable **par accident**, jamais NULL en pratique ⚠️

Une valeur par défaut est déclarée, mais la contrainte `NOT NULL` a été oubliée.
La colonne n'est jamais NULL dans les faits, mais **la base ne l'interdit pas**.

| Colonne | Défaut |
|---|---|
| `offre.statut` | `'Active'` |
| `offre.datePublication` | `now()` |
| `Candidature.statut` | `'En attente'` |
| `Candidature.dateCandidature` | `now()` |
| `AnnonceCohorte.statut` / `datePublication` | `'Active'` / `now()` |
| `Message.dateEnvoi` / `estLu` | `now()` / `false` |
| `Conversation.dateCreation` / `dateDernierMessage` | `now()` |
| `QCM.noteMinimal` / `estActif` / `dateCreation` | `0` / `true` / `now()` |
| `CompetenceOffre.estObligatoire` / `niveauSouhaitee` | `false` / `'Débutant'` |
| `CompetenceEtudiant.dateAjout` | `now()` |
| `recommandation.dateGeneration` | `now()` |
| `admin.dateCreation` | `now()` |

**Le symptôme est visible dans le schéma lui-même** : les tables ajoutées par les
migrations récentes (`CV`, `Promotion`, `JetonUtilisateur`, `FileCourriel`,
`DocumentCandidature`, `UniversiteDomaine`) déclarent systématiquement
`NOT NULL DEFAULT …`, alors que les tables d'origine (`offre`, `Candidature`,
`Message`, `QCM`…) se contentent du `DEFAULT`. C'est une différence de rigueur entre
deux générations du schéma, pas une différence d'intention.

> **Anomalie à signaler** : `CompetenceOffre.niveauSouhaitee` a pour défaut la chaîne
> `'D‚butant'` — un « Débutant » mal encodé (CP850 lu comme Latin-1) figé dans la
> définition de la colonne. Toute nouvelle ligne hérite de cette valeur corrompue.

---

### Raison 6 — Nullable alors que la donnée est obligatoire ❌ (dette)

Ici, le NULL n'est ni voulu ni inoffensif.

#### 6.1 `utilisateur.emailUtilisateur` et `utilisateur.motDePasse`

Les deux colonnes qui **définissent** un compte sont nullables. Rien en base
n'empêche d'insérer un utilisateur sans adresse et sans mot de passe.
La migration 008 a ajouté l'unicité — `CREATE UNIQUE INDEX ON utilisateur (lower("emailUtilisateur"))` —
mais pas la non-nullité. Or un index unique **tolère plusieurs NULL** : autant de
comptes sans adresse que l'on veut peuvent coexister.

`typeUtilisateur` est dans le même cas : nullable et sans `CHECK`, alors que tout le
routage applicatif en dépend.

#### 6.2 `etudiant.idUtilisateur`, `entreprise.idUtilisateur`, `universite.idUtilisateur`

Nullables : un profil peut exister **sans compte associé**, donc sans moyen de s'y
connecter et sans propriétaire. Ce n'est pas une fonctionnalité — c'est un reliquat
de l'époque où les profils étaient créés avant les comptes. À comparer avec `admin`,
dont la colonne est correctement `NOT NULL`.

#### 6.3 `etudiant.idUniversite` — pas de clé étrangère du tout

C'est le point le plus important de cette section.

```prisma
model etudiant {
  idUniversite  Int?   // aucune relation déclarée
  ...
}
```

La colonne est un entier libre. **Aucune contrainte référentielle** ne garantit que
cet identifiant corresponde à une université existante, alors que `Promotion`,
`AnnonceCohorte` et `UniversiteDomaine` ont toutes leur FK vers `universite`.

Conséquences :

- une université supprimée laisse des étudiants pointant vers un identifiant fantôme ;
- les jointures se font manuellement en SQL, sans filet ;
- l'index `idx_etudiant_universite_statut` optimise une jointure que la base ne connaît pas.

Le choix est en partie explicable : `nomUniversiteSaisi` permet à un étudiant de
déclarer un établissement **non encore inscrit** sur la plateforme. Mais la bonne
traduction de ce besoin est une FK nullable — `idUniversite` renseigné *ou*
`nomUniversiteSaisi` renseigné — pas l'absence de contrainte.

La migration 011 explique par ailleurs pourquoi `idUniversite` **n'est pas remis à NULL**
quand un étudiant sort des effectifs :

> « Détacher au sens de vider la colonne effacerait l'information : plus personne ne
> saurait d'où vient cet étudiant, ni ne pourrait revenir sur une exclusion prononcée
> par erreur. Le rattachement est conservé, et c'est le **statut** qui détache. »

C'est un bon raisonnement — il rend l'absence de FK d'autant plus regrettable, puisque
la colonne est justement conçue pour durer.

#### 6.4 Les booléens nullables — un vrai piège en SQL

`etudiant.estActif`, `etudiant.estVerifieIdentite`, `entreprise.estVerifie`,
`universite.estVerifie`, `Message.estLu`, `CompetenceOffre.estObligatoire`,
`preference_stage.mobiliteNational`, `disponibiliteImmediate`, `QCM.estActif`.

Un booléen nullable a **trois** états : `true`, `false`, `NULL`. Et en SQL,
`NULL = true` vaut `NULL`, donc **faux** au filtrage.

Le code s'appuie pourtant sur des égalités strictes :

```sql
-- src/app/api/rechercheCandidat/route.js:43
WHERE e."estActif" = true
-- src/app/api/offreCandidats/[idOffre]/route.js:81
WHERE e."estActif" = true
```

Un étudiant dont `estActif` vaut NULL — cas parfaitement possible, la colonne n'a
même pas de valeur par défaut — **disparaît silencieusement** de la recherche de
candidats et de la liste des candidats suggérés. Aucune erreur, aucune trace : il
n'existe simplement plus pour l'entreprise.

C'est la dette la plus concrètement dangereuse du modèle, parce qu'elle est invisible.

#### 6.5 Colonnes héritées, conservées mais mortes

| Colonne | État |
|---|---|
| `Candidature.cv` (`varchar(500)`) | ancien chemin de fichier en texte libre, remplacé par `idCV` (migration 002). Plus aucune route ne l'écrit. |
| `Candidature.lettreMotivation` (`text`) | remplacé par `nomFichierLettre` + fichier sur volume. Plus écrite. |

Elles restent nullables parce qu'elles ne sont plus alimentées. Les supprimer
demande une migration de données (vérifier qu'aucune ligne ancienne n'en dépend
pour l'affichage) — c'est un candidat naturel pour le prochain lot de nettoyage.

---

## Partie III — Synthèse

### Ce que le modèle fait bien

- **Un compte, quatre rôles** en tables séparées : pas de colonnes fantômes, contraintes `NOT NULL` utilisables par rôle.
- **La détection de compétences séparée du profil** : la machine propose, l'humain arbitre, et la trace des deux états rend l'évaluation possible.
- **Les contraintes portées par la base et non par le code** : index unique partiel sur le CV principal, unicité `(idEtudiant, idOffre)`, index fonctionnel sur `lower(email)`, `CHECK` sur les statuts. Une route buguée échoue au lieu de corrompre.
- **Les dénormalisations volontaires et justifiées** : `ReponseEtudiant.enonce`, `Candidature.noteQCM`, `Conversation.dateDernierMessage`.
- **`FileCourriel` isolée** : boîte d'envoi transactionnelle, sans FK par conception.

### Ce qui reste à corriger, par ordre de gravité

| # | Dette | Effet |
|---|---|---|
| 1 | Booléens nullables filtrés par `= true` | Des étudiants disparaissent silencieusement des recherches |
| 2 | `etudiant.idUniversite` sans clé étrangère | Rattachements fantômes possibles, aucune intégrité référentielle |
| 3 | `utilisateur.emailUtilisateur` / `motDePasse` nullables | Comptes inconnectables ; l'index unique ne bloque pas les NULL multiples |
| 4 | `CompetenceDetectee.idCompetenceReference` en CASCADE | Supprimer une compétence de référence efface les détections au lieu de les délier |
| 5 | `idUtilisateur` nullable sur `etudiant` / `entreprise` / `universite` | Profils sans propriétaire |
| 6 | `'D‚butant'` en valeur par défaut | Valeur corrompue héritée par chaque nouvelle ligne |
| 7 | `Candidature.cv` / `lettreMotivation` mortes | Bruit dans le schéma, risque de réutilisation par erreur |
| 8 | `centre_interet` / `parcours_realisation` / `preference_stage` : `idEtudiant` nullable | Lignes orphelines possibles, sans aucun usage |
