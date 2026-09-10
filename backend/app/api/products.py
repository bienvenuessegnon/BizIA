from fastapi import APIRouter, Depends

from app.api.auth import current_user
from app.schemas.common import ProductIn
from app.services.store import get_user_store

router = APIRouter()


@router.get("")
def list_products(user: dict = Depends(current_user)) -> dict:
    return {"items": get_user_store(user["id"]).list_products()}


@router.post("", status_code=201)
def create_product(payload: ProductIn, user: dict = Depends(current_user)) -> dict:
    item = get_user_store(user["id"]).add_product(payload.model_dump())
    return {"item": item}
