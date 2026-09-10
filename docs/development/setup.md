# Setup local

1. Copier `.env.example` → `.env` et `frontend/.env.example` → `frontend/.env.local`.
2. Python : venv à la racine, `pip install -r backend/requirements.txt`.
3. `export PYTHONPATH` = racine du dépôt.
4. Node : `cd frontend && npm install`.
5. Deux terminaux : `bash scripts/start-backend.sh` et `bash scripts/start-frontend.sh`.
6. Option : `bash scripts/seed-samples.sh` pour charger les CSV d’exemple.

Python 3.12 et Node 22 sont les versions de référence de cet environnement.

## Render (sans clé)

Le fichier `render.yaml` déploie l’API et le front. Connexion par e-mail + mot de passe, pas de Google.

1. Sur Render : **New** → **Blueprint** → ce dépôt, branche `dev` (après merge) ou la branche de la PR.
2. Deux services : `bizia-api` et `bizia-web`.
3. Aucune clé à coller. Les comptes JSON sont **éphémères** (un redéploiement les efface).
