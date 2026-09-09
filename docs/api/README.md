# Contrat API BizIA

Version MVP 0.2 — pour travail en parallèle Imma / Uriel / Farid.

> État actuel : les routes existent et valident les payloads, mais renvoient
> `"status": "not_implemented"` avec des listes vides. La **forme** des réponses
> ci-dessous est le contrat : Imma peut coder contre elle avant qu'Uriel n'implémente.

Le serveur FastAPI régénère aussi une spec interactive : `http://localhost:8000/docs`.  
Fichier OpenAPI versionné : [openapi.yaml](openapi.yaml).

## Erreurs

Corps JSON :

```json
{ "error": { "code": "unknown_product", "message": "Aucun produit avec le SKU X." } }
```

| HTTP | code typique | Cas |
| --- | --- | --- |
| 400 | `parse_error` | Fichier illisible |
| 404 | `unknown_product` | Vente vers un SKU inconnu |
| 415 | `unsupported_type` | Autre chose que CSV/Excel |
| 422 | `unknown_schema` | Colonnes non mappées |

## Endpoints

### `GET /health`

```json
{ "status": "ok", "service": "bizia-backend" }
```

### Produits — `GET /api/products` · `POST /api/products`

POST body :

```json
{
  "sku": "HUILE-1L",
  "name": "Huile 1L",
  "category": "Épicerie",
  "unit_cost": 1000,
  "unit_price": 1500,
  "stock_quantity": 4,
  "low_stock_threshold": 5
}
```

Réponse POST `201` : `{ "item": { "id": "...", ... } }`

### Ventes — `GET /api/sales` · `POST /api/sales`

POST body :

```json
{
  "product_sku": "HUILE-1L",
  "quantity": 3,
  "unit_price": 1500,
  "unit_cost": null,
  "sold_at": null,
  "channel": "manual"
}
```

Si `unit_cost` ou `sold_at` sont nuls, le backend complète (coût produit, maintenant UTC).

### Import — `POST /api/ingestion/files`

`multipart/form-data` champ `file` (`.csv`, `.xlsx`).

Réponse :

```json
{
  "status": "accepted",
  "filename": "ventes.csv",
  "source": "csv",
  "products_ingested": 0,
  "sales_ingested": 16
}
```

Les lignes sont **normalisées** puis fusionnées dans le store commun.

### Analyse — `POST /api/analysis/run` · `GET /api/analysis/summary`

Le backend appelle `ml.pipeline.analyze`. Query optionnelle : `include_forecast=true`.

`result` contient : `kpis`, `top_sold`, `top_profit`, `low_stock`, `trend`, `week_over_week`, `anomalies`, `alerts`, `insights`, `recommendations`.

### Alertes — `GET /api/alerts`

```json
{ "items": [{ "code": "low_stock", "severity": "medium", "title": "...", "detail": "..." }] }
```

### Chat — `POST /api/chat/messages`

```json
{ "message": "Quel produit me rapporte le plus ?" }
```

```json
{ "reply": "...", "grounded": true, "user_message": "..." }
```

`grounded: true` = réponse construite à partir du dernier `result` d’analyse.

### Rapport — `POST /api/reports/generate`

JSON de synthèse (PDF avancé : plus tard).

## Règle d’or

Changement de payload = mise à jour de ce dossier **et** message à toute l’équipe avant merge dans `dev`.
