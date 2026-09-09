"""CA, bénéfice, marges, stocks, classements — TODO(farid)."""

from __future__ import annotations

from typing import Any


def compute_kpis(dataset: dict[str, Any]) -> dict[str, Any]:
    """revenue, cost, profit, margin_pct, units_sold, sales_count."""
    raise NotImplementedError("À implémenter : statistiques descriptives.")


def product_rankings(dataset: dict[str, Any], limit: int = 5) -> dict[str, list[dict[str, Any]]]:
    """{"top_sold": [...], "top_profit": [...]}"""
    raise NotImplementedError("À implémenter : produits les plus vendus / rentables.")


def low_stock(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """Produits sous leur seuil d'alerte."""
    raise NotImplementedError("À implémenter : indicateurs de stock.")
