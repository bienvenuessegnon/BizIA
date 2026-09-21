from fastapi import APIRouter, Depends

from app.api.auth import current_company
from app.schemas.common import ProductIn
from app.services.store import get_company_store

router = APIRouter()


@router.get("")
def list_products(company: dict = Depends(current_company)) -> dict:
    return {"items": get_company_store(company["id"]).list_products()}


@router.post("", status_code=201)
def create_product(payload: ProductIn, company: dict = Depends(current_company)) -> dict:
    item = get_company_store(company["id"]).add_product(payload.model_dump())
    return {"item": item}
