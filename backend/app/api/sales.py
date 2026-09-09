from fastapi import APIRouter

from app.schemas.common import SaleIn

router = APIRouter()


@router.get("")
def list_sales() -> dict:
    """TODO(uriel): retourner store.list_sales()."""
    return {"items": [], "status": "not_implemented"}


@router.post("", status_code=201)
def create_sale(payload: SaleIn) -> dict:
    """TODO(uriel): valider le SKU (404 `unknown_product`), compléter unit_cost et sold_at."""
    return {"item": None, "status": "not_implemented"}
