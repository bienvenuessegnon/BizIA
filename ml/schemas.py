"""Schéma canonique consommé par le moteur ML (dicts JSON-compatibles)."""

from __future__ import annotations

from typing import Any, Literal, TypedDict


SourceType = Literal["manual", "csv", "excel", "pdf", "image", "unknown"]


class ProductRecord(TypedDict, total=False):
    id: str
    sku: str
    name: str
    category: str
    unit_cost: float
    unit_price: float
    stock_quantity: float
    low_stock_threshold: float


class SaleRecord(TypedDict, total=False):
    id: str
    product_sku: str
    quantity: float
    unit_price: float
    unit_cost: float
    sold_at: str
    channel: str


class CanonicalDataset(TypedDict, total=False):
    source: SourceType
    products: list[ProductRecord]
    sales: list[SaleRecord]


def empty_dataset(source: SourceType = "unknown") -> dict[str, Any]:
    return {"source": source, "products": [], "sales": []}
