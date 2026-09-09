# Architecture technique

- **Frontend** : Next.js dans `frontend/` (port 3000)
- **Backend** : FastAPI dans `backend/` (port 8000)
- **ML** : package `ml/` importé par le backend (pas de serveur séparé au MVP)
- **Données** : JSON local + fichiers dans `data/uploads/`

Un service ML HTTP séparé n’est pas nécessaire pour le hackathon : un import Python évite la latence et les contrats dupliqués. Si Farid a besoin d’un process isolé plus tard, `ml.pipeline.analyze` reste le point d’entrée.

Persistance : fichier JSON plutôt que PostgreSQL pour rester démontrable sans Docker obligatoire.
