# Contrat API BizIA

Version MVP 0.3 — saisie manuelle et import CSV/Excel alimentent le même pipeline.

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
| 400 | `no_analysis` | Rapport sans analyse |
| 404 | `unknown_product` | Vente saisie vers un SKU inconnu |
| 415 | `unsupported_type` | Autre chose que CSV/Excel |
| 422 | `unknown_schema` | Colonnes non mappées |
| 422 | `validation_error` | Payload Pydantic invalide |

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
  "sales_ingested": 16,
  "sales_skipped_unknown": 0,
  "sales_skipped_duplicate": 0
}
```

Les lignes sont **normalisées** puis fusionnées dans le store commun. Une vente
dont le SKU n'est pas au catalogue est ignorée (`sales_skipped_unknown`). Un
réimport identique n'ajoute pas de doublon (`sales_skipped_duplicate`).

La dernière source d'import (`csv` / `excel`) est conservée et renvoyée dans
`result.source` au prochain `POST /api/analysis/run`.

### Analyse — `POST /api/analysis/run` · `GET /api/analysis/summary`

Le backend appelle `ml.pipeline.analyze`. Query optionnelle : `include_forecast=true`.

`result` contient : `kpis`, `top_sold`, `top_profit`, `low_stock`, `trend`, `week_over_week`, `anomalies`, `alerts`, `insights`, `recommendations`.

`week_over_week` compare le **bénéfice** sur deux fenêtres de même durée. Les
champs `metric: "profit"` et `window_days` rendent cette convention explicite.

### Auth — `POST /api/auth/register` · `POST /api/auth/login`

L'inscription et la connexion renvoient `{ "user": {...}, "token": "..." }`.
Le mot de passe est haché avec Argon2 et le store ne conserve que l'empreinte
SHA-256 du jeton. `GET /api/auth/me` et `POST /api/auth/logout` utilisent
`Authorization: Bearer <token>`.

Toutes les routes métier exigent cette session. Produits, ventes et dernière
analyse sont stockés dans un espace propre à l'identifiant du compte : un
nouveau compte démarre donc avec des listes et un dashboard vides.

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

### Rapport — `POST /api/reports/generate?format=pdf|docx`

Rapport PDF ou Word généré depuis la dernière analyse. Aucun téléchargement JSON
n'est proposé à l'utilisateur.

## Règle d’or

Changement de payload = mise à jour de ce dossier **et** message à toute l’équipe avant merge dans `dev`.
