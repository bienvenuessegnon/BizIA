# Conventions de contribution

## Répartition

| Dossier | Responsable | Branche |
| --- | --- | --- |
| `frontend/` | Imma | `imma_frontend` |
| `backend/` | Uriel | `uriel_backend` |
| `ml/` | Farid | `farid_ml` |
| `docs/`, `data/`, `tests/`, `shared/`, intégration | Bienv | `dev` |
| `features/` | Tous | périmètre métier (quoi, pas comment) |

Le frontend et le backend s’implémentent **chacun dans son dossier**. Les README sous `features/` décrivent le besoin.

## Contrats

Échanges via `docs/api/` et `shared/contrats/`. Flux :

```
ingestion → normalisation → ml.analyze
                         → dashboard | alertes | chatbot | rapport
```

Saisie manuelle et import : **même pipeline**.

## Branches

Voir [development/git.md](development/git.md).
