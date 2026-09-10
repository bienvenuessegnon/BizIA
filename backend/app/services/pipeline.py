"""Orchestration backend → moteur ML.

Unique endroit du backend qui appelle `ml.pipeline.analyze`, quelle que soit
l'origine des données.
"""

from __future__ import annotations

from typing import Any

from ml.pipeline import analyze

from app.services.gemini import enrich_analysis_with_gemini
from app.services.store import get_store, get_user_store


def run_analysis(
    source: str | None = None,
    include_forecast: bool = False,
    user_id: str | None = None,
) -> dict[str, Any]:
    """store.as_dataset() → ml.analyze() → store.save_analysis()."""
    store = get_user_store(user_id) if user_id else get_store()
    result = analyze(store.as_dataset(source), include_forecast=include_forecast)
    result = enrich_analysis_with_gemini(result)
    store.save_analysis(result)
    return result
