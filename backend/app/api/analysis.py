from fastapi import APIRouter, Query

from app.services.pipeline import run_analysis
from app.services.store import get_store

router = APIRouter()


@router.post("/run")
def analysis_run(include_forecast: bool = Query(default=False)) -> dict:
    result = run_analysis(include_forecast=include_forecast)
    return {"result": result}


@router.get("/summary")
def analysis_summary() -> dict:
    return {"result": get_store().get_last_analysis()}
