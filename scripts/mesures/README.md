# `mesures/` — ce qui produit les chiffres du mémoire

Ces scripts **ne modifient rien**. Ils lisent la base et le corpus, et impriment des
mesures.

Ils servent aussi de **tests de non-régression** : les valeurs attendues sont connues, et
tout écart signale que quelque chose a changé — dans le code, dans les données, ou dans le
corpus.

```bash
node scripts/mesures/test-ingestion-cv.mjs
node scripts/mesures/evaluer-recommandations.mjs
node scripts/mesures/test-ingestion-bout-en-bout.mjs   # exige l'application démarrée
```

---

## `test-ingestion-cv.mjs` — la lecture des CV

Rejoue le pipeline complet sur les 38 CV du corpus, et compare à la vérité terrain.

**Valeurs attendues :**

```
routage de la nature du PDF : 38/38
confiance OCR moyenne       : 91,6 % sur 22 CV
précision 98,2 %   rappel 95,2 %   F1 96,7 %
```

Les deux listes de `verite.json` donnent deux mesures distinctes : les compétences attendues
donnent le **rappel**, les termes parasites la **précision**. Un extracteur qui retiendrait
tout obtiendrait un rappel parfait — c'est la précision qui l'en empêche.

La ventilation par nature de PDF est la partie instructive : elle montre que l'OCR coûte une
dizaine de points de rappel et **rien** en précision. Le pipeline préfère taire une
compétence qu'en inventer une.

Options : `--detail` affiche, CV par CV, ce qui a été trouvé, manqué et inventé.

---

## `evaluer-recommandations.mjs` — le moteur de co-occurrence

La mesure centrale du mémoire, et celle dont le résultat est **en partie négatif**.

**Le problème qu'il fallait contourner.** Le plan prévoyait de tirer la vérité terrain de
l'historique des candidatures. Cet historique n'existe pas. Et le fabriquer aurait été pire
que rien : engendré avec notre propre fonction de score, on mesurerait le score contre
lui-même ; tiré au hasard, il ne dirait rien.

**Le protocole retenu : l'ablation.** La pertinence est définie sur le profil complet, par
correspondance **exacte** — donc favorable à la baseline. On retire ensuite une compétence
du profil et l'on demande aux deux systèmes de retrouver le classement.

Quatre protocoles :

| | Ce qu'il mesure |
|---|---|
| **A** | l'effet sur le classement complet |
| **B** | idem, matrice apprise **hors** des offres évaluées — contrôle anti-fuite |
| **C** | restreint aux offres que l'ablation rend inatteignables |
| **D** | classement sur la **seule** composante compétences |

Plus une analyse de sensibilité au poids des compétences.

**Valeurs attendues** — protocole D, celui qui isole le mécanisme :

```
Précision@1   9,9 %  ->  22,2 %   (+12,3 pt)
MRR          0,395   ->   0,442
```

Et protocole A, sur le score complet : effet **nul à légèrement négatif**. C'est le résultat
honnête : le mécanisme fait ce pour quoi il a été conçu, mais son gain ne survit pas à
l'intégration dans un score où les compétences pèsent 40 %.

L'A/B porte sur **le code de production** : `scoreCompetence()` accepte un paramètre
`matrice` optionnel. `null` donne la correspondance exacte, la matrice donne la
co-occurrence. Aucune réimplémentation, donc aucun risque de baseline de paille.

Voir [MD/6](../../MD/6%20-%20EVALUATION.md) pour l'interprétation complète et les limites.

---

## `test-ingestion-bout-en-bout.mjs` — la chaîne réelle

**Exige l'application démarrée** sur `http://localhost:3000`.

Dépose un CV numérisé par HTTP, l'analyse, relit les détections, confirme les compétences,
et vérifie les contrôles d'accès.

**Pourquoi ce script existe alors que les deux autres mesurent déjà.** Parce que mesurer
l'algorithme ne mesure pas le système. Deux défauts n'étaient visibles que par ce chemin :

- le worker de pdfjs, absent du paquet serveur de Next — toutes les mesures en ligne de
  commande passaient, l'application échouait ;
- un paramètre SQL à deux types déduits.

Il crée un compte de test et le supprime en fin d'exécution.

---

## `test-cooccurrence.mjs` — inspecter la matrice

Sans valeur attendue : c'est un outil d'observation. Il affiche la densité du corpus et,
pour quelques compétences, celles que le moteur juge proches — sans qu'on les ait jamais
déclarées telles.

C'est ce script qui a rendu visibles les trois échecs successifs du moteur : « Génie civil
proche de Génie textile » sur des vecteurs trop creux, « Git proche de SQL » par confusion
entre complémentarité et substituabilité, et Vue.js sans aucun contexte.

---

## Si les chiffres ne correspondent plus

Dans l'ordre de vraisemblance :

1. **Le corpus a été régénéré.** C'est la cause la plus fréquente : les CV sont tirés au
   hasard, un nouveau corpus donne d'autres chiffres. Voir
   [`../corpus/`](../corpus/README.md).
2. **La base a changé.** Ajouter ou retirer des étudiants modifie la matrice de
   co-occurrence — retirer trois étudiants sur quarante et un déplaçait les métriques d'un
   point.
3. **Le code a changé.** C'est alors une régression, et c'est précisément ce que ces scripts
   servent à détecter.

Dans les deux premiers cas, mettez à jour [MD/5](../../MD/5%20-%20INGESTION-CV.md) et
[MD/6](../../MD/6%20-%20EVALUATION.md) : un document qui annonce des chiffres que les
scripts ne reproduisent plus est pire qu'un document sans chiffres.
