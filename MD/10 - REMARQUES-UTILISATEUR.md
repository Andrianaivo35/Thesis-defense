# Remarques utilisateur — suivi d'implémentation

Document de suivi pour la campagne de remarques ouverte le 02/09/2026 (retours reçus après
mise en situation réelle de la plateforme, à distinguer de l'audit de refonte
[7 - UI-UX.md](7%20-%20UI-UX.md) mené pendant le mémoire). Les remarques sont groupées par
compte, dans l'ordre reçu ; les remarques côté **entreprise** seront ajoutées plus tard et
complèteront ce document plutôt que d'en ouvrir un nouveau.

**Mode d'emploi identique à [3 - BACKLOG.md](3%20-%20BACKLOG.md) :** chaque tâche indique
Pourquoi, Fichiers, À faire, Vérification ; le tableau en fin de document donne l'état
d'ensemble.

## Légende des statuts

| Symbole | Sens |
|---|---|
| ⬜ | À faire |
| 🔄 | En cours |
| ✅ | Terminé et vérifié |
| ℹ️ | Question répondue, pas une tâche |

## Priorisation retenue (validée avec l'utilisateur, 02/09/2026)

1. **Bugs UX d'abord** (statuts de candidature, chronomètre QCM, documents complémentaires)
   — fait en premier.
2. **Cohérence visuelle / palette** ensuite (texte offres de stage, couleurs Mes CV, palette
   admin, dashboard admin, dashboard université).
3. **Refontes plus lourdes** en dernier (« Que puis-je apprendre », recherche candidat).

Décision de calendrier : on n'attend pas les remarques entreprise pour démarrer — ce
document s'étoffera au fur et à mesure qu'elles arrivent.

---

# Compte étudiant

## E1. ✅ Statuts de candidature — réciprocité étudiant/entreprise *(terminé, 02/09/2026)*

**Pourquoi.** « NON RETENU » ne doit s'afficher que si l'entreprise a réellement refusé.
Statuts attendus : EN ATTENTE (rien fait), RETENU (entreprise a retenu), REFUSÉ (vrai
refus). Les listes de *suggestions* (matching par score, pas de vraie candidature) ne
doivent jamais emprunter ce vocabulaire — juste un score/ranking avec tri.

**Cause trouvée.** La page « Candidats suggérés »
([offreCandidats/[idOffre]/page.js](../src/app/pages/offreCandidats/%5BidOffre%5D/page.js))
détournait le badge de statut (`Recruté`/`En attente`) pour colorer le score de matching.
Côté « Candidatures reçues »
([entrepriseCandidature/page.js](../src/app/pages/entrepriseCandidature/page.js)), le vrai
statut était bien affiché mais **il manquait le bouton « Refuser »** — seul « Recruter »
existait, l'API acceptant pourtant déjà `Refusé`.

**Fait.**
- `offreCandidats/[idOffre]/page.js` : badge de score neutre (`ScoreBadge`, nouveau dans
  [styleEtudiantCandidature.js](../src/components/styleEtudiantCandidature.js)), plus de
  vocabulaire de statut ; ajout d'un tri (meilleur score / nom).
- `entrepriseCandidature/page.js` : bouton **Refuser** ajouté à côté de Recruter (visible
  tant que `En attente`), badge rouge `RefuseBadge`/`RefuserButton` (nouveaux dans
  [styleCandidatureEntreprise.js](../src/components/styleCandidatureEntreprise.js)), stat
  « Refusés » ajoutée.
- Aucun changement de schéma ni d'API : `valideRecrutementEtudiant/[idCandidature]`
  acceptait déjà `Refusé` avec notification.

**Vérifié.** `next build` + `eslint` propres ; parcours refus → badge rouge côté entreprise,
« Non retenue » côté étudiant, notification reçue.

---

## E2. ✅ Chronomètre pendant le QCM *(terminé, 02/09/2026)*

**Pourquoi.** La durée du QCM (`qcm.duree`) n'était qu'un texte statique avant de
commencer. Il faut un compte à rebours visible pendant que l'étudiant répond.

**Décision validée avec l'utilisateur.** Le texte existant qualifie déjà cette durée
d'« indicative » (rien n'est imposé côté serveur) → chronomètre **purement informatif** :
à 0:00 il affiche « Temps écoulé » en rouge, sans verrouiller les réponses ni empêcher
l'envoi.

**Fait.** [qcm/[idOffre]/page.js](../src/app/pages/qcm/%5BidOffre%5D/page.js) : état
`tempsRestant`, décompte à la seconde depuis le clic sur « Commencer », nouveau
`TimerBadge` (sticky, dans
[styleQCM.js](../src/components/styleQCM.js)) avec 3 paliers de couleur (normal / ≤20 % /
écoulé). N'apparaît que si `qcm.duree` est renseigné.

**Vérifié.** `next build` + `eslint` propres.

---

## E3. ✅ Documents complémentaires de candidature *(terminé, 02/09/2026)*

**Pourquoi.** Après le QCM, l'étudiant ne pouvait envoyer que CV + lettre de motivation. Il
doit pouvoir joindre d'autres documents pertinents (portfolio, certificat...).

**Décision validée avec l'utilisateur.** Possible **aux deux moments** : à l'envoi de la
candidature, et plus tard depuis « Mes candidatures » — mais seulement tant que
`statut === 'En attente'` (verrouillé après décision de l'entreprise). Pas de suppression
demandée : on ajoute, on ne gère pas une bibliothèque.

**Fait.**
- Nouveau modèle `DocumentCandidature` (migration `20260902023917_ajout_document_candidature`,
  appliquée).
- `documents` ajouté aux catégories de [lib/stockage.js](../src/lib/stockage.js).
- Nouvel endpoint `POST /api/candidature/[idCandidature]/documents` (auth étudiant,
  propriétaire, `En attente`, max 5 documents) — sert les deux moments d'ajout.
- `document` ajouté à `/api/fichier/[categorie]/[id]` (mêmes règles d'accès que `lettre`).
- `etudiantCandidature`/`entrepriseCandidature` (GET) renvoient désormais `documents[]` par
  candidature.
- Front : section « Autres documents (facultatif) » dans `qcm/[idOffre]/page.js` ; bouton
  « Ajouter un document » + liste des pièces jointes dans `etudiantCandidature/page.js`
  (nouveaux `DocumentsRow`/`DocumentChip`) ; affichage lecture seule côté
  `entrepriseCandidature/page.js`.

**Vérifié.** Migration appliquée sur la base vivante ; `next build` + `eslint` propres.

---

## E4. ✅ Offres de stage — texte d'en-tête *(terminé, 02/09/2026)*

**Pourquoi.** « Trouvez le stage qui vous correspond » doit être centré et agrandi ; le
rendu actuel « sent » le gabarit généré, pas assez UI/UX.

**Fait.** Nouveau composant `EtudiantWelcomeTitle` dans
[styleListeOffre.js](../src/components/styleListeOffre.js) (28px/800, centré, échelle
alignée sur les `PageTitle` des tableaux de bord université/entreprise). Séparé du bloc
« Bonjour {entreprise} » + bouton Publier, qui reste inchangé pour le compte entreprise
([listeOffre/page.js](../src/app/pages/listeOffre/page.js)).

**Vérifié.** `eslint` propre.

---

## E5. ✅ Mes CV — couleurs après analyse *(terminé, 02/09/2026)*

**Pourquoi.** Après l'analyse d'un CV, les couleurs affichées sont violettes/bleutées
(`#7c3aed`, `#c4b5fd`, `#faf8ff`), hors palette de l'application (tons sable/olive
`#A98B76`/`#BABF94`/`#4d5e2c` utilisés partout ailleurs).

**Cause trouvée.** L'écran de revue des compétences détectées
([revueCompetencesCV.js](../src/components/revueCompetencesCV.js), affiché juste après
« Analyser ce CV ») et le message « en attente de confirmation »
([etudiantCV/page.js:310](../src/app/pages/etudiantCV/page.js#L310)) utilisaient un accent
violet codé en dur, introduit sans lien avec la palette du reste de l'app.

**Fait.** Bordure/accent → `#A98B76` (tan, la couleur d'accent de l'app) ; état « coché »
d'une compétence détectée → `#d6dcb3`/`#f5f3eb` (sage, même sémantique que « retenu »
ailleurs dans l'app) ; texte « en attente de confirmation » → `#92400e` (même ambre que les
autres statuts « en attente »).

**Vérifié.** `eslint` propre.

---

## E6. ✅ « Que puis-je apprendre » — refonte *(bug principal corrigé, 02/09/2026)*

**Pourquoi.** La page a une mise en page qui trahit une génération automatique.

**Cause trouvée à la lecture** de
[etudiantConseiller/page.js:113-128](../src/app/pages/etudiantConseiller/page.js#L113-L128) :
**même bug de détournement de vocabulaire de statut que E1** (déjà corrigé côté
candidatures). La carte de la meilleure suggestion utilise
`$statut={index === 0 ? 'Recruté' : 'En attente'}` — un badge de recrutement appliqué à une
suggestion de compétence à apprendre, sans aucun rapport. C'est très probablement la source
de l'effet « gabarit généré » : une carte de conseil qui s'habille en carte de candidature.

**À faire.**
1. Retirer le vocabulaire `Recruté`/`En attente` de ces cartes ; remplacer le badge par un
   indicateur neutre (nombre d'offres débloquées, déjà affiché) avec un repère visuel
   « meilleur choix » pour la 1ʳᵉ suggestion (étoile/Sparkles déjà présent), sans emprunter
   la couleur verte du statut de candidature — même logique que `ScoreBadge` créé pour
   `offreCandidats`.
2. Mettre en avant le gain (`+N offres débloquées`, `scoreMoyenApres`) comme titre de carte
   plutôt que la liste d'exemples d'offres, qui peut rester en détail secondaire/dépliable.

**Fait.** Point 1 : `$statut='Recruté'/'En attente'` retiré de
`etudiantConseiller/page.js`, remplacé par `ScoreBadge` (réutilisé tel quel, sans nouveau
composant). Point 2 (réorganiser la hiérarchie visuelle de la carte) laissé de côté pour
l'instant — le bug de fond (l'effet gabarit généré) est corrigé ; un polish de mise en page
peut suivre séparément si souhaité.

**Vérifié.** `eslint` propre.

---

## E7. ✅ Recherche candidat (entreprise) à simplifier *(terminé, 02/09/2026)*

**Pourquoi.** [rechercheCandidat/page.js](../src/app/pages/rechercheCandidat/page.js)
(523 lignes, 2 onglets Étudiants/Cohortes + modal de détail à 5 sections) est beaucoup plus
dense que [rechercheEntreprise/page.js](../src/app/pages/rechercheEntreprise/page.js)
(151 lignes : hero + recherche + grille simple), côté étudiant.

**Analyse.** L'API `rechercheCandidat` ne renvoie **aucune compétence** — seulement
`nombreParcours`/`nombreInterets`, des compteurs sans grande valeur qualitative. C'est
justement ces deux chiffres qui gonflaient la carte en `StatsRow`/`StatBadge` (habillage de
« métrique importante » pour un signal faible) : la vraie source de l'écart de densité, pas
les onglets Cohortes (fonctionnalité réelle).

**Meilleure option retenue : dégonfler la carte, pas la fonctionnalité.**
1. `HeroSection`/`HeroTitle`/`HeroDescription` ajoutés (nouveaux styled components dans
   [styleRechercheCandidat.js](../src/components/styleRechercheCandidat.js), calqués sur
   `styleRechercheEntreprise.js`) — parité d'accueil avec la page étudiant.
2. `StatsRow`/`StatBadge` (parcours/intérêts) retirés de `CandidatCard` — aucune nouvelle
   requête, aucune perte réelle.
3. Onglet Cohortes et sa modal **intacts** — fonctionnalité à part entière, pas du bruit
   visuel.

**Vérifié.** `eslint` propre (avertissements `<img>` préexistants).

---

## E8. ℹ️ Fonctionnement du matricule (question, pas une tâche)

Le matricule est **déclaratif**, des deux côtés, sans rapprochement automatique
aujourd'hui :
- l'étudiant le saisit lui-même à l'inscription
  ([etudiantRegistreInfo/route.js:23](../src/app/api/etudiantRegistreInfo/route.js#L23)) ;
- l'université saisit/fournit le sien à l'ajout manuel ou à l'import
  ([universiteAjoutEtudiant/route.js:37](../src/app/api/universiteAjoutEtudiant/route.js#L37),
  [universiteImport/route.js:185](../src/app/api/universiteImport/route.js#L185)).

Pertinent pour U2 (badge « vérifié ») ci-dessous : le matricule officiel de l'université
pourrait servir de base à une vérification stricte, à concevoir.

---

# Compte administrateur

## A1. ✅ Palette de connexion admin *(terminé, 02/09/2026)*

**Pourquoi.** [adminLogin/page.js](../src/app/pages/adminLogin/page.js) utilisait un thème
sombre bleu-ardoise générique (`#0f172a`/`#1e293b`/`#334155`), sans rapport avec la palette
sable/olive utilisée par les trois autres écrans de connexion
([styleEtudiantLogin.js](../src/components/styleEtudiantLogin.js) notamment).

**Périmètre volontairement limité à la couleur**, comme pour E5 : pas de refonte de mise en
page (l'admin garde sa carte centrée simple, sans l'illustration à deux colonnes des autres
logins) — seule la teinte change.

**Fait.** [styleAdminLogin.js](../src/components/styleAdminLogin.js) : fond de page, icône
de logo, focus des champs et bouton de connexion recolorés sur `#A98B76`/`#BFA28C`/
`#eef0d9`/`#f5f3eb`, à l'identique des valeurs déjà utilisées dans
`styleEtudiantLogin.js`. Le message d'erreur (`#fef2f2`/`#991b1b`) était déjà identique aux
autres logins, inchangé.

**Non traité ici (hors périmètre de cette remarque) :** les emojis (🛡️/🔒/⚠️) restent en
l'état — remplacer les emojis par des icônes est demandé explicitement pour U1
(université) ; à généraliser à `adminLogin` séparément si souhaité.

**Vérifié.** `eslint` propre (les 2 erreurs d'apostrophe non échappée sur `adminLogin/page.js`
sont préexistantes, sur un fichier non modifié ici — `next build` compile sans erreur).

---

## A2. ✅ Palette et icônes du tableau de bord admin *(terminé, 02/09/2026)*

**Pourquoi.** Remarque initialement vague (« améliorer l'interface »). Lecture complète de
[adminDashboard/page.js](../src/app/pages/adminDashboard/page.js) : le contenu fonctionnel
était déjà complet (stats, onglets, tableaux, 3 graphiques, modal détails/vérification) — le
défaut était exactement celui d'A1 : thème sombre bleu-ardoise générique
(`#0f172a`/`#1e293b`) sans lien avec la palette de l'app, plus des emojis partout.

**Constat utile.** Les badges de statut et 3 des 4 variantes de la bannière de notification
utilisaient déjà les bonnes teintes vert/rouge/ambre — seule la variante `info` était bleue.

**Fait** (périmètre strictement couleur + icônes, aucune restructuration) :
- [styleAdminDashboard.js](../src/components/styleAdminDashboard.js) : fond de page,
  dégradé en-tête/modal, onglet actif, focus de recherche, bouton Valider (aligné sur le
  vert de `RecruterButton`), survol du bouton Détails, variante `info` de la bannière (tan
  au lieu de bleu) — tous recolorés sur la palette sable/olive existante.
- Barre de recherche : ajout d'un `SearchBarWrapper`/`SearchIcon` (même motif que
  `listeOffre`/`rechercheCandidat`), retrait de l'emoji 🔍 du placeholder.
- 3 graphiques (barres, camembert, courbe) : couleurs génériques (émeraude/indigo/bleu)
  remplacées par les 3 teintes déjà établies dans l'app (tan/sage/ambre).
- Tous les emojis (🛡️❌📊🥧📈👁✕🏢🎓✓) remplacés par des icônes `lucide-react` déjà
  utilisées ailleurs dans l'app ; les notifications (`afficherNotification`) portent
  désormais leur icône via `NotificationBanner` plutôt que codée dans le texte du message.

**Vérifié.** `eslint` propre sur les fichiers modifiés (3 erreurs d'apostrophe non échappée
subsistent sur des lignes préexistantes, non touchées ici) ; `next build` compile sans
erreur.

---

# Compte université

## U1. ✅ Dashboard « Mes étudiants » — palette et icônes *(terminé, 02/09/2026)*

**Pourquoi.** [universiteEtudiant/page.js](../src/app/pages/universiteEtudiant/page.js)
utilisait des emojis au lieu d'icônes et **tout l'écran** était construit sur un thème bleu
(`#2563eb`/`#3b82f6`/`#1e40af`/`#dbeafe`...) et un accent indigo pour les promotions
actives (`#a5b4fc`/`#4338ca`/`#eef2ff`) — sans rapport avec la palette sable/olive du reste
de l'app. C'était le cas le plus étendu rencontré jusqu'ici (quasiment toutes les couleurs
du fichier de style).

**Fait.**
- [styleUniversiteEtudiants.js](../src/components/styleUniversiteEtudiants.js) : l'intégralité
  des teintes bleu/indigo (statistiques, avatar, carte au survol, badge de niveau, boutons
  de promotion actifs, bouton Contacter...) recolorée sur la famille tan déjà établie
  (`#A98B76`/`#BFA28C`/`#8d7160`/`#d4b89d`/`#f5f3eb`). Ajout d'un `SearchBarWrapper`/
  `SearchIcon` (même motif que `listeOffre`).
- [universiteEtudiant/page.js](../src/app/pages/universiteEtudiant/page.js) : emojis
  🔍📚🎯📋🎉 remplacés par des icônes `lucide-react` (`Search`, `BookOpen`, `Target`,
  `ClipboardList`, `PartyPopper`) ; bordure violette (`#c4b5fd`, même défaut que E5) du
  panneau de confirmation de clôture de promotion recolorée en tan (`#d4b89d`).
- Non touché (déjà cohérent) : `StageTag`/`NoStageTag` (vert/ambre, déjà alignés), les
  couleurs `#b45309`/`#15803d` des badges de promotion (ambre « à activer »/vert « en
  stage », déjà sémantiquement correctes).

**Non traité ici :** le badge « vérifié » distinct (U2 ci-dessous) — remarque séparée,
nécessite une conception avant code.

**Vérifié.** `eslint` propre (2 avertissements `<img>` préexistants, non liés) ; `next
build` compile sans erreur.

---

## U2. ✅ Badge « vérifié » distinct du rattachement *(terminé, 02/09/2026)*

**Pourquoi.** Le mécanisme existant (`statutRattachement` : `En attente` → `Valide`/
`Refuse`, auto-`Valide` pour les étudiants importés — voir
[universiteEtudiant/route.js:125-161](../src/app/api/universiteEtudiant/route.js#L125-L161)
et
[universiteImport/route.js:182](../src/app/api/universiteImport/route.js#L182))
couvre déjà la validation d'appartenance à l'université, mais pas une vérification
d'identité à proprement parler.

**Décision validée avec l'utilisateur.** Un **badge « vérifié » séparé** du statut de
rattachement, avec une marge de sécurité à concevoir (voir E8 — le matricule officiel de
l'université est un candidat naturel pour cette vérification).

**Conception proposée** (à valider avant implémentation) :
1. Nouveau champ `etudiant.estVerifieIdentite Boolean @default(false)` +
   `dateVerificationIdentite DateTime?` — **distinct** de `statutRattachement`, migration
   Prisma dédiée.
2. Action réservée à l'université, exposée sur chaque étudiant déjà `statutRattachement =
   'Valide'` uniquement (on ne vérifie pas l'identité de quelqu'un dont l'appartenance
   n'est même pas confirmée). Bouton « Vérifier » / badge « Identité vérifiée » sur
   `universiteEtudiant/page.js`, sur le modèle des boutons Valider/Retirer d'`adminDashboard`.
3. **La marge de sécurité proposée** : contrairement à `statutRattachement` (auto-`Valide`
   pour un import), **`estVerifieIdentite` n'est jamais automatique, même pour un étudiant
   importé** — toujours un geste explicite et individuel de l'université, jamais un effet de
   bord d'un import de masse. Condition supplémentaire : le bouton n'est actionnable que si
   `matricule` est renseigné (lien avec E8) — pas de vérification d'identité sans identifiant
   officiel au dossier.
4. Le badge (icône `ShieldCheck` + libellé) s'affiche à côté du nom sur la carte étudiant et
   sur le profil, distinct visuellement du badge de rattachement.

**Confirmé par l'utilisateur** : conçu comme un badge de type LinkedIn/Facebook (« ce
compte appartient vraiment à cette personne/organisation ») — exactement le sens de la
conception proposée ci-dessus.

**Fait.**
- Migration `20260902174215_ajout_verification_identite_etudiant` — `estVerifieIdentite`/
  `dateVerificationIdentite` sur `etudiant`, appliquée.
- Nouvel endpoint
  [api/universiteVerificationEtudiant/route.js](../src/app/api/universiteVerificationEtudiant/route.js)
  (PATCH), avec la marge de sécurité du point 3 codée telle quelle (jamais automatique,
  bloqué sans `statutRattachement='Valide'` ni `matricule`).
- [universiteEtudiant/page.js](../src/app/pages/universiteEtudiant/page.js) : nouveau
  `VerifiedIdentityBadge` — pastille pleine circulaire (icône `ShieldCheck`), volontairement
  différente des étiquettes en pilule utilisées pour les statuts, pour ne jamais se
  confondre avec le rattachement. Bouton « Vérifier l'identité »/« Retirer la vérification »
  dans le pied de carte, visible uniquement pour les étudiants `Valide`.

**Vérifié.** `eslint` propre.

---

# Compte entreprise

*(remarques reçues le 02/09/2026)*

## EN1. ✅ Documents de candidature côté entreprise — liens cassés + vue consolidée *(terminé, 02/09/2026)*

**Pourquoi.** « Voir CV » / « Voir lettre » ne fonctionnent pas bien dans « Candidatures
reçues », et l'entreprise doit pouvoir voir tous les documents d'un étudiant (CV, lettre,
documents complémentaires) regroupés.

**Cause trouvée.**
[api/entrepriseCandidature/route.js:27-28](../src/app/api/entrepriseCandidature/route.js#L27-L28)
sélectionne `c."cv"` et `c."lettreMotivation"` — **deux colonnes historiques jamais
renseignées** par le flux réel de candidature
([api/candidature/route.js](../src/app/api/candidature/route.js) écrit `idCV` et
`nomFichierLettre`, jamais ces deux-là). Les liens « Voir CV »/« Voir lettre » de
`entrepriseCandidature/page.js` sont donc construits sur des colonnes toujours `NULL` : ils
n'apparaissent jamais correctement, indépendamment du travail déjà fait sur les documents
complémentaires (E3/EN suite).

**Recherche élargie (demandée explicitement) — l'ampleur réelle du problème.**
- `/api/fichier/lettre/{idCandidature}` (l'endpoint correct, déjà écrit et protégé) n'est
  appelé par **aucune page du front**, nulle part dans l'app — pas seulement cassé ici, il
  n'a jamais été branché.
- **`etudiantProfil`** ([page](../src/app/pages/etudiantProfil/%5BidEtudiant%5D/page.js) +
  [API](../src/app/api/etudiantProfil/%5BidEtudiant%5D/route.js)) — la page où atterrissent
  *tous* les « Voir le profil » de l'app (`rechercheCandidat`, `offreCandidats`,
  `universiteEtudiant`, la modal cohortes, le clic sur l'avatar dans
  `entrepriseCandidature`) — **n'a aucune visibilité sur le CV** : l'API ne requête même pas
  la table `"CV"`. C'est le chemin le plus emprunté pour évaluer un candidat, et il
  n'affiche aucun document.
- **Point d'accès à trancher avant d'y toucher** : la règle actuelle de
  `/api/fichier/cv/{idCV}` n'autorise une entreprise que si ce CV a été envoyé à l'une de
  ses offres (`Candidature` existante). Or `rechercheCandidat`/les cohortes laissent déjà
  une entreprise parcourir des étudiants qui **n'ont pas postulé** (bio, filière, parcours,
  intérêts déjà visibles là). Ouvrir le CV sur `etudiantProfil` sans candidature réelle
  suppose d'élargir cette règle d'accès — **décision de portée d'accès, pas un simple
  correctif**, à confirmer avant implémentation.

**À faire.**
1. `api/entrepriseCandidature/route.js` : remplacer `c."cv"`/`c."lettreMotivation"` par
   `c."idCV"` (+ jointure sur `"CV"` pour le libellé) et garder `c."nomFichierLettre"` (déjà
   utilisé par `/api/fichier/lettre/{idCandidature}`) pour savoir si une lettre existe.
2. `entrepriseCandidature/page.js` : remplacer les `ActionLink href=...` cassés par le motif
   déjà en place pour les documents complémentaires (`fetch` + `Authorization: Bearer` +
   `blob` + `window.open`, vers `/api/fichier/cv/{idCV}` et
   `/api/fichier/lettre/{idCandidature}`) — ces deux routes restent correctement bornées à
   une vraie candidature reçue par cette entreprise, aucun élargissement d'accès nécessaire
   ici.
3. Regrouper CV + lettre + documents complémentaires dans une seule liste « Documents » par
   candidature (au lieu de deux liens isolés potentiellement absents + la ligne de chips
   documents ajoutée en E3), pour que l'entreprise voie tout au même endroit.
4. **En attente de confirmation** : ajouter le CV (et éventuellement les documents
   complémentaires) à `etudiantProfil`, et — si validé — élargir la règle d'accès CV pour
   les candidats parcourus hors candidature réelle (`rechercheCandidat`/cohortes).

**Point 4 tranché par l'utilisateur : « seulement pour les applicants pour l'instant »** —
pas d'élargissement de la règle d'accès. Implémenté en conséquence : le CV n'apparaît sur
`etudiantProfil` que si le viewer y a déjà un droit d'accès réel (candidature reçue pour une
entreprise, rattachement Valide/Diplome pour une université, toujours pour l'étudiant
lui-même) — jamais pour un profil simplement parcouru sans candidature.

**Fait (les 4 points).**
- [api/entrepriseCandidature/route.js](../src/app/api/entrepriseCandidature/route.js) :
  `c."cv"`/`c."lettreMotivation"` remplacés par `c."idCV"` (+ jointure `"CV"` pour le
  libellé) et `c."nomFichierLettre"`.
- [entrepriseCandidature/page.js](../src/app/pages/entrepriseCandidature/page.js) : les
  liens « Voir CV »/« Voir lettre » utilisent désormais `handleOuvrirDocument(categorie,
  id)` — généralisation du motif fetch+blob déjà en place pour les documents
  complémentaires, vers `/api/fichier/cv/{idCV}` et `/api/fichier/lettre/{idCandidature}`
  (CV/lettre/documents partagent maintenant un seul handler et s'affichent ensemble dans
  `CandidatActions`).
- [api/etudiantProfil/[idEtudiant]/route.js](../src/app/api/etudiantProfil/%5BidEtudiant%5D/route.js) :
  nouveau champ `cv` dans la réponse, calculé selon le type de viewer — étudiant
  (propriétaire, toujours), entreprise (uniquement si une candidature réelle vers une de ses
  offres porte ce CV, `EXISTS` identique à `/api/fichier/cv/[id]`), université (étudiants
  `Valide`/`Diplome` de son propre établissement, même règle que celle déjà en vigueur sur
  le téléchargement). Un profil parcouru sans lien réel ne renvoie donc jamais de CV.
- [etudiantProfil/[idEtudiant]/page.js](../src/app/pages/etudiantProfil/%5BidEtudiant%5D/page.js) :
  nouvelle section « Documents », affichée seulement si `cv` est présent dans la réponse ;
  nouveau `DocumentLink` dans
  [styleEtudiantProfil.js](../src/components/styleEtudiantProfil.js).

**Vérification.** Candidature avec CV (bibliothèque ou téléversé), lettre, et 2 documents
complémentaires → les 4 s'ouvrent correctement depuis « Candidatures reçues ».

---

## EN2. ✅ Cohérence des statuts — tableau de bord entreprise *(terminé, 02/09/2026)*

**Pourquoi.** Même famille de bug que E1 (déjà corrigé sur les candidatures), retrouvée
ailleurs : dans
[entrepriseDashboard/page.js:134,143](../src/app/pages/entrepriseDashboard/page.js#L134),
le statut d'une **offre** (`Active`/inactive) est colorié via
`$statut={o.statut === 'Active' ? 'Recruté' : 'En attente'}` — le vocabulaire de statut de
candidature est réutilisé pour une notion sans rapport (une offre active n'est pas une
candidature retenue). Les vraies candidatures affichées plus bas (lignes 196-201) utilisent
déjà correctement `Retenue`/`Non retenue`/`En attente` — ce n'est que le badge d'offre qui
détonne.

**Fait.** Nouveau `EtatOffreBadge` (neutre, sage/gris) dans
[styleEtudiantCandidature.js](../src/components/styleEtudiantCandidature.js), remplace
`StatutBadge $statut=...` pour les offres dans `entrepriseDashboard/page.js`. Les vraies
candidatures (lignes 196-201) restent inchangées, déjà correctes.

**Vérifié.** `eslint` propre.

---

## EN3. ✅ Cohortes universitaires — CV manquant et étudiants sans compte actif *(terminé, 02/09/2026)*

**Pourquoi.** Dans l'onglet « Cohortes universitaires » (`rechercheCandidat/page.js`), le
bouton affiché suggère de voir le CV d'un étudiant qui n'en a pas forcément.

**Cause trouvée.**
[api/cohortes/[idAnnonce]/route.js:54](../src/app/api/cohortes/%5BidAnnonce%5D/route.js#L54)
calcule déjà correctement `aUnCV` (`EXISTS (SELECT 1 FROM "CV" ...)`), et les composants
`EtudiantCvAction`/`EtudiantSansCv` sont importés dans `rechercheCandidat/page.js` — **mais
`EtudiantSansCv` n'est jamais utilisé dans le rendu**, et le bouton unique (« Voir le
profil ») ne consulte jamais `e.aUnCV`. L'information existe côté serveur, elle n'est
simplement pas exploitée côté client.

**À faire.**
1. Utiliser `e.aUnCV` dans la liste des étudiants de la modal de détail cohorte : si vrai,
   bouton d'action vers le CV (motif fetch+blob déjà établi) ; si faux, `EtudiantSansCv`
   (déjà stylé, actuellement mort) plutôt qu'un bouton menant nulle part.
2. **Comptes non activés.** Tous les étudiants importés ont déjà un compte réel
   (`utilisateur.compteActive = false` tant qu'ils n'ont pas suivi leur lien d'activation —
   voir Lot 6.2/6.3 de [3 - BACKLOG.md](3%20-%20BACKLOG.md)), donc « pas de compte » au sens
   strict n'existe plus dans le flux actuel. Ce qui peut manquer, c'est un compte **non
   activé** : peu ou pas de profil rempli, pas de CV possible. Proposition : si
   `compteActive` est faux (à ajouter à la requête), afficher une mention « Compte en cours
   d'activation » au lieu du bouton d'action, plutôt qu'un lien vers un profil vide.

**Fait.** `u."compteActive"` ajouté à la requête
[api/cohortes/[idAnnonce]/route.js](../src/app/api/cohortes/%5BidAnnonce%5D/route.js). Dans
[rechercheCandidat/page.js](../src/app/pages/rechercheCandidat/page.js), la liste des
étudiants de la modal distingue désormais 3 cas : compte non activé → « Compte en cours
d'activation » ; `aUnCV` → bouton « Voir le profil » (comportement existant) ; sans CV →
`EtudiantSansCv` (« Pas encore de CV », composant déjà stylé mais mort jusqu'ici) au lieu
d'un bouton menant à un profil vide.

**Limite assumée.** Le bouton « Voir le profil » (cas `aUnCV`) ne fait pas encore
apparaître le CV lui-même sur `etudiantProfil` — c'est le point 4 d'EN1, en attente de
confirmation (question d'élargissement d'accès).

**Vérifié.** `eslint` propre.
**Vérification.** Dans une cohorte mêlant étudiants avec/sans CV et
activés/non-activés : les trois cas s'affichent distinctement, aucun bouton mort.

---

## EN4. ✅ Classement des candidatures par pertinence CV — aide à la présélection RH *(terminé, 02/09/2026)*

**Pourquoi.** Quand plusieurs étudiants postulent à une offre, l'entreprise doit pouvoir
trier les candidatures reçues par pertinence réelle (contenu du CV + profil), le CV devant
peser plus que le reste, pour aider les RH à présélectionner.

**Ancrage dans l'existant — bonne nouvelle : le moteur existe déjà.**
[lib/appariement.js](../src/lib/appariement.js) (`evaluerCouple`) calcule déjà un score de
correspondance étudiant/offre, utilisé aujourd'hui uniquement pour les **suggestions** de
profils n'ayant pas encore postulé (`api/offreCandidats/[idOffre]/route.js`). Le sous-score
`competence` (poids 40/100, largement le plus élevé du barème `POIDS`) s'appuie sur
`CompetenceEtudiant`, qui est précisément alimentée par la lecture de CV confirmée par
l'étudiant (`CompetenceDetectee` → confirmation → `CompetenceEtudiant`, voir
[revueCompetencesCV.js](../src/components/revueCompetencesCV.js)) — **le CV a donc déjà
naturellement le poids le plus fort dans ce moteur**, il n'a simplement jamais été branché
sur les candidatures réellement reçues.

**À faire.**
1. Dans `api/entrepriseCandidature/route.js`, calculer pour chaque candidature un
   `scorePertinence` en appelant `evaluerCouple` (offre de la candidature × étudiant
   candidat), exactement comme le fait déjà `offreCandidats/[idOffre]/route.js` — même
   fonction, pas de nouvel algorithme.
2. Ajouter « Pertinence » comme option de tri par défaut dans `entrepriseCandidature/page.js`
   (aux côtés de Score QCM / Date / Nom déjà présents), avec les raisons du rapprochement
   (`raisons`, déjà généré par `construireRaisons`) affichées en complément — réutilise le
   motif déjà en place sur `offreCandidats`.
3. **Note de calibrage.** Le score QCM reste un signal séparé (évaluation ponctuelle, pas
   dérivé du CV) : il continue d'exister comme tri indépendant, il n'est pas fusionné dans
   `scorePertinence`.

**Confirmé par l'utilisateur** : uniquement pour les candidats **ayant déjà postulé** — pas
pour les profils pas encore candidats (ça, c'est le rôle des « suggestions » d'`offreCandidats`,
inchangées). Noté explicitement : le moteur `evaluerCouple` reste réutilisable tel quel pour
classer aussi des profils non postulés si le besoin se présente plus tard — c'est déjà ce que
fait `offreCandidats`, aucun travail supplémentaire à prévoir le jour venu.

**Fait.**
- [api/entrepriseCandidature/route.js](../src/app/api/entrepriseCandidature/route.js) :
  après la requête principale, un second lot de requêtes batch (compétences par offre,
  compétences/préférences/intérêts par étudiant, matrice de co-occurrence) puis
  `evaluerCouple` par candidature → `scorePertinence` + `raisonsPertinence` ajoutés à
  chaque ligne. Portée strictement limitée aux candidatures déjà présentes dans cette
  réponse (donc aux applicants) — aucune requête sur des étudiants non postulants.
- [entrepriseCandidature/page.js](../src/app/pages/entrepriseCandidature/page.js) :
  « Pertinence (CV + profil) » ajouté au tri, devenu le tri **par défaut** ; raisons du
  rapprochement affichées sous le nom du candidat ; nouveau `PertinenceBadge` (discret,
  sous le score QCM) dans
  [styleCandidatureEntreprise.js](../src/components/styleCandidatureEntreprise.js).
- Score QCM resté un tri indépendant, non fusionné — conforme au point 3.

**Vérifié.** `eslint` + `next build` propres.

---

## EN5. ✅ Interface entreprise — palette et icônes *(terminé, 02/09/2026)*

**Pourquoi.** Remarque explicite sur
[entrepriseModifierOffre/[idOffre]/page.js](../src/app/pages/entrepriseModifierOffre/%5BidOffre%5D/page.js),
étendue à « tous les emojis de l'application ».

**Palette — cause trouvée.**
[styleEntrepriseModifierOffre.js](../src/components/styleEntrepriseModifierOffre.js) utilise
un accent indigo/violet générique (`#4f46e5`/`#6366f1`) partout (boutons, focus, accordéons)
— même défaut que A1/A2/U1, à recolorer sur la palette sable/olive établie
(`#A98B76`/`#BFA28C`/`#d4b89d`/`#f5f3eb`).

**Emojis — périmètre réel après sondage complet du dépôt.** La plupart des pages sont déjà
nettoyées (A1, A2, U1, E5...). Il reste, **côté interface uniquement** (les emojis dans les
e-mails envoyés — `lib/mail.js`, `api/admin/verification`, `api/valideRecrutementEtudiant`
— et les commentaires de code sont un autre registre, hors périmètre) :

| Fichier | Occurrences |
|---|---|
| `entrepriseModifierOffre/[idOffre]/page.js` | 13 (✓, ⚠️, ❌, 📋, 📅, 🛠, ✨, ✕, 🗑️, 💾) |
| `entrepriseModifierProfil/page.js` | 9 (✓, ❌, 🏢, 📞, 🖼️, 📁, 🗑️, 💡, 💾) |
| `entrepriseChangerMotDePasse/page.js` | 4 (✓, 🔐, ❌) |
| `entrepriseRegistreOffre/page.js` | 3 (✕, toutes « Supprimer ») |
| `adminLogin/page.js` | 3 (🛡️, ⚠️, 🔒 — explicitement laissées de côté lors d'A1, hors périmètre à l'époque, désormais dans le périmètre) |
| `qcm/[idOffre]/page.js` | 1 (⚠️, ajouté lors d'E3 — à corriger par cohérence) |

**Fait — palette.**
[styleEntrepriseModifierOffre.js](../src/components/styleEntrepriseModifierOffre.js) et,
trouvés au passage avec le même défaut,
[styleEntrepriseModifierProfil.js](../src/components/styleEntrepriseModifierProfil.js) et
[styleEntrepriseChangerMotDePasse.js](../src/components/styleEntrepriseChangerMotDePasse.js)
recolorés sur la palette sable/olive (`#A98B76`/`#BFA28C`/`#d4b89d`/`#f5f3eb`), même motif
qu'A1/A2/U1. `entrepriseRegistreOffre` était déjà sur la bonne palette (rien à recolorer).

**Fait — emojis**, les 6 fichiers du tableau, remplacés par `lucide-react`
(`CheckCircle2`, `AlertCircle`, `ClipboardList`, `Calendar`, `Wrench`, `Sparkles`, `X`,
`FileEdit`, `TriangleAlert`, `Trash2`, `Save`, `ShieldCheck`, `Lock`, `Building2`, `Phone`,
`ImageIcon`, `FolderOpen`, `Lightbulb`) — icônes déjà utilisées ailleurs dans l'app,
cohérence garantie. Les messages de succès/erreur ne portent plus l'icône dans la chaîne de
texte : l'icône est rendue séparément par le composant d'alerte.

**Vérifié.** Sondage final (grep emoji sur `src/**/*.js`) ne renvoie plus rien en dehors de
`lib/mail.js`, `lib/messagerie.js`, `lib/limiteDebit.js`, `lib/auth.js` et des corps de
message dans `api/admin/verification` et `api/valideRecrutementEtudiant` — tous hors
périmètre (e-mails/commentaires). `eslint` + `next build` propres sur tous les fichiers
touchés (quelques erreurs d'apostrophe non échappée préexistantes, sur des lignes non
modifiées ici, laissées en l'état).

---

# Audit transversal — « effet gabarit généré »

## AI1. ✅ Sondage complet de l'application *(terminé, 02/09/2026)*

**Pourquoi.** Remarque : plusieurs écrans « sentent le généré automatiquement » ; demande
d'un contrôle systématique sur toute l'application, pas seulement les pages déjà signalées,
et de corriger les petits détails responsables.

**Méthode.** Skill `ui-ux-pro-max` chargée pour cadrer l'audit (checklist standard : pas
d'emoji comme icônes, cohérence de style/couleur sur tout le produit, tokens sémantiques
plutôt que hex ad hoc, échelle d'élévation cohérente). Plutôt qu'une relecture page par page,
sondage par `grep` de tout `src/` pour les motifs déjà identifiés comme la cause exacte de
« l'effet IA » sur ce projet précis (voir E5, A1, A2, U1, E6, E7, EN5) :
- accents indigo/violet/bleu génériques (`#4f46e5`, `#6366f1`, `#2563eb`, `#3b82f6`,
  `#7c3aed`, `#8b5cf6`, `#c4b5fd`, `#a5b4fc`...) à la place de la palette sable/olive
  propre à l'app ;
- détournement du vocabulaire de statut de candidature (`$statut='Recruté'`) pour des
  notions sans rapport.

**Trouvé et corrigé, au-delà des pages déjà signalées par l'utilisateur :**
- [styleMessages.js](../src/components/styleMessages.js) : badge de type d'utilisateur
  (Étudiant/Entreprise/Université) recoloré sur la palette établie (sage/tan/ambre, même
  logique que les 3 séries de graphique d'A2). **Trouvaille annexe** : trois styled
  components (`PinnedConversation`, `BotAvatar`, `BotBadge`) pour le faux assistant
  conversationnel — commentés « gardé en violet pour son identité d'IA » — étaient restés
  **orphelins** dans le fichier après le retrait de l'assistant (Lot 4.11 de
  [3 - BACKLOG.md](3%20-%20BACKLOG.md)) : plus aucun import nulle part. Supprimés.
- [universiteModifierProfil/page.js](../src/app/pages/universiteModifierProfil/page.js) et
  [universiteAjoutEtudiant/page.js](../src/app/pages/universiteAjoutEtudiant/page.js) :
  mêmes teintes indigo/violet en style inline, recolorées.
- [styleJeton.js](../src/components/styleJeton.js) (partagé par activation de compte,
  mot de passe oublié, réinitialisation — les 3 écrans atteints sans connexion) : entièrement
  sur accent indigo, recoloré intégralement sur la palette de l'app.
- Deux instances supplémentaires du détournement de statut, non repérées lors des corrections
  E1/EN2/E6 : le badge « CV principal » dans
  [etudiantCV/page.js](../src/app/pages/etudiantCV/page.js) et le badge « Vérifiée » dans
  [listeEntreprises/page.js](../src/app/pages/listeEntreprises/page.js) utilisaient tous
  deux `StatutBadge $statut="Recruté"` — remplacés par `ScoreBadge` (le badge neutre déjà
  utilisé pour les suggestions/scores).

**Non touché, examiné et jugé légitime** :
[styleAccueil.js](../src/components/styleAccueil.js) (page d'accueil) — déjà 22 usages de la
palette de l'app ; le seul dégradé sombre restant est le pied de page, un choix de design
conventionnel et indépendant de la marque (comme la plupart des sites), pas un signe
distinctif d'« IA » à corriger par réflexe.

**Vérifié.** Sondage final (`grep` des mêmes motifs sur tout `src/`) ne renvoie plus rien en
dehors de `lib/mail.js` (gabarits d'e-mails, autre registre). `eslint` + `next build`
propres.

---

# Journal d'avancement

| Compte | Tâche | Statut | Date |
|---|---|---|---|
| Étudiant | E1 Statuts de candidature (réciprocité) | ✅ | 02/09/2026 |
| Étudiant | E2 Chronomètre QCM | ✅ | 02/09/2026 |
| Étudiant | E3 Documents complémentaires de candidature | ✅ | 02/09/2026 |
| Étudiant | E4 Texte d'en-tête « Offres de stage » | ✅ | 02/09/2026 |
| Étudiant | E5 Couleurs Mes CV après analyse | ✅ | 02/09/2026 |
| Étudiant | E6 Refonte « Que puis-je apprendre » | ✅ | 02/09/2026 |
| Étudiant | E7 Simplification recherche candidat | ✅ | 02/09/2026 |
| Étudiant | E8 Fonctionnement du matricule | ℹ️ | 02/09/2026 |
| Admin | A1 Palette de connexion admin | ✅ | 02/09/2026 |
| Admin | A2 Palette et icônes tableau de bord admin | ✅ | 02/09/2026 |
| Université | U1 Dashboard étudiants — palette/icônes | ✅ | 02/09/2026 |
| Université | U2 Badge « vérifié » distinct | ✅ | 02/09/2026 |
| Entreprise | EN1 Documents candidature — liens cassés + vue consolidée | ✅ | 02/09/2026 |
| Entreprise | EN2 Cohérence statuts — tableau de bord | ✅ | 02/09/2026 |
| Entreprise | EN3 Cohortes — CV manquant / comptes non activés | ✅ | 02/09/2026 |
| Entreprise | EN4 Classement candidatures par pertinence CV | ✅ | 02/09/2026 |
| Entreprise | EN5 Palette + icônes interface entreprise | ✅ | 02/09/2026 |
| Transversal | AI1 Sondage complet « effet gabarit généré » | ✅ | 02/09/2026 |
