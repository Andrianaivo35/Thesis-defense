# Bilan des travaux

> Ce document ne parle que du passé : ce que le projet était, et ce qui a été fait.
> Les pistes non engagées vivent ailleurs — voir [8 - PERSPECTIVES-PRODUIT.md](8%20-%20PERSPECTIVES-PRODUIT.md).

---

## 1. Le point de départ

Une plateforme de mise en relation étudiants ↔ entreprises pour les stages, en Next.js et
PostgreSQL, fonctionnelle en apparence. La revue de code initiale
([1 - REVUE-CODE.md](1%20-%20REVUE-CODE.md)) a établi qu'elle ne l'était pas tout à fait.

Les défauts les plus lourds, tous **vérifiés et non supposés** :

| Défaut | Conséquence réelle |
|---|---|
| Les CV étaient écrits dans `public/` | Next.js ne sert ce dossier que dans son état **au moment du build** : en production, **une entreprise ne pouvait jamais ouvrir le CV d'un candidat**. Invisible en développement. |
| Aucune contrainte d'unicité sur l'adresse électronique | La connexion lit `rows[0]` sans `ORDER BY` : deux comptes de même adresse auraient rendu l'accès aléatoire, sans erreur journalisée. |
| `typeUtilisateur` incohérent — `'Université'` accentué ici, `'Universite'` là | Onze emplacements. Une université pouvait se retrouver enfermée hors de son propre compte. |
| Aucune pagination | `GET /api/listeOffre` renvoyait 47 Ko pour 51 offres, et la recherche s'effectuait dans le navigateur — sans porter sur les compétences, pourtant le critère le plus pertinent. |
| `scoreMatching` | La colonne contenait en réalité la note au QCM. Le nom mentait sur le contenu. |
| Le CV n'était **jamais lu** | Le sujet annoncé était « recommander à partir du CV ». Le document était stocké, téléchargeable, et opaque. |

S'ajoutaient une page « ajouter un étudiant » réduite à une coquille vide, un faux assistant
conversationnel, plusieurs liens morts, et des données d'essai mêlées aux données réelles.

---

## 2. Ce qui a été fait

Sept lots, dans un ordre où chacun prépare le suivant. Le détail de chaque décision est dans
[3 - BACKLOG.md](3%20-%20BACKLOG.md).

### Lot 0 — Déblocage
Unification de `typeUtilisateur`, correction de `adminLogin`, nettoyage du référentiel de
compétences. Rien d'autre n'était mesurable avant.

### Lot 1 — Structuration de la saisie
Les compétences d'offre passent par le référentiel au lieu d'être créées à la volée.
L'étudiant **choisit** son université dans une liste au lieu de la saisir, et son
rattachement est **validé par l'établissement** — seul à savoir qui sont réellement ses
étudiants. Listes fermées pour le niveau, la ville et la durée.

### Lot 2 — Fermeture de la boucle fonctionnelle
Page « Mes candidatures », notification du changement de statut, indicateur « déjà
postulé ». Un `SAVEPOINT` sur la vérification de compte : l'ancienne version prétendait
qu'un échec de message n'annulait pas l'opération, alors qu'elle faisait l'inverse — en
PostgreSQL, une instruction en échec avorte toute la transaction.

### Lot 3 — Stockage des CV
Sortie de `public/`, volume dédié, route de téléchargement authentifiée, bibliothèque
multi-CV.

### Lot 4 — Passage à l'échelle et finitions
Pagination et recherche côté serveur, avertissement avant le QCM, durcissement des comptes,
référentiel de filières, et onze écrans manquants ou incomplets — dont le tableau de bord
entreprise, la page « À propos », et le retrait du faux assistant.

### Lot 5 — Cœur du mémoire
- **Moteur de co-occurrence** ([4](4%20-%20MOTEUR-COOCCURRENCE.md)) — une structure de
  similarité entre compétences, **apprise du corpus par comptage**, sans LLM ni
  apprentissage.
- **Lecture des CV** ([5](5%20-%20INGESTION-CV.md)) — routage page par page entre texte natif
  et OCR, extraction par appariement flou, confirmation par l'étudiant.
- **Évaluation** ([6](6%20-%20EVALUATION.md)) — protocole d'ablation, quatre variantes, et un
  résultat en partie négatif rapporté comme tel.

### Lot 6 — Gestion des étudiants par l'université
Unicité de l'adresse, jetons d'activation à usage unique, import CSV avec prévisualisation
obligatoire, promotions, cycle de vie du rattachement, envoi de courriels par file durable.

### Après les lots
Nettoyage de la base, peuplement des données de démonstration, audit UI/UX
([7](7%20-%20UI-UX.md)), refonte de la messagerie, contrainte filière ↔ université, passage
des migrations à Prisma, et procédure de reprise sans Docker.

---

## 3. Les chiffres

| | |
|---|---|
| Commits sur la branche | 48 |
| Routes API | 58 |
| Pages | 43 |
| Modules métier · composants | 24 · 50 |
| Tables en base | 29 |
| Migrations (14 SQL historiques, désormais 2 Prisma) | — |
| Documents de mémoire | 9 |

**Jeu de démonstration** : 79 comptes, 67 offres, 72 candidatures, 56 compétences de
référence, 38 CV réels dont une partie numérisée.

**Mesures** — reproductibles par trois scripts :

| Mesure | Résultat |
|---|---|
| Routage natif / OCR / mixte | **38/38** |
| Extraction de compétences | précision **98,2 %**, rappel **95,2 %**, F1 **96,7 %** |
| Confiance OCR moyenne | 91,6 % sur 22 CV |
| Co-occurrence, mécanisme isolé | précision@1 **9,9 → 22,2 %**, MRR **+12 %** relatifs |
| Co-occurrence, score complet | effet **nul à légèrement négatif** |
| Import d'une promotion | **300 comptes en 1,25 s** |

---

## 4. Les décisions structurantes

Celles qu'un lecteur doit connaître pour comprendre le reste.

1. **Aucun LLM, aucun apprentissage.** La similarité entre compétences est obtenue par
   comptage de co-occurrences dans le corpus. Le système est déterministe, explicable, et
   fonctionne hors ligne.
2. **PostgreSQL plutôt que Neo4j.** La question a été posée. Une base de graphe n'apportait
   rien à cette échelle, et aurait ajouté un composant à administrer pour un gain nul.
3. **Le pipeline propose, l'humain dispose.** Ni l'OCR ni l'extraction ne sont fiables à
   100 %. Écrire d'office dans le profil ferait d'une erreur de lecture une donnée fausse,
   propagée dans les recommandations sans qu'on puisse remonter à sa cause.
4. **Des liens à usage unique, jamais de mot de passe provisoire.** Un mot de passe transmis
   reste en clair dans un courriel, échappe à la politique de robustesse, et n'est presque
   jamais changé.
5. **L'argent n'entre jamais dans le score.** La visibilité payante, si elle voit le jour,
   vivra hors des résultats classés. Un classement acheté ne se mesure pas — et détruirait
   la contribution scientifique du projet.
6. **Prisma pour les migrations, `pg` pour les requêtes.** Le besoin réel était de savoir
   quelles migrations avaient été appliquées. Réécrire les 58 routes n'apportait rien de
   fonctionnel.

---

## 5. Les erreurs trouvées par la mesure

C'est la partie la plus utile au mémoire. Aucune de ces erreurs n'a été trouvée en relisant
le code : toutes l'ont été en mesurant.

| Erreur | Comment elle est apparue | Effet de la correction |
|---|---|---|
| **Jaro-Winkler détruisait la précision** de l'extraction. Adopté pour une raison plausible, il causait à lui seul la quasi-totalité des faux positifs : `anglais` → *Angular* (0,867), `gestion et commerce` → *Gestion de projet* (0,891). Son bonus de préfixe a été conçu pour des **patronymes**, pas pour des locutions partageant leur premier mot. | Mesure sur le corpus de vérité terrain | précision **60 → 89 %** |
| **La détection de section mangeait des compétences.** « Contrôle qualité — niveau intermédiaire » contient « qualité » : la ligne était prise pour un titre de section et sautée. | Analyse des faux négatifs | rappel **87,5 → 94,9 %** |
| **La vérité terrain elle-même était fausse.** Les langues écrites sur les CV n'y étaient pas consignées : l'extraction avait raison quarante fois et était comptée en faux positif. | Instruction des faux positifs restants | précision **75 → 98 %** |
| **Une fuite par temporisation.** La demande de réinitialisation répondait la même chose que l'adresse existe ou non — mais **pas dans le même temps** : 97 ms contre 15 ms. L'énumération de comptes redevenait possible au chronomètre. | Mesure des durées de réponse | écart des médianes **82 → 3 ms** |
| **Un `COUNT` sans `DISTINCT`.** L'API annonçait 15 inscrits dans une promotion là où le filtre en renvoyait 3 : la jointure sur les candidatures multipliait les lignes. | Recoupement de deux sources | effectifs exacts |
| **Deux bugs invisibles hors du conteneur** : le worker de pdfjs absent du paquet serveur, et un paramètre SQL à deux types déduits. Toutes les mesures en ligne de commande passaient. | Essai de bout en bout | ingestion fonctionnelle en production |
| **Un tableau de dépendances incomplet.** Un `useMemo` ignorait deux états : basculer sur « anciens étudiants » n'aurait pas rafraîchi la liste. | `eslint` lors de l'inspection finale | corrigé |

> **Le fil conducteur.** Cinq de ces sept erreurs étaient **silencieuses** : aucune ne levait
> d'exception, aucune n'apparaissait dans un journal. Elles produisaient un résultat
> plausible mais faux. C'est l'argument central du chapitre d'évaluation — un système qui ne
> se mesure pas ne se corrige pas.

---

## 6. Les limites, dites franchement

- **Le corpus est petit** : 67 offres, 38 étudiants, 83 paires pertinentes. Les écarts sous
  deux points ne sont pas interprétables, et la courbe de sensibilité du chapitre 6 le
  démontre directement.
- **Il n'existe aucune vérité terrain humaine.** La pertinence est un proxy calculé, pas un
  jugement observé. La table des candidatures a été peuplée pour la démonstration, avec un
  avertissement explicite : elle ne doit pas servir à l'évaluation.
- **Le corpus de CV est synthétique.** C'est ce qui donne une vérité terrain exacte, et ce
  qui rend les chiffres du chapitre 5 une borne **supérieure** : les dégradations imitent un
  scan, elles n'en sont pas un.
- **La contribution du moteur de co-occurrence ne survit pas à son intégration.** Isolée,
  elle double la précision au premier rang ; noyée dans un score composite où les
  compétences pèsent 40 %, son effet disparaît. C'est rapporté comme tel.
