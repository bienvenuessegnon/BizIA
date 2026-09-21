from typing import Any
from fastapi import APIRouter, Depends, Header

from app.schemas.common import LoginIn, RegisterIn
from app.services import auth as auth_service
from app.services import supabase_client
from app.utils.errors import ApiError

router = APIRouter()


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError(401, "missing_token", "Jeton d'authentification manquant.")
    return authorization.removeprefix("Bearer ").strip()


def current_user(authorization: str | None = Header(default=None)) -> dict[str, str]:
    return auth_service.authenticate(_bearer(authorization))


def current_company(
    user: dict[str, Any] = Depends(current_user),
    x_company_id: str | None = Header(default=None, alias="X-Company-ID"),
) -> dict[str, Any]:
    """Dépendance FastAPI pour récupérer et valider l'entreprise active de la requête.

    - Lit l'en-tête `X-Company-ID`.
    - Vérifie l'appartenance de l'utilisateur à l'entreprise (renvoie 403 si interdit).
    - Rétrocompatibilité : si l'en-tête est absent, utilise l'entreprise principale de l'utilisateur.
    """
    user_id = str(user["id"])
    if x_company_id and x_company_id.strip():
        target_id = x_company_id.strip()
        comp = supabase_client.get_company(target_id, user_id)
        if not comp:
            raise ApiError(403, "company_access_denied", "Accès refusé ou entreprise inexistante.")
        return comp

    companies = supabase_client.list_companies(user_id)
    if not companies:
        raise ApiError(404, "company_not_found", "Aucune entreprise disponible pour cet utilisateur.")
    return companies[0]


@router.post("/register", status_code=201)
def register(payload: RegisterIn) -> dict:
    return auth_service.register(
        payload.first_name, payload.last_name, payload.email, payload.password
    )


@router.post("/login")
def login(payload: LoginIn) -> dict:
    return auth_service.login(payload.email, payload.password)


@router.get("/me")
def me(authorization: str | None = Header(default=None)) -> dict:
    return {"user": current_user(authorization)}


@router.post("/logout", status_code=204)
def logout(authorization: str | None = Header(default=None)) -> None:
    auth_service.logout(_bearer(authorization))
