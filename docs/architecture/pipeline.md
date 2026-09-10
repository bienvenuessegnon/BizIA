# Pipeline commun

```
                 ┌── Formulaire manuel ──┐
                 │                       │
Sources ─────────┼── CSV ────────────────┤
                 ├── Excel ──────────────┤
                 ├── PDF ────────────────┤
                 └── Image ──────────→ NORMALISATION
                                           ↓
                                     SCHÉMA COMMUN
                                           ↓
                                    ANALYSE / ML
                                           ↓
                                  RÉSULTATS STRUCTURÉS
                                           ↓
                             DASHBOARD + ASSISTANT IA
```

## Responsabilités

| Étape | Module | Qui |
| --- | --- | --- |
| Collecte UI | `frontend/` | Imma |
| API + store + mapping colonnes | `backend/` | Uriel |
| Nettoyage, KPI, anomalies | `ml/` | Farid |
| Cohérence des contrats, e2e, démo | `docs/`, `tests/`, `data/` | Bienv |

## Schéma commun

Voir `shared/contrats/canonical-dataset.schema.json`.

Un fichier brut **n’entre jamais** dans le ML. Le backend le traduit d’abord.

## Chatbot

L’assistant lit `last_analysis` (sortie ML). Il ne recalcule pas une vérité parallèle.
