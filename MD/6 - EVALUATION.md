# Évaluation — ce que les mesures établissent, et ce qu'elles n'établissent pas

> Documentation du Lot 5.5. Troisième et dernier volet du cœur du mémoire, après le
> [moteur de co-occurrence](4%20-%20MOTEUR-COOCCURRENCE.md) et
> [l'ingestion de CV](5%20-%20INGESTION-CV.md).
>
> **Ce chapitre rapporte un résultat majoritairement négatif.** C'est délibéré : la
> mesure a été conçue pour pouvoir infirmer, et elle a partiellement infirmé.

---

## 1. Il n'y avait pas de vérité terrain

Le plan prévoyait de tirer la vérité terrain de l'historique des candidatures — qui a
postulé où, qui a été retenu. **Cet historique n'existe pas : la table `Candidature` est
vide.** Aucun script de peuplement n'en crée.

Deux fausses solutions ont été écartées :

| Fausse solution | Pourquoi elle ne vaut rien |
|---|---|
| Engendrer des candidatures avec notre fonction de score | On mesurerait le score contre lui-même. Le résultat est garanti d'avance ; il ne démontre rien. |
| Tirer des candidatures au hasard | Elles ne portent aucun signal. Toute métrique calculée dessus est du bruit habillé en chiffre. |

Fabriquer la vérité terrain qu'on souhaite mesurer est la façon la plus sûre d'obtenir un
beau tableau qui ne dit rien.

> **Note ajoutée après coup.** La table `Candidature` a depuis été peuplée
> ([scripts/seed-candidatures.mjs](../scripts/seed-candidatures.mjs)), pour que la boucle
> fonctionnelle soit démontrable — tableau de bord entreprise, suivi des candidatures,
> historique des QCM.
>
> **Ces données ne changent rien à ce chapitre et ne doivent pas y être injectées.** Les
> issues y sont engendrées par un modèle de comportement écrit à la main, dont les
> hypothèses recoupent celles du moteur de recommandation. S'en servir comme vérité terrain
> reviendrait exactement à la première fausse solution du tableau ci-dessus. Le protocole
> reste l'ablation.
>
> Vérifié : le peuplement n'a modifié aucun des chiffres rapportés ci-dessous.

## 2. Le protocole retenu : l'ablation

On s'appuie sur ce que la base contient réellement — les compétences déclarées — et sur une
définition de la pertinence qui n'emprunte **rien** au modèle évalué :

> Une offre est **pertinente** pour un étudiant s'il possède toutes ses compétences
> **obligatoires**, au sens strict de l'égalité d'identifiant.

C'est de la correspondance exacte. La définition **favorise donc la baseline** : tout gain
mesuré pour la co-occurrence sera conservateur.

On **dégrade** ensuite le profil en retirant une compétence, et l'on demande aux deux
systèmes de retrouver le classement d'origine :

- la **baseline** ne peut plus voir l'offre : la compétence exigée a disparu du profil ;
- la **co-occurrence** peut la retrouver, si le corpus lui a appris qu'une compétence
  restante en est proche.

C'est la situation réelle : un profil incomplet est le cas normal, pas l'exception.

L'A/B porte sur **le code de production lui-même** : `scoreCompetence()` accepte un
paramètre `matrice` optionnel. `null` donne la correspondance exacte, la matrice donne la
co-occurrence. Aucune réimplémentation, donc aucun risque de baseline de paille.

### Contre la fuite

La matrice apprend des offres **et** des profils étudiants — elle voit donc le profil
qu'on s'apprête à évaluer. `construireMatrice()` a reçu un paramètre `contextesExclus`,
réservé à l'évaluation et jamais utilisé en production, qui permet de la reconstruire sans
un contexte donné.

| Protocole | Univers | Matrice apprise sans |
|---|---|---|
| **A** | les 67 offres | le profil de l'étudiant évalué |
| **B** | 33 offres de test | le profil **et** les 33 offres évaluées |
| **C** | les 67 offres, pertinence restreinte | le profil de l'étudiant évalué |
| **D** | les 67 offres, score compétences seul | le profil de l'étudiant évalué |

**B** est le contrôle sévère : aucune des offres classées n'a servi à l'apprentissage.

---

## 3. Résultats

### 3.1 Protocole A — effet global

*34 étudiants, 116 ablations, 67 offres classées.*

| Métrique | Baseline | Co-occurrence | Écart |
|---|---|---|---|
| Précision@5 | 37,1 % | 33,3 % | **−3,8 pt** |
| Rappel@5 | 84,6 % | 79,4 % | **−5,2 pt** |
| NDCG@5 | 84,3 % | 79,9 % | **−4,4 pt** |
| MRR | 0,897 | 0,887 | −0,010 |

**La co-occurrence dégrade légèrement le classement global.**

### 3.2 Protocole B — anti-fuite

*20 étudiants, 67 ablations, 33 offres jamais vues à l'apprentissage.*

| Métrique | Baseline | Co-occurrence | Écart |
|---|---|---|---|
| Précision@1 | 88,1 % | 91,0 % | +3,0 pt |
| NDCG@5 | 90,5 % | 90,6 % | = |
| MRR | 0,930 | 0,937 | +0,007 |

Effet **nul à très légèrement positif**. Le résultat de A n'est donc pas un artefact de
mémorisation — mais il n'y a pas non plus de gain à revendiquer.

### 3.3 Protocole D — le mécanisme isolé

Les compétences ne pèsent que **40 %** du score. Les 60 % restants — filière, niveau,
localisation, préférences — sont **identiques dans les deux bras** et classent déjà
correctement une bonne part des offres. L'effet du mécanisme y est dilué.

D classe sur la **seule** composante compétences, la seule que la matrice influence, et
restreint la pertinence aux offres que l'ablation vient de rendre inatteignables.

*34 étudiants, 83 ablations.*

| Métrique | Baseline | Co-occurrence | Écart |
|---|---|---|---|
| **Précision@1** | 9,6 % | **22,9 %** | **+13,3 pt** |
| **NDCG@1** | 9,6 % | **22,9 %** | **+13,3 pt** |
| NDCG@5 | 42,9 % | 45,8 % | +3,0 pt |
| NDCG@10 | 50,1 % | 52,3 % | +2,2 pt |
| **MRR** | 0,396 | **0,449** | **+0,054** (+13 % relatif) |
| Rappel@3 | 52,2 % | 48,3 % | −3,9 pt |

**Le mécanisme fonctionne.** Quand la compétence exigée disparaît du profil, la
co-occurrence remonte l'offre en tête plus de deux fois plus souvent que la correspondance
exacte. Le rappel@3 en léger recul indique la contrepartie : elle place mieux ce qu'elle
trouve, au prix d'un peu d'étendue.

### 3.4 Sensibilité au poids des compétences

NDCG@5 ciblé, en faisant varier le seul poids des compétences :

| Poids | Baseline | Co-occurrence | Écart |
|---|---|---|---|
| 40 % *(en vigueur)* | 68,6 % | 68,6 % | +0,1 pt |
| 55 % | 66,9 % | 66,2 % | −0,8 pt |
| 70 % | 58,3 % | 59,6 % | +1,2 pt |
| 85 % | 52,7 % | 51,5 % | −1,2 pt |
| 100 % | 42,9 % | 45,8 % | +3,0 pt |

**Cette courbe n'est pas monotone.** Les points intermédiaires alternent de signe : c'est du
bruit, pas une tendance. Il serait malhonnête d'en conclure « il suffit de relever le poids
des compétences ». Ce que la courbe montre, c'est seulement que le gain n'apparaît qu'à
l'extrême, quand les compétences décident seules.

---

## 4. Conclusion

La phrase que le plan espérait pouvoir prononcer en soutenance était :

> *« nous avons remplacé une correspondance exacte par une structure de similarité apprise
> du corpus lui-même, et nous avons mesuré le gain. »*

**La mesure ne permet pas de la prononcer telle quelle.** Ce qu'elle permet de dire :

1. **Le mécanisme fait ce pour quoi il a été conçu.** Isolé, il double la précision au
   premier rang (9,6 % → 22,9 %) et améliore le rang réciproque moyen de 13 % relatifs sur
   la population qu'il vise.

2. **Ce gain ne survit pas à l'intégration.** Dans le score complet, au poids en vigueur,
   l'effet est nul (B) à légèrement négatif (A). Les quatre autres composantes suffisent
   déjà à classer, et absorbent l'apport.

3. **Il n'est pas un artefact de mémorisation** : le protocole anti-fuite ne l'annule pas.

4. **Le corpus est trop petit pour trancher plus finement.** 67 offres, 41 étudiants,
   86 paires pertinentes. La non-monotonie de la courbe de sensibilité le montre
   directement.

C'est un résultat exploitable en soutenance, et défendable : *une contribution
algorithmique réelle et mesurée, dont l'intégration dans un score composite annule l'effet.*
La question qu'il ouvre — comment intégrer un signal appris à côté de critères
administratifs — est plus intéressante que le gain qu'on espérait annoncer.

> ⚠️ **Ce qu'il ne faut surtout pas faire :** régler les poids sur ces mesures pour obtenir
> un chiffre favorable. Ce serait ajuster les paramètres sur le jeu d'essai, et le résultat
> ne vaudrait rien. Les poids en vigueur n'ont pas été modifiés.

---

## 5. Qualité de l'extraction de CV

Mesurée séparément, sur les 41 CV du corpus de vérité terrain — voir
[5 - INGESTION-CV.md](5%20-%20INGESTION-CV.md) pour le détail.

| | |
|---|---|
| Routage de la nature du PDF | **41/41** |
| Recours à l'OCR | 24 CV sur 41 (**59 %**) |
| Confiance OCR moyenne | 91,5 % |
| Précision de l'extraction | **98,8 %** |
| Rappel de l'extraction | **96,0 %** |
| F1 | **97,4 %** |

Contrairement au volet recommandation, **ce volet-là est un succès net**. La différence
tient à la vérité terrain : celle de l'extraction est exacte par construction (on a écrit
les CV), celle de la recommandation est un proxy.

---

## 6. Limites

| Limite | Conséquence |
|---|---|
| **Pas d'historique de candidatures** | La pertinence est un proxy calculé, pas un jugement humain observé. C'est la limite principale. |
| **La pertinence est de la correspondance exacte** | Elle pénalise structurellement tout lissage. La co-occurrence est jugée par le critère que précisément elle prétend dépasser. |
| **Corpus de 67 offres / 41 étudiants** | Les écarts sous 2 points ne sont pas interprétables. La courbe de sensibilité le démontre. |
| **86 paires pertinentes seulement** | Une poignée d'étudiants pèse lourd dans les moyennes. |
| **Ablation d'une seule compétence** | Un profil réel peut en manquer plusieurs ; l'effet n'est pas mesuré à ce régime. |
| **Aucun test de significativité** | Avec ces effectifs, il ne serait pas concluant. Ne pas présenter les écarts comme des résultats statistiques. |

## 7. Perspectives

- **Journaliser les recommandations servies et les candidatures effectives.** C'est le seul
  chemin vers une vraie vérité terrain. Quelques mois d'usage réel valent mieux que
  n'importe quel protocole synthétique.
- **Faire annoter un échantillon** par des enseignants ou des recruteurs : une vérité
  terrain humaine, même sur 200 paires, changerait la nature des conclusions.
- **Repenser l'intégration du signal appris** plutôt que son poids : par exemple l'exposer
  comme une liste distincte (« offres proches de votre profil ») au lieu de le noyer dans
  un score unique.
- **Élargir le corpus** avant toute nouvelle mesure comparative.

---

## 8. Reproduire

```bash
node scripts/evaluer-recommandations.mjs            # A, B, C, D + sensibilité
node scripts/evaluer-recommandations.mjs --detail   # ablations où le NDCG diffère
node scripts/test-ingestion-cv.mjs                  # extraction : précision / rappel / F1
```

| Fichier | Rôle |
|---|---|
| [scripts/evaluer-recommandations.mjs](../scripts/evaluer-recommandations.mjs) | les quatre protocoles et l'analyse de sensibilité |
| [src/lib/cooccurrence.js](../src/lib/cooccurrence.js) | `construireMatrice(client, contextesExclus)` |
| [src/lib/appariement.js](../src/lib/appariement.js) | `evaluerCouple({ …, matrice })` — le paramètre qui porte l'A/B |
