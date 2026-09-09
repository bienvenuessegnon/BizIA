# ML & analyse — Farid

Package Python importable : `ml.pipeline.analyze(dataset) -> dict`.

Le moteur **ignore la source** (`manual`, `csv`, `excel`). Il ne voit qu’un schéma commun : `products[]` + `sales[]`.

## Lancer / tester

```bash
# racine du dépôt
source .venv/bin/activate
export PYTHONPATH="$(pwd)"
pip install -r ml/requirements.txt
pytest ml/tests -q
```

Exemple :

```python
from ml.pipeline import analyze

result = analyze({
    "source": "csv",
    "products": [...],
    "sales": [...],
})
```

## Structure

```
ml/
  preprocessing/       nettoyage, dédoublonnage, coûts manquants
  analysis/            CA, bénéfice, marges, classements, tendances
  anomaly_detection/   z-score simple sur le CA journalier
  forecasting/         moyenne mobile (optionnel, non bloquant)
  utils/
  pipeline.py          point d’entrée unique
  tests/
```

## Sortie attendue

JSON avec `kpis`, `top_sold`, `top_profit`, `low_stock`, `trend`, `anomalies`, `alerts`, `insights`, `recommendations`.

Prévisions avancées : uniquement si le temps le permet (`include_forecast=True`).

Branche : `farid_ml`.
