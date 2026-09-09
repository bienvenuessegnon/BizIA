"""Prédiction simple — optionnelle, ne doit pas bloquer le MVP."""

from __future__ import annotations

from typing import Any


def naive_next_period(trend: list[dict[str, Any]]) -> dict[str, Any] | None:
    """Moyenne mobile sur les derniers jours. À faire seulement si le temps le permet."""
    raise NotImplementedError("Optionnel : prévision naïve.")
