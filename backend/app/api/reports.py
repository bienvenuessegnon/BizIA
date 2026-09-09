from fastapi import APIRouter

from app.services.store import get_store
from app.utils.errors import ApiError

router = APIRouter()


@router.post("/generate")
def generate_report() -> dict:
    analysis = get_store().get_last_analysis()
    if analysis is None:
        raise ApiError(
            400,
            "no_analysis",
            "Lancez une analyse avant d'exporter un rapport.",
        )
    return {
        "status": "ok",
        "report": {
            "kpis": analysis.get("kpis"),
            "insights": analysis.get("insights"),
            "alerts": analysis.get("alerts"),
            "recommendations": analysis.get("recommendations"),
            "top_sold": analysis.get("top_sold"),
            "top_profit": analysis.get("top_profit"),
            "low_stock": analysis.get("low_stock"),
            "trend": analysis.get("trend"),
            "anomalies": analysis.get("anomalies"),
            "week_over_week": analysis.get("week_over_week"),
        },
    }
