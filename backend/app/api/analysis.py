from fastapi import APIRouter, Query

router = APIRouter()


@router.post("/run")
def analysis_run(include_forecast: bool = Query(default=False)) -> dict:
    """TODO(uriel): appeler services.pipeline.run_analysis (unique appel au moteur ML)."""
    return {"status": "not_implemented", "result": None}


@router.get("/summary")
def analysis_summary() -> dict:
    """TODO(uriel): retourner store.get_last_analysis()."""
    return {"status": "not_implemented", "result": None}
