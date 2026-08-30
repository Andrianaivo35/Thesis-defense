# Moteur de similarité entre compétences — documentation technique

Document de référence sur la contribution centrale du mémoire.
Il consigne la méthode, **les échecs rencontrés et leur résolution**, les formules, les
mesures obtenues et les limites assumées.

Implémentation : [`src/lib/cooccurrence.js`](../src/lib/cooccurrence.js)
Vérification : `node scripts/mesures/test-cooccurrence.mjs`

> Les échecs documentés en §4 sont la partie la plus utile de ce document. Ils constituent
> le raisonnement scientifique du mémoire : une hypothèse, sa mise à l'épreuve sur données
> réelles, son invalidation partielle, puis sa correction motivée.

---

## 1. Le problème

Le moteur de recommandation comparait les compétences **par identifiant exact**. Un étudiant
maîtrisant React obtenait **zéro** sur une offre exigeant Vue.js, alors qu'un recruteur y
verrait une quasi-correspondance. Même situation pour Laravel et Symfony, MySQL et
PostgreSQL, ou Statistiques et Analyse de données.

Le système ne disposait d'aucune notion de proximité entre compétences, et rien dans les
données ne la déclarait explicitement.

---

## 2. Principe retenu : sémantique distributionnelle par comptage

**Aucun LLM, aucun apprentissage, aucun modèle pré-entraîné.** Uniquement des dénombrements
sur les données de la plateforme.

Ce choix est un atout en soutenance, pas un compromis :

| Propriété | Conséquence |
|---|---|
| Chaque score s'explique par de l'arithmétique | On répond à « pourquoi ce classement ? » par une démonstration |
| Résultats déterministes | Indispensable au chapitre évaluation — un LLM donnerait un résultat différent à chaque exécution |
| Aucun appel réseau, aucun coût | Le système tourne intégralement hors ligne dans le Docker fourni |
| Le mérite technique reste au candidat | Personne ne peut dire « c'est le modèle qui a fait le travail » |

**Référence théorique.** Le principe est celui de la sémantique distributionnelle : *« on
reconnaît un mot à ses fréquentations »* (Firth, 1957). C'est le fondement conceptuel de
word2vec, mais calculé ici par comptage plutôt que par descente de gradient — donc
entièrement inspectable.

---

## 3. Pourquoi une similarité du **second** ordre

La co-occurrence directe ne peut pas fonctionner ici, et c'est contre-intuitif.

React et Vue.js sont des **alternatives** : une équipe emploie l'une *ou* l'autre. Elles ne
figurent donc presque jamais ensemble dans une même offre. Leur co-occurrence directe est
nulle — les compter directement conclurait qu'elles n'ont **aucun rapport**, soit l'inverse
exact de la réalité.

**Vérifié sur le corpus :** `co-occurrence directe React / Vue.js = 0`.

On compare donc les **profils de co-occurrence** plutôt que la co-occurrence elle-même.
React et Vue.js apparaissent toutes deux aux côtés de JavaScript, HTML/CSS et Git : leurs
vecteurs de contexte se ressemblent, donc les compétences sont jugées proches.

### Contextes retenus

Deux sources, toutes deux légitimes :

- les compétences **exigées par une même offre** ;
- les compétences **déclarées par un même étudiant**.

Les identifiants sont préfixés (`o3`, `e3`) : une offre n° 3 et un étudiant n° 3 sont deux
contextes distincts. Les contextes ne contenant qu'une seule compétence sont écartés — ils
n'apportent aucune paire.

---

## 4. Les trois échecs rencontrés, et leur résolution

> **C'est la section à exploiter dans le mémoire.** Chaque échec a été constaté sur données
> réelles, diagnostiqué, puis corrigé de manière motivée.

### 4.1 Échec — Instabilité sur données rares

**Constat.** `Génie civil ↔ Génie textile = 0,979`.

**Diagnostic.** Le cosinus ne fait aucune différence entre une similarité établie sur vingt
observations et une établie sur une seule. Ces deux compétences n'apparaissaient que dans
deux ou trois contextes, partagés avec « Contrôle qualité ». Deux vecteurs minuscules
partageant leurs rares voisines obtiennent mécaniquement un score proche de 1. C'était une
**coïncidence de rareté**, pas une proximité.

**Correction.** Amortissement par le volume de preuves :

```
confiance = n / (n + K),  avec K = 5
n = nombre de contextes de la compétence la moins observée
```

Le maillon le plus faible borne la confiance : une similarité ne peut pas être plus fiable
que la compétence la moins documentée des deux.

| n (observations) | Part du score conservée |
|---|---|
| 1 | 17 % |
| 2 | 29 % |
| 5 | 50 % |
| 20 | 80 % |

**Propriété recherchée :** l'amortissement s'efface à mesure que le corpus s'étoffe.

**Résultat.** `Génie civil ↔ Génie textile` retombe de 0,979 à 0,458.

---

### 4.2 Échec — Complémentarité confondue avec substituabilité

**Constat.** Le moteur créditait un étudiant possédant **Git** pour une offre exigeant
**SQL**, en justifiant *« Git est proche de SQL »*.

**Diagnostic.** Le cosinus du second ordre mesure « apparaît dans des contextes
semblables ». Or cela recouvre **deux relations très différentes** :

| Relation | Exemple | Utilisable pour créditer ? |
|---|---|---|
| **Substituabilité** | React *ou* Vue.js | ✅ oui — l'une remplace l'autre |
| **Complémentarité** | Git *et* SQL | ❌ non — l'une ne remplace pas l'autre |

La proximité statistique était **réelle** ; la conclusion était **fausse**. Pour créditer un
profil, c'est la substituabilité qui compte.

**Première correction — pénalité de complémentarité.** Les deux relations se distinguent par
un signal simple : deux compétences substituables apparaissent dans des contextes
*semblables* mais **rarement ensemble**, alors que deux compétences complémentaires
apparaissent précisément ensemble.

```
tauxDirect = coOccurrenceDirecte(a,b) / n
facteurSubstituabilite = 1 − 0,8 × tauxDirect
```

**Effet vérifié :** React ↔ Node.js (complémentaires, front + back) passe de 0,428 à 0,347.

**Limite de cette correction.** Elle est **insuffisante à elle seule**. Git et SQL figurent
dans *les mêmes* offres : aucun décompte de contextes, si raffiné soit-il, ne peut les
séparer. Il fallait un signal **indépendant de la co-occurrence** — voir §4.3.

---

### 4.3 Échec — Compétences sans aucun contexte, et résolution par le signal textuel

**Constat.** Huit compétences du référentiel n'apparaissaient dans **aucun** contexte :
Vue.js, Angular, C++, Symfony, NoSQL (MongoDB), Cloud (AWS/Azure), Malagasy, Français
rédactionnel. Vingt-cinq sur cinquante-six en avaient deux ou moins.

Une compétence sans contexte n'a aucun voisin : le signal de co-occurrence ne peut
**rien** en dire. Le cas React ≈ Vue.js, pourtant l'exemple fondateur de la méthode, n'était
donc **pas démontrable** sur le corpus.

**Correction — un troisième signal, textuel.**

La colonne `CompetenceReference.description` existait mais était vide pour les 56
compétences. Elle devient un signal de similarité à part entière (migration 006).

C'est **précisément le signal qui manquait**, et il résout les deux problèmes à la fois :

| Problème | Pourquoi la description le résout |
|---|---|
| Compétence sans contexte | Une description fournit des dizaines de termes, indépendamment du nombre d'offres publiées |
| Git ≈ SQL | Leurs descriptions ne partagent **aucun** terme (« versions du code source » / « bases de données relationnelles »), là où React et Vue.js partagent presque tout leur vocabulaire |

**Principe de rédaction des descriptions.** Le vocabulaire est délibérément normalisé : deux
compétences interchangeables doivent partager leurs **termes structurants** (le rôle, la
technologie de base, l'objet manipulé), et deux compétences seulement complémentaires ne
doivent en partager aucun.

```
React   : « Bibliothèque JavaScript de composants pour construire des interfaces web côté navigateur »
Vue.js  : « Framework    JavaScript de composants pour construire des interfaces web côté navigateur »
Git     : « Système de gestion des versions du code source et de collaboration entre développeurs »
SQL     : « Langage d'interrogation et de manipulation de bases de données relationnelles »
```

Ce sont des **données de référence rédigées**, au même titre que la taxonomie des filières
du Lot 4.4. La similarité, elle, reste calculée par comptage.

**Mise en œuvre : TF-IDF + cosinus.**

```
poids(terme, competence) = tf × ( log(N / df) + 1 )
similariteTexte(a,b) = cosinus( vecteur(a), vecteur(b) )
```

L'IDF est **indispensable** : sans lui, « pour » ou « applications » pèseraient autant que
« relationnelles ». Ce sont précisément les termes rares qui distinguent une compétence
d'une autre.

**Racinisation minimale du français.** Sans elle, « industrielle » et « industrielles »
restaient deux termes distincts, ce qui annulait tout rapprochement entre descriptions
industrielles. La racinisation est volontairement **conservatrice** — marques de pluriel et
de féminin les plus régulières uniquement. Une racinisation agressive rapprocherait des
termes sans rapport, ce qui serait pire que le problème initial.

---

## 5. Formule finale

```
similarite(a, b) =
      0,60 × similariteTexte(a, b)
    + 0,15 × similariteCooccurrence(a, b) × confiance × facteurSubstituabilite
    + 0,25 × aprioriCategorie(a, b)

  puis : si résultat < 0,40 → 0
```

### Justification de chaque terme

| Terme | Poids | Rôle |
|---|---|---|
| **Description (TF-IDF)** | 0,60 | Dense, disponible même sans aucune offre, seul signal capable de séparer substituabilité et complémentarité |
| **Co-occurrence observée** | 0,15 | Précise mais rare (11,4 % de densité) ; amortie par la confiance et la pénalité de complémentarité |
| **A priori de catégorie** | 0,25 | N'oriente qu'en dernier recours ; **non amorti**, puisqu'il ne repose sur aucune observation — c'est son rôle de combler leur absence |

**Poids majoritaire du texte : assumé.** À l'échelle actuelle du corpus, la description est
plus fiable que 176 paires observées. Le rapport s'inversera naturellement quand la
plateforme aura assez d'offres — et ce basculement est lui-même un résultat à discuter dans
le mémoire.

**Seuil de 0,40.** Principe retenu : *si une proximité n'inspire pas assez confiance pour
être affichée à l'utilisateur, elle n'en inspire pas assez pour entrer dans le score.* Un
seul seuil gouverne donc l'affichage et le calcul. Calibré sur le corpus : à 0,15, le moteur
créditait Git pour une offre exigeant SQL.

---

## 6. Intégration au score de compétence

Une compétence proche est créditée **au prorata de la similarité mesurée** :

```
créditObtenu = poidsCompetence × similarite(exigée, possédée)
```

Une compétence approchante ne vaut donc **jamais** autant que la compétence exacte. Pour
chaque compétence exigée sans correspondance exacte, on retient la compétence de l'étudiant
la plus proche.

La correspondance est **explicitée à l'utilisateur** — *« Symfony est proche de Laravel »* —
sans quoi il ne comprendrait pas pourquoi une offre dont il ne possède aucune compétence
exigée lui est proposée.

**Robustesse.** Un échec de construction de la matrice ne bloque pas la recommandation : le
moteur retombe sur la correspondance exacte. La matrice est mise en cache 5 minutes.

---

## 7. Mesures obtenues

### 7.1 Densité du corpus

| Mesure | Avant densification | Après |
|---|---|---|
| Contextes | 80 | **104** |
| Paires observées | 141 | **176** |
| Paires possibles | 1 540 | 1 540 |
| **Densité** | 9,2 % | **11,4 %** |
| Compétences sans contexte | 8 | **0** |
| Compétences décrites | 0 | **56 / 56** |

### 7.2 Validation sur paires de contrôle

| Paire | Score | Attendu | Verdict |
|---|---|---|---|
| Laravel / Symfony | **0,885** | substituables | ✅ |
| Vue.js / Angular | **0,879** | substituables | ✅ |
| MySQL / PostgreSQL | **0,855** | substituables | ✅ |
| Javascript / TypeScript | **0,799** | substituables | ✅ |
| React / Vue.js | **0,765** | substituables | ✅ |
| Analyse de données / Statistiques | 0,573 | proches | ✅ |
| Comptabilité / Audit financier | 0,542 | proches | ✅ |
| Git / SQL | **0,000** | complémentaires | ✅ |
| Cloud / Docker | **0,000** | complémentaires | ✅ |
| Comptabilité / Docker | **0,000** | sans rapport | ✅ |

**Séparation parfaite** entre substituables et non-substituables sur l'échantillon de
contrôle.

### 7.3 Effet sur les recommandations

| Étudiant | Offre recommandée | Score | Explication produite |
|---|---|---|---|
| Développeuse **Symfony** | Stagiaire Développeur Laravel | 97 | *Symfony est proche de Laravel* |
| Développeuse **Vue.js** | Stagiaire Développeur Angular | 96 | *Vue.js est proche de Angular* |
| Développeur **Angular** | Stagiaire Développeur Vue.js | 95 | *Angular est proche de Vue.js* |

**Aucun de ces liens n'a été déclaré** : ils sont déduits du corpus et du vocabulaire.

---

## 7bis. Le conseiller contrefactuel — un quatrieme echec instructif

Le conseiller (`/api/conseiller`, PLAN §4) simule l'ajout d'une competence au profil et
mesure l'ecart. Il ne contient **aucun algorithme nouveau** : il rejoue `evaluerCouple` sur
un profil hypothetique. C'est cette reutilisation qui rend le conseil credible — la
recommandation affichee et la simulation reposent sur exactement la meme mesure.

### Echec — le critere de classement favorisait les competences generiques

**Constat.** Premiere suggestion faite a une developpeuse web : *« Apprendre Communication
→ +5 offres »*. Or son score moyen **baissait** (57 → 55), et l'offre debloquee etait
« Stagiaire Gestion Sinistres (38) » — de la gestion de sinistres pour une developpeuse web.

**Diagnostic.** Deux erreurs de mesure combinees :

1. **Compter les offres franchissant le seuil d'affichage (35).** Ce seuil signifie « pas
   totalement hors sujet », pas « opportunite reelle ». Les competences generiques
   (Communication, Relation client) font franchir ce seuil bas a de nombreuses offres sans
   rapport avec le profil.
2. **Mesurer la progression sur la moyenne de toutes les offres eligibles.** Ajouter des
   offres faibles *dilue* cette moyenne : un bon conseil pouvait donc afficher une
   regression.

**Correction.**

| Avant | Apres |
|---|---|
| Offres franchissant 35 | Offres atteignant **60** (`SEUIL_OPPORTUNITE`) |
| Moyenne de toutes les offres eligibles | Moyenne des **10 meilleures** (`CIBLES_REALISTES`) — les cibles realistes de l'etudiant |

**Resultat.** Les conseils deviennent alignes sur le profil, et toutes les progressions sont
desormais positives :

| Etudiant | Conseil | Offres debloquees | Cibles |
|---|---|---|---|
| Developpeuse web | **SQL** | 5 | 77 → **84** |
| Etudiante BTP | **Genie textile** | 3 | 61 → **66** |
| Etudiant actuariat | **Communication** | 8 | 74 → **79** |

**Enseignement transposable.** Un seuil concu pour l'affichage ne convient pas a la
decision. Les deux usages appellent deux seuils distincts, et les confondre produit des
resultats techniquement exacts mais concretement inutiles.

**Performance mesuree :** 65 a 143 ms pour ~50 competences simulees x 65 offres, soit environ
3 000 evaluations par requete. La force brute est suffisante a cette echelle.

---

## 8. Limites assumées

À mentionner explicitement dans le mémoire — un jury valorise davantage une section de
limites honnête que des résultats surestimés.

1. **Densité de 11,4 %.** La co-occurrence reste un signal minoritaire, d'où son poids de
   0,15. Le moteur repose donc surtout sur le texte à ce stade.
2. **Les descriptions sont rédigées, non apprises.** Elles injectent une connaissance
   humaine du domaine. C'est un choix assumé — un référentiel contrôlé, comme la taxonomie
   des filières — mais la similarité textuelle n'est pas « découverte » au même titre que la
   co-occurrence.
3. **Pas de substituts industriels.** Génie civil, Génie mécanique et Génie des procédés
   ressortent à 0 les uns par rapport aux autres. C'est **correct** — un mécanicien ne
   remplace pas un ingénieur procédés — mais cela signifie que les profils industriels ne
   bénéficient pas des correspondances approchées.
4. **Racinisation approximative.** Elle traite les pluriels et féminins réguliers, pas les
   formes irrégulières ni la lemmatisation.
5. **Seuils du conseiller calibres sur ce corpus.** `SEUIL_OPPORTUNITE = 60` et
   `CIBLES_REALISTES = 10` conviennent a 65 offres. Sur un corpus dix fois plus grand, ces
   valeurs demanderaient un reglage.
6. **Corpus de démonstration.** Les données restent fabriquées ; les métriques du chapitre
   évaluation seront bruitées à cette échelle et doivent être présentées comme telles.

---

## 9. Reproductibilité

```bash
# Recalculer et inspecter la matrice
node scripts/mesures/test-cooccurrence.mjs

# Rejouer la densification du corpus (idempotent)
node scripts/base/seed-dummy-data-3.js
```

**Migrations associées**

| Migration | Objet |
|---|---|
| `005-categorie-react.sql` | React était seul dans une catégorie « Developpement », ce qui annulait l'a priori de catégorie face à Vue.js |
| `006-descriptions-competences.sql` | Descriptions des 56 compétences |

**Constantes de réglage** — toutes dans `src/lib/cooccurrence.js`, documentées sur place :
`POIDS_TEXTE`, `POIDS_APRIORI`, `POIDS_COMPLEMENTARITE`, `CONSTANTE_AMORTISSEMENT`,
`SEUIL_SIMILARITE`.
