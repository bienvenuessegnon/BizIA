from fastapi import APIRouter, Depends, Path

from app.api.auth import current_user
from app.schemas.common import CompanyIn, CompanyOut, CompanyUpdate
from app.services import supabase_client
from app.utils.errors import ApiError

router = APIRouter()


@router.get("", response_model=dict)
def list_companies(user: dict = Depends(current_user)) -> dict:
    items = supabase_client.list_companies(user["id"])
    return {"items": items}


@router.post("", status_code=201, response_model=dict)
def create_company(payload: CompanyIn, user: dict = Depends(current_user)) -> dict:
    comp = supabase_client.create_company(
        user_id=user["id"],
        name=payload.name,
        category=payload.category or "Commerce Général",
        currency=payload.currency,
    )
    return {"company": comp}


@router.get("/{company_id}", response_model=dict)
def get_company(
    company_id: str = Path(...), user: dict = Depends(current_user)
) -> dict:
    comp = supabase_client.get_company(company_id=company_id, user_id=user["id"])
    if not comp:
        raise ApiError(404, "company_not_found", "Entreprise introuvable ou accès non autorisé.")
    return {"company": comp}


@router.patch("/{company_id}", response_model=dict)
def update_company(
    payload: CompanyUpdate,
    company_id: str = Path(...),
    user: dict = Depends(current_user),
) -> dict:
    updates = payload.model_dump(exclude_unset=True)
    comp = supabase_client.update_company(
        company_id=company_id, user_id=user["id"], updates=updates
    )
    if not comp:
        raise ApiError(
            403,
            "company_update_forbidden",
            "Modification non autorisée ou entreprise introuvable.",
        )
    return {"company": comp}
