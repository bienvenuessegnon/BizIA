"""Helpers pandas partagés par le moteur — TODO(farid)."""

from __future__ import annotations

from typing import Any

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


def products_frame(products: list[dict[str, Any]]):
    """list[dict] → DataFrame typé sur PRODUCT_COLUMNS."""
    raise NotImplementedError("À implémenter avec pandas.")


def sales_frame(sales: list[dict[str, Any]]):
    """list[dict] → DataFrame typé sur SALE_COLUMNS."""
    raise NotImplementedError("À implémenter avec pandas.")
