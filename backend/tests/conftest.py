from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import supabase_client
from app.services.store import JsonStore, set_store
from app.utils.settings import settings


@pytest.fixture(autouse=True)
def isolated_store(tmp_path: Path) -> JsonStore:
    store = JsonStore(tmp_path / "bizia.json")
    set_store(store)
    old_url = settings.supabase_url
    settings.supabase_url = ""
    old_client = supabase_client._supabase_client
    supabase_client._supabase_client = None
    yield store
    set_store(None)
    settings.supabase_url = old_url
    supabase_client._supabase_client = old_client


@pytest.fixture
def client() -> TestClient:
    client = TestClient(app)
    session = client.post(
        "/api/auth/register",
        json={
            "first_name": "Test",
            "last_name": "User",
            "email": "test@example.com",
            "password": "mot-de-passe-solide",
        },
    ).json()
    client.headers["Authorization"] = f"Bearer {session['token']}"
    return client
