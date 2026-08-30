# `corpus/` — le jeu de CV de référence

```bash
node scripts/corpus/generer-cv-test.js
```

Engendre **38 CV en PDF** dans `cv-test/`, plus `verite.json` : le fichier qui dit, pour
chacun, ce qu'il contient.

---

## Pourquoi engendrer plutôt que télécharger

Les générateurs existants produisent des CV en anglais, en PDF natif uniquement, et sans
rapport avec notre référentiel de compétences.

Mais l'argument décisif est ailleurs. **Les CV sont fabriqués à partir des profils réels de
la base** : on sait donc exactement quelles compétences chacun contient, puisqu'on les y a
écrites. C'est une **vérité terrain exacte**, impossible à obtenir sur des CV réels sans
annotation manuelle.

---

## Ce que `verite.json` contient, et pourquoi les deux listes comptent

Pour chaque CV :

| Champ | Sert à mesurer |
|---|---|
| `competencesAttendues` | le **rappel** — en a-t-on manqué ? |
| `termesParasites` | la **précision** — en a-t-on inventé ? |

La seconde liste est la moins évidente et la plus importante. Un CV réel ne contient pas que
des compétences : loisirs, qualités personnelles, logiciels hors référentiel,
certifications. Ces termes sont **délibérément présents** et consignés. Sans eux, on ne
mesurerait que le rappel — et un extracteur qui retiendrait tout obtiendrait un score
parfait.

Le corpus en compte environ 490.

---

## Ce qui rend le corpus exigeant

1. **Quatre maquettes** — colonne unique, deux colonnes avec bandeau latéral, en-tête coloré
   pleine largeur, format compact. Un pipeline calibré sur une seule mise en page
   échouerait.
2. **Trois natures de PDF** — natif, numérisé (image dégradée, OCR requis), et **mixte**
   (une page native suivie d'une page numérisée). Le cas mixte impose un routage page par
   page : une décision prise au niveau du document se trompe forcément.
3. **Un emplacement photo**, comme sur la plupart des CV réels — une zone graphique que
   l'extraction doit ignorer.
4. **Du contenu qui remplit la page** — baccalauréat, langues, expériences complémentaires.
   Les profils de la base comportent peu d'éléments ; sans cet étoffement, le contenu se
   tassait dans la moitié haute et ne ressemblait à aucun CV.

Les primitives de dessin sont **partagées** entre le rendu PDF et le rendu image : un CV
numérisé est donc bien le scan de son équivalent natif, et non une mise en page différente.

---

## Ce qu'il faut savoir avant de relancer

> **Régénérer change les chiffres du mémoire.** Les maquettes, les palettes et le contenu
> parasite sont tirés au hasard. Le corpus qui suit n'est pas celui qui précède.

Après une régénération, il faut :

```bash
node scripts/base/seed-candidatures.mjs     # réattribuer les CV aux étudiants
node scripts/mesures/test-ingestion-cv.mjs  # remesurer
```

puis mettre à jour [MD/5](../../MD/5%20-%20INGESTION-CV.md) si les valeurs ont bougé. Les
chiffres actuellement publiés sont : routage **38/38**, précision **98,2 %**, rappel
**95,2 %**.

Le générateur lit la base : un étudiant supprimé disparaît du corpus, un étudiant ajouté y
entre. C'est pourquoi le nettoyage de la base a fait passer le corpus de 41 à 38 CV.

---

## Détail utile

Le corpus consigne aussi, pour chaque CV, sa **nature** (`natif`, `scanne`, `mixte`) et sa
**maquette**. Le script de mesure s'en sert pour ventiler les résultats — c'est ainsi qu'on
a pu établir que l'OCR coûte une dizaine de points de rappel, et rien en précision.
