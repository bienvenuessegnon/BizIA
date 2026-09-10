# Données BizIA

| Dossier | Usage |
| --- | --- |
| `samples/` | Jeux d’exemple versionnés (CSV) pour démos et tests |
| `uploads/` | Fichiers importés localement (ignorés par Git) |
| `local/` | Store JSON du MVP (`bizia.json`) — ignoré par Git |

## Principe

Les fichiers d’exemple, la saisie manuelle et les imports CSV/Excel/PDF/image sont **normalisés vers le même schéma** (`docs/api/`) avant analyse.

## Charger les échantillons

1. Lancer le backend.
2. `POST /api/ingestion/files` avec `data/samples/produits.csv` puis `data/samples/ventes.csv`.
3. `POST /api/analysis/run`.

Ou : `bash scripts/seed-samples.sh`
