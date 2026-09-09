# Conventions de contribution

## Principe

Une feature = un dossier sous `features/`.  
Chacun implémente **sa** feature dans ce dossier. On n’organise pas le dépôt en applications `frontend/` / `backend/`.

## Où mettre le code

| Emplacement | Contenu |
| --- | --- |
| `features/<nom>/` | Tout le travail de la feature (logique, tests, notes, artefacts de la feature) |
| `shared/` | Uniquement ce qui est réellement partagé entre plusieurs features (contrats, types, règles) |
| `docs/` | Documentation produit et règles d’équipe |

Ne pas ajouter de skeleton front ou back à la racine. Quand une feature aura besoin d’une API ou d’écrans, cela se fera **dans** le dossier de la feature, ou via un contrat décrit dans `shared/`.

## Démarrer une feature

1. Lire `features/<nom>/README.md` (périmètre et hors-périmètre).
2. Travailler uniquement dans ce dossier, plus `shared/` si un contrat commun est nécessaire.
3. Documenter dans le README de la feature les choix qui impactent les autres (formats d’entrée / sortie).

## Contrats entre features

Les échanges passent par des **contrats** (fichiers de description dans `shared/contrats/` quand ils existent), pas par des imports croisés entre features.

Flux cible (ordre logique, pas d’implémentation imposée) :

```
ingestion → structuration → (anomalies | tendances | predictions)
                         → visualisations | rapports | chatbot | decisions
```

## Branches

Une branche par feature, nommée de façon explicite, par exemple `feat/ingestion`.
