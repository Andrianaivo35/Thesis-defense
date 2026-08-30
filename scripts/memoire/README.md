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
| 3 | `ecrans.json` et les images | `chapitre3/Chapitre3.docx` |

---

## Modifier le chapitre sans toucher au code

Tout se règle dans **`ecrans.json`**.

### Ajouter un écran

```json
{
  "role": "etudiant",
  "chemin": "/pages/etudiantProfil/33",
  "fichier": "etudiant-profil",
  "titre": "Profil de l'étudiant",
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

Un écran sans repère n'est pas annoté : son image d'origine sert telle quelle dans le
document.
