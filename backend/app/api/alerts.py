from fastapi import APIRouter, Depends

from app.api.auth import current_company
from app.services.store import get_company_store

router = APIRouter()


@router.get("")
def list_alerts(company: dict = Depends(current_company)) -> dict:
    analysis = get_company_store(company["id"]).get_last_analysis()
    if not analysis:
        return {"items": []}
    return {"items": list(analysis.get("alerts") or [])}
