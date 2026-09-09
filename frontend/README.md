# Frontend — BizIA

Dossier de l’équipe **frontend**. Stack : React, Next.js (App Router), TypeScript.

## Périmètre

- Dashboard
- Import de fichiers (UI)
- Chat avec les données
- Visualisations
- Consultation des rapports, alertes et recommandations

Le métier (calculs, ML, LLM) reste dans `backend/`.

## Démarrer

```bash
cd frontend
npm install
npm run dev
```

L’app écoute sur [http://localhost:3000](http://localhost:3000).  
L’API backend est attendue sur `http://localhost:8000` (voir `.env.example`).

## Structure

```
frontend/
  app/                 pages (accueil, dashboard, chat)
  app/components/      composants UI (à remplir)
  public/              assets statiques
```

Contrats d’API : `shared/contrats/` et routes FastAPI dans `backend/`.
