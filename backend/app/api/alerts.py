from fastapi import APIRouter

from app.services.store import get_store

router = APIRouter()


@router.get("")
def list_alerts() -> dict:
    analysis = get_store().get_last_analysis()
    if not analysis:
        return {"items": []}
    return {"items": list(analysis.get("alerts") or [])}
