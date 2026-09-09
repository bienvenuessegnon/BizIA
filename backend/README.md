# Backend — Uriel

Stack : **Python 3.12, FastAPI, Pydantic**. Persistance MVP : JSON (`data/local/bizia.json`).

## Lancer

Depuis la **racine du dépôt** :

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cd ..
export PYTHONPATH="$(pwd)"
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API : http://localhost:8000
- Swagger : http://localhost:8000/docs

`PYTHONPATH` doit pointer vers la racine pour importer le package `ml/`.

## Structure

```
backend/app/
  api/         routes REST
  schemas/     contrats Pydantic
  services/    store, ingestion, pipeline, chat
  analysis/    adaptateur vers ml.pipeline
  models/      place pour un ORM plus tard
  routes/      alias / notes
  utils/
  main.py
tests/
```

## Flux

```
Frontend → API → normalisation → ml.analyze() → JSON → Frontend
```

Saisie manuelle (`POST /api/products`, `POST /api/sales`) et import (`POST /api/ingestion/files`) écrivent dans le **même store**, puis `POST /api/analysis/run` appelle **le même** moteur.

Branche : `uriel_backend`.
