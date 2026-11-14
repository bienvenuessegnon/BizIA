# BizIA

Analyste de données pour PME : import de fichiers (CSV, Excel, PDF ou image), saisie des produits et des ventes, tableau de bord, alertes et assistant. Projet d'équipe, finaliste du Dev Day 2026 Bénin.

*A data analysis tool for small businesses: file import, dashboards, alerts and a chat assistant, built with Next.js, FastAPI and scikit-learn. Team project.*

**Démo :** [https://bizia.vercel.app](https://bizia.vercel.app)

## Fonctionnalités

- saisie manuelle des produits et des ventes, gestion multi-entreprises
- import CSV, Excel, PDF (tableaux) et images, avec aperçu avant validation
- scan de reçus et simulateur de tableur
- tableau de bord : chiffre d'affaires, bénéfice, marges, stocks faibles, tendances, graphiques
- alertes et détection d'anomalies (z-score sur le chiffre d'affaires journalier)
- assistant ancré sur l'analyse déjà calculée
- export de rapport (PDF ou Word)
- authentification (compte e-mail ou Google)

Le moteur d'analyse (`ml.analyze`) normalise un schéma commun `products[]` / `sales[]`, quelle que soit la source, puis calcule les indicateurs, classements, tendances et alertes. Une prévision par moyenne mobile est disponible en option.

## Stack

| Couche | Choix |
| --- | --- |
| Interface | Next.js, React, TypeScript |
| API | Python, FastAPI |
| Analyse | pandas, NumPy, scikit-learn |
| Conteneurs | Docker, `docker-compose.yml` |
| Déploiement | Vercel (interface), Render prévu via `render.yaml` |

## Équipe

- **Imma** — interface (`frontend/`)
- **Uriel** — API et intégration (`backend/`)
- **Farid** — analyse et apprentissage automatique (`ml/`)
- **Bienvenu ESSEGNON** — architecture, documentation, tests et intégration

## Lancer le projet

Prérequis : Node.js 22+ et Python 3.12+.

```bash
cp .env.example .env
cp frontend/.env.example frontend/.env.local
```

Interface (http://localhost:3000) :

```bash
cd frontend
npm install
npm run dev
```

API (http://localhost:8000, documentation sur `/docs`) :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
export PYTHONPATH="$(pwd)"
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Depuis la racine, après installation de l'environnement : `bash scripts/start-backend.sh`.

Tests :

```bash
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
pip install -r backend/requirements.txt
pytest -q
```

Docker (un seul service, site et API sur le port 8000) :

```bash
docker compose up --build
```

## Structure

```text
frontend/     interface Next.js
backend/      API FastAPI
ml/           nettoyage, indicateurs, tendances, anomalies
data/samples/ jeux d'exemple
docs/         architecture, contrat API, notes de développement
tests/        tests transverses
```

## Documentation

- [docs/architecture/pipeline.md](docs/architecture/pipeline.md)
- [docs/development/setup.md](docs/development/setup.md)
- [docs/api/README.md](docs/api/README.md)

## Licence

MIT — voir [LICENSE](LICENSE).

## Auteur

[Bienvenu ESSEGNON](https://github.com/bienvenuessegnon), au nom de l'équipe BizIA.
