# Stage Share — Recommendation & CV Intelligence Plan

**Version 2 (révisée)** — remplace la v1 après arbitrage sur le périmètre.
Statut : **PLANIFICATION UNIQUEMENT — rien dans ce document n'est encore implémenté.**

---

## 0. Principe directeur : « intelligent, mais déterministe »

**Aucun LLM, aucun appel à une IA générative externe.** Tout le système repose sur des
algorithmes déterministes : comptage, similarité, théorie des graphes, recherche
d'information classique.

Ce n'est pas un compromis, c'est la position la plus solide pour une soutenance :

| Avantage | Pourquoi ça compte en soutenance |
|---|---|
| Chaque score est explicable par de l'arithmétique | On peut répondre à « pourquoi ce classement ? » avec une démonstration, pas un haussement d'épaules |
| Résultats reproductibles | Indispensable au chapitre évaluation — un LLM donne une réponse différente à chaque exécution, les métriques deviendraient ininterprétables |
| Aucun coût d'API, aucun réseau | Tourne intégralement dans le Docker déjà en place, démo hors-ligne garantie |
| Le mérite technique reste au candidat | Personne ne peut dire « c'est le modèle qui a fait le travail » |

Le système doit **paraître** intelligent par la qualité de sa conception, pas par la
puissance d'un modèle tiers.

---

## 1. Point de départ : la faiblesse à corriger

Le moteur actuel (`src/app/api/recommandations/route.js`) est une heuristique
unidirectionnelle à poids fixes (compétence 40 / filière 20 / niveau 15 / localisation 15 /
préférence 10), avec un recouvrement de mots pour le texte.

Deux vrais défauts, mesurables et démontrables :

1. **Correspondance de compétences en identifiant exact uniquement.** Un étudiant qui
   maîtrise React obtient **zéro** sur une offre demandant Vue.js. Python/Pandas obtient
   zéro face à une offre « R / analyse statistique ». Un recruteur humain y voit des
   quasi-correspondances ; le système y voit des inconnus.
2. **Unidirectionnel.** Aucun classement offre → meilleurs candidats.

Accessoirement : « recommandation à partir du CV » est aujourd'hui inexact — les
compétences viennent d'un formulaire saisi à la main, le CV n'est jamais lu.

Ces trois points définissent exactement le périmètre ci-dessous.

---

## 2. Périmètre retenu : trois fonctionnalités, pas plus

Elles se renforcent mutuellement : la 1 produit les données, la 2 les exploite, la 3
réutilise le moteur de la 2 sans nouvel algorithme.

| # | Fonctionnalité | Rôle |
|---|---|---|
| ① | Ingestion de CV (OCR + extraction de compétences) | Rend les données **réelles** |
| ② | Correspondance bidirectionnelle par co-occurrence de compétences | Rend le système **apparemment intelligent** |
| ③ | Conseiller contrefactuel (« que dois-je apprendre ? ») | Rend le système **prescriptif** |

\+ le **chapitre évaluation** qui compare le tout à l'heuristique actuelle servant de
référence (*baseline*). C'est lui qui transforme « une appli avec une formule » en
« une étude comparative d'approches de recommandation ».

---

## 3. ② Le cœur : adjacence des compétences par co-occurrence

> *La pièce maîtresse du mémoire. À présenter en premier, c'est elle qui porte la
> contribution.*

### 3.1 Idée

Apprendre au système que React ≈ Vue.js **sans jamais le lui dire**, et sans LLM, sans
embeddings pré-entraînés, sans bibliothèque de ML.

Sur l'ensemble du corpus (offres + CV), on compte quelles compétences **apparaissent
ensemble**. React et Vue.js coexistent rarement dans un même CV (on choisit l'un ou
l'autre) mais constamment dans les mêmes *contextes* : mêmes ensembles de compétences
d'offres, mêmes domaines, mêmes profils de promotion. En normalisant ces comptages
(PMI — *information mutuelle ponctuelle* — ou cosinus sur la matrice de co-occurrence), on
obtient une **matrice de similarité entre compétences dérivée des données du système
lui-même**.

Le score de compétence devient alors :
- correspondance **exacte** → crédit plein ;
- compétence **adjacente** → crédit partiel, pondéré par l'adjacence mesurée ;
- aucune relation → zéro (comme aujourd'hui).

### 3.2 Pourquoi c'est le bon centre de gravité

- **Effet démo immédiat.** « Le système sait que Laravel et Symfony sont proches.
  Personne ne l'a programmé. Il l'a déduit de 51 offres. »
- **Défendable académiquement.** C'est de la sémantique distributionnelle classique — le
  principe derrière word2vec, mais calculé par comptage plutôt que par descente de
  gradient. La méthode entière tient sur une diapositive.
- **Bidirectionnel gratuitement.** La même matrice sert dans les deux sens : étudiant →
  offres et offre → candidats. Une seule logique à écrire et à maintenir, pas deux.
- **Corrige un échec réel et démontrable** de la baseline → le chapitre évaluation a
  quelque chose à *montrer*, pas seulement du bruit statistique.

### 3.3 Le problème de densité, et sa réponse honnête

Avec ~51 offres, la matrice de co-occurrence sera **creuse et bruitée**. C'est une limite
réelle, à traiter explicitement plutôt qu'à masquer.

**Réponse :** mélanger la co-occurrence observée avec un *a priori* faible tiré du champ
`categorieCompetenceReference` déjà présent en base — deux compétences de même catégorie
démarrent légèrement adjacentes, et les données observées viennent ensuite renforcer ou
affaiblir ce lien.

C'est un lissage d'estimateur creux par un a priori. Conceptuellement solide, quelques
lignes de code, et cela fait un bon paragraphe de mémoire sur la gestion de la rareté des
données.

### 3.4 Explicabilité (à exploiter en démo)

Chaque correspondance doit pouvoir se justifier en langage naturel, calculé, pas rédigé :

> « Correspondance via **Vue.js** — proche de votre **React** (co-occurrence mesurée : 0,71)
> · 3 compétences exactes sur 4 · niveau exactement requis »

Optionnellement : afficher le petit sous-graphe compétences partagées entre l'étudiant et
l'offre (quelques nœuds, pas la base entière). « IA explicable » est un mot-clé fort pour
un jury, et ici il est mérité.

---

## 4. ③ Le multiplicateur : conseiller contrefactuel

> *Le meilleur rapport effet/effort de tout le projet. Aucun nouvel algorithme.*

Une fois qu'on dispose d'un scoreur déterministe, on peut l'exécuter **hypothétiquement** :
ajouter une compétence que l'étudiant ne possède pas, recalculer tous les scores, mesurer
l'écart.

> « Apprenez **Docker** → 7 offres supplémentaires accessibles, score moyen 62 → 78. »
> « Apprenez **Power BI** → débloque 4 offres du secteur Banque, aujourd'hui fermé à votre profil. »

Cela fait passer le système de **classeur** à **conseiller** — une classe d'intelligence
perçue complètement différente, obtenue par force brute sur un scoreur déjà écrit.

**Extension quasi gratuite (vue université/admin) :** agréger le même calcul sur tous les
étudiants → « les compétences qui manquent le plus à nos étudiants par rapport au marché ».
Même code, un `GROUP BY` plus large. Cela donne enfin un écran à forte valeur au profil
« université », le moins bien servi de l'application aujourd'hui.

---

## 5. ① Ingestion de CV : OCR et extraction

> *Nécessaire : « recommandation à partir du CV » est le sujet annoncé, or le CV n'est
> aujourd'hui jamais lu. C'est aussi le moment de démo le plus spectaculaire.*

### 5.1 Le problème : deux natures de PDF

- **PDF électronique (natif)** : le texte est intégré et sélectionnable → extraction directe.
- **PDF scanné** : c'est une *image* de page (photocopie, photo de téléphone). Aucune couche
  texte — un extracteur classique renvoie du vide ou du bruit. Il faut de l'**OCR**
  (reconnaissance optique de caractères) pour convertir l'image en texte.

Le pipeline doit **détecter automatiquement** le cas et router en conséquence : l'étudiant
ne doit jamais avoir à déclarer « ceci est un scan ».

### 5.2 Étapes

**1. Dépôt et normalisation** — accepter PDF, et JPG/PNG (photo de CV papier, fréquent pour
les étudiants sans version numérique).

**2. Détection de couche texte (décision de routage)** — tenter l'extraction directe
(`pdf-parse` / `pdfjs-dist`). Si le texte d'une page est vide, anormalement court pour une
page de CV, ou majoritairement du bruit non alphanumérique → cette page part en OCR.
Décision **page par page**, pas document par document : un CV peut mêler une page native et
un diplôme scanné.

**3a. Voie électronique** — extraction directe, puis nettoyage léger : recollage des mots
coupés en fin de ligne, normalisation des espaces, suppression des en-têtes/pieds de page
répétés.

**3b. Voie OCR** — rendu de la page en image (200–300 DPI), **prétraitement** (redressement,
binarisation/contraste, débruitage), puis OCR.
- **Choix retenu : Tesseract** (`tesseract.js` ou binaire) — libre, auto-hébergé, s'intègre
  au Docker existant, précision suffisante sur du CV dactylographié, démo hors-ligne garantie.
- **À citer comme alternative « production »** : OCR cloud (Google Vision, Azure Document
  Intelligence, AWS Textract) — nettement plus précis sur les scans photographiés et
  sensible à la *mise en page* (CV sur deux colonnes), mais payant et dépendant du réseau.
- **Décision de conception :** placer l'OCR derrière une interface/adaptateur, pour que le
  changement de moteur soit une affaire de configuration et non de réécriture. Ce choix de
  *design pattern* est lui-même un bon argument de maturité d'ingénierie en soutenance.

Le prétraitement d'image est l'endroit où la précision OCR se gagne ou se perd : ne pas le
sous-estimer, surtout sur les photos de téléphone (obliques, faiblement contrastées).

**4. Sortie unifiée** — quelle que soit la voie, on obtient du texte brut par page. La suite
du pipeline ignore si l'OCR a été impliqué.

**5. Structuration et extraction de compétences**
- Découpage en sections par mots-clés d'en-tête (« Compétences », « Expérience »,
  « Formation », « Langues »…).
- Rapprochement des n-grammes du texte avec le vocabulaire `CompetenceReference` existant,
  **par correspondance floue** (Levenshtein / Jaro-Winkler).
- **Synergie clé avec l'OCR :** l'OCR produit des erreurs de caractères, et la
  correspondance floue est précisément ce qui les corrige — `Javascrpt` → `JavaScript`.
  Le problème « entrée bruitée » et le problème « normalisation des compétences » ont la
  **même** solution. C'est ce qui fait de ce pipeline une conception cohérente plutôt que
  deux briques juxtaposées.
- Compétences détectées absentes du référentiel → proposées à validation (admin/université)
  plutôt que silencieusement inventées ou ignorées. Le vocabulaire reste maîtrisé tout en
  s'enrichissant.
- Score de confiance par compétence (exacte / floue / voisinage OCR douteux).

**6. Confirmation humaine** — l'OCR et l'extraction ne seront jamais fiables à 100 %.
Après analyse, présenter un écran de revue : « Nous avons détecté ces compétences —
confirmez ou retirez », pré-rempli au lieu d'un formulaire vide.

C'est à la fois la réponse d'ingénierie honnête (une erreur OCR devient une gêne mineure,
pas une corruption silencieuse des données) et un excellent moment de démo.

### 5.3 Données à conserver par CV analysé
- Texte brut extrait (retraitement futur, recherche).
- Voie utilisée (native / OCR) et confiance OCR → métrique intéressante pour le mémoire
  (« X % de nos CV de test ont nécessité l'OCR, confiance moyenne Y »).
- Résultat structuré **avant et après** confirmation humaine → permet de mesurer la
  précision/rappel de l'extraction dans le chapitre évaluation.

### 5.4 Multi-CV : périmètre minimal assumé

Aujourd'hui le CV n'existe qu'au niveau candidature (`Candidature.cv`) ou import de cohorte
(`EtudiantExterne.cvPdf`) — aucune entité CV au niveau du profil étudiant.

**On implémente le strict nécessaire**, pas une gestion documentaire complète :
- Entité `CV` : `idCV`, `idEtudiant`, `libelle`, fichier, résultat d'extraction,
  `estPrincipal`, `dateAjout`.
- `Candidature.idCV` (FK) en remplacement de la colonne texte libre.
- Le profil de compétences de l'étudiant = **union** des compétences confirmées sur
  l'ensemble de ses CV, en gardant la trace du CV d'origine.

Cela suffit à alimenter la fonctionnalité « quel CV envoyer ? » (le système compare les CV
de l'étudiant à une offre donnée et désigne le mieux placé) — c'est-à-dire ② appliqué à un
périmètre restreint. Le CRUD de médiathèque de CV autour n'apporte pas de points : rester
minimal.

*Note de stockage :* les CV sont stockés en base64 dans une colonne `text`. Acceptable à
l'échelle du mémoire, à signaler comme compromis assumé ; la réponse « prête pour la
production » serait un stockage objet (MinIO, déjà facile avec Docker) avec simple référence
en base. À mettre en « perspectives », pas à implémenter.

---

## 6. Décision d'architecture : Neo4j ou PostgreSQL ?

**Décision retenue : le cœur (③ + ②) se fait en PostgreSQL. Neo4j devient optionnel.**

Justification honnête :
- Une matrice de co-occurrence, c'est une auto-jointure et un `GROUP BY`. PostgreSQL le fait
  nativement.
- Ajouter une seconde base, un job de synchronisation et un risque de dérive pour calculer
  ce que SQL sait déjà faire serait une complexité **à défendre plutôt qu'à exploiter** — et
  un membre du jury qui connaît les bases de données posera la question.

**Neo4j ne se justifie que pour ce que SQL fait mal**, à savoir :
- les **chemins multi-sauts** (étudiant → compétence → offre → compétence → offre) ;
- le **PageRank personnalisé** pour la découverte sérendipiteuse.

Ce sont de vrais apports, et une seconde approche légitime à comparer dans l'évaluation.

**Règle de décision :** le **graphe reste le modèle conceptuel** du mémoire dans tous les
cas — ce cadrage est juste et doit être conservé à la rédaction. Neo4j n'en est qu'une
*implémentation*. On ne l'introduit que si le multi-sauts / PageRank est effectivement
traité. Sinon, on fait les calculs de graphe en PostgreSQL et on investit le temps gagné
dans le chapitre évaluation, qui rapporte davantage.

---

## 7. Évaluation — la vraie contribution scientifique

C'est cette section, et non la technologie employée, qui fait le niveau M2.

- Constituer une vérité terrain : historique des `Candidature` (issues acceptées/refusées),
  complété si nécessaire par un jeu étiqueté construit manuellement sur le corpus actuel.
- Comparer, sur les mêmes données :
  1. **Baseline** — l'heuristique à poids fixes actuelle (correspondance exacte) ;
  2. **Co-occurrence** — ② avec adjacence des compétences ;
  3. *(optionnel)* **PageRank personnalisé** si Neo4j est retenu.
- Métriques : **Précision@K, Rappel@K, NDCG**.
- Mesurer aussi la qualité de ① séparément : précision/rappel de l'extraction de compétences
  (comparaison avant/après confirmation humaine, cf. 5.3), et taux de recours à l'OCR.

**La phrase à pouvoir prononcer en soutenance :** *« nous avons remplacé une correspondance
exacte par une structure de similarité apprise du corpus lui-même, et nous avons mesuré le
gain. »*

⚠️ Sur un corpus de cette taille, les métriques seront bruitées. **Le dire explicitement**
dans les limites plutôt que de survendre les chiffres : un jury valorise une section
« limites » honnête bien plus que des résultats gonflés.

---

## 8. Ordre de construction

1. **Pipeline CV — voie électronique d'abord** (gain rapide, débloque les tests), puis OCR.
2. **Matrice de co-occurrence + scoreur ②**, calculable dès maintenant sur les données
   existantes (51 offres déjà en base) — n'attend pas ①.
3. **Bidirectionnel** (offre → candidats) : découle de 2, quasi gratuit.
4. **Multi-CV minimal** (5.4) puis « quel CV envoyer ? ».
5. **Conseiller contrefactuel ③** — réutilise le scoreur de 2, à faire en dernier car
   presque entièrement « offert ».
6. **Évaluation (§7) en parallèle de 2 et 3**, surtout pas à la fin : il faut journaliser
   prédictions et issues au fil de l'eau, pas les reconstituer après coup.

---

## 9. Explicitement hors périmètre

Nommé ici pour que le périmètre ne dérive pas silencieusement pendant la réalisation :

- ❌ **Tout LLM / IA générative** — contraire au principe directeur (§0).
- ❌ **Génération automatique de QCM** — extension séduisante mais hors sujet du mémoire.
- ❌ **Détection de plagiat de CV** — bon gadget, aucune valeur pour la problématique.
- ❌ **Chatbot conversationnel de recherche d'offres** — fort effet démo, mais périmètre
  important et orthogonal au sujet « systèmes de recommandation ». À garder en
  « perspectives ».
- ❌ **Notifications temps réel** — passerait pour de la dispersion en questions de jury.
- ❌ **Médiathèque de CV complète** (CRUD, versions, partage) — voir 5.4, rester minimal.

---

## 10. Risques et points de vigilance

| Risque | Mitigation |
|---|---|
| **Précision OCR sur scans dégradés** — le principal risque technique | Budgéter le prétraitement d'image (§5.2, étape 3b) ; la confirmation humaine (étape 6) garantit qu'une erreur reste une gêne, pas une corruption silencieuse |
| **Matrice de co-occurrence creuse** (corpus réduit) | Lissage par a priori de catégorie (§3.3), et le dire dans les limites |
| **Métriques d'évaluation bruitées** | Section « limites » explicite plutôt que chiffres survendus |
| **Dérive de synchronisation** *(uniquement si Neo4j retenu)* | Neo4j reconstructible intégralement depuis PostgreSQL à la demande : le pire cas est « relancer le job », jamais « les deux bases divergent » |
| **Dérive de périmètre** | §9 existe précisément pour ça — s'y tenir |
