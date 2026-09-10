from fastapi import APIRouter, Depends

from app.api.auth import current_user
from app.schemas.common import SaleIn
from app.services.store import get_user_store
from app.utils.errors import ApiError

router = APIRouter()


@router.get("")
def list_sales(user: dict = Depends(current_user)) -> dict:
    return {"items": get_user_store(user["id"]).list_sales()}


@router.post("", status_code=201)
def create_sale(payload: SaleIn, user: dict = Depends(current_user)) -> dict:
    store = get_user_store(user["id"])
    sku = payload.product_sku.strip()
    if store.get_product(sku) is None:
        raise ApiError(
            404,
            "unknown_product",
            f"Aucun produit avec le SKU {sku}.",
        )

    data = payload.model_dump()
    if not data.get("channel"):
        data["channel"] = "manual"
    return {"item": store.add_sale(data)}
