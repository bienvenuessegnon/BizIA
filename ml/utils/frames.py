"""Helpers pandas partagés par le moteur."""

from __future__ import annotations

from typing import Any

import pandas as pd

PRODUCT_COLUMNS = [
    "id",
    "sku",
    "name",
    "category",
    "unit_cost",
    "unit_price",
    "stock_quantity",
    "low_stock_threshold",
]

SALE_COLUMNS = [
    "id",
    "product_sku",
    "quantity",
    "unit_price",
    "unit_cost",
    "sold_at",
    "channel",
]

PRODUCT_TEXT_COLUMNS = ["id", "sku", "name", "category"]
PRODUCT_NUMERIC_COLUMNS = [
    "unit_cost",
    "unit_price",
    "stock_quantity",
    "low_stock_threshold",
]

SALE_TEXT_COLUMNS = ["id", "product_sku", "channel"]
SALE_NUMERIC_COLUMNS = ["quantity", "unit_price", "unit_cost"]


def products_frame(products: list[dict[str, Any]] | None) -> pd.DataFrame:
    """list[dict] → DataFrame typé sur PRODUCT_COLUMNS."""
    frame = _base_frame(products, PRODUCT_COLUMNS)
    for column in PRODUCT_TEXT_COLUMNS:
        frame[column] = _as_text(frame[column])
    for column in PRODUCT_NUMERIC_COLUMNS:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    return frame


def sales_frame(sales: list[dict[str, Any]] | None) -> pd.DataFrame:
    """list[dict] → DataFrame typé sur SALE_COLUMNS (`sold_at` en datetime UTC)."""
    frame = _base_frame(sales, SALE_COLUMNS)
    for column in SALE_TEXT_COLUMNS:
        frame[column] = _as_text(frame[column])
    for column in SALE_NUMERIC_COLUMNS:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    frame["sold_at"] = _as_utc_datetime(frame["sold_at"])
    return frame


def with_sale_amounts(sales: pd.DataFrame) -> pd.DataFrame:
    """Ajoute `revenue`, `cost` et `profit` ligne à ligne."""
    frame = sales.copy()
    quantity = frame["quantity"].fillna(0.0).astype(float)
    unit_price = frame["unit_price"].fillna(0.0).astype(float)
    unit_cost = frame["unit_cost"].fillna(0.0).astype(float)
    frame["revenue"] = quantity * unit_price
    frame["cost"] = quantity * unit_cost
    frame["profit"] = frame["revenue"] - frame["cost"]
    return frame


def match_key(series: pd.Series) -> pd.Series:
    """Clé de rapprochement des SKU, insensible à la casse et aux espaces."""
    return series.astype("string").str.strip().str.upper()


def records(frame: pd.DataFrame, columns: list[str]) -> list[dict[str, Any]]:
    """DataFrame → list[dict] JSON-compatible (`pd.NA`/`NaT` deviennent `None`)."""
    subset = frame.loc[:, columns]
    return [
        {key: _json_safe(value) for key, value in row.items()}
        for row in subset.to_dict(orient="records")
    ]


def _base_frame(rows: list[dict[str, Any]] | None, columns: list[str]) -> pd.DataFrame:
    frame = pd.DataFrame([row for row in (rows or []) if isinstance(row, dict)])
    for column in columns:
        if column not in frame.columns:
            frame[column] = None
    return frame.loc[:, columns].reset_index(drop=True)


def _as_text(series: pd.Series) -> pd.Series:
    text = series.astype("string").str.strip()
    return text.mask(text.eq(""), pd.NA)


def _as_utc_datetime(series: pd.Series) -> pd.Series:
    if series.isna().all():
        return pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns, UTC]")
    try:
        return pd.to_datetime(series, errors="coerce", utc=True, format="mixed")
    except (TypeError, ValueError):
        return pd.to_datetime(series, errors="coerce", utc=True)


def _json_safe(value: Any) -> Any:
    if value is None or value is pd.NaT or value is pd.NA:
        return None
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        return value.item()
    return value
