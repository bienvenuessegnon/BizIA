from fastapi import APIRouter

router = APIRouter()


@router.post("/generate")
def generate_report() -> dict[str, str]:
    """Rapport décisionnel — à implémenter."""
    return {"status": "pending", "detail": "Génération de rapport à implémenter"}
