# Données BizIA

| Dossier | Usage |
| --- | --- |
| `samples/` | Jeux d’exemple versionnés (CSV, Excel, PDF) pour démos et tests |
| `uploads/` | Fichiers importés localement (ignorés par Git) |
| `local/` | Store JSON du MVP (`bizia.json`) — ignoré par Git |

## Principe

Les fichiers d’exemple, la saisie manuelle et les imports CSV/Excel/PDF/image sont **normalisés vers le même schéma** (`docs/api/`) avant analyse.

## Fichiers d’exemple

| Fichier | Contenu |
| --- | --- |
| `produits.csv` · `produits.xlsx` · `produits.pdf` | catalogue de 5 produits |
| `ventes.csv` · `ventes.xlsx` · `ventes.pdf` | journal de 16 ventes sur ces 5 produits |

Importer un catalogue **avant** les ventes : une vente dont le SKU est absent du
catalogue est ignorée. Les CSV sont la source de vérité, les autres formats en
sont dérivés par `python3 scripts/make-samples.py`.

## Charger les échantillons

1. Lancer le backend.
2. `POST /api/ingestion/files` avec `data/samples/produits.csv` puis `data/samples/ventes.csv`.
3. `POST /api/analysis/run`.

Ou : `bash scripts/seed-samples.sh`
