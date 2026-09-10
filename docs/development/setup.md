# Setup local

1. Copier `.env.example` → `.env` et `frontend/.env.example` → `frontend/.env.local`.
2. Python : venv à la racine, `pip install -r backend/requirements.txt`.
3. `export PYTHONPATH` = racine du dépôt.
4. Node : `cd frontend && npm install`.
5. Deux terminaux : `bash scripts/start-backend.sh` et `bash scripts/start-frontend.sh`.
6. Option : `bash scripts/seed-samples.sh` pour charger les CSV d’exemple.

Python 3.12 et Node 22 sont les versions de référence de cet environnement.

## Render (un seul service, sans clé)

Le `Dockerfile` de la racine construit le site Next.js en statique puis le fait servir par
l’API : **une seule URL** pour le site et pour `/api`. Pas de CORS, pas de seconde adresse.
Connexion par e-mail + mot de passe, pas de Google.

1. Sur Render : **New** → **Blueprint** → ce dépôt, branche `dev`.
2. Un service : `bizia` (langage **Docker**).
3. Aucune clé à coller. Les comptes JSON sont **éphémères** (un redéploiement les efface).

Ce que sert ce service :

| Chemin | Contenu |
| --- | --- |
| `/` | le site (accueil, produits, ventes, import, dashboard, assistant) |
| `/api/...` | l’API |
| `/health` | sonde utilisée par Render |
| `/docs` | documentation OpenAPI |

Créé à la main plutôt que par le Blueprint : choisir **Docker**, laisser le chemin du
Dockerfile par défaut (`./Dockerfile`) et le contexte à la racine du dépôt.

Le même conteneur tourne en local : `docker compose up --build`, puis http://localhost:8000.

### Déployer le front séparément (optionnel)

Le mode serveur de Next.js reste disponible : sans `NEXT_OUTPUT=export`, `npm run build`
puis `npm start` fonctionnent comme avant. Il faut alors renseigner `NEXT_PUBLIC_API_URL`
avec l’URL publique de l’API — cette variable est figée au build, donc un changement d’URL
impose un nouveau déploiement.
