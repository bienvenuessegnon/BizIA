from fastapi import APIRouter

from app.schemas.common import ProductIn
from app.services.store import get_store

router = APIRouter()


@router.get("")
def list_products() -> dict:
    return {"items": get_store().list_products()}


@router.post("", status_code=201)
def create_product(payload: ProductIn) -> dict:
    item = get_store().add_product(payload.model_dump())
    return {"item": item}
