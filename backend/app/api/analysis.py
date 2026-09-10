from fastapi import APIRouter, Depends, Query

from app.api.auth import current_user
from app.services.pipeline import run_analysis
from app.services.store import get_user_store

router = APIRouter()


@router.post("/run")
def analysis_run(
    include_forecast: bool = Query(default=False),
    user: dict = Depends(current_user),
) -> dict:
    result = run_analysis(include_forecast=include_forecast, user_id=user["id"])
    return {"result": result}


@router.get("/summary")
def analysis_summary(user: dict = Depends(current_user)) -> dict:
    return {"result": get_user_store(user["id"]).get_last_analysis()}
