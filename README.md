# BizIA

**Les données deviennent des décisions.**

BizIA est un analyste de données IA autonome pour les PME. Il transforme des fichiers dispersés (PDF, Excel, CSV, documents) en analyses, prédictions et décisions concrètes.

## Objectif

Les PME ont souvent beaucoup de données — ventes, stocks, dépenses, clients, fournisseurs, trésorerie — mais elles restent difficiles à exploiter. BizIA automatise :

- l’import et la compréhension des documents ;
- le nettoyage et la structuration ;
- la détection d’anomalies et de tendances ;
- les prédictions ;
- les visualisations et rapports ;
- le dialogue avec les données via un chatbot.

## Organisation du dépôt

Le projet est découpé **par fonctionnalités métier**, pas par couches front / back.

Chaque équipe (ou personne) prend une feature, travaille **dans son dossier**, et s’appuie sur `shared/` pour les contrats communs.

```
docs/                 Vision produit et conventions
features/             Une feature = un dossier autonome
shared/               Contrats, types et règles partagés
```

Les features prévues au démarrage :

| Dossier | Rôle |
| --- | --- |
| `features/ingestion` | Import PDF, Excel, CSV, documents |
| `features/structuration` | Nettoyage et mise en forme des données |
| `features/anomalies` | Détection d’écarts et d’alertes |
| `features/tendances` | Identification des évolutions |
| `features/predictions` | Anticipation des évolutions |
| `features/visualisations` | Graphiques et restitutions visuelles |
| `features/rapports` | Rapports exploitables |
| `features/chatbot` | Dialogue avec les données |
| `features/decisions` | Recommandations actionnables |

Comment contribuer : voir [docs/conventions.md](docs/conventions.md).
Vision produit : voir [docs/vision.md](docs/vision.md).
