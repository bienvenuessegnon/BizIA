from fastapi import APIRouter

from app.schemas.common import ProductIn

router = APIRouter()


@router.get("")
def list_products() -> dict:
    """TODO(uriel): retourner store.list_products()."""
    return {"items": [], "status": "not_implemented"}


@router.post("", status_code=201)
def create_product(payload: ProductIn) -> dict:
    """TODO(uriel): store.add_product(payload.model_dump())."""
    return {"item": None, "status": "not_implemented"}
