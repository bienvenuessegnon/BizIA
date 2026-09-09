"""Première détection d'anomalies.

Piste MVP : écart type / z-score sur le CA journalier. Modèles entraînés : post-MVP.
"""

from __future__ import annotations

from typing import Any

import numpy as np

from ml.utils.numbers import format_amount, money, to_float

MIN_POINTS = 4
HIGH_SEVERITY_Z = 3.0
MEDIUM_SEVERITY_Z = 2.5


def detect_revenue_anomalies(
    trend: list[dict[str, Any]], z_threshold: float = 2.0
) -> list[dict[str, Any]]:
    """[{"type", "period", "value", "z_score", "severity", "message"}]"""
    points = [point for point in (trend or []) if isinstance(point, dict)]
    if len(points) < MIN_POINTS:
        return []

    values = np.array([to_float(point.get("revenue")) for point in points], dtype=float)
    mean = float(values.mean())
    deviation = float(values.std())
    if deviation == 0.0:
        return []

    anomalies = []
    for point, value in zip(points, values):
        z_score = (value - mean) / deviation
        if abs(z_score) < z_threshold:
            continue
        anomalies.append(_anomaly(point.get("period"), value, z_score, mean))

    return sorted(anomalies, key=lambda item: abs(item["z_score"]), reverse=True)


def _anomaly(period: Any, value: float, z_score: float, mean: float) -> dict[str, Any]:
    is_spike = z_score > 0
    label = "Pic" if is_spike else "Chute"
    direction = "au-dessus" if is_spike else "en dessous"

    return {
        "type": "revenue_spike" if is_spike else "revenue_drop",
        "period": str(period) if period is not None else "",
        "value": money(value),
        "z_score": round(z_score, 2),
        "severity": _severity(z_score),
        "message": (
            f"{label} de chiffre d'affaires le {period} : {format_amount(value)}, "
            f"nettement {direction} de la moyenne ({format_amount(mean)})."
        ),
    }


def _severity(z_score: float) -> str:
    magnitude = abs(z_score)
    if magnitude >= HIGH_SEVERITY_Z:
        return "high"
    if magnitude >= MEDIUM_SEVERITY_Z:
        return "medium"
    return "low"
