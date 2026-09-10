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

1. Sur Render : **New** → **Blueprint** → ce dépôt, branche `dev`.
2. Deux services : `bizia-api` (Python) et `bizia-web` (Node).
3. Aucune clé à coller. Les comptes JSON sont **éphémères** (un redéploiement les efface).

Si un service est créé à la main plutôt que par le Blueprint, choisir **Python** pour l’API
et **Node** pour le front. Avec le langage **Docker**, Render construit le `Dockerfile` de la
racine, qui ne contient que l’API.

**BizIA a besoin de deux services.** L’API ne sert pas l’interface : sa racine `/` renvoie
seulement un repère JSON, la documentation vit sur `/docs`. Le site est le service Node.

Créer le front à la main :

| Champ | Valeur |
| --- | --- |
| Language | Node |
| Root Directory | `frontend` |
| Build Command | `npm ci && npm run build` |
| Start Command | `npm start -- --hostname 0.0.0.0 --port $PORT` |
| `NEXT_PUBLIC_API_URL` | l’URL publique de l’API, par exemple `https://biziao.onrender.com` |

`NEXT_PUBLIC_API_URL` est figée pendant le build : après un changement d’URL d’API, relancer
un déploiement du front.
