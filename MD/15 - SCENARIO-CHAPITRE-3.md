# Scénario du chapitre 3 : la plateforme racontée de bout en bout

Plan de travail pour refaire les captures du chapitre 3 sur le code à jour (commit
`722a010` de Fanomezana compris), et pour y ajouter l'évaluation budgétaire COCOMO.

---

## 0. Le principe : deux temps, dans cet ordre

| Temps | État de la base | Ce qu'on montre |
|---|---|---|
| **A : Plateforme neuve** | vide, sauf le référentiel des 56 compétences et le compte administrateur d'installation | chaque geste de chaque acteur, **dans l'ordre où il se produit réellement** : on ne peut pas postuler avant qu'une offre existe, ni valider un rattachement avant qu'un étudiant se soit déclaré |
| **B : Plateforme en régime** | jeu de démonstration complet restauré (79 comptes, 67 offres, 72 candidatures, 38 CV) | les fonctions qui n'ont de sens qu'avec du volume : recommandations expliquées, candidats suggérés, conseiller, similarité entre compétences, statistiques |

**Pourquoi pas tout sur la base vide.** Le moteur de recommandation apprend la proximité
entre compétences à partir de leurs co-occurrences dans les offres et les CV. Avec trois
offres et quelques étudiants, il n'a rien à apprendre : les suggestions seraient vides ou
triviales, et la capture desservirait la contribution au lieu de l'illustrer.

**Pourquoi pas tout sur la base pleine.** Une base déjà remplie ne montre aucune
*transition* : on y voit une candidature « Recrutée », jamais le moment où elle le devient.
Le temps A photographie les états avant et après chaque action.

---

## 1. Préparation : ce qui a été fait, ce qui reste à faire

| # | Action | État |
|---|---|---|
| 1 | Sauvegarde de la base en service (79 comptes) et des 38 PDF | **fait** : `memoire/sauvegardes-base/`, exclu de git |
| 2 | Démarrage de l'application **sans envoi de courriel réel** (`EMAIL_PASSWORD` vide) | **fait** |
| 3 | Remise à zéro : tout vider sauf le référentiel des compétences, recréer l'administrateur d'installation | **fait** : `scripts/base/remettre-a-zero.mjs` |
| 4 | Temps A : scénario joué dans le vrai navigateur, captures à chaque étape | **fait** |
| 5 | Restauration du jeu complet | **fait** : `scripts/base/restaurer-sauvegarde.mjs` |
| 6 | Temps B : captures des fonctions intelligentes | **fait** |
| 7 | Chapitre 3 (captures, explications, COCOMO) | **fait** |
| 8 | Chapitre 4 (COCOMO a posteriori) | **fait** |

> **Anomalie à signaler à Fanomezana.** Le commit `722a010` a retiré 75 des 79 lignes
> `INSERT INTO public.utilisateur` de `prisma/seed.sql`, dont celle de l'administrateur, en
> laissant les étudiants, entreprises et universités qui les référencent. Le fichier ne se
> charge plus (violation de clé étrangère). La version précédente est intacte dans git :
> `git show 722a010^:prisma/seed.sql`.

**Aucun courriel ne part pendant le scénario.** Les adresses du scénario sont en
`@demo.stageshare.mg`, hors de la liste blanche, et l'envoi est coupé. Quand une université
crée un compte, l'application affiche alors le lien d'activation à l'écran : c'est ce lien
que le scénario suit, exactement comme le ferait l'établissement qui le transmet.

---

## 2. La distribution des rôles

Mot de passe commun : **`Demo1234!`** (8 caractères, une majuscule, une minuscule, un chiffre).

### Administration

| Code | Personne | Adresse | Rôle dans l'histoire |
|---|---|---|---|
| **ADM1** | Administrateur d'installation | `admin@stageshare.mg` | existe dès l'installation ; vérifie les comptes, crée ADM2 |
| **ADM2** | Nirina Rasoamanana | `nirina.rasoamanana@stageshare.mg` | créée par ADM1 |

### Établissements

| Code | Établissement | Adresse | Rôle dans l'histoire |
|---|---|---|---|
| **UNI1** | École Nationale d'Informatique (ENI), Fianarantsoa | `contact@eni.demo.stageshare.mg` | s'inscrit tôt ; déclare ses filières, importe une promotion, ajoute une étudiante, valide et refuse des rattachements, publie une annonce de cohorte, gère le cycle de vie |
| **UNI2** | Institut Supérieur Polytechnique de Madagascar (ISPM) | `contact@ispm.demo.stageshare.mg` | s'inscrit **après** un de ses étudiants : démontre le rattachement automatique |

### Entreprises

| Code | Entreprise | Adresse | Rôle dans l'histoire |
|---|---|---|---|
| **ENT1** | Ingenosya | `contact@ingenosya.demo.stageshare.mg` | vérifiée ; publie deux offres avec questionnaire ; recrute ETU1, refuse ETU2 ; écrit à ETU1 |
| **ENT2** | Telma | `contact@telma.demo.stageshare.mg` | vérifiée ; publie une offre ; consulte une annonce de cohorte |
| **ENT3** | Soa Digital (fictive) | `contact@soadigital.demo.stageshare.mg` | reste **non vérifiée** : montre l'état avant validation |

### Étudiants

| Code | Étudiant | Comment il arrive | Ce qui lui arrive |
|---|---|---|---|
| **ETU1** | Hasina Rakotoarisoa | s'inscrit seule, choisit ENI dans la liste | rattachement validé ; dépose un CV ; postule chez Ingenosya ; **recrutée** |
| **ETU2** | Toky Andriamahefa | s'inscrit **avant** que l'ISPM existe, saisit le nom à la main | rattaché automatiquement à l'inscription de l'ISPM ; postule aux deux offres d'Ingenosya (développeur : **refusé** ; analyste : en attente) ; oublie son mot de passe |
| **ETU3** | Mialy Randrianarisoa | ajoutée individuellement par ENI | active son compte par le lien ; dépose un **CV numérisé** (lecture OCR) |
| **ETU4 à ETU8** | promotion « L3 Informatique 2025-2026 » | importés par ENI depuis un fichier CSV | Fanilo Rabemanantsoa active son compte ; Niaina Randriambola quitte l'établissement (**sorti**, avec motif) |
| **ETU9** | Rivo Rajaonary | s'inscrit en se déclarant d'ENI sans y être | rattachement **refusé** par ENI |

---

## 3. Temps A : la chronologie

Chaque ligne est une section du chapitre. Les captures sont prises **avant** l'action
(formulaire rempli) et **après** (message de confirmation, nouvel état).

| Étape | Acteur | Ce qui se passe | Ce que la capture démontre |
|---|---|---|---|
| **A1. La plateforme au premier jour** | public, ADM1 | accueil, à propos ; ADM1 se connecte sur un tableau de bord vide | l'état initial ; les quatre portes d'entrée |
| **A2. Un établissement s'inscrit** | UNI1 | formulaire d'inscription d'ENI, confirmation | le compte existe aussitôt, **non vérifié** |
| **A3. Un étudiant arrive avant son université** | ETU2 | inscription en plusieurs écrans ; « mon université n'est pas dans la liste » ; saisie libre « Institut Supérieur Polytechnique de Madagascar » | le message « vous serez rattaché dès qu'elle s'inscrira » |
| **A4. L'université arrive, l'étudiant la rejoint** | UNI2 | inscription de l'ISPM ; son tableau de bord montre déjà une demande de rattachement | le rapprochement des noms normalisés, sans intervention |
| **A5. Les entreprises s'inscrivent** | ENT1, ENT2, ENT3 | trois inscriptions ; un premier essai d'ENT3 avec un mot de passe trop faible | la politique de mot de passe et son message précis |
| **A6. L'administration vérifie** | ADM1 | tableau de bord : 3 entreprises et 2 universités en attente ; fiche détaillée ; vérification d'ENT1, ENT2, UNI1, UNI2 ; ENT3 laissée en attente ; création d'ADM2 | le badge de confiance ; la notification envoyée au compte vérifié |
| **A7. L'université s'organise** | UNI1 | modification du profil et **déclaration des filières** enseignées ; import CSV d'une promotion avec **prévisualisation et lignes rejetées**, puis confirmation ; ajout individuel d'ETU3 avec **lien d'activation** | rien n'est écrit avant validation ; le mot de passe n'est jamais choisi par l'établissement |
| **A8. Les étudiants entrent** | ETU1, ETU9, ETU3, ETU4 | ETU1 s'inscrit en choisissant ENI : la liste des filières se **restreint** à ce qu'ENI enseigne ; ETU9 fait de même ; ETU3 et ETU4 activent leur compte | la contrainte filière / établissement ; l'activation par lien à usage unique |
| **A9. L'université tranche** | UNI1, UNI2 | ENI valide ETU1, **refuse** ETU9, confirme l'identité d'ETU1 ; l'ISPM valide ETU2 | le rattachement comme décision de l'établissement |
| **A10. Les entreprises publient** | ENT1, ENT2 | ENT1 complète sa fiche ; publie l'offre « Développeur web full-stack » (React, Node.js, PostgreSQL, Git) avec son questionnaire, puis « Analyste de données » ; ENT2 publie « Administrateur réseaux et télécoms » ; ENT1 **modifie** une offre | compétences prises dans le référentiel ; questionnaire de filtrage |
| **A11. Les étudiants construisent leur dossier** | ETU1, ETU3 | ETU1 complète son profil, dépose un CV natif, lance l'analyse, **accepte et rejette** des compétences détectées ; ETU3 dépose un **CV numérisé** et obtient une lecture OCR | la lecture du CV et le contrôle humain sur ce qu'elle propose |
| **A12. Les étudiants postulent** | ETU1, ETU2 | consultation des offres recommandées ; questionnaire (avertissement « une seule tentative ») ; candidature avec CV choisi et lettre ; ETU2 postule aux deux offres d'Ingenosya ; suivi « En attente » | le questionnaire obligatoire, la note calculée par le serveur |
| **A13. Les entreprises décident** | ENT1 | liste des candidatures : CV, note, profil ; ETU1 **recrutée**, ETU2 **refusé** ; message à ETU1 pour l'entretien | la décision déclenche une notification |
| **A14. Les étudiants apprennent la décision** | ETU1, ETU2 | suivi des candidatures mis à jour ; messagerie : notification automatique, réponse d'ETU1 | la communication sans divulguer d'adresse |
| **A15. L'université présente une cohorte** | UNI1, ENT2 | annonce de cohorte liée à la promotion importée ; ENT2 la découvre dans sa recherche et ouvre son détail | la demande de stage émise par l'établissement |
| **A16. Le cycle de vie** | UNI1 | Niaina Randriambola déclaré **sorti** avec motif ; écran des anciens | le détachement sans effacement |
| **A17. Les vitrines publiques** | ETU1, ENT1, ENT2 | recherche d'entreprises ; fiche publique d'ENT1 et d'UNI1 ; profil d'ETU1 vu par son recruteur | ce qui est public et ce qui ne l'est pas |
| **A18. Les mécanismes de compte** | ETU2, ENT1 | mot de passe oublié (réponse identique que l'adresse existe ou non) ; réinitialisation par lien ; changement de mot de passe | la sécurité des accès : placée en dernier, car Ingenosya change de mot de passe |

---

## 4. Temps A : ce que chaque utilisateur fait

La même chronologie, relue acteur par acteur. C'est la liste à cocher.

### ADM1 : Administrateur d'installation
- [ ] se connecter (A1) et constater un tableau de bord vide
- [ ] ouvrir la fiche détaillée d'Ingenosya (A6)
- [ ] vérifier Ingenosya, Telma, ENI, ISPM (A6)
- [ ] laisser Soa Digital en attente (A6)
- [ ] créer le compte de Nirina Rasoamanana (A6)

### ADM2 : Nirina Rasoamanana
- [ ] se connecter avec le compte créé (A6)

### UNI1 : ENI
- [ ] s'inscrire (A2)
- [ ] déclarer ses filières enseignées dans son profil (A7)
- [ ] télécharger le modèle CSV, importer la promotion, lire les lignes rejetées, confirmer (A7)
- [ ] ajouter Mialy Randrianarisoa et relever le lien d'activation (A7)
- [ ] valider le rattachement d'Hasina, refuser celui de Rivo, confirmer l'identité d'Hasina (A9)
- [ ] publier une annonce de cohorte pour la promotion importée (A15)
- [ ] déclarer un étudiant sorti, avec motif (A16)
- [ ] consulter ses anciens étudiants (A16)

### UNI2 : ISPM
- [ ] s'inscrire et constater le rattachement automatique de Toky (A4)
- [ ] valider le rattachement de Toky (A9)

### ENT1 : Ingenosya
- [ ] s'inscrire (A5)
- [ ] compléter sa fiche : description, logo, site (A10)
- [ ] publier « Développeur web full-stack » avec compétences et questionnaire (A10)
- [ ] publier « Analyste de données » (A10)
- [ ] modifier une offre publiée (A10)
- [ ] ouvrir la liste des candidatures, consulter CV, note et profil (A13)
- [ ] recruter Hasina, refuser Toky (A13)
- [ ] écrire à Hasina (A13)
- [ ] consulter le profil de sa recrue (A17)
- [ ] changer son mot de passe (A18)

### ENT2 : Telma
- [ ] s'inscrire (A5)
- [ ] publier « Administrateur réseaux et télécoms » (A10)
- [ ] trouver l'annonce de cohorte d'ENI et ouvrir son détail (A15)
- [ ] consulter la fiche publique d'ENI (A17)

### ENT3 : Soa Digital
- [ ] tenter une inscription avec un mot de passe trop faible, lire le refus (A5)
- [ ] s'inscrire correctement (A5)

### ETU1 : Hasina Rakotoarisoa
- [ ] s'inscrire en choisissant ENI ; constater la liste de filières restreinte (A8)
- [ ] compléter son profil (A11)
- [ ] déposer un CV, lancer l'analyse, accepter et rejeter des compétences (A11)
- [ ] consulter les offres (A12)
- [ ] passer le questionnaire et postuler chez Ingenosya (A12)
- [ ] voir sa candidature passer à « Recrutée » (A14)
- [ ] lire la notification et répondre au message d'Ingenosya (A14)
- [ ] rechercher des entreprises et consulter une fiche (A17)

### ETU2 : Toky Andriamahefa
- [ ] s'inscrire avec une université saisie à la main (A3)
- [ ] déposer un CV (A11)
- [ ] postuler aux deux offres d'Ingenosya (A12)
- [ ] voir le refus d'Ingenosya (A14)
- [ ] demander la réinitialisation de son mot de passe et en choisir un nouveau (A18)

### ETU3 : Mialy Randrianarisoa
- [ ] activer son compte par le lien (A8)
- [ ] déposer un CV numérisé et obtenir sa lecture OCR (A11)

### ETU4 : Fanilo Rabemanantsoa, étudiant importé
- [ ] activer son compte par le lien (A8)

### Niaina Randriambola : étudiant importé
- [ ] (subit) être déclaré sorti par ENI (A16)

### ETU9 : Rivo Rajaonary
- [ ] s'inscrire en se déclarant d'ENI (A8)
- [ ] (subit) voir son rattachement refusé (A9)

---

## 5. Temps B : la plateforme en régime

Base restaurée depuis la sauvegarde. Les comptes de démonstration existants servent
d'acteurs.

| Étape | Acteur | Ce qu'on montre | Pourquoi seulement ici |
|---|---|---|---|
| **B1. Statistiques d'administration** | ADM1 | volumes, inscriptions par mois, comptes à vérifier, état de la file de courriels | des courbes à trois points ne disent rien |
| **B2. Recommandations expliquées** | un étudiant du jeu | offres recommandées avec le **détail du score** par critère et le motif du rapprochement | il faut des dizaines d'offres pour qu'un classement ait un sens |
| **B3. Similarité entre compétences** | idem | une offre exigeant Vue.js créditée à un profil React | la proximité est **apprise** des co-occurrences : sans corpus, elle n'existe pas |
| **B4. Le conseiller** | idem | les compétences qui ouvriraient le plus d'opportunités | le calcul rejoue le profil sur toutes les offres |
| **B5. Lecture d'un CV numérisé** | un étudiant au CV scanné | texte extrait, confiance OCR, compétences détectées avec leur contexte | les 38 CV du corpus, dont des numérisés |
| **B6. Candidats suggérés** | une entreprise | les profils proches d'une offre, **y compris sans candidature**, avec explication | le sens inverse de la recommandation |
| **B7. Recherche de candidats** | une entreprise | filtres par compétence, niveau, ville | |
| **B8. Pilotage par promotions** | une université | promotions, étudiants actifs et anciens, rattachements | |
| **B9. Candidatures en volume** | une entreprise | tableau de bord et tri des candidatures par note | |

---

## 6. L'évaluation budgétaire COCOMO

**Le partage entre les deux chapitres.**

| Chapitre 3 : prévision | Chapitre 4 : réalité |
|---|---|
| le modèle, sa justification, ses formules | la taille **mesurée** du logiciel livré |
| une taille **estimée** à partir du périmètre fonctionnel (décomposition par module) | le recalcul de l'effort, de la durée et du coût sur cette taille |
| les 15 facteurs de coût notés et justifiés | la comparaison prévision / réalité, et l'analyse de l'écart |
| effort, durée, effectif et coût prévisionnels | les limites du modèle sur une pile technique moderne |

**Mesures déjà relevées sur le code** (lignes non vides, hors commentaires) :

| Partie | Fichiers | Lignes de code |
|---|---:|---:|
| Pages (interface) | 43 | 12 887 |
| Composants et styles | 50 | 15 531 |
| Routes API | 60 | 6 609 |
| Bibliothèque métier | 24 | 2 154 |
| Racine de l'application | 3 | 545 |
| Migrations SQL | 14 | 365 |
| Scripts de base, corpus, mesures | 17 | 3 366 |
| **Produit livré** | **211** | **41 457** |
| *Scripts du mémoire, exclus* | *12* | *4 675* |

**Trois hypothèses que seul l'auteur peut confirmer** :

1. **la durée réelle** du développement et **la taille de l'équipe** : l'historique git
   ne les donne pas : son premier commit (25/08/2026) importe déjà 39 739 lignes ;
2. **le coût mensuel** d'un développeur retenu pour le chiffrage, en ariary ;
3. le fait de compter ou non les **15 531 lignes de styles** comme du code au sens de
   COCOMO : elles pèsent 37 % du total pour un effort par ligne sans commune mesure avec
   la logique métier. Les deux calculs sont présentés.

---

## 7. État d'exécution (16/09/2026)

| Élément | Résultat |
|---|---|
| Temps A | **75 captures**, 18 étapes, toutes jouées par l'interface et contrôlées en base |
| Temps B | **14 captures**, 8 étapes (B1 à B8 ; la recherche de candidats et les candidatures en volume sont réunies en B7) |
| Chapitre 3 | `memoire/Chapitre3-Realisation-et-scenario.docx` : 87 pages, 89 figures, 7 tableaux |
| Chapitre 4 | section 4.4 ajoutée, sections suivantes renumérotées (4.5 à 4.8) |
| Base | jeu de démonstration complet restauré en fin de parcours |

**Acteurs de la partie B**, choisis d'après les réponses réelles du moteur : Njaka
Rakotomalala (similarité « React est proche de Vue.js », CV numérisé), l'offre Vue.js
d'Ingenosya Madagascar, Telma, l'Université d'Antananarivo.

### Anomalies relevées pendant le scénario (non corrigées)

| Anomalie | Où | Conséquence |
|---|---|---|
| Le navigateur n'exige que 6 caractères pour le mot de passe, le serveur 8 avec majuscule, minuscule et chiffre (introduit par `722a010`) | `entrepriseRegistreInfo`, `etudiantRegistreInfo`, `universiteRegistreInfo`, changement de mot de passe | « Mot de passe valide » s'affiche, puis le serveur refuse |
| Les dates saisies s'affichent un jour plus tôt (15 oct. → « 14 oct. ») | offres, annonces de cohorte | conversion de fuseau horaire des colonnes `DATE` |
| `prisma/seed.sql` a perdu 75 des 79 comptes (commit `722a010`) | installation depuis le dépôt | le fichier ne se charge plus |
