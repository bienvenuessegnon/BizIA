"""Tendances et comparaison de périodes — TODO(farid)."""

from __future__ import annotations

from typing import Any


def daily_revenue_trend(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """[{"period": "YYYY-MM-DD", "revenue": .., "profit": .., "units_sold": ..}]"""
    raise NotImplementedError("À implémenter : série temporelle des ventes.")


def week_over_week(trend: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Écart de bénéfice entre les deux dernières fenêtres de 7 jours."""
    raise NotImplementedError("À implémenter : comparaison hebdomadaire.")
