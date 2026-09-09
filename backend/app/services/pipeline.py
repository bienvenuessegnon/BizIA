"""Orchestration backend → moteur ML — TODO(uriel).

Unique endroit du backend qui appelle `ml.pipeline.analyze`, quelle que soit
l'origine des données.
"""

from __future__ import annotations

from typing import Any


def run_analysis(source: str = "manual", include_forecast: bool = False) -> dict[str, Any]:
    """store.as_dataset() → ml.analyze() → store.save_analysis()."""
    raise NotImplementedError("À implémenter : brancher le store sur le moteur ML.")
