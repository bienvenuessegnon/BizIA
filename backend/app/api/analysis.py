from fastapi import APIRouter, Depends, Query

from app.api.auth import current_company
from app.services.pipeline import run_analysis
from app.services.store import get_company_store

router = APIRouter()


@router.post("/run")
def analysis_run(
    include_forecast: bool = Query(default=False),
    company: dict = Depends(current_company),
) -> dict:
    result = run_analysis(include_forecast=include_forecast, company_id=company["id"])
    return {"result": result}


@router.get("/summary")
def analysis_summary(company: dict = Depends(current_company)) -> dict:
    return {"result": get_company_store(company["id"]).get_last_analysis()}
