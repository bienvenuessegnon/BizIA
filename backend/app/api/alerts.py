from fastapi import APIRouter

router = APIRouter()


@router.get("")
def list_alerts() -> dict:
    """TODO(uriel): alertes de la dernière analyse (stocks faibles, anomalies, seuils)."""
    return {"items": [], "status": "not_implemented"}
