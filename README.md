# BizIA

Analyste de données IA autonome pour les PME et les entreprises.

BizIA transforme des données saisies à la main ou importées (CSV / Excel) en indicateurs, alertes, insights et un dialogue avec un assistant — **via un seul pipeline d’analyse**.

> Les données saisies manuellement et les données importées alimentent le même moteur. Pas deux logiques métier.

## Le problème

Les PME ont des ventes, des stocks et des fichiers, mais un fossé entre ces données et les décisions du quotidien : pourquoi le bénéfice baisse, quels produits surveiller, quoi vérifier avant le prochain achat.

## État du dépôt

Cette phase pose **l’architecture**, pas les fonctionnalités : arborescence, contrats,
squelettes annotés `TODO(<prénom>)`, données d’exemple, tests de contrat et branches Git.
Chaque membre implémente ensuite son périmètre dans son dossier.

## Fonctionnalités MVP (à implémenter)

- Saisie manuelle de produits et de ventes
- Import CSV et Excel simple
- Statistiques descriptives : CA, bénéfice, marges, stocks faibles, tendances
- Alertes par seuils et première détection d’anomalies
- Dashboard (indicateurs, alertes, insights)
- Assistant IA **ancré sur l’analyse déjà calculée**
- Rapport de synthèse MVP (export PDF enrichi : plus tard)

Hors priorité hackathon : PDF non structurés, prévisions complexes, multi-boutiques, vocal.

## Architecture

```
Sources (formulaire | CSV | Excel)
        ↓
   NORMALISATION → schéma commun
        ↓
   ML / analyse (package ml/)
        ↓
   Résultats structurés
        ↓
   Dashboard + assistant IA
```

Flux technique :

```
Frontend (Next.js) → API FastAPI → normalisation → ml.analyze() → API → Frontend
```

## Stack

| Couche | Choix | Pourquoi |
| --- | --- | --- |
| Frontend | Next.js 15, React 19, TypeScript | Déjà présent dans le dépôt ; App Router |
| Backend | Python 3.12, FastAPI | Déjà présent ; OpenAPI auto (`/docs`) |
| ML | pandas, numpy, scikit-learn | Déjà dans `backend/requirements.txt`, extrait dans `ml/` |
| Persistance MVP | JSON fichier (`data/local/`) | Zéro infra (pas de Postgres pour le hackathon) |
| Conteneurs | Docker Compose (optionnel) | Lancer front + back ensemble |

## Structure

```
BizIA/
├── frontend/          # Imma — interface
├── backend/           # Uriel — API & intégration
├── ml/                # Farid — nettoyage & analyse
├── data/              # échantillons & uploads
├── docs/              # architecture, API, git, présentation
├── features/          # périmètre métier (déjà en place)
├── shared/contrats/   # schémas d’échange
├── scripts/           # lancements locaux
├── tests/             # tests transverses (pipeline commun)
├── docker-compose.yml
├── .env.example
└── README.md
```

Les dossiers `features/` et `shared/` existants sont **conservés** : spécifications produit et contrats.

## Équipe

- **Imma** — Frontend (`frontend/`, branche `imma_frontend`)
- **Uriel** — Backend & intégration (`backend/`, branche `uriel_backend`)
- **Farid** — ML & analyse (`ml/`, branche `farid_ml`)
- **Bienv** — Architecture, cohérence, docs, tests, intégration sur `dev` (branche optionnelle `bienv_architecture`)

## Installation

Prérequis : Node.js 22+, Python 3.12+, npm.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

→ http://localhost:3000

### Backend

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export PYTHONPATH="$(pwd)"
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

→ API http://localhost:8000  
→ OpenAPI http://localhost:8000/docs

Ou : `bash scripts/start-backend.sh` depuis la racine (après venv + deps).

### Module ML

Le package `ml/` est importé par le backend (`from ml.pipeline import analyze`).
`analyze()` renvoie aujourd’hui la forme vide du contrat (`ml.pipeline.empty_result`).  
Pour travailler / tester uniquement le moteur :

```bash
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
pip install -r ml/requirements.txt
pytest ml/tests -q
```

### Docker (optionnel)

```bash
docker compose up --build
```

### Tests

```bash
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
pip install -r backend/requirements.txt
pytest -q
```

## Git — branches

```
main                 # stable, démontrable
  └── dev            # intégration équipe
        ├── imma_frontend
        ├── uriel_backend
        └── farid_ml
```

Bienv intègre sur `dev`. Une branche `bienv_architecture` peut servir aux gros changements transverses, à merger ensuite dans `dev`.

### Commencer à travailler

```bash
git checkout dev
git pull origin dev
git checkout <votre_branche>
git merge dev   # ou rebase, au choix de l’équipe
```

| Personne | Branche | Dossier principal |
| --- | --- | --- |
| Imma | `imma_frontend` | `frontend/` |
| Uriel | `uriel_backend` | `backend/` |
| Farid | `farid_ml` | `ml/` |
| Bienv | `dev` | `docs/`, `data/`, `tests/`, `shared/`, intégration |

### Conventions de commits

```
feat(frontend): add sales form
feat(backend): add sales API
feat(ml): add sales analysis
fix(frontend): fix dashboard loading
fix(backend): validate sales payload
docs: update API documentation
```

- Commits petits et explicites
- Ne pas modifier inutilement les dossiers des autres
- Signaler tout changement d’API dans `docs/api/` et `shared/contrats/`
- Tester avant de pousser

Détail : [docs/development/git.md](docs/development/git.md)

## Contrat API

Spécification : [docs/api/README.md](docs/api/README.md) · OpenAPI [docs/api/openapi.yaml](docs/api/openapi.yaml)

Aperçu :

| Méthode | Chemin | Rôle |
| --- | --- | --- |
| GET | `/health` | Santé |
| GET/POST | `/api/products` | Produits |
| GET/POST | `/api/sales` | Ventes |
| POST | `/api/ingestion/files` | Import CSV/Excel |
| POST | `/api/analysis/run` | Lance le moteur unique |
| GET | `/api/analysis/summary` | Dernier résultat |
| GET | `/api/alerts` | Alertes |
| POST | `/api/chat/messages` | Assistant ancré |
| POST | `/api/reports/generate` | Rapport MVP |

## Prochaines tâches

| Qui | Dossier | À faire |
| --- | --- | --- |
| Imma | `frontend/src/` | Formulaires produits/ventes, import, dashboard, graphiques, chat, états de chargement et d’erreur |
| Uriel | `backend/app/` | Store JSON, routes produits/ventes, mapping CSV/Excel, appel du moteur, chat serveur, erreurs |
| Farid | `ml/` | Nettoyage, KPI, classements, stocks, tendances, anomalies (prévision optionnelle) |
| Bienv | `docs/`, `tests/`, `data/` | Cohérence des contrats, tests end-to-end, insights/recommandations, démo |

Chaque squelette porte un commentaire `TODO(<prénom>)` à l’endroit exact où coder.

## Documentation

- [docs/architecture/pipeline.md](docs/architecture/pipeline.md)
- [docs/development/setup.md](docs/development/setup.md)
- [docs/presentation/](docs/presentation/) — documents de référence équipe
- [docs/vision.md](docs/vision.md) · [docs/conventions.md](docs/conventions.md)

## Licence

MIT — voir [LICENSE](LICENSE).
