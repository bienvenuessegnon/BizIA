"""Nettoyage et préparation du schéma commun.

Règles appliquées (identiques quelle que soit la source) :

Produits
    - une ligne sans `sku` est écartée ;
    - les SKU en double sont fusionnés, la dernière occurrence gagne ;
    - `name` manquant reprend le `sku` ;
    - les montants et quantités manquants valent 0 et ne peuvent pas être négatifs.

Ventes
    - une ligne sans `product_sku` ou sans quantité strictement positive est écartée ;
    - le `product_sku` reprend la casse du catalogue quand il y correspond ;
    - les doublons exacts datés (même produit, quantité, prix, horodatage, canal)
      sont considérés comme un double import et supprimés ;
    - `unit_price` et `unit_cost` manquants sont repris du catalogue, sinon 0 ;
    - `sold_at` illisible est ramené à la vente datée la plus récente, sinon à
      l'instant courant, pour que la ligne compte quand même dans les KPI ;
    - `channel` manquant reprend la source du jeu de données.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import pandas as pd

from ml.schemas import SourceType
from ml.utils.frames import (
    PRODUCT_COLUMNS,
    SALE_COLUMNS,
    match_key,
    products_frame,
    records,
    sales_frame,
)

KNOWN_SOURCES: tuple[str, ...] = ("manual", "csv", "excel")

IDENTITY_COLUMNS = ["id", "sku"]

DUPLICATE_SALE_COLUMNS = [
    "product_sku",
    "quantity",
    "unit_price",
    "unit_cost",
    "sold_at",
    "channel",
]


def clean_dataset(dataset: dict[str, Any]) -> dict[str, Any]:
    """Doublons, valeurs manquantes, types, coûts absents.

    Entrée et sortie respectent `ml/schemas.py`.
    """
    payload = dataset if isinstance(dataset, dict) else {}
    source = normalize_source(payload.get("source"))

    products = clean_products(products_frame(payload.get("products")))
    sales = clean_sales(sales_frame(payload.get("sales")), products, source)

    return {
        "source": source,
        "products": records(products, PRODUCT_COLUMNS),
        "sales": records(sales, SALE_COLUMNS),
    }


def normalize_source(source: Any) -> SourceType:
    """Toute source inconnue devient `unknown` plutôt que de faire échouer l'analyse."""
    if isinstance(source, str) and source.strip().lower() in KNOWN_SOURCES:
        return source.strip().lower()  # type: ignore[return-value]
    return "unknown"


def clean_products(frame: pd.DataFrame) -> pd.DataFrame:
    frame = frame.loc[match_key(frame["sku"]).notna()].copy()
    frame["sku"] = frame["sku"].str.strip()
    frame = _merge_duplicate_products(frame)

    frame["name"] = frame["name"].fillna(frame["sku"])
    for column in ("unit_cost", "unit_price", "stock_quantity", "low_stock_threshold"):
        frame[column] = frame[column].fillna(0.0).clip(lower=0.0).astype(float)

    return frame.reset_index(drop=True)


def clean_sales(frame: pd.DataFrame, products: pd.DataFrame, source: str) -> pd.DataFrame:
    frame = frame.loc[match_key(frame["product_sku"]).notna()].copy()
    frame["quantity"] = frame["quantity"].astype(float)
    frame = frame.loc[frame["quantity"] > 0].copy()

    frame["product_sku"] = _canonical_skus(frame["product_sku"], products)
    frame = _drop_duplicate_sales(frame)

    catalog_key = match_key(frame["product_sku"])
    for column in ("unit_price", "unit_cost"):
        frame[column] = frame[column].fillna(catalog_key.map(_catalog_map(products, column)))
        frame[column] = frame[column].fillna(0.0).clip(lower=0.0).astype(float)

    frame["sold_at"] = frame["sold_at"].fillna(_fallback_date(frame["sold_at"]))
    frame["channel"] = frame["channel"].fillna(source)

    return frame.sort_values("sold_at", kind="stable").reset_index(drop=True)


def _merge_duplicate_products(frame: pd.DataFrame) -> pd.DataFrame:
    """Fusionne les SKU en double champ par champ.

    La dernière valeur *renseignée* gagne : un réimport avec une colonne vide
    met à jour le reste sans effacer ce qu'on savait déjà du produit. Les champs
    d'identité (`id`, `sku`) gardent au contraire leur première valeur, sinon un
    fichier mal saisi renommerait un produit déjà connu.
    """
    keyed = frame.assign(_key=match_key(frame["sku"]))
    if not keyed["_key"].duplicated().any():
        return frame.reset_index(drop=True)

    grouped = keyed.groupby("_key", sort=False)
    merged = grouped.last()
    for column in IDENTITY_COLUMNS:
        merged[column] = grouped[column].first()
    return merged.loc[:, PRODUCT_COLUMNS].reset_index(drop=True)


def _catalog_map(products: pd.DataFrame, column: str) -> pd.Series:
    if products.empty:
        return pd.Series(dtype=float)
    catalog = products.assign(_key=match_key(products["sku"]))
    return catalog.drop_duplicates(subset="_key", keep="last").set_index("_key")[column]


def _canonical_skus(skus: pd.Series, products: pd.DataFrame) -> pd.Series:
    """Aligne la casse des SKU de vente sur celle du catalogue quand elle diffère."""
    trimmed = skus.str.strip()
    if products.empty:
        return trimmed
    canonical = _catalog_map(products, "sku")
    return match_key(trimmed).map(canonical).fillna(trimmed)


def _drop_duplicate_sales(frame: pd.DataFrame) -> pd.DataFrame:
    identified = frame.loc[frame["id"].notna()]
    duplicated_ids = identified.duplicated(subset="id", keep="last")

    dated = frame.loc[frame["sold_at"].notna()]
    duplicated_rows = dated.duplicated(subset=DUPLICATE_SALE_COLUMNS, keep="first")

    to_drop = duplicated_ids[duplicated_ids].index.union(
        duplicated_rows[duplicated_rows].index
    )
    return frame.drop(index=to_drop)


def _fallback_date(sold_at: pd.Series) -> pd.Timestamp:
    latest = sold_at.max()
    if pd.isna(latest):
        return pd.Timestamp(datetime.now(timezone.utc)).floor("s")
    return latest
