"""Client et adaptateur Supabase V2 pour BizIA.

Gère la communication avec PostgreSQL / Supabase Auth et propose un repli
local transparent conforme au schéma lorsque les clés d'API ne sont pas configurées.
"""

from __future__ import annotations

import logging
from typing import Any

from app.services.store import get_store
from app.utils.settings import settings

logger = logging.getLogger(__name__)

_supabase_client = None


def is_supabase_configured() -> bool:
    return bool(settings.supabase_url.strip() and settings.supabase_anon_key.strip())


def get_supabase_client():
    global _supabase_client
    if not is_supabase_configured():
        return None
    if _supabase_client is None:
        try:
            from supabase import create_client

            key = (
                settings.supabase_service_role_key.strip()
                if settings.supabase_service_role_key.strip()
                else settings.supabase_anon_key.strip()
            )
            _supabase_client = create_client(settings.supabase_url.strip(), key)
        except Exception as err:
            logger.warning("Impossible d'initialiser le client Supabase : %s", err)
            return None
    return _supabase_client


# ==============================================================================
# Méthodes Entreprises (Multi-entreprises V2)
# ==============================================================================


def list_companies(user_id: str) -> list[dict[str, Any]]:
    client = get_supabase_client()
    if client is not None:
        try:
            res = (
                client.table("company_members")
                .select("role, companies(*)")
                .eq("user_id", user_id)
                .execute()
            )
            companies = []
            for row in res.data or []:
                c = row.get("companies") or {}
                if c:
                    c["role"] = row.get("role", "member")
                    companies.append(c)
            return companies
        except Exception as err:
            logger.error("Erreur Supabase list_companies: %s", err)

    store = get_store()
    existing = store.list_companies_for_user(user_id)
    if not existing:
        user = store.find_user_by_id(user_id)
        name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip() if user else ""
        comp = store.ensure_default_company(user_id, name)
        return [comp]
    return existing


def create_company(
    user_id: str,
    name: str,
    category: str = "Commerce Général",
    currency: str = "FCFA",
) -> dict[str, Any]:
    client = get_supabase_client()
    if client is not None:
        try:
            comp_res = (
                client.table("companies")
                .insert(
                    {
                        "name": name.strip(),
                        "category": category.strip(),
                        "currency": currency.strip(),
                        "created_by": user_id,
                    }
                )
                .execute()
            )
            if comp_res.data:
                comp = comp_res.data[0]
                client.table("company_members").insert(
                    {
                        "company_id": comp["id"],
                        "user_id": user_id,
                        "role": "owner",
                    }
                ).execute()
                comp["role"] = "owner"
                return comp
        except Exception as err:
            logger.error("Erreur Supabase create_company: %s", err)

    return get_store().create_company_for_user(user_id, name, category, currency)


def get_company(company_id: str, user_id: str) -> dict[str, Any] | None:
    client = get_supabase_client()
    if client is not None:
        try:
            member_res = (
                client.table("company_members")
                .select("role")
                .eq("company_id", company_id)
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            if member_res.data:
                comp_res = client.table("companies").select("*").eq("id", company_id).single().execute()
                if comp_res.data:
                    comp = comp_res.data
                    comp["role"] = member_res.data.get("role", "member")
                    return comp
        except Exception as err:
            logger.error("Erreur Supabase get_company: %s", err)

    return get_store().get_company_for_user(company_id, user_id)


def update_company(
    company_id: str, user_id: str, updates: dict[str, Any]
) -> dict[str, Any] | None:
    client = get_supabase_client()
    if client is not None:
        try:
            member_res = (
                client.table("company_members")
                .select("role")
                .eq("company_id", company_id)
                .eq("user_id", user_id)
                .single()
                .execute()
            )
            if not member_res.data or member_res.data.get("role") not in ("owner", "admin"):
                return None
            up_res = client.table("companies").update(updates).eq("id", company_id).execute()
            if up_res.data:
                comp = up_res.data[0]
                comp["role"] = member_res.data.get("role")
                return comp
        except Exception as err:
            logger.error("Erreur Supabase update_company: %s", err)

    return get_store().update_company_for_user(company_id, user_id, updates)
