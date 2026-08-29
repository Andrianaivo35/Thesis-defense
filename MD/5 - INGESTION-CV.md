# Lecture des CV : OCR et extraction de compétences

> Documentation technique du Lot 5.4. Deuxième pilier du mémoire, après le
> [moteur de co-occurrence](4%20-%20MOTEUR-COOCCURRENCE.md).
>
> Ce document consigne la méthode, **les erreurs commises et comment la mesure les
> a révélées**, les résultats chiffrés et les limites assumées.

---

## 1. Le problème

Le sujet annoncé est « recommander à partir du CV ». Or jusqu'à ce lot, le CV
n'était **jamais lu**. Il était déposé, stocké, téléchargeable par l'entreprise —
et c'est tout. Les recommandations s'appuyaient exclusivement sur le profil saisi
à la main, que l'étudiant remplit rarement et met à jour encore moins.

L'écart n'est pas cosmétique : un étudiant dont le CV mentionne huit compétences
mais qui n'en a déclaré aucune était, pour la plateforme, un profil vide.

## 2. Deux formats sous un même nom

Un PDF n'est pas un format, c'en est deux :

| | Contenu | Extraction |
|---|---|---|
| **PDF natif** | une couche texte | directe, exacte, gratuite |
| **PDF numérisé** | une image de page | impossible sans OCR |

Le second cas est fréquent chez les étudiants : photocopie à la bibliothèque,
ou de plus en plus souvent photo prise au téléphone.

Le piège est que **l'échec est silencieux**. Un extracteur classique appliqué à
un PDF numérisé ne lève aucune erreur : il renvoie une chaîne vide. Le CV est
alors traité comme s'il ne contenait rien, et personne n'en est informé.

L'étudiant ne doit jamais avoir à déclarer laquelle des deux natures il dépose.
La détection est donc automatique.

### 2.1 Pourquoi la décision se prend page par page

Le cas **mixte** est le plus courant et le plus traître : un CV rédigé sur
traitement de texte, auquel l'étudiant agrafe le scan de son diplôme ou de son
attestation de scolarité.

Une décision prise au niveau du **document** se trompe forcément :

- « le document a du texte » → la page numérisée est ignorée, le diplôme est perdu ;
- « le document est un scan » → on passe la page native à l'OCR, dégradant un
  texte qui était parfait.

D'où le routage **page par page**. C'est peu coûteux à écrire et cela change la
nature du résultat : sur les 7 CV mixtes du corpus, le rappel est de 100 %.

### 2.2 Le critère de routage

Implémenté dans `evaluerCoucheTexte()` ([src/lib/extractionTexte.js](../src/lib/extractionTexte.js)) :

1. **moins de 180 caractères** sur la page → OCR.
   Le seuil n'est pas arbitraire. Une page numérisée renvoie en général
   0 caractère, parfois quelques dizaines (numéro de page, filigrane, en-tête
   resté vectoriel). La page de CV la plus dépouillée du corpus en compte plus
   de 600. La marge entre les deux populations est large ; 180 s'y place sans
   ambiguïté.

2. **moins de 45 % de lettres** → OCR.
   Une couche texte peut exister tout en étant inexploitable : polices mal
   encodées, PDF produit par un logiciel défaillant. Le symptôme est une
   proportion anormale de caractères non alphabétiques.

**Résultat mesuré : 38/38 CV correctement routés.**

### 2.3 Comment on récupère l'image d'une page numérisée

On extrait l'image **déjà embarquée** dans le PDF, au lieu de rastériser la page.

C'est possible parce qu'une page numérisée *est* une image plein cadre : c'est
ainsi que tout scanner produit son PDF. Quand plusieurs images coexistent, on
retient la plus volumineuse — la page elle-même, et non un logo ou un tampon.

L'intérêt est concret : rastériser exigerait un moteur de rendu **et** une
bibliothèque graphique native (`canvas`), lourdes à installer dans le conteneur.
L'extraction directe n'a besoin de rien de plus que ce qui est déjà là.

> **Limite assumée.** Une page numérisée découpée en plusieurs images, ou mêlant
> image et dessin vectoriel, n'est pas couverte. Ce n'est pas le cas des
> scanners courants, mais c'est à signaler.

## 3. L'OCR derrière un adaptateur

Le choix du moteur est un arbitrage, pas une évidence :

| | Avantages | Inconvénients |
|---|---|---|
| **Tesseract** *(retenu)* | libre, hors ligne, s'intègre au conteneur existant, précision suffisante sur du CV dactylographié | entrelace les colonnes d'un CV sur deux colonnes |
| **OCR infonuagique** (Google Vision, Azure Document Intelligence, AWS Textract) | nettement meilleur sur les scans photographiés, **sensible à la mise en page** — reconstitue l'ordre de lecture | payant, dépend du réseau |

Cet arbitrage peut légitimement se retourner en production. Le placer derrière
une interface (`src/lib/ocr.js`) fait du changement de moteur une affaire de
**configuration** (`MOTEUR_OCR`), non de réécriture : le reste du pipeline ne
connaît que `reconnaitre(image) → { texte, confiance }`.

**Règle de conception :** un moteur indisponible *lève* une erreur. Il ne renvoie
jamais un texte vide, qui serait indistinguable d'une page blanche et ferait
passer une panne pour un CV sans compétences.

Les données linguistiques (`ocr-data/fra.traineddata`) sont **versionnées dans le
dépôt** plutôt que téléchargées au premier appel. Sans cela, la première analyse
échoue sur une machine hors ligne — et une soutenance se déroule rarement avec
une connexion fiable.

## 4. L'appariement flou

### 4.1 Deux problèmes, une solution

Ils se posaient séparément :

1. **L'OCR se trompe de caractères.** « Malagasy » est lu « Maiagasy ».
2. **Les étudiants n'écrivent pas comme le référentiel.** « Node JS »,
   « node.js », « NodeJS ».

Dans les deux cas il faut reconnaître deux chaînes proches sans être identiques.
Une seule mécanique — la distance d'édition — traite l'entrée bruitée **et** la
normalisation du vocabulaire. C'est ce qui fait de ce pipeline une conception
cohérente, et non deux briques juxtaposées.

### 4.2 Trois garde-fous contre les faux positifs

Le flou est une arme à double tranchant : trop permissif, il fabrique des
compétences que le CV ne mentionne pas.

1. **Aucun flou sous six caractères.** À trois caractères, « SQL » est à une
   substitution de « SGL », « SQI », « SOL ». Le rapport signal/bruit s'effondre.
2. **Appariement au plus long, avec masquage.** Sans cela « PostgreSQL »
   produirait aussi « SQL », et « NoSQL (MongoDB) » également.
3. **Pondération par la section du CV.** Le plus efficace des trois — voir §4.3.

### 4.3 La section comme signal

Un CV réel ne contient pas que des compétences : loisirs, qualités personnelles,
logiciels hors référentiel, certifications. Sans tenir compte de la structure,
« Photographie » listé en centres d'intérêt pèse autant que « Comptabilité »
listé en compétences.

Les sections sont donc classées par **pertinence**, qui multiplie la similarité :

| Section | Pertinence |
|---|---|
| Compétences | 1,00 |
| Expériences, Langues | 0,90 |
| Logiciels | 0,85 |
| Formation | 0,80 |
| Certifications | 0,70 |
| Divers, À propos | 0,40 |
| Loisirs, Qualités | 0,30 |

Un terme lu en section secondaire n'est **pas écarté** : le rejeter d'office
ferait manquer le CV qui mentionne « Python » dans sa phrase d'accroche. Sa
confiance tombe sous le seuil de rétention (0,55) : il reste visible dans l'écran
de revue, sans être coché par défaut.

---

## 5. Les erreurs, et comment la mesure les a révélées

C'est la partie la plus utile du chapitre. Chaque erreur a été trouvée en
mesurant sur le corpus de vérité terrain, jamais en relisant le code.

### 5.1 Jaro-Winkler détruisait la précision

**Le raisonnement initial**, qui semblait solide : l'OCR se trompe rarement sur
les premières lettres d'un mot, donc une mesure privilégiant le préfixe devait
améliorer le rappel. On retenait `max(Levenshtein, Jaro-Winkler)`.

**La mesure a dit l'inverse.** Jaro-Winkler causait à lui seul la quasi-totalité
des faux positifs :

| terme lu | apparié à | Jaro-Winkler | Levenshtein |
|---|---|---|---|
| « anglais » | Angular | **0,867** ✓ | 0,571 ✗ |
| « autonomie » | Agronomie | **0,867** ✓ | 0,778 ✗ |
| « gestion et commerce » | Gestion de projet | **0,891** ✓ | 0,526 ✗ |
| « francais courant anglais » | Français rédactionnel | **0,877** ✓ | ~0,500 ✗ |

**La raison est structurelle.** Jaro-Winkler a été conçu pour le rapprochement
d'enregistrements d'état civil : des **patronymes**, courts et sans espaces. Son
bonus de préfixe y a un sens. Appliqué à des locutions techniques de plusieurs
mots, il suffit qu'elles partagent leur premier mot — « Gestion… », « Génie… » —
pour que le bonus emporte la décision, quel que soit le reste.

Levenshtein seul rejette ces quatre cas **et** retient les véritables erreurs
OCR : « Maiagasy » lu pour « Malagasy » est à une substitution près, soit 0,875,
au-dessus du seuil de 0,86. La correction du bruit OCR — le service qu'on
attendait de Jaro-Winkler — était déjà rendue par la distance d'édition.

> **Leçon.** Une mesure de similarité n'est pas générique. Elle porte les
> hypothèses du problème pour lequel elle a été conçue.

**Effet : précision 60,0 % → 88,8 %**, rappel inchangé.

### 5.2 La détection de section mangeait des compétences

La règle initiale était : « la ligne *contient* un mot repère → c'est un titre de
section ». La ligne était alors consommée comme titre, sans être analysée.

Conséquence : `« Contrôle qualité — niveau intermédiaire »` contient
« qualité ». Elle était donc prise pour le titre de la section « Qualités
personnelles » et sautée. **La compétence « Contrôle qualité » disparaissait,
alors qu'elle était écrite en toutes lettres** — six fois sur le corpus.

Un titre de section *ouvre* une section : il est en **tête** de ligne.

Il a fallu par ailleurs distinguer deux formes réelles :

- le titre **sur sa propre ligne** (mise en page classique) ;
- le titre **en tête de ligne suivi de son contenu** :
  `« Formation   Licence 3 — Gestion et Commerce »`. C'est la mise en page en
  colonnes libellé/valeur, et c'est aussi ce que produit l'OCR quand il replie
  deux colonnes sur une seule ligne.

Ne traiter que le premier cas était une erreur mesurée : les lignes du second
type n'ouvraient aucune section et **héritaient de la précédente**.
`« Qualités : Sens du relationnel, Rigueur »` se retrouvait rattaché à la section
« Logiciels » ouverte plus haut, avec sa pertinence élevée — exactement l'inverse
de l'effet recherché.

**Effet : rappel 87,5 % → 94,9 %.**

### 5.3 La vérité terrain était fausse

Les langues écrites sur les CV (`Malagasy`, présent au référentiel) n'avaient pas
été consignées dans `competencesAttendues`. L'extraction les retrouvait — à
raison — et était comptée en **faux positif quarante fois pour avoir eu raison**.
La précision affichée tombait à 75 % au lieu de 98 %.

> **Leçon.** Une vérité terrain incomplète ne rend pas la mesure sévère, elle la
> rend **fausse**. Un faux positif inexpliqué doit être instruit avant d'être
> attribué au système.

### 5.4 Deux bugs que seul un essai de bout en bout pouvait révéler

Les mesures en ligne de commande passaient toutes. Contre le conteneur :

1. **Le worker de pdfjs n'existait pas.** `pdf-parse` et `tesseract.js` chargent
   des fichiers annexes *à l'exécution, par chemin*. Le bundler de Next réécrit
   les chemins des modules qu'il absorbe mais n'émet pas ces fichiers :
   `Cannot find module '/app/.next/server/chunks/pdf.worker.mjs'`.
   Corrigé en les déclarant `serverExternalPackages`.

2. **`inconsistent types deduced for parameter $9`** — le même paramètre servait
   de valeur et de test dans un `CASE`, avec deux types déduits.

> **Leçon.** Mesurer l'algorithme ne mesure pas le système. Les deux défauts
> étaient invisibles à toute vérification n'empruntant pas le chemin réel.

---

## 6. Résultats

Sur les **38 CV** du corpus de vérité terrain
([voir sa génération](../scripts/generer-cv-test.js)) — 168 compétences à
retrouver et 492 termes parasites à ignorer.

```
routage de la nature du PDF : 38/38
confiance OCR moyenne       : 91,6 % sur 22 CV
durée d'analyse             : ~1,5 s par CV scanné, OCR compris

précision 98,2 %   rappel 95,2 %   F1 96,7 %
```

| Nature | CV | Précision | Rappel |
|---|---|---|---|
| natif | 16 | 97,2 % | 98,6 % |
| scanné | 15 | **100,0 %** | 89,4 % |
| mixte | 7 | 97,0 % | **100,0 %** |

**Lecture.** Sept des huit compétences manquées sont sur des CV scannés :
l'OCR coûte une dizaine de points de rappel, et rien ou presque en précision.
C'est le comportement souhaitable — le pipeline préfère taire une compétence
qu'en inventer une.

> Ces chiffres ont été **remesurés** après le nettoyage de la base
> ([scripts/nettoyer-base.mjs](../scripts/nettoyer-base.mjs)), qui a retiré trois
> comptes personnels ou d'essai : le corpus est passé de 41 à 38 CV. Les écarts
> avec la mesure précédente (précision 98,8 %, rappel 96,0 %) sont de l'ordre du
> demi-point, ce qui donne une idée concrète du bruit à cette taille
> d'échantillon.

### Reproduire

```bash
node scripts/generer-cv-test.js        # régénère le corpus + la vérité terrain
node scripts/test-ingestion-cv.mjs     # mesure précision / rappel / F1
node scripts/test-ingestion-bout-en-bout.mjs   # chaîne complète par HTTP
```

---

## 7. La confirmation humaine

Ni l'OCR ni l'extraction ne seront fiables à 100 %. Écrire d'office les
compétences détectées dans `CompetenceEtudiant` ferait d'une erreur de lecture
une **donnée fausse**, propagée ensuite dans toutes les recommandations sans que
personne ne puisse remonter à sa cause.

Les détections vont donc dans une table dédiée, `CompetenceDetectee`, avec une
colonne `decision` qui reste `NULL` tant que l'étudiant n'a pas tranché. Le
pipeline **propose**, l'étudiant **dispose**.

Trois bénéfices, pas un :

1. **Robustesse.** Une erreur d'OCR devient une case à décocher.
2. **Ergonomie.** L'étudiant reçoit un formulaire **pré-rempli** au lieu d'un
   formulaire vide. C'est aussi le meilleur moment de démonstration.
3. **Évaluabilité.** Conserver l'état *avant* et *après* arbitrage humain est
   exactement ce qu'il faut pour mesurer la précision de l'extraction en
   conditions réelles (chapitre d'évaluation, Lot 5.5). Sans cette séparation,
   la correction humaine effacerait la trace de l'erreur.

Chaque proposition affiche **d'où elle vient** — la page, la section, la ligne
d'origine, et le terme réellement lu quand l'appariement était flou. Sans cette
justification, l'étudiant n'aurait aucun moyen de trancher autrement qu'au
hasard.

---

## 8. Limites assumées

| Limite | Portée | Réponse « production » |
|---|---|---|
| Page numérisée en plusieurs images ou mêlant vectoriel | rare hors scanners courants | rastérisation via pdfjs + canvas |
| Tesseract entrelace les CV sur deux colonnes | dégrade le rappel sur ces mises en page | OCR infonuagique sensible à la mise en page — l'adaptateur est déjà en place |
| Analyse **synchrone** (1 à 2 s) | acceptable à cette échelle | file d'attente si le volume changeait |
| Compétences hors référentiel non exploitées | le terme est conservé mais inutilisé | circuit de validation admin/université |
| Le niveau de maîtrise n'est jamais déduit | le pipeline lit un nom, pas un niveau | analyse du contexte (« 3 ans d'expérience ») |
| Photos de téléphone (obliques, peu contrastées) | non représentées au corpus | prétraitement d'image : redressement, binarisation, débruitage |

**Le corpus est synthétique.** C'est son intérêt — il fournit une vérité terrain
exacte, impossible à obtenir sur des CV réels sans annotation manuelle — et sa
limite : les dégradations appliquées (inclinaison, bruit, contraste) imitent un
scan, elles ne le sont pas. Les chiffres du §6 sont à lire comme une borne
**supérieure**.

---

## 9. Où c'est implémenté

| Fichier | Rôle |
|---|---|
| [src/lib/ocr.js](../src/lib/ocr.js) | adaptateur OCR, moteur Tesseract, moteur d'absence explicite |
| [src/lib/extractionTexte.js](../src/lib/extractionTexte.js) | routage page par page, extraction d'image, nettoyage |
| [src/lib/appariementFlou.js](../src/lib/appariementFlou.js) | normalisation, Levenshtein, sections, extraction |
| [src/lib/ingestionCV.js](../src/lib/ingestionCV.js) | orchestration, persistance, application des décisions |
| [src/app/api/cv/[idCV]/analyse/route.js](../src/app/api/cv/%5BidCV%5D/analyse/route.js) | `POST` analyser, `GET` relire, `PUT` confirmer |
| [src/components/revueCompetencesCV.js](../src/components/revueCompetencesCV.js) | écran de revue et de confirmation |
| [scripts/migrations/007-analyse-cv.sql](../scripts/migrations/007-analyse-cv.sql) | colonnes d'analyse sur `CV`, table `CompetenceDetectee` |
| [scripts/generer-cv-test.js](../scripts/generer-cv-test.js) | corpus synthétique + vérité terrain |
| [scripts/test-ingestion-cv.mjs](../scripts/test-ingestion-cv.mjs) | mesure précision / rappel / F1 |
| [scripts/test-ingestion-bout-en-bout.mjs](../scripts/test-ingestion-bout-en-bout.mjs) | chaîne complète par HTTP |
