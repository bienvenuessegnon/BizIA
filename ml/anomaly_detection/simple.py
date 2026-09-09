"""Première détection d'anomalies — TODO(farid).

Piste MVP : écart type / z-score sur le CA journalier. Modèles entraînés : post-MVP.
"""

from __future__ import annotations

from typing import Any


def detect_revenue_anomalies(
    trend: list[dict[str, Any]], z_threshold: float = 2.0
) -> list[dict[str, Any]]:
    """[{"type", "period", "value", "z_score", "severity", "message"}]"""
    raise NotImplementedError("À implémenter : détection d'anomalies simple.")
