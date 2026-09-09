# Frontend — Imma

Stack : **Next.js 15 (App Router), React 19, TypeScript**.

## Lancer

```bash
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm run dev
```

http://localhost:3000

## Structure

```
frontend/
  src/app/             routes : accueil, produits, ventes, import, dashboard, chat
  src/components/      UI réutilisable
  src/services/        client API
  src/hooks/
  src/types/           types alignés sur le contrat
  src/utils/
  public/
```

## Périmètre Imma (MVP)

- Navigation et page d’accueil
- Formulaires produits / ventes
- Import CSV/Excel
- Dashboard, graphiques, indicateurs, alertes
- Chatbot, chargements, erreurs
- Consommation exclusive des APIs Uriel (`src/services/api.ts`)

Ne pas implémenter de logique métier de calcul ici.

Branche : `imma_frontend`.
