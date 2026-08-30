# Chapitre 3 — captures, annotations, document

Trois étapes séparées à dessein. Régénérer les captures ne force pas à refaire les
annotations ; recomposer le document ne force pas à tout recapturer.

```bash
node scripts/memoire/capturer-ecrans.mjs      # 1. les captures
python scripts/memoire/annoter-captures.py    # 2. les pastilles numérotées
python scripts/memoire/generer-chapitre3.py   # 3. le document Word
```

**Avant la première utilisation :**

```bash
npm install                       # installe Playwright
npx playwright install chromium   # télécharge le navigateur
pip install python-docx pillow    # si absents
```

L'application doit tourner sur `http://localhost:3000` — ou passez `--url` à l'étape 1.

---

## Ce que chaque étape produit

| Étape | Entrée | Sortie |
|---|---|---|
| 1 | `ecrans.json` | `chapitre3/figures/*.png` et `reperes.json` |
| 2 | les images et `reperes.json` | `*-annote.png` et `legendes.json` |
| 3 | `ecrans.json` et les images | `Chapitre3-Essentiel.docx` **et** `Chapitre3-Complet.docx` |

---

## Deux documents, pour deux usages

L'étape 3 produit **deux fichiers** à partir des mêmes captures :

| Document | Figures | Ce qu'il contient |
|---|---|---|
| `Chapitre3-Essentiel.docx` | 17 | ce qui porte la contribution : recommandation et son explication, lecture des CV, gestion par promotion, sécurité |
| `Chapitre3-Complet.docx` | 44 | tous les écrans, chacun marqué « complément » ou « secondaire » quand on peut s'en passer |

Le tri vient du champ **`importance`** de chaque écran dans `ecrans.json` :

| Valeur | Sens | Dans quel document |
|---|---|---|
| `coeur` | on ne peut pas défendre le mémoire sans | les deux |
| `utile` | éclaire, sans être indispensable | complet, marqué « complément » |
| `accessoire` | écran de service — connexion, mot de passe oublié | complet, marqué « secondaire » |

Actuellement : **17 cœur, 16 utiles, 11 accessoires**.

**Pourquoi deux documents plutôt qu'un.** Retirer une figure d'un document Word déjà rédigé
casse la numérotation, les renvois et la table des figures. Ici, on change une valeur dans
`ecrans.json`, on relance l'étape 3, et les deux documents se renumérotent seuls. La version
complète sert de réserve : on y prend une figure quand une section a besoin d'un appui.

Pour ajouter un troisième découpage, il suffit d'une entrée dans la liste `DOCUMENTS` en
tête de `generer-chapitre3.py` — son nom de fichier, les niveaux retenus, et son texte
d'annonce.

---

## Modifier le chapitre sans toucher au code

Tout se règle dans **`ecrans.json`**, qui s'ouvre sur trois blocs :

| Bloc | À quoi il sert |
|---|---|
| **`titres`** | le titre de chaque figure, **regroupés en un seul endroit**. C'est ici qu'on renomme, sans aller chercher l'écran au milieu des sections. |
| **`identifiants`** | les identifiants employés dans les adresses. Changer l'étudiant d'exemple se fait en une ligne, et les cinq adresses qui l'emploient suivent. |
| **`sections`** | l'ordre du chapitre, et pour chaque écran son rôle, son adresse, son explication et ses repères. |

Dans une adresse, `{{idEtudiant}}` est remplacé par la valeur du bloc `identifiants`.

> **Attention au rôle.** Un étudiant ne peut consulter que **son propre** profil : mettre
> l'identifiant d'un autre produit une page de refus. Le script le signale désormais, mais
> mieux vaut le savoir — `idEtudiant` doit être celui du compte de capture.

### Ajouter un écran

```json
{
  "role": "etudiant",
  "chemin": "/pages/etudiantProfil/{{idEtudiant}}",
  "fichier": "etudiant-profil",
  "texte": "Le paragraphe qui accompagnera la figure dans le mémoire.",
  "attendre": "text=Compétences",
  "reperes": [
    { "cible": "texte:Compétences", "legende": "les compétences déclarées" }
  ]
}
```

- **`role`** — `public`, `etudiant`, `entreprise`, `universite` ou `admin`. La connexion est
  faite pour vous.
- **`attendre`** — un sélecteur à attendre avant de déclencher. Utile quand la page charge
  ses données après l'affichage : sans lui, la capture montre un écran vide.
- **`reperes`** — chaque entrée devient une pastille numérotée sur l'image **et** une puce
  numérotée sous la figure dans le document.
- **`importance`** — `coeur`, `utile` ou `accessoire`. Détermine dans lequel des deux
  documents l'écran apparaît (voir plus haut). En l'absence du champ, l'écran est traité
  comme `utile`.

### Désigner un repère

Deux écritures :

| Écriture | Sens |
|---|---|
| `"texte:Mes promotions"` | le premier élément contenant ce texte |
| `"input[type=file]"` | un sélecteur CSS |

La première est plus lisible et résiste mieux aux changements de structure ; la seconde sert
quand il n'y a pas de texte, comme pour un champ de fichier.

### Agir avant de capturer

```json
"avant": [
  { "clic": "button:has-text('Filières enseignées')" },
  { "pause": 500 }
]
```

Pour dérouler une section repliée, ouvrir un onglet, remplir un champ.

---

## Deux détails qui ont demandé une correction

Ils sont expliqués dans les scripts, mais méritent d'être connus avant de les modifier.

**Les coordonnées viennent du navigateur, jamais de l'œil.** L'étape 1 relève la position
réelle de chaque élément (`boundingBox()`) et l'écrit dans `reperes.json`. L'étape 2 y pose
ses pastilles. Une annotation placée à la main serait à refaire au moindre déplacement d'un
élément — et personne ne remarquerait qu'elle désigne désormais autre chose.

**Le navigateur complet, pas le « headless shell ».** Playwright lance par défaut une
version allégée de Chromium, dépourvue de traductions : le bouton d'un champ de fichier
s'affichait « Choose File / No file chosen » au milieu d'une interface française. D'où
`channel: 'chromium'` à l'étape 1.

---

## Ce que le document contient, et ce qu'il ne contient pas

**Il contient** : la numérotation continue des figures, une légende sous chaque image, un
renvoi dans le texte, la liste numérotée des annotations, et une table des figures.

**Il ne contient pas** : les transitions entre sections, l'argumentation, les renvois aux
autres chapitres. C'est une **base de travail**, pas un chapitre fini — le script fait la
partie mécanique, celle qu'on rate quand on la refait vingt fois.

---

## Si une capture échoue

Le script le dit et poursuit. Causes fréquentes :

| Message | Cause |
|---|---|
| `Connexion impossible pour <rôle>` | l'application n'est pas démarrée, ou le compte de `ecrans.json` n'existe plus |
| `repère introuvable : …` | le sélecteur ne correspond plus — l'interface a changé |
| `ÉCHEC <nom> : Timeout` | la page met trop de temps ; ajoutez un `attendre` |
| `⚠ REFUS DÉTECTÉ` | la page a répondu, mais affiche un refus au lieu du contenu attendu — mauvais rôle, ou identifiant d'un autre utilisateur |

Le dernier mérite une explication : une capture peut **réussir tout en photographiant un
refus**. C'est arrivé — le profil d'un étudiant demandé avec l'identifiant d'un autre
affichait « vous ne pouvez consulter que votre propre profil », et l'image serait partie
telle quelle dans le mémoire. Le script cherche donc les formulations d'échec de
l'application et les récapitule en fin d'exécution.

Un écran sans repère n'est pas annoté : son image d'origine sert telle quelle dans le
document.
