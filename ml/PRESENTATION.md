# Présentation — Analyse des données, ML, tendances et anomalies (Farid)

Support de passage : ~4 minutes. Tous les chiffres cités viennent de
`data/samples/` et sont reproductibles avec `pytest ml/tests -q`.

---

## 1. Le rôle du moteur en une phrase

> « Le frontend collecte, le backend transporte, le moteur d'analyse est ce qui
> transforme des lignes de ventes en décisions. C'est la partie qui répond à la
> question : *qu'est-ce que ces données me disent sur mon commerce ?* »

Le moteur est un package Python appelé par le backend :
`ml.pipeline.analyze(dataset) -> dict`.

**Point d'architecture à souligner :** il ignore totalement la provenance des
données. Saisie manuelle, CSV ou Excel entrent dans le même schéma commun et
ressortent avec les mêmes indicateurs. C'est ce qui garantit qu'on ne raconte
pas deux vérités différentes selon la façon dont l'utilisateur a saisi.

---

## 2. Les cinq étapes

```
données brutes → nettoyage → indicateurs → tendances & anomalies → décisions
```

| Étape | Ce que ça produit |
| --- | --- |
| Nettoyage | un jeu de données exploitable, sans doublons ni trous |
| Indicateurs | CA, coût, bénéfice, marge, classements produits, stocks |
| Tendances | série journalière, comparaison de deux périodes |
| Anomalies | journées statistiquement atypiques |
| Décisions | alertes, insights et recommandations en français |

---

## 3. Ce que ça donne sur les données de démo

16 ventes, 5 produits, du 25 août au 8 septembre.

| Indicateur | Valeur |
| --- | --- |
| Chiffre d'affaires | 57 700 |
| Coût d'achat | 38 600 |
| Bénéfice | 19 100 |
| Marge | 33,1 % |
| Unités vendues | 84 |

**L'histoire à raconter — volume ≠ rentabilité.** C'est le meilleur argument de
la démo :

| Produit | Unités | CA | Bénéfice | Marge |
| --- | --- | --- | --- | --- |
| RIZ-5KG | 7 | 21 000 | **5 600** | 26,7 % |
| HUILE-1L | 12 | 17 500 | 5 500 | 31,4 % |
| EAU-15L | **35** | 10 500 | 4 200 | 40,0 % |
| PAIN | 22 | 5 500 | 2 200 | 40,0 % |
| SAVON | 8 | 3 200 | 1 600 | 50,0 % |

> « L'eau est de loin le produit le plus vendu : 35 unités, plus que tous les
> autres. Mais elle n'arrive qu'en troisième position sur le bénéfice. Le riz,
> avec 7 unités seulement, rapporte le plus. Un commerçant qui regarde ses
> ventes voit l'eau ; BizIA lui montre le riz. C'est exactement l'écart entre
> avoir des données et les comprendre. »

---

## 4. Le nettoyage, socle de tout le reste

À montrer si on a le temps, ou à garder pour les questions. Sur un fichier
volontairement dégradé (doublons de réimport, SKU vide, quantité à zéro,
produit inconnu, prix manquant, date « hier ») :

```
entrée : 6 produits, 23 ventes
sortie : 5 produits, 18 ventes
```

Ce qui a été fait, ligne par ligne :

- les 3 lignes réimportées à l'identique sont supprimées — sinon le CA est
  gonflé artificiellement ;
- la vente sans produit et celle à quantité zéro sont écartées ;
- `huile-1l` est reconnu comme `HUILE-1L` malgré la casse ;
- la vente au prix manquant est **rattrapée** avec le prix du catalogue plutôt
  que jetée : la donnée compte quand même dans le CA ;
- la date illisible est ramenée à la vente connue la plus récente ;
- la vente vers un produit inconnu est conservée mais **signalée** par une
  alerte, parce que c'est un problème de saisie que le commerçant doit voir.

> « Une règle de conception : on ne jette une ligne que si elle est
> inexploitable. Sinon on la répare et, si le doute subsiste, on le signale. »

Point important pour un doublon de produit : un réimport avec des colonnes
vides met à jour le prix sans effacer le nom, le coût ou le stock qu'on
connaissait déjà.

---

## 5. Tendances et comparaison de périodes

La série journalière couvre les 15 jours de bout en bout, **jours sans vente
inclus, à zéro**. C'est un choix : une journée creuse est une information, pas
un trou dans le graphique.

- meilleure journée : 26 août, 15 000 de CA ;
- plus faible : 3 septembre, 800.

Comparaison des deux dernières fenêtres de 7 jours :

| | Bénéfice |
| --- | --- |
| Période précédente | 9 940 |
| Période courante | 7 660 |
| Écart | **−2 280, soit −22,9 %** |

> « C'est la réponse à *pourquoi mon bénéfice a-t-il baissé cette semaine ?* Le
> moteur ne se contente pas d'un total : il compare deux périodes de même durée
> et chiffre l'écart. »

---

## 6. Anomalies

Méthode : **z-score sur le chiffre d'affaires journalier**. On mesure de
combien d'écarts-types une journée s'éloigne de la moyenne de la période.

À expliquer simplement :

> « La moyenne est de 3 847 par jour. Le 26 août, on est à 15 000, soit un peu
> plus de 3 écarts-types au-dessus. Statistiquement, une journée comme celle-là
> ne devrait presque jamais arriver — donc soit il s'est passé quelque chose de
> particulier, soit c'est une erreur de saisie. Dans les deux cas, l'utilisateur
> doit le savoir. »

Le seuil est à 2 écarts-types, avec une sévérité graduée : `high` au-delà de 3,
`medium` au-delà de 2,5. Il faut au minimum 4 journées d'historique, sinon on ne
retourne rien plutôt que de bruiter.

**Choix assumé à défendre :** pas de modèle entraîné pour le MVP. Avec 15 jours
de données, un `IsolationForest` ou un modèle saisonnier serait moins fiable
qu'un z-score, et surtout inexplicable à l'utilisateur. Un écart-type se
raconte en une phrase ; un modèle boîte noire ne se raconte pas.

---

## 7. De l'analyse à la décision

Le moteur ne s'arrête pas aux chiffres : il produit trois listes prêtes à
afficher. Sur les données de démo, 4 alertes, 6 insights et 4 recommandations.

- **Alertes** — stock faible sur le savon (3 en stock pour un seuil de 8),
  journée atypique, bénéfice en baisse.
- **Insights** — des phrases en français, pas des nombres bruts.
- **Recommandations** — priorisées, avec le *pourquoi* à côté du *quoi* :
  « Réapprovisionner en priorité : Savon de ménage, Huile végétale 1L » parce
  que « 2 produits sont au niveau ou en dessous de leur seuil d'alerte ».

> « Et c'est aussi ce qui fait tenir l'assistant IA : il puise dans ces
> résultats au lieu de recalculer dans son coin. Il n'invente aucun chiffre. »

Les cinq questions cibles du chatbot ont chacune leur clé dans la sortie :
bénéfice en baisse → `week_over_week`, produits à surveiller → `low_stock` et
`anomalies`, produit le plus rentable → `top_profit`, résumé → `insights`,
prochains achats → `recommendations`.

---

## 8. Prévision (option, à mentionner brièvement)

`analyze(dataset, include_forecast=True)` ajoute une projection par moyenne
mobile sur 7 jours : pour le 9 septembre, 3 314 de CA et 1 094 de bénéfice.

À cadrer honnêtement : « c'est une tendance, pas une prédiction. Avec deux
semaines d'historique, annoncer mieux serait malhonnête. » La clé est absente
par défaut pour ne pas modifier le contrat de sortie du reste de l'équipe.

---

## 9. Fiabilité

- 18 tests automatisés, dont une validation sur les fichiers de démo réels.
- Le même fichier en CSV (tout en texte) et en Excel (entiers typés) donne des
  résultats **identiques au centime**.
- `analyze` ne lève jamais d'exception : une entrée inexploitable retourne la
  forme vide plus une alerte `no_data`. Le dashboard ne peut pas planter à
  cause du moteur.

---

## 10. Questions probables

**Pourquoi pas de vrai machine learning ?**
Il y en a — la détection d'anomalies est de la statistique inférentielle, et
c'est le bon outil à cette échelle de données. Un modèle entraîné sur 15 jours
d'historique surapprendrait. L'architecture est prête pour l'ajouter : le
module `anomaly_detection` est isolé derrière une fonction, on remplace
l'implémentation sans toucher au reste.

**Que se passe-t-il si l'utilisateur n'a aucun historique ?**
Sortie vide plus une alerte qui l'invite à saisir ou importer des données.
Aucune erreur, aucun écran cassé.

**Comment savez-vous que les chiffres sont justes ?**
Les totaux des données de démo sont vérifiés à la main dans les tests : 57 700
de CA, 38 600 de coût, 19 100 de bénéfice. Si une modification casse un calcul,
le test échoue.

**Et si deux personnes importent le même fichier ?**
Les doublons exacts datés sont détectés et supprimés avant tout calcul.

---

## Enchaînement avec les autres

- **Avant moi (Uriel)** : le backend normalise et m'envoie le schéma commun.
- **Après moi (Imma)** : le dashboard affiche `kpis`, `trend`, `alerts`.
- **Autour (Bienv)** : la garantie que manuel et import passent par le même
  pipeline — testée et vérifiée.
