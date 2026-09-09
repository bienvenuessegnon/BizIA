from fastapi import APIRouter

router = APIRouter()


@router.get("/summary")
def analysis_summary() -> dict[str, str]:
    """Analyse auto, anomalies, tendances, prédictions — app.analysis."""
    return {"status": "pending", "detail": "Analyse à implémenter"}
