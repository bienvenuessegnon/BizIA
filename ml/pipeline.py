"""Point d'entrée du moteur d'analyse.

Contrat de sortie figé (voir docs/api/README.md) : le backend et le frontend
codent déjà contre cette forme.
"""

from __future__ import annotations

from typing import Any

from ml.analysis.insights import build_alerts, build_insights, build_recommendations
from ml.analysis.kpis import compute_kpis, low_stock, product_rankings
from ml.analysis.trends import daily_revenue_trend, week_over_week
from ml.anomaly_detection.simple import detect_revenue_anomalies
from ml.forecasting.naive import naive_next_period
from ml.preprocessing.clean import clean_dataset


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

    Le moteur ignore la source : `manual`, `csv` et `excel` portant les mêmes
    lignes produisent exactement les mêmes indicateurs.

    `include_forecast=True` ajoute une clé `forecast` (moyenne mobile). Elle est
    absente par défaut pour ne rien changer au contrat de sortie existant.
    """
    cleaned = clean_dataset(dataset if isinstance(dataset, dict) else {})

    result = empty_result(cleaned["source"])
    result["kpis"] = compute_kpis(cleaned)

    rankings = product_rankings(cleaned)
    result["top_sold"] = rankings["top_sold"]
    result["top_profit"] = rankings["top_profit"]
    result["low_stock"] = low_stock(cleaned)

    result["trend"] = daily_revenue_trend(cleaned)
    result["week_over_week"] = week_over_week(result["trend"])
    result["anomalies"] = detect_revenue_anomalies(result["trend"])

    result["alerts"] = build_alerts(result, cleaned)
    result["insights"] = build_insights(result)
    result["recommendations"] = build_recommendations(result)

    if include_forecast:
        result["forecast"] = naive_next_period(result["trend"])

    return result
