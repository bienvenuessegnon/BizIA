"""Point d'entrée du moteur d'analyse — à implémenter par Farid.

Contrat de sortie figé (voir docs/api/README.md) : le backend et le frontend
codent déjà contre cette forme.
"""

from __future__ import annotations

from typing import Any


def empty_result(source: str = "unknown") -> dict[str, Any]:
    """Forme exacte du résultat attendu par le backend."""
    return {
        "source": source,
        "kpis": {
            "revenue": 0.0,
            "cost": 0.0,
            "profit": 0.0,
            "margin_pct": 0.0,
            "units_sold": 0.0,
            "sales_count": 0,
        },
        "top_sold": [],
        "top_profit": [],
        "low_stock": [],
        "trend": [],
        "week_over_week": None,
        "anomalies": [],
        "alerts": [],
        "insights": [],
        "recommendations": [],
    }


def analyze(dataset: dict[str, Any], include_forecast: bool = False) -> dict[str, Any]:
    """Schéma commun → résultats structurés.

    Étapes attendues :
    1. `preprocessing.clean_dataset`
    2. `analysis.kpis` (CA, bénéfice, marges, stocks, classements)
    3. `analysis.trends`
    4. `anomaly_detection`
    5. alertes / insights / recommandations
    6. `forecasting` seulement si `include_forecast` et si le temps le permet

    TODO(farid): implémenter. Retourne pour l'instant la forme vide du contrat.
    """
    return empty_result(dataset.get("source", "unknown"))
