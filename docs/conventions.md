# Conventions de contribution

## Répartition

| Dossier | Responsable | Contenu |
| --- | --- | --- |
| `frontend/` | Frontend | Next.js, dashboard, chat, visualisations |
| `backend/` | Backend, data, ML, IA | FastAPI, ingestion, analyse, LLM |
| `features/` | Tous | Périmètre métier (quoi, pas comment) |
| `shared/contrats/` | Tous | Contrats d’API et schémas d’échange |
| `docs/` | Tous | Vision et règles d’équipe |

Le frontend et le backend s’implémentent **chacun dans son dossier**. Les README sous `features/` décrivent le besoin ; ils ne remplacent pas le code.

## Démarrer

1. Frontend : lire [`frontend/README.md`](../frontend/README.md).
2. Backend : lire [`backend/README.md`](../backend/README.md).
3. Pour une capacité métier, lire `features/<nom>/README.md` puis coder dans `frontend/` et/ou `backend/` selon la couche.

## Contrats

Les échanges front ↔ back passent par des contrats décrits dans `shared/contrats/` (et les routes REST du backend). Éviter les couplages implicites.

Flux métier :

```
ingestion → structuration → analyse
                         → anomalies | tendances | predictions
                         → visualisations | rapports | chatbot | decisions
```

## Branches

Une branche par sujet, par exemple `feat/frontend-dashboard` ou `feat/backend-ingestion`.
