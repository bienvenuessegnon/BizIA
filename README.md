# 🧠 BizIA

**Transformez vos données en décisions intelligentes.**

BizIA est un analyste de données IA autonome qui transforme les données brutes des entreprises en insights, prédictions et recommandations directement exploitables.

> BizIA : les données deviennent des décisions.

## Organisation du dépôt

Le travail est réparti par **couche** (front / back) et par **feature métier**.

| Dossier | Qui | Rôle |
| --- | --- | --- |
| [`frontend/`](frontend/README.md) | équipe frontend | Dashboard, chat, visualisations |
| [`backend/`](backend/README.md) | équipe backend / data / ML / IA | API, ingestion, analyse, LLM |
| [`features/`](features/README.md) | tout le monde | Périmètre métier de chaque capacité |
| [`shared/`](shared/README.md) | tout le monde | Contrats d’échange (schémas, API) |
| [`docs/`](docs/) | tout le monde | Vision et conventions |

Chacun prend **son dossier** (`frontend/` ou `backend/`) et s’appuie sur `features/` pour le périmètre.

Conventions : [docs/conventions.md](docs/conventions.md).

---

## 🚀 Le problème

Les entreprises disposent de plus en plus de données :

- 📊 Ventes
- 📦 Stocks
- 💰 Dépenses et trésorerie
- 👥 Clients
- 🤝 Fournisseurs
- 📈 Performances commerciales
- 📄 Documents et fichiers métiers

Mais ces données sont souvent dispersées, difficiles à analyser et sous-exploitées.

Une PME peut avoir des centaines de lignes dans un fichier Excel sans savoir :

- Pourquoi mes ventes baissent-elles ?
- Quels produits risquent d’être en rupture ?
- Quelles anomalies dois-je surveiller ?
- Quelle tendance se dessine ?
- Que dois-je faire maintenant ?

Le problème n’est donc pas le manque de données.

**Le problème, c’est le fossé entre les données et la décision.**

---

## 💡 Notre solution

BizIA transforme automatiquement les données d’une entreprise en intelligence actionnable.

L’utilisateur importe simplement ses fichiers :

**PDF** · **Excel** · **CSV** · **Documents**

BizIA les comprend, les structure et les analyse grâce à l’IA et au machine learning.

La plateforme peut ensuite :

**Comprendre → Nettoyer → Analyser → Détecter → Prédire → Recommander → Expliquer**

L’objectif n’est pas seulement de produire des graphiques.

BizIA répond à la question la plus importante :

> Maintenant que je sais ce qui se passe, qu’est-ce que je dois faire ?

---

## 🎯 La promesse

De la donnée brute…

Excel · CSV · PDF · Documents

↓

…à une décision.

```
        BIZIA
          ↓
   Compréhension
          ↓
       Analyse
          ↓
     Détection
          ↓
     Prédiction
          ↓
   Recommandation
          ↓
      Décision
```

---

## ✨ Fonctionnalités

### 📥 1. Import intelligent des données

Importez vos données sans les préparer manuellement.

Formats pris en charge :

- CSV
- Excel
- PDF
- Documents

Le système identifie automatiquement les structures et informations pertinentes afin de préparer les données pour l’analyse.

→ `features/ingestion` · implémentation `backend/` + écran d’import `frontend/`

### 🧹 2. Nettoyage et préparation automatique

Avant toute analyse, BizIA identifie les problèmes présents dans les données :

- valeurs manquantes
- doublons
- incohérences
- formats incorrects
- colonnes inutilisables
- données aberrantes

L’objectif est de réduire au maximum le travail manuel nécessaire avant l’analyse.

→ `features/structuration`

### 🔎 3. Analyse automatique

BizIA analyse les données afin d’identifier :

- tendances
- variations
- corrélations
- performances
- anomalies
- indicateurs clés
- évolutions importantes

L’utilisateur n’a pas besoin de construire manuellement chaque analyse.

→ `features/analyse` · `features/tendances`

### 🚨 4. Détection des anomalies

BizIA surveille les données pour identifier des comportements inhabituels.

Exemples :

- Une augmentation inhabituelle des dépenses
- Une baisse anormale des ventes
- Un produit dont les performances changent brutalement
- Une valeur qui s’écarte fortement du comportement habituel

Chaque anomalie peut être accompagnée d’une explication.

→ `features/anomalies`

### 🔮 5. Prédictions

Grâce au machine learning, BizIA exploite les données historiques afin d’estimer certaines évolutions futures :

- prévision des ventes
- évolution de la demande
- risque de rupture de stock
- tendances financières
- évolution des performances

Les prédictions sont présentées de manière compréhensible pour anticiper plutôt que réagir.

→ `features/predictions`

### 🤖 6. Recommandations intelligentes

La plateforme ne s’arrête pas à « voici ce que montrent vos données ».

Elle cherche aussi à répondre : **voici ce que vous pourriez faire.**

Les recommandations peuvent inclure :

- la raison
- les données qui la justifient
- le niveau de priorité
- l’impact potentiel estimé

**Exemple**

Risque identifié : les ventes du produit X diminuent depuis 4 semaines.

Recommandation : réduire temporairement le réapprovisionnement et analyser les performances du produit.

Impact potentiel : réduction du risque de surstock.

→ `features/decisions`

### 💬 7. Chat avec les données

Interface conversationnelle pour dialoguer directement avec les données, par exemple :

- Quelles sont mes meilleures ventes ?
- Pourquoi mon chiffre d’affaires a-t-il baissé ?
- Montre-moi les produits à risque.
- Quelle est la tendance pour le mois prochain ?
- Explique-moi cette anomalie.
- Génère-moi un rapport.

→ `features/chatbot` · UI `frontend/` · moteur `backend/`

### 📊 8. Visualisations automatiques

Visualisations adaptées aux données et aux analyses :

- graphiques d’évolution
- comparaisons
- distributions
- tendances
- indicateurs clés
- anomalies
- prévisions

→ `features/visualisations` · rendu `frontend/`

### 📄 9. Génération de rapports

Livrables exploitables contenant :

- résumé exécutif
- KPI
- analyses
- graphiques
- anomalies détectées
- prédictions
- recommandations

L’analyse devient un livrable décisionnel, pas seulement un écran.

→ `features/rapports`

---

## 🧩 Architecture du produit

```
                    ┌──────────────────────┐
                    │       UTILISATEUR    │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │     BIZIA FRONTEND   │
                    │   Dashboard + Chat   │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      API / BACKEND   │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       ┌───────────┐     ┌────────────┐    ┌────────────┐
       │ Ingestion │     │ Data       │    │ AI / LLM   │
       │ des       │     │ Analysis   │    │ Engine     │
       │ fichiers  │     │ + ML       │    │            │
       └─────┬─────┘     └─────┬──────┘    └─────┬──────┘
             │                 │                  │
             └─────────────────┼──────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │ Intelligence        │
                    │ décisionnelle       │
                    └──────────┬───────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
           Charts            Alerts           Actions
             │                 │                 │
             └─────────────────┼─────────────────┘
                               ▼
                    Rapport décisionnel
```

---

## 🛠️ Stack technique

La stack exacte peut évoluer pendant le développement du prototype.

**Frontend** (`frontend/`)

- React / Next.js
- TypeScript
- Interface dashboard moderne
- Data visualization
- Chat interface

**Backend** (`backend/`)

- Python
- FastAPI
- APIs REST
- Traitement et orchestration des données

**Data & Machine Learning**

- Pandas
- NumPy
- Scikit-learn
- Algorithmes de détection d’anomalies
- Modèles de prévision

**IA**

- LLM
- NLP
- RAG / contextualisation des données
- Génération d’insights
- Agentic workflows

**Data ingestion**

- CSV
- Excel
- PDF
- Documents

---

## 🧠 Une approche « AI-first »

BizIA ne considère pas l’IA comme un simple chatbot ajouté à un dashboard.

L’IA intervient dans toute la chaîne de valeur :

Données → Compréhension → Nettoyage → Analyse → Détection → Prédiction → Interprétation → Recommandation → Action

Le chatbot est la porte d’entrée vers un moteur d’intelligence décisionnelle.

---

## 🏆 Pourquoi BizIA ?

Il existe déjà de nombreux outils pour visualiser des données, construire des dashboards, faire du reporting ou utiliser des assistants IA.

BizIA rapproche ces capacités autour d’un même objectif : **passer du reporting à la décision.**

| Approche traditionnelle | BizIA |
| --- | --- |
| Données dispersées | Données centralisées |
| Analyse manuelle | Analyse automatisée |
| Dashboard passif | Intelligence proactive |
| L’utilisateur cherche les problèmes | BizIA détecte les problèmes |
| Graphiques | Graphiques + explications |
| Prévisions séparées | Prévisions intégrées |
| Analyse | Analyse + recommandation |
| Rapport | Rapport décisionnel |
| Questions techniques | Conversation naturelle |

---

## 👤 Exemple de parcours utilisateur

1. **Import** — l’utilisateur dépose son fichier Excel de ventes.
2. **Compréhension** — BizIA identifie produits, dates, quantités, prix, chiffre d’affaires.
3. **Analyse** — performances commerciales.
4. **Détection** — baisse inhabituelle sur une catégorie.
5. **Prédiction** — la tendance pourrait continuer.
6. **Recommandation** — une action, avec le pourquoi.
7. **Conversation** — « Pourquoi cette catégorie baisse-t-elle ? »
8. **Rapport** — livrable décisionnel partageable.

---

## 🌍 Vision

Rendre l’analyse de données avancée accessible aux entreprises qui n’ont pas nécessairement d’équipe data, de data analyst, de data scientist ou de ressources techniques importantes.

À terme, BizIA peut évoluer d’un analyste de données vers un **copilote décisionnel pour PME** : surveillance continue, anticipation des risques et opportunités, prochaines actions pertinentes.

Détail : [docs/vision.md](docs/vision.md).

---

## 🔭 Roadmap

### Phase 1 — MVP

- [x] Concept produit
- [ ] Import de données
- [ ] Analyse automatique
- [ ] Dashboard
- [ ] Chat avec les données
- [ ] Détection d’anomalies
- [ ] Premières recommandations

### Phase 2 — Intelligence avancée

- [ ] Machine learning
- [ ] Prévisions
- [ ] Analyse multi-sources
- [ ] Rapports automatisés
- [ ] Alertes intelligentes
- [ ] Scoring des risques

### Phase 3 — Agent décisionnel

- [ ] Surveillance continue
- [ ] Détection proactive
- [ ] Recommandations contextualisées
- [ ] Workflows automatisés
- [ ] Agents spécialisés
- [ ] Intégration aux outils métiers

---

## 🔐 Sécurité & données

La confiance est essentielle lorsqu’une plateforme travaille avec des données d’entreprise.

BizIA est conçu avec une attention particulière portée à :

- isolation des données
- contrôle des accès
- confidentialité
- validation des fichiers
- traçabilité des analyses

Les mécanismes de sécurité définitifs dépendront de l’architecture retenue pour la version de production.

---

## 🎬 Démonstration

Scénario du prototype :

1. Importer un fichier
2. BizIA comprend les données
3. Analyse automatique
4. Dashboard généré
5. Anomalie détectée
6. Prédiction
7. Recommandation
8. Question au chatbot
9. Génération du rapport

En quelques minutes, une donnée brute devient une décision exploitable.

---

## 💥 Notre différence

BizIA ne veut pas seulement aider une entreprise à comprendre ses données.

BizIA veut l’aider à **savoir quoi faire ensuite**.

C’est cette transition **Data → Insight → Prediction → Action** qui constitue le cœur de la vision.

---

## 👥 Équipe

BizIA est développé dans le cadre d’un hackathon par une équipe combinant développement frontend, backend, data, machine learning et intelligence artificielle.

Chaque composant du produit est pensé autour d’un même objectif : une expérience simple pour un problème complexe.

---

## 📜 Licence

Ce projet est développé dans le cadre du hackathon.

Voir le fichier [LICENSE](LICENSE) pour les conditions d’utilisation du code.

---

<div align="center">

**🧠 BizIA**

Your data. Your intelligence. Your next decision.

Transform data into decisions.

</div>
