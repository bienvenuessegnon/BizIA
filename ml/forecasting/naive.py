"""Prédiction simple — optionnelle, ne doit pas bloquer le MVP."""

from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from ml.utils.numbers import money, to_float

DEFAULT_WINDOW = 7


def naive_next_period(
    trend: list[dict[str, Any]], window: int = DEFAULT_WINDOW
) -> dict[str, Any] | None:
    """Moyenne mobile sur les derniers jours. À faire seulement si le temps le permet."""
    points = [point for point in (trend or []) if isinstance(point, dict)]
    if not points:
        return None

    effective_window = max(1, min(window, len(points)))
    recent = points[-effective_window:]

    return {
        "period": _next_period(points[-1].get("period")),
        "method": "moving_average",
        "window": effective_window,
        "revenue": _average(recent, "revenue"),
        "profit": _average(recent, "profit"),
        "units_sold": _average(recent, "units_sold"),
    }


def _average(points: list[dict[str, Any]], key: str) -> float:
    return money(sum(to_float(point.get(key)) for point in points) / len(points))


def _next_period(last_period: Any) -> str | None:
    try:
        return (date.fromisoformat(str(last_period)) + timedelta(days=1)).isoformat()
    except ValueError:
        return None
