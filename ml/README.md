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
  analysis/            CA, bénéfice, marges, classements, tendances, insights
  anomaly_detection/   z-score simple sur le CA journalier
  forecasting/         moyenne mobile (optionnel, non bloquant)
  utils/
  pipeline.py          point d’entrée unique
  tests/
```

## Sortie attendue

JSON avec `kpis`, `top_sold`, `top_profit`, `low_stock`, `trend`, `week_over_week`,
`anomalies`, `alerts`, `insights`, `recommendations`.

`analyze` ne lève jamais d’exception sur des données douteuses : une entrée
inexploitable donne la forme vide (`empty_result`) plus une alerte `no_data`.

## Règles de nettoyage

Le backend envoie des données déjà normalisées, mais le moteur reste défensif.

| Cas | Traitement |
| --- | --- |
| Produit sans `sku` | ligne écartée |
| SKU en double | fusionné, la dernière occurrence gagne |
| `name` absent | reprend le `sku` |
| Montant / stock absent ou négatif | ramené à 0 |
| Vente sans `product_sku` ou sans quantité > 0 | ligne écartée |
| Casse du SKU différente du catalogue | alignée sur le catalogue |
| Vente en doublon exact et datée | supprimée (double import) |
| `unit_price` / `unit_cost` absent | repris du catalogue, sinon 0 |
| `sold_at` illisible | ramené à la vente datée la plus récente |
| Vente vers un SKU hors catalogue | conservée + alerte `unknown_product` |

## Tendances et anomalies

- `trend` : une ligne par jour entre la première et la dernière vente, jours
  creux inclus à zéro pour que la courbe et la détection restent lisibles.
- `week_over_week` : deux fenêtres de même longueur (7 jours max, sinon la
  moitié de l’historique). `delta_pct` vaut `null` si la période de référence
  est à zéro.
- `anomalies` : z-score sur le CA journalier, seuil 2.0, minimum 4 points.
  Sévérité `high` au-delà de 3σ, `medium` au-delà de 2,5σ.

## Prévision (optionnelle)

`analyze(dataset, include_forecast=True)` ajoute une clé `forecast` :
moyenne mobile sur les 7 derniers jours. Cette clé est **absente par défaut**,
le contrat de sortie existant n’est pas modifié.

Branche : `farid_ml`.
