from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
def generate_report() -> dict:
    """TODO(bienv): synthèse KPI + insights + recommandations, si retenue dans le MVP."""
    return {"status": "not_implemented", "report": None}
