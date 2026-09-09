"""Tendances et comparaison de périodes."""

from __future__ import annotations

from typing import Any

import pandas as pd

from ml.utils.frames import sales_frame, with_sale_amounts
from ml.utils.numbers import money, percentage

WINDOW_DAYS = 7


def daily_revenue_trend(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """[{"period": "YYYY-MM-DD", "revenue": .., "profit": .., "units_sold": ..}]

    Les jours sans vente compris entre la première et la dernière vente sont
    présents à zéro : la courbe reste continue et une journée creuse devient
    visible pour la détection d'anomalies.
    """
    sales = with_sale_amounts(sales_frame(dataset.get("sales")))
    sales = sales.loc[sales["sold_at"].notna()]
    if sales.empty:
        return []

    daily = (
        sales.assign(period=sales["sold_at"].dt.tz_convert("UTC").dt.date)
        .groupby("period")
        .agg(
            revenue=("revenue", "sum"),
            profit=("profit", "sum"),
            units_sold=("quantity", "sum"),
        )
        .sort_index()
    )
    daily = daily.reindex(
        pd.date_range(min(daily.index), max(daily.index), freq="D").date, fill_value=0.0
    )

    return [
        {
            "period": period.isoformat(),
            "revenue": money(row["revenue"]),
            "profit": money(row["profit"]),
            "units_sold": money(row["units_sold"]),
        }
        for period, row in daily.iterrows()
    ]


def week_over_week(trend: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Écart de bénéfice entre les deux dernières fenêtres de 7 jours."""
    points = [point for point in (trend or []) if isinstance(point, dict)]
    if len(points) < 2:
        return None

    # Fenêtres de même longueur, sinon l'écart compare deux durées différentes.
    window = min(WINDOW_DAYS, len(points) // 2)
    current = points[-window:]
    previous = points[-2 * window : -window]

    current_profit = money(sum(_profit(point) for point in current))
    previous_profit = money(sum(_profit(point) for point in previous))
    delta = money(current_profit - previous_profit)

    return {
        "current_window_profit": current_profit,
        "previous_window_profit": previous_profit,
        "delta": delta,
        "delta_pct": percentage(delta, abs(previous_profit)) if previous_profit else None,
    }


def _profit(point: dict[str, Any]) -> float:
    value = point.get("profit", 0.0)
    return float(value) if isinstance(value, (int, float)) else 0.0
