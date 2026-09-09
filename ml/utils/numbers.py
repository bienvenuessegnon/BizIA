"""Conversions numériques tolérantes partagées par le moteur."""

from __future__ import annotations

import math
from typing import Any

MONEY_DIGITS = 2


def to_float(value: Any, default: float = 0.0) -> float:
    """Convertit n'importe quelle entrée en float fini, `default` si impossible."""
    try:
        number = float(value)
    except (TypeError, ValueError):
        return default
    if math.isnan(number) or math.isinf(number):
        return default
    return number


def money(value: Any) -> float:
    """Arrondit un montant à deux décimales."""
    return round(to_float(value), MONEY_DIGITS)


def percentage(part: Any, whole: Any) -> float:
    """`part / whole` en pourcentage, 0.0 si le dénominateur est nul."""
    denominator = to_float(whole)
    if denominator == 0.0:
        return 0.0
    return round(to_float(part) / denominator * 100, MONEY_DIGITS)


def format_amount(value: Any) -> str:
    """Montant lisible dans un texte français : `12 450`."""
    return f"{to_float(value):,.0f}".replace(",", "\u202f")
