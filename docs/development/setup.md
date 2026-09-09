# Setup local

1. Copier `.env.example` → `.env` et `frontend/.env.example` → `frontend/.env.local`.
2. Python : venv à la racine, `pip install -r backend/requirements.txt`.
3. `export PYTHONPATH` = racine du dépôt.
4. Node : `cd frontend && npm install`.
5. Deux terminaux : `bash scripts/start-backend.sh` et `bash scripts/start-frontend.sh`.
6. Option : `bash scripts/seed-samples.sh` pour charger les CSV d’exemple.

Python 3.12 et Node 22 sont les versions de référence de cet environnement.
