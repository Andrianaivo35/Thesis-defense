# Audit UI/UX et refonte de la hiérarchie

> **Périmètre volontairement étroit.** Ni les couleurs ni les dispositions ne changent :
> pas de nouvelle palette, pas de colonnes déplacées, pas de composants redessinés. Ce
> document ne traite que de **l'ordre** — quel élément se lit en premier, lequel peut
> attendre, lequel n'a rien à faire là.
>
> C'est une contrainte utile. Réordonner coûte peu, se vérifie vite, et corrige la plupart
> des défauts observés : ils ne viennent pas du dessin, ils viennent de la priorité.

---

## 1. Le principe directeur

> **Ce qui appelle une décision passe avant ce qui informe.**

L'application place presque partout les **statistiques** en tête et l'**action** en dessous.
C'est l'inverse de ce que fait l'utilisateur.

« 3 candidatures à traiter » est une information. Ce que l'entreprise doit faire, c'est
*les traiter*. Lui présenter le compte avant la liste lui impose un défilement pour
atteindre son propre travail — chaque jour, sur chaque écran.

Ce document applique ce seul principe, écran par écran.

---

## 2. Écran par écran

### 2.1 Carte de recommandation — le défaut le plus coûteux

Composant [recommandations.js](../src/components/recommandations.js). Ordre actuel :

| Rang | Élément | Problème |
|---|---|---|
| 1 | **Badge de score « 87 % »** | Un artefact du système, pas une information du métier |
| 2 | Logo + nom de l'entreprise | |
| 3 | **Titre du poste** | C'est ce qu'on cherche, en 3ᵉ position |
| 4 | Ville, date limite | |
| 5 | **Raisons du rapprochement** | En bas de carte, souvent hors du regard |

**Deux inversions à faire.**

1. **Le poste avant l'entreprise et avant le score.** Un étudiant cherche un *stage*, pas
   une société ni un pourcentage. Le titre doit être la première ligne lue.
2. **Les raisons remontent juste sous le titre.** C'est le point le plus important de tout
   ce document : « vous avez React, cette offre demande Vue.js — proches » est la sortie du
   moteur de co-occurrence, c'est-à-dire **la contribution du mémoire**. Elle est
   actuellement le dernier élément d'une carte. Personne ne la voit, et le travail devient
   invisible.

Le score reste, réduit au rang d'indice discret : il n'est pas faux, il n'est simplement
pas ce qu'on lit en premier.

**Ordre proposé :** titre du poste → raison principale → entreprise → lieu et date limite →
score.

### 2.2 Liste des offres — l'écran d'atterrissage de l'étudiant

Ordre actuel : salutation → **barre de recherche** → recommandations → toutes les offres.

La recherche passe avant les recommandations. Or **un étudiant qui arrive ne sait pas quoi
chercher** : il ouvre l'application justement parce qu'il n'a pas d'idée précise. Lui
présenter un champ vide en premier lui demande de produire l'information qu'il venait
chercher.

**Ordre proposé :** salutation → recommandations → recherche → toutes les offres.

La barre de recherche ne disparaît pas et ne bouge pas de forme ; elle descend d'un cran.
Celui qui sait ce qu'il veut la trouve immédiatement, celui qui ne sait pas voit d'abord ce
qu'on a calculé pour lui.

### 2.3 Le profil incomplet doit être la première chose vue

Un étudiant sans compétences déclarées reçoit des recommandations vides. Le composant
affiche bien un message, mais **au même rang** que les recommandations elles-mêmes.

Quand le profil est incomplet, ce message est la seule chose qui compte : c'est la
condition de tout le reste. Il doit occuper la place des recommandations, pas la partager.

**Et il doit proposer le bon geste.** Aujourd'hui il renvoie vers « compléter mon profil »,
c'est-à-dire un formulaire. Or l'application sait faire mieux : **déposer un CV et le
laisser lire** (Lot 5.4) remplit le profil en une opération. C'est la fonctionnalité la plus
différenciante du projet, et elle est enterrée dans un onglet « Mes CV », derrière un
bouton « Analyser ».

**Ordre proposé pour un profil incomplet :** « Déposez votre CV, nous en extrayons vos
compétences » → « ou saisissez-les à la main » → recommandations (vides, expliquées).

### 2.4 Tableau de bord entreprise

Ordre actuel : titre → sous-titre → **4 statistiques** → accès rapides → offres récentes →
candidatures récentes.

La statistique « À traiter » est un nombre ; les candidatures à traiter sont juste en
dessous, mélangées aux autres. L'entreprise voit « 3 » puis doit chercher lesquelles.

**Ordre proposé :** titre → **les candidatures en attente, en liste actionnable** →
statistiques (bandeau resserré) → offres récentes → accès rapides.

Quand il n'y a rien à traiter, ce premier bloc s'efface et les statistiques reprennent la
tête : un écran vide n'a pas à réserver sa meilleure place au néant.

### 2.5 Tableau de bord université

Même correction, avec une spécificité : la donnée qui appelle une décision est
**les demandes de rattachement en attente**. Un étudiant qui attend d'être validé ne peut
rien faire de la plateforme — ni postuler, ni être recommandé.

**Ordre proposé :** demandes de rattachement en attente → promotions → statistiques →
accès rapides.

### 2.6 « Mes candidatures » (étudiant)

Ordre actuel : titre → 4 statistiques → liste.

Un étudiant a rarement plus de dix candidatures. Compter ce qu'il peut dénombrer d'un coup
d'œil n'apporte rien, et repousse la liste hors de l'écran.

**Ordre proposé :** titre → liste, **les réponses reçues en premier** (retenue ou refus),
puis celles en attente → statistiques en bas, en une ligne.

Une réponse reçue est un événement ; une candidature en attente est un état. L'événement
passe devant.

### 2.7 Le conseiller n'est appelé de nulle part

« Que puis-je apprendre ? » (Lot 5.3) n'existe que dans le menu. Or il a un moment
d'utilité évident : **quand l'étudiant a peu de recommandations**. C'est précisément là
qu'il faut lui dire « avec telle compétence, six offres de plus vous seraient ouvertes ».

**Proposition :** sous un bloc de recommandations pauvre (moins de trois offres), une seule
ligne renvoyant au conseiller. Pas un encart permanent — il deviendrait du bruit.

---

## 3. La messagerie

L'écran demande davantage qu'un réordonnancement. Voici ce que la lecture du code
([messages/page.js](../src/app/pages/messages/page.js)) et son usage font apparaître.

### 3.1 Défauts constatés

| # | Défaut | Conséquence |
|---|---|---|
| 1 | **Aucun séparateur de date** | Rien ne distingue un message d'aujourd'hui d'un message d'il y a trois semaines |
| 2 | **Aucun regroupement des messages consécutifs** | Chaque message porte son heure ; trois messages d'affilée produisent trois blocs, la lecture est hachée |
| 3 | **Le message n'apparaît qu'après l'aller-retour serveur** | Sur réseau lent, l'utilisateur croit que rien n'est parti et réappuie |
| 4 | **Le sondage tourne dans un onglet masqué** | Un rafraîchissement toutes les 5 s existe bien, mais il continue quand l'onglet est en arrière-plan : requêtes et batterie consommées pour un écran que personne ne regarde |
| 5 | **Aucune recherche dans les conversations** | La recherche n'existe que dans l'onglet « Nouveau » |
| 6 | **Aucun contexte** | On parle à « Telma » sans savoir de quelle candidature il s'agit — alors que toutes ces conversations en naissent |
| 7 | **Reliquat `activeId === 'chatbot'`** | Code mort du faux assistant retiré au Lot 4.11 |
| 8 | **Aucun accusé de lecture côté expéditeur** | `nonLus` existe pourtant déjà côté destinataire |

### 3.2 Corrections retenues

Par ordre de gain :

1. **Séparateurs de date** (« Aujourd'hui », « Hier », date pleine au-delà) et
   **regroupement des messages consécutifs** du même auteur dans la même minute.
2. **Envoi optimiste** : le message s'affiche immédiatement, grisé, puis se confirme ou
   signale son échec avec un bouton « réessayer ». C'est le défaut le plus pénalisant sur
   une connexion lente.
3. **Suspendre le sondage quand l'onglet est masqué**, et le relancer au retour. Le
   rafraîchissement existe déjà ; c'est son fonctionnement en arrière-plan qui est à
   corriger.
4. **Recherche dans les conversations**, le champ existant étant simplement rendu
   disponible aussi dans l'onglet « Conversations ».
5. **Retrait du reliquat `chatbot`**.

### 3.3 Écarté volontairement

- **Indicateur « en train d'écrire »** et **accusés de lecture temps réel** : ils supposent
  une connexion persistante (WebSocket). L'application est mono-instance et sans serveur
  temps réel ; l'ajouter pour un confort mineur serait disproportionné.
- **Pièces jointes dans la messagerie** : les CV ont déjà leur circuit, contrôlé et
  authentifié. Un second chemin de fichiers rouvrirait les problèmes réglés au Lot 3.

---

## 4. Ce que ce document ne fait pas

- **Aucun changement de couleur ni de disposition**, conformément à la consigne.
- **Aucune refonte de la navigation** : la barre latérale étudiant et la barre supérieure
  fonctionnent, et les toucher demanderait de revoir tous les écrans.
- **Aucun travail sur le mobile** au-delà de l'existant. Il mériterait un examen à part —
  la messagerie à deux panneaux et les tableaux larges sont les premiers candidats.

---

## 5. Ordre de mise en œuvre

Du meilleur rapport au plus coûteux :

| Rang | Changement | Effort |
|---|---|---|
| 1 | Raisons et titre en tête de carte de recommandation (§2.1) | faible |
| 2 | Corrections de la messagerie (§3.2) | moyen |
| 3 | Recommandations avant la recherche (§2.2) | faible |
| 4 | Dépôt de CV proposé en premier sur un profil incomplet (§2.3) | faible |
| 5 | Actionnable avant statistiques sur les trois tableaux de bord (§2.4, §2.5, §2.6) | moyen |
| 6 | Appel au conseiller sous un bloc pauvre (§2.7) | faible |

Le rang 1 est le plus important du document : il ne coûte presque rien et rend visible la
contribution scientifique du mémoire, aujourd'hui reléguée en bas d'une carte.
