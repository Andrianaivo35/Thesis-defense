# Diagramme de classes — Stage Share

Source de vérité : `prisma/schema.prisma` (28 entités, PostgreSQL).
Le commentaire de chaque liaison est développé dans `12 - MODELE-DE-DONNEES.md`.

---

## Conventions de lecture

| Notation             | Signification                                                                     |
| -------------------- | --------------------------------------------------------------------------------- |
| `PK`               | clé primaire                                                                     |
| `FK`               | clé étrangère                                                                  |
| `UQ`               | contrainte d'unicité                                                             |
| `?` après le type | colonne dont le **NULL est autorisé**                                                   |
| `*--`              | composition — l'enfant n'existe pas sans le parent (`ON DELETE CASCADE`)       |
| `o--`              | agrégation — l'enfant survit conceptuellement, mais la base cascade quand même |
| `-->`              | référence simple                                                                |
| `<\|--`              | spécialisation *conceptuelle* — en base, c'est une table par rôle reliée à `utilisateur` par une FK unique (voir §1) |

Les noms sont donnés **exactement** tels qu'ils existent en base : les entités
historiques sont en minuscules (`etudiant`, `offre`, `universite`), celles ajoutées
par les migrations du Lot 3 et suivants sont en PascalCase (`CV`, `Promotion`,
`JetonUtilisateur`). Cette différence de casse n'est pas cosmétique : elle marque
deux générations du schéma qui n'ont pas les mêmes exigences de nullabilité.

---

## 0. Vue d'ensemble

```mermaid
classDiagram
    direction TB

    class utilisateur
    class admin
    class etudiant
    class entreprise
    class universite
    class JetonUtilisateur

    class Promotion
    class UniversiteDomaine
    class AnnonceCohorte

    class CV
    class CompetenceDetectee
    class CompetenceReference
    class CompetenceEtudiant
    class centre_interet
    class parcours_realisation
    class preference_stage

    class offre
    class CompetenceOffre
    class recommandation

    class Candidature
    class DocumentCandidature
    class QCM
    class Question
    class ChoixReponse
    class ReponseEtudiant

    class Conversation
    class participantConversation
    class Message
    class FileCourriel

    utilisateur <|-- admin
    utilisateur <|-- etudiant
    utilisateur <|-- entreprise
    utilisateur <|-- universite
    utilisateur *-- JetonUtilisateur

    universite *-- Promotion
    universite *-- UniversiteDomaine
    universite *-- AnnonceCohorte
    Promotion o-- AnnonceCohorte
    Promotion o-- etudiant

    etudiant *-- CV
    etudiant *-- CompetenceEtudiant
    etudiant *-- centre_interet
    etudiant *-- parcours_realisation
    etudiant *-- preference_stage
    CV *-- CompetenceDetectee
    CompetenceReference o-- CompetenceDetectee
    CompetenceReference o-- CompetenceEtudiant
    CompetenceReference o-- CompetenceOffre

    entreprise *-- offre
    offre *-- CompetenceOffre
    offre *-- QCM
    QCM *-- Question
    Question *-- ChoixReponse

    etudiant *-- Candidature
    offre *-- Candidature
    CV o-- Candidature
    Candidature *-- DocumentCandidature
    Candidature *-- ReponseEtudiant
    Question o-- ReponseEtudiant
    ChoixReponse o-- ReponseEtudiant

    etudiant *-- recommandation
    offre *-- recommandation

    utilisateur *-- participantConversation
    Conversation *-- participantConversation
    Conversation *-- Message
    utilisateur *-- Message
```

`FileCourriel` n'apparaît reliée à rien : c'est volontaire, voir §6.

---

## 1. Comptes et identités

Un seul point d'authentification, quatre rôles portés par quatre tables distinctes.

```mermaid
classDiagram
    direction LR

    class utilisateur {
        +Int idUtilisateur PK
        +String? typeUtilisateur
        +String? emailUtilisateur
        +String? motDePasse
        +Boolean compteActive
    }
    note for utilisateur "Unicite garantie par un index fonctionnel<br/>UNIQUE sur lower(emailUtilisateur) - migration 008"

    class admin {
        +Int idAdmin PK
        +Int idUtilisateur FK UQ
        +String nomAdmin
        +String prenomAdmin
        +String? telephone
        +DateTime? dateCreation
    }

    class etudiant {
        +Int idEtudiant PK
        +Int? idUtilisateur FK UQ
        +String? nomEtudiant
        +String? prenomEtudiant
        +Int? idUniversite
        +Int? idPromotion FK
        +String? statutRattachement
        +Boolean? estActif
    }

    class entreprise {
        +Int idEntreprise PK
        +Int? idUtilisateur FK UQ
        +String? nomEntreprise
        +String? numeroIdentificationFiscal
        +Boolean? estVerifie
        +DateTime? dateVerification
    }

    class universite {
        +Int idUniversite PK
        +Int? idUtilisateur FK UQ
        +String? nomUniversite
        +String? sigleUniversitaire
        +Boolean? estVerifie
    }

    class JetonUtilisateur {
        +Int idJeton PK
        +Int idUtilisateur FK
        +String type
        +String jetonHache UQ
        +DateTime dateExpiration
        +DateTime? dateUtilisation
        +DateTime dateCreation
    }
    note for JetonUtilisateur "type CHECK IN (activation, reinitialisation)<br/>jetonHache : SHA-256, jamais le jeton en clair"

    utilisateur "1" *-- "0..1" admin : est
    utilisateur "1" *-- "0..1" etudiant : est
    utilisateur "1" *-- "0..1" entreprise : est
    utilisateur "1" *-- "0..1" universite : est
    utilisateur "1" *-- "0..*" JetonUtilisateur : emet
```

---

## 2. Université, promotions, rattachement

```mermaid
classDiagram
    direction LR

    class universite {
        +Int idUniversite PK
        +String? nomUniversite
        +String? ville
    }

    class UniversiteDomaine {
        +Int idUniversiteDomaine PK
        +Int idUniversite FK
        +String domaine
        +DateTime dateAjout
    }
    note for UniversiteDomaine "UNIQUE (idUniversite, domaine)<br/>Liste vide = aucune restriction"

    class Promotion {
        +Int idPromotion PK
        +Int idUniversite FK
        +String libelle
        +String annee
        +String? niveauAcademique
        +String? filiere
        +String? specialisation
        +String statut
        +DateTime dateCreation
    }
    note for Promotion "statut CHECK IN (Active, Diplomee, Archivee)"

    class etudiant {
        +Int idEtudiant PK
        +Int? idUniversite
        +String? nomUniversiteSaisi
        +Int? idPromotion FK
        +String? statutRattachement
        +DateTime? dateRattachement
        +DateTime? dateFinRattachement
        +String? motifFinRattachement
        +Boolean? estVerifieIdentite
        +DateTime? dateVerificationIdentite
    }
    note for etudiant "statutRattachement CHECK IN<br/>(En attente, Valide, Refuse, Diplome, Sorti) ou NULL<br/>idUniversite n'a PAS de cle etrangere - voir doc 12"

    class AnnonceCohorte {
        +Int idAnnonceCohorte PK
        +Int idUniversite FK
        +Int? idPromotion FK
        +String titre
        +String? description
        +String? filiereConcernee
        +String? domainesRecherche
        +DateTime? periodeDebut
        +DateTime? periodeFin
        +String? statut
        +DateTime? dateLimite
    }

    universite "1" *-- "0..*" UniversiteDomaine : enseigne
    universite "1" *-- "0..*" Promotion : organise
    universite "1" *-- "0..*" AnnonceCohorte : publie
    Promotion "0..1" o-- "0..*" etudiant : regroupe
    Promotion "0..1" o-- "0..*" AnnonceCohorte : concerne
    universite "1" .. "0..*" etudiant : rattache (sans FK)
```

---

## 3. Profil étudiant, CV et compétences

C'est le cœur du mémoire : la chaîne `CV → texte → compétences détectées → arbitrage → profil`.

```mermaid
classDiagram
    direction TB

    class etudiant {
        +Int idEtudiant PK
        +String? filiere
        +String? specialisation
        +String? niveauAcademique
    }

    class CV {
        +Int idCV PK
        +Int idEtudiant FK
        +String libelle
        +String nomFichier
        +String? nomFichierOriginal
        +Int? tailleOctets
        +Boolean estPrincipal
        +DateTime dateAjout
        +String statutAnalyse
        +String? texteExtrait
        +Int? nombrePages
        +Int? pagesOcr
        +Decimal? confianceOcr
        +DateTime? dateAnalyse
        +String? messageAnalyse
    }
    note for CV "Index UNIQUE PARTIEL sur idEtudiant WHERE estPrincipal<br/>= un seul CV principal par etudiant, garanti par la base<br/>statutAnalyse : en_attente, en_cours, analyse, echec"

    class CompetenceDetectee {
        +Int idCompetenceDetectee PK
        +Int idCV FK
        +Int? idCompetenceReference FK
        +String termeDetecte
        +String methode
        +Decimal confiance
        +Int? page
        +String? section
        +String? contexte
        +String? decision
        +DateTime? dateDecision
        +DateTime dateDetection
    }
    note for CompetenceDetectee "decision NULL = l'etudiant n'a pas encore arbitre<br/>C'est la trace AVANT/APRES qui rend l'evaluation mesurable"

    class CompetenceReference {
        +Int idCompetenceReference PK
        +String nomCompetenceReference UQ
        +String? categorieCompetenceReference
        +String? description
    }

    class CompetenceEtudiant {
        +Int idCompetenceEtudiant PK
        +Int idEtudiant FK
        +Int idCompetenceReference FK
        +String? niveau
        +DateTime? dateAjout
    }
    note for CompetenceEtudiant "UNIQUE (idEtudiant, idCompetenceReference)"

    class centre_interet {
        +Int idCentreInteret PK
        +Int? idEtudiant FK
        +String? domaineInteret
        +String? missionPreferee
    }

    class parcours_realisation {
        +Int idParcoursRealisation PK
        +Int? idEtudiant FK
        +String? type
        +String? titre
        +String? entreprise
        +DateTime? dateDebut
        +DateTime? dateFin
        +String? lien
    }

    class preference_stage {
        +Int idPreferenceStage PK
        +Int? idEtudiant FK
        +String? villePreferee
        +String? accepteTeletravail
        +String? rayonDeplacement
        +Boolean? mobiliteNational
        +String? typeStagePreferee
        +String? dureeSouhaitee
        +DateTime? dateDebutDisponibilite
        +Boolean? disponibiliteImmediate
    }

    etudiant "1" *-- "0..*" CV : depose
    etudiant "1" *-- "0..*" CompetenceEtudiant : declare
    etudiant "1" *-- "0..*" centre_interet : renseigne
    etudiant "1" *-- "0..*" parcours_realisation : renseigne
    etudiant "1" *-- "0..*" preference_stage : renseigne
    CV "1" *-- "0..*" CompetenceDetectee : produit
    CompetenceReference "0..1" o-- "0..*" CompetenceDetectee : rapproche
    CompetenceReference "1" o-- "0..*" CompetenceEtudiant : normalise
```

---

## 4. Entreprise, offres, appariement

```mermaid
classDiagram
    direction LR

    class entreprise {
        +Int idEntreprise PK
        +String? nomEntreprise
        +String? secteurActivitePrincipal
        +Boolean? estVerifie
    }

    class offre {
        +Int idOffre PK
        +Int idEntreprise FK
        +String titre
        +String description
        +String? domaine
        +String? niveauRequis
        +String? duree
        +DateTime? dateDebut
        +DateTime? dateFin
        +String? remuneration
        +String? ville
        +String? accepteTeletravail
        +String? typeStage
        +String? statut
        +DateTime? datePublication
        +DateTime? dateLimites
    }

    class CompetenceOffre {
        +Int idCompetenceOffre PK
        +Int idOffre FK
        +Int idCompetenceReference FK
        +String? niveauSouhaitee
        +Boolean? estObligatoire
    }
    note for CompetenceOffre "UNIQUE (idOffre, idCompetenceReference)"

    class CompetenceReference {
        +Int idCompetenceReference PK
        +String nomCompetenceReference UQ
    }

    class recommandation {
        +Int idRecommandation PK
        +Int idEtudiant FK
        +Int idOffre FK
        +Decimal? scoresGlobal
        +Decimal? scoresCompetence
        +Decimal? scoresFiliere
        +Decimal? scoreNiveau
        +Decimal? scoreLocalisation
        +Decimal? scorePreference
        +DateTime? dateGeneration
    }
    note for recommandation "UNIQUE (idEtudiant, idOffre)<br/>Cache recalcule : DELETE puis INSERT a chaque generation<br/>Poids : competence 40, filiere 20, niveau 15, localisation 15, preference 10"

    class etudiant {
        +Int idEtudiant PK
    }

    entreprise "1" *-- "0..*" offre : publie
    offre "1" *-- "0..*" CompetenceOffre : exige
    CompetenceReference "1" o-- "0..*" CompetenceOffre : normalise
    etudiant "1" *-- "0..*" recommandation : recoit
    offre "1" *-- "0..*" recommandation : cible
```

---

## 5. Candidature, dossier et QCM

```mermaid
classDiagram
    direction TB

    class Candidature {
        +Int idCandidature PK
        +Int idEtudiant FK
        +Int idOffre FK
        +Int? idCV FK
        +String? nomFichierLettre
        +String? lettreMotivation
        +String? cv
        +DateTime? dateCandidature
        +String? statut
        +Decimal? noteQCM
    }
    note for Candidature "UNIQUE (idEtudiant, idOffre) : une seule candidature par offre<br/>statut : En attente, Recrute, Refuse<br/>lettreMotivation et cv sont des colonnes heritees, plus ecrites"

    class DocumentCandidature {
        +Int idDocument PK
        +Int idCandidature FK
        +String nomFichier
        +String? nomFichierOriginal
        +Int? tailleOctets
        +DateTime dateAjout
    }

    class QCM {
        +Int idQCM PK
        +Int idOffre FK UQ
        +String? titre
        +String? description
        +Int? duree
        +Int? noteMinimal
        +DateTime? dateCreation
        +Boolean? estActif
    }

    class Question {
        +Int idQuestion PK
        +Int idQCM FK
        +String enonce
        +Int ordre
        +Int points
        +String? explication
    }

    class ChoixReponse {
        +Int idChoix PK
        +Int idQuestion FK
        +String enonce
        +Int ordre
        +Boolean estCorrect
    }

    class ReponseEtudiant {
        +Int idReponse PK
        +Int idCandidature FK
        +Int idQuestion FK
        +Int idChoixOffre FK
        +String? enonce
        +Boolean estCorrecte
        +Int ordre
    }
    note for ReponseEtudiant "UNIQUE (idCandidature, idQuestion) : une reponse par question<br/>enonce = copie du libelle au moment de la reponse"

    class etudiant {
        +Int idEtudiant PK
    }
    class offre {
        +Int idOffre PK
    }
    class CV {
        +Int idCV PK
    }

    etudiant "1" *-- "0..*" Candidature : postule
    offre "1" *-- "0..*" Candidature : recoit
    CV "0..1" o-- "0..*" Candidature : jointe
    Candidature "1" *-- "0..*" DocumentCandidature : complete
    offre "1" *-- "0..1" QCM : evalue par
    QCM "1" *-- "0..*" Question : contient
    Question "1" *-- "2..*" ChoixReponse : propose
    Candidature "1" *-- "0..*" ReponseEtudiant : produit
    Question "1" o-- "0..*" ReponseEtudiant : porte sur
    ChoixReponse "1" o-- "0..*" ReponseEtudiant : choisi
```

---

## 6. Messagerie et courriels sortants

```mermaid
classDiagram
    direction LR

    class Conversation {
        +Int idConversation PK
        +DateTime? dateCreation
        +DateTime? dateDernierMessage
    }

    class participantConversation {
        +Int idParticipantConversation PK
        +Int idConversation FK
        +Int idUtilisateur FK
    }
    note for participantConversation "UNIQUE (idConversation, idUtilisateur)<br/>Table d'association : N-N entre utilisateur et Conversation"

    class Message {
        +Int idMessage PK
        +Int idConversation FK
        +Int idExpediteur FK
        +String contenu
        +DateTime? dateEnvoi
        +Boolean? estLu
        +String? pieceJointe
    }

    class utilisateur {
        +Int idUtilisateur PK
    }

    class FileCourriel {
        +Int idCourriel PK
        +String destinataire
        +String sujet
        +String corpsHtml
        +String statut
        +Int tentatives
        +String? derniereErreur
        +String? categorie
        +DateTime dateCreation
        +DateTime? dateEnvoi
    }
    note for FileCourriel "Boite d'envoi transactionnelle - AUCUNE cle etrangere<br/>statut CHECK IN (en_attente, envoye, echec, abandonne)<br/>Index partiel WHERE statut = en_attente"

    Conversation "1" *-- "2..*" participantConversation : reunit
    utilisateur "1" *-- "0..*" participantConversation : participe
    Conversation "1" *-- "0..*" Message : porte
    utilisateur "1" *-- "0..*" Message : ecrit
```

---

## Récapitulatif des cardinalités

| Relation                                                                                                      | Cardinalité                       | Suppression du parent |
| ------------------------------------------------------------------------------------------------------------- | ---------------------------------- | --------------------- |
| `utilisateur` → `admin` / `etudiant` / `entreprise` / `universite`                                 | 1 → 0..1                          | CASCADE               |
| `utilisateur` → `JetonUtilisateur`                                                                       | 1 → 0..*                          | CASCADE               |
| `universite` → `Promotion` / `UniversiteDomaine` / `AnnonceCohorte`                                  | 1 → 0..*                          | CASCADE               |
| `Promotion` → `etudiant`                                                                                 | 0..1 → 0..*                       | SET NULL              |
| `Promotion` → `AnnonceCohorte`                                                                           | 0..1 → 0..*                       | SET NULL              |
| `etudiant` → `CV`                                                                                        | 1 → 0..* (1 seul principal)       | CASCADE               |
| `etudiant` → `CompetenceEtudiant` / `centre_interet` / `parcours_realisation` / `preference_stage` | 1 → 0..*                          | CASCADE               |
| `CV` → `CompetenceDetectee`                                                                              | 1 → 0..*                          | CASCADE               |
| `CompetenceReference` → `CompetenceDetectee`                                                             | 0..1 → 0..*                       | CASCADE               |
| `CompetenceReference` → `CompetenceEtudiant` / `CompetenceOffre`                                       | 1 → 0..*                          | CASCADE               |
| `entreprise` → `offre`                                                                                   | 1 → 0..*                          | CASCADE               |
| `offre` → `CompetenceOffre`                                                                              | 1 → 0..*                          | CASCADE               |
| `offre` → `QCM`                                                                                          | 1 → 0..1                          | CASCADE               |
| `QCM` → `Question` → `ChoixReponse`                                                                   | 1 → 0..*                          | CASCADE               |
| `etudiant` / `offre` → `Candidature`                                                                   | 1 → 0..* (couple unique)          | CASCADE               |
| `CV` → `Candidature`                                                                                     | 0..1 → 0..*                       | SET NULL              |
| `Candidature` → `DocumentCandidature` / `ReponseEtudiant`                                              | 1 → 0..*                          | CASCADE               |
| `etudiant` / `offre` → `recommandation`                                                                | 1 → 0..* (couple unique)          | CASCADE               |
| `Conversation` ↔ `utilisateur`                                                                           | N-N (table `participantConversation`) | CASCADE               |
| `Conversation` / `utilisateur` → `Message`                                                             | 1 → 0..*                          | CASCADE               |
| `FileCourriel`                                                                                              | aucune                             | —                    |
