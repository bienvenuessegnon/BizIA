"""Orchestration backend → moteur ML.

Unique endroit du backend qui appelle `ml.pipeline.analyze`, quelle que soit
l'origine des données.
"""

from __future__ import annotations

from typing import Any

from ml.pipeline import analyze

from app.services.store import get_store


def run_analysis(source: str = "manual", include_forecast: bool = False) -> dict[str, Any]:
    """store.as_dataset() → ml.analyze() → store.save_analysis()."""
    store = get_store()
    result = analyze(store.as_dataset(source), include_forecast=include_forecast)
    store.save_analysis(result)
    return result
