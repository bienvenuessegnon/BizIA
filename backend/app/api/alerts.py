from fastapi import APIRouter, Depends

from app.api.auth import current_user
from app.services.store import get_user_store

router = APIRouter()


@router.get("")
def list_alerts(user: dict = Depends(current_user)) -> dict:
    analysis = get_user_store(user["id"]).get_last_analysis()
    if not analysis:
        return {"items": []}
    return {"items": list(analysis.get("alerts") or [])}
