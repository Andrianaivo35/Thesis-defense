# Perspectives produit : partenariats payants et forum

> **Ce document ne propose rien à implémenter maintenant.** Il pose les deux idées, leurs
> conséquences et les décisions à prendre avant d'écrire la moindre ligne. Le mémoire est
> terminé ; ceci concerne la suite.
>
> Les deux sujets ont un point commun : ils touchent à ce qui fait la valeur de la
> plateforme — la confiance dans le classement, et la qualité de la donnée. Mal conçus, ils
> la détruisent au lieu de l'augmenter.

---

# Partie A — Visibilité payante et partenariats

## A.1 Le besoin

Trois demandes distinctes, qu'il ne faut pas confondre :

| Qui paie | Pour atteindre qui | Le problème |
|---|---|---|
| **Une université** | de **futurs bacheliers** | **Ils ne sont pas sur la plateforme.** Ce sont des lycéens qui n'ont pas encore de compte. |
| **Une entreprise** | de futurs ingénieurs | Ceux-là y sont : ce sont les étudiants inscrits. |
| **Un partenariat** université ↔ entreprise | les deux | Relation durable, pas une campagne. |

**La première ligne est la plus importante et la moins évidente.** Promouvoir une université
auprès de futurs bacheliers suppose une **vitrine publique**, consultable sans compte. La
plateforme n'en a aucune aujourd'hui : tout est derrière une authentification. C'est un
**prérequis**, pas un détail — sans lui, l'université paierait pour être vue par des gens
qui sont déjà ses étudiants.

## A.2 Périmètre arrêté : des bandeaux, jamais des offres

> **Décision prise.** La visibilité payante se limite à des **emplacements de visibilité** —
> bandeaux, mises en avant, vitrine. Elle ne touche **jamais** aux offres recommandées.

Ce n'était pas acquis, et c'est le bon arbitrage. La valeur de cette plateforme tient à une
chose : **le classement est mérité**. Le mémoire entier consiste à montrer qu'une offre
remonte parce qu'elle correspond, et à expliquer pourquoi.

Si une entreprise pouvait payer pour apparaître dans les recommandations :

- la recommandation ne voudrait plus rien dire — l'étudiant ne pourrait plus distinguer
  « on me la propose parce qu'elle me correspond » de « on me la propose parce qu'elle a
  payé » ;
- **la contribution scientifique du projet serait annulée.** Les mesures du chapitre
  d'évaluation portent sur un classement par pertinence ; un classement acheté ne se mesure
  pas ;
- l'effet se retournerait vite : une plateforme dont les recommandations sont suspectes
  n'est plus consultée, et l'espace publicitaire ne vaut alors plus rien.

Le périmètre retenu écarte ces trois risques d'emblée.

### Ce que cela impose au code

`evaluerCouple()` — le scoreur — ne doit connaître **aucune** notion de partenaire,
d'abonnement ou de campagne. Pas de paramètre, pas de jointure, pas de coefficient.

C'est une contrainte facile à énoncer et facile à violer six mois plus tard, sous une forme
qui paraîtra anodine : « remonter légèrement les offres des partenaires », « à score égal,
privilégier un partenaire ». Les deux franchissent la ligne.

La séparation doit donc être **structurelle** : les emplacements payants sont servis par
leurs propres routes, alimentés par leurs propres tables, et rendus par leurs propres
composants. Aucun chemin de code ne relie une campagne à un score.

### Ce que cela impose à l'écran

Un bandeau se lit comme une publicité : **hors du flux classé**, et **signalé** — « Annonce »,
« Contenu sponsorisé ». Le dissimuler exposerait à la réglementation sur la publicité, et
surtout ruinerait la confiance qui fait la valeur du reste.

## A.3 Les emplacements retenus

Tous sont des **espaces de visibilité**. Aucun n'intervient dans un classement par
pertinence.

| Emplacement | Description | Qui l'achète |
|---|---|---|
| **Vitrine publique** | Pages d'établissements et d'entreprises, consultables sans compte et référencées | Université visant les futurs bacheliers |
| **Bandeau d'en-tête** | En tête de la liste des offres, **au-dessus** du flux et non dedans, marqué « Annonce » | Entreprise visant les étudiants |
| **Entreprise mise en avant** | Encart distinct dans « Toutes les entreprises », séparé des résultats | Entreprise |
| **Université mise en avant** | Même principe, sur la vitrine publique | Université |
| **Bandeau de cohorte** | Visible des entreprises, à côté des annonces de cohorte | Université |

**Hors périmètre, par décision :** toute remontée d'une offre, d'un candidat ou d'une
annonce **dans un résultat classé**. Y compris sous les formes atténuées évoquées plus
haut — « à score égal », « léger bonus ». La frontière n'est tenable que si elle est nette.

## A.4 Ce qu'il faudrait construire

Rien de tout cela n'existe. Par ordre de dépendance :

1. **Une vitrine publique** — pages établissement et entreprise sans authentification. C'est
   aussi utile hors monétisation : aujourd'hui, personne ne peut découvrir la plateforme sans
   créer un compte.
2. **Un modèle de campagne** : `Partenaire`, `Campagne` (période, budget, emplacement),
   `Creation` (image, texte, lien).
3. **Une mesure** : impressions et clics. Sans elle, rien n'est vendable — un annonceur
   n'achète pas ce qu'il ne peut pas constater. C'est aussi ce qui permet de fixer un prix.
4. **Un marquage visible** : « Annonce », « Contenu sponsorisé ». Le dissimuler exposerait à
   la réglementation sur la publicité, et surtout ruinerait la confiance qui fait la valeur.
5. **La facturation** — en dernier, et probablement hors de la plateforme au début : un
   contrat et une facture suffisent tant que les partenaires se comptent sur une main.

## A.5 Le partenariat, qui n'est pas de la publicité

Une convention université ↔ entreprise est une **relation**, pas une campagne : stages
réservés, forum de recrutement, intervention en cours. Elle mérite son propre objet.

C'est probablement la forme de monétisation la plus saine des trois — elle se vend sur une
valeur réelle, pas sur de l'attention.

### Une question laissée ouverte

Un partenariat pourrait s'afficher comme **mention** sur une offre déjà recommandée :

> « Cette entreprise est partenaire de votre établissement. »

Cela ne change **ni quelles offres apparaissent, ni dans quel ordre** : c'est une annotation,
pas un classement. À ce titre, la règle du §A.2 n'est pas franchie.

**Mais la frontière est plus fine qu'elle n'en a l'air**, et la décision arrêtée dit
« bandeaux, pas les offres ». Une mention payante posée sur une carte d'offre reste un
élément commercial dans le flux recommandé — même sans effet sur le tri, elle attire l'œil,
et c'est précisément ce qui s'achète.

Deux lectures se défendent :

| | Pour | Contre |
|---|---|---|
| **Autoriser la mention** | Information vraie et utile à l'étudiant ; aucun effet sur le tri | Élément commercial dans le flux recommandé, contraire à l'esprit de la décision |
| **L'interdire** | Frontière parfaitement nette, impossible à éroder | Prive l'étudiant d'une information qui l'intéresse réellement |

**À trancher avant d'implémenter**, pas pendant. Une frontière qu'on précise en cours de
route finit toujours par se déplacer.

Un compromis possible : afficher la mention **uniquement quand le partenariat est réel et
gratuit à afficher** — c'est-à-dire ne jamais la facturer. Elle devient alors une
information de la plateforme, et non un produit.

---

# Partie B — Le forum

## B.1 Ce qui tue un forum

Le vide. Un forum sans questions ne donne envie à personne d'en poser, et l'échec est
définitif : personne ne revient sur un espace qu'il a trouvé mort.

**Toute la conception doit donc viser la masse critique**, pas la richesse fonctionnelle.
Un forum avec badges, réputation, votes, insignes et modération élaborée mais trois
questions est un échec. Trois fonctions et quarante questions est un succès.

## B.2 L'idée qui change tout : étiqueter par compétences

Le modèle Stack Overflow repose sur les **étiquettes**. La plateforme possède déjà un
vocabulaire d'étiquettes propre, fermé et normalisé : le référentiel de 56 compétences.

En étiqueter les questions apporte trois choses d'un coup :

1. **Pour l'utilisateur** — les questions se retrouvent, et un étudiant voit celles qui
   touchent à ses compétences déclarées.
2. **Pour la plateforme** — une question étiquetée « React » et « TypeScript » est un
   **nouveau contexte de co-occurrence**. Or c'est exactement la faiblesse mesurée au
   chapitre d'évaluation : le corpus ne compte que 67 offres, et la non-monotonie des
   résultats vient de là. **Un forum actif ferait grandir le corpus du moteur**, sans aucun
   travail de saisie supplémentaire.
3. **Pour le mémoire** — cela ouvre une perspective concrète et défendable : « la
   contribution est mesurée sur un corpus trop petit ; voici par quel mécanisme il
   grandirait ».

C'est le point le plus important de cette partie B.

## B.3 Les groupes demandés

| Groupe | Qui écrit | Qui lit | Remarque |
|---|---|---|---|
| **Public** | tous | tous | Le cœur. C'est lui qui atteint la masse critique. |
| **Par université** | ses étudiants et elle | idem | Utile : questions de scolarité, conventions, calendriers |
| **Par entreprise** | ses recruteurs, les candidats | idem | **Le plus délicat** — voir ci-dessous |

**Le groupe d'entreprise demande un arbitrage.** S'il devient un canal de recrutement
parallèle, il contourne la mécanique de candidature — et avec elle l'équité et la traçabilité
que le reste du projet a construites. Un étudiant présent dans le groupe serait avantagé sur
un étudiant mieux qualifié qui n'y est pas.

**Proposition :** le groupe d'entreprise sert à *informer* (métiers, journées portes
ouvertes, questions sur les stages), **jamais à sélectionner**. Toute proposition concrète
repasse par une offre publiée.

## B.4 Ce qu'il faut reprendre de Stack Overflow — et ce qu'il faut laisser

**À reprendre :**

- **Une question, des réponses, une réponse acceptée** par l'auteur. C'est la mécanique
  centrale, et elle suffit à distinguer un forum utile d'un fil de discussion.
- **Les votes sur les réponses**, qui remontent la meilleure.
- **Les étiquettes** — issues du référentiel, voir §B.2.

**À laisser :**

- **La réputation chiffrée et les insignes.** Sur une communauté de quelques centaines
  d'étudiants, ils créent une compétition contre-productive et découragent d'oser poser une
  question — ce qui est précisément l'obstacle à franchir.
- **La fermeture des questions en double**, la modération par les pairs, les révisions
  proposées. Ce sont des outils d'échelle ; à cette taille, ils font fuir.
- **Le vote négatif.** Sur Stack Overflow il régule le bruit ; ici il ferait taire des
  étudiants qui hésitent déjà.

## B.5 Ce que j'ajouterais, que Stack Overflow n'a pas

- **Le lien avec le profil.** Une réponse acceptée sur une question étiquetée « Python » est
  une preuve de compétence bien plus forte qu'une case cochée dans un formulaire. Elle
  pourrait *proposer* d'ajouter la compétence au profil — proposer, avec confirmation,
  exactement comme le pipeline d'ingestion de CV.
- **Les questions sans réponse remontées** vers ceux qui déclarent la compétence
  correspondante. C'est la seule façon d'obtenir des réponses au démarrage.
- **L'amorçage par l'existant.** Les questions les plus fréquentes — « comment se passe le
  QCM ? », « faut-il une convention ? » — peuvent être écrites d'avance par l'administration.
  Un forum qui contient déjà vingt questions utiles n'a pas l'air mort.

## B.6 Ce qu'il faut décider avant d'écrire du code

1. **Qui modère ?** Sans réponse, la question se posera au premier message inapproprié,
   dans l'urgence.
2. **Une question publique est-elle visible sans compte ?** Cela rejoint la vitrine de la
   partie A, et c'est ce qui apporterait des visiteurs.
3. **Que devient le contenu d'un étudiant qui quitte l'établissement ?** Le Lot 6.5 a tranché
   pour le rattachement ; il faudra trancher ici aussi.
4. **Les étiquettes hors référentiel sont-elles permises ?** Les interdire garde le
   vocabulaire propre mais bride ; les permettre rouvre le problème que la migration 006 a
   fermé. Le circuit de validation du Lot 5.4 — proposer, faire confirmer — est
   probablement la réponse.

---

## Ordre suggéré

| Rang | Chantier | Pourquoi ce rang |
|---|---|---|
| 1 | **Vitrine publique** | Prérequis de la promotion aux futurs bacheliers, utile en soi, sans risque |
| 2 | **Forum public étiqueté par compétences** | Fait grandir le corpus du moteur ; c'est le chantier au plus fort effet de levier |
| 3 | **Partenariats université ↔ entreprise** | La monétisation la plus saine — se vend sur une valeur réelle. Trancher d'abord la question du §A.5 |
| 4 | **Groupes par université** | Utile, sans arbitrage délicat |
| 5 | **Bandeaux et mises en avant** | Après la vitrine et la mesure d'audience, sans quoi il n'y a rien à vendre. Emplacements de visibilité uniquement — jamais de remontée dans un classement (§A.2) |
| 6 | **Groupes par entreprise** | En dernier : c'est celui qui demande l'arbitrage du §B.3 |
