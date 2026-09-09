"""CA, bénéfice, marges, stocks, classements."""

from __future__ import annotations

from typing import Any

import pandas as pd

from ml.utils.frames import match_key, products_frame, sales_frame, with_sale_amounts
from ml.utils.numbers import money, percentage

DEFAULT_RANKING_LIMIT = 5

RANKING_COLUMNS = ["sku", "name", "units_sold", "revenue", "profit"]


def compute_kpis(dataset: dict[str, Any]) -> dict[str, Any]:
    """revenue, cost, profit, margin_pct, units_sold, sales_count."""
    sales = with_sale_amounts(sales_frame(dataset.get("sales")))

    revenue = money(sales["revenue"].sum())
    cost = money(sales["cost"].sum())
    return {
        "revenue": revenue,
        "cost": cost,
        "profit": money(revenue - cost),
        "margin_pct": percentage(revenue - cost, revenue),
        "units_sold": money(sales["quantity"].fillna(0.0).sum()),
        "sales_count": int(len(sales)),
    }


def product_rankings(
    dataset: dict[str, Any], limit: int = DEFAULT_RANKING_LIMIT
) -> dict[str, list[dict[str, Any]]]:
    """{"top_sold": [...], "top_profit": [...]}"""
    per_product = aggregate_by_product(dataset)
    if per_product.empty:
        return {"top_sold": [], "top_profit": []}

    return {
        "top_sold": _top(per_product, "units_sold", limit),
        "top_profit": _top(per_product, "profit", limit),
    }


def aggregate_by_product(dataset: dict[str, Any]) -> pd.DataFrame:
    """Une ligne par SKU vendu : unités, CA et bénéfice cumulés."""
    sales = with_sale_amounts(sales_frame(dataset.get("sales")))
    if sales.empty:
        return pd.DataFrame(columns=RANKING_COLUMNS)

    sales = sales.assign(_key=match_key(sales["product_sku"]))
    grouped = (
        sales.groupby("_key", dropna=True)
        .agg(
            sku=("product_sku", "first"),
            units_sold=("quantity", "sum"),
            revenue=("revenue", "sum"),
            profit=("profit", "sum"),
        )
        .reset_index()
    )
    grouped["name"] = grouped["_key"].map(_product_names(dataset)).fillna(grouped["sku"])
    return grouped.loc[:, RANKING_COLUMNS]


def low_stock(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """Produits sous leur seuil d'alerte."""
    products = products_frame(dataset.get("products"))
    if products.empty:
        return []

    stock = products["stock_quantity"].fillna(0.0)
    threshold = products["low_stock_threshold"].fillna(0.0)
    flagged = products.loc[(threshold > 0) & (stock <= threshold)].copy()
    if flagged.empty:
        return []

    flagged["_deficit"] = (
        flagged["low_stock_threshold"].fillna(0.0) - flagged["stock_quantity"].fillna(0.0)
    )
    flagged = flagged.sort_values("_deficit", ascending=False, kind="stable")

    return [
        {
            "sku": row["sku"],
            "name": row["name"] if pd.notna(row["name"]) else row["sku"],
            "stock_quantity": money(row["stock_quantity"]),
            "low_stock_threshold": money(row["low_stock_threshold"]),
        }
        for _, row in flagged.iterrows()
    ]


def _product_names(dataset: dict[str, Any]) -> pd.Series:
    products = products_frame(dataset.get("products"))
    if products.empty:
        return pd.Series(dtype="string")
    catalog = products.assign(_key=match_key(products["sku"]))
    catalog = catalog.drop_duplicates(subset="_key", keep="last")
    return catalog.set_index("_key")["name"]


def _top(per_product: pd.DataFrame, column: str, limit: int) -> list[dict[str, Any]]:
    ordered = per_product.sort_values(column, ascending=False, kind="stable")
    if limit > 0:
        ordered = ordered.head(limit)
    return [
        {
            "sku": row["sku"],
            "name": row["name"],
            "units_sold": money(row["units_sold"]),
            "revenue": money(row["revenue"]),
            "profit": money(row["profit"]),
        }
        for _, row in ordered.iterrows()
    ]
