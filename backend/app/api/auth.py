from fastapi import APIRouter, Header

from app.schemas.common import LoginIn, RegisterIn
from app.services import auth as auth_service
from app.utils.errors import ApiError

router = APIRouter()


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise ApiError(401, "missing_token", "Jeton d'authentification manquant.")
    return authorization.removeprefix("Bearer ").strip()


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
    return {"user": auth_service.authenticate(_bearer(authorization))}


@router.post("/logout", status_code=204)
def logout(authorization: str | None = Header(default=None)) -> None:
    auth_service.logout(_bearer(authorization))
