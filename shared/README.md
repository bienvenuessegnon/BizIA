# Contrats d’échange frontend ↔ backend

Décrire ici les payloads REST (ingestion, analyse, chat, rapports) avant de les figer dans le code.

Le frontend consomme `NEXT_PUBLIC_API_URL` (défaut : `http://localhost:8000`).
Le backend expose `/health` et `/api/*`.
