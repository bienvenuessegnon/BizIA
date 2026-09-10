"""Authentification MVP persistée dans le store JSON.

Les mots de passe sont hachés avec Argon2. Les jetons de session sont opaques ;
seule leur empreinte SHA-256 est persistée.
"""

from __future__ import annotations

import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from pwdlib import PasswordHash

from app.services.store import get_store
from app.utils.errors import ApiError

password_hash = PasswordHash.recommended()
SESSION_TTL = timedelta(days=7)


def _public_user(user: dict[str, Any]) -> dict[str, str]:
    return {
        "id": str(user["id"]),
        "first_name": str(user["first_name"]),
        "last_name": str(user["last_name"]),
        "email": str(user["email"]),
    }


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _new_session(user: dict[str, Any]) -> dict[str, Any]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + SESSION_TTL
    get_store().save_session(
        {
            "user_id": user["id"],
            "token_hash": _token_hash(token),
            "expires_at": expires_at.isoformat(),
        }
    )
    return {"user": _public_user(user), "token": token, "expires_at": expires_at.isoformat()}


def register(first_name: str, last_name: str, email: str, password: str) -> dict[str, Any]:
    normalized_email = email.strip().lower()
    store = get_store()
    if store.find_user_by_email(normalized_email):
        raise ApiError(409, "email_already_used", "Cette adresse e-mail est déjà utilisée.")
    user = store.add_user(
        {
            "id": str(uuid.uuid4()),
            "first_name": first_name.strip(),
            "last_name": last_name.strip(),
            "email": normalized_email,
            "password_hash": password_hash.hash(password),
        }
    )
    return _new_session(user)


def login(email: str, password: str) -> dict[str, Any]:
    user = get_store().find_user_by_email(email.strip().lower())
    stored_hash = str(user.get("password_hash") or "") if user else ""
    if not user or not stored_hash or not password_hash.verify(password, stored_hash):
        raise ApiError(401, "invalid_credentials", "E-mail ou mot de passe incorrect.")
    return _new_session(user)


def authenticate(token: str) -> dict[str, str]:
    session = get_store().find_session(_token_hash(token))
    if not session:
        raise ApiError(401, "invalid_token", "Session invalide ou expirée.")
    expires_at = datetime.fromisoformat(str(session["expires_at"]))
    if expires_at <= datetime.now(timezone.utc):
        get_store().revoke_session(_token_hash(token))
        raise ApiError(401, "invalid_token", "Session invalide ou expirée.")
    user = get_store().find_user_by_id(str(session.get("user_id") or ""))
    if not user:
        raise ApiError(401, "invalid_token", "Utilisateur introuvable.")
    return _public_user(user)


def logout(token: str) -> None:
    get_store().revoke_session(_token_hash(token))
