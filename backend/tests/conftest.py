from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.store import JsonStore, set_store


@pytest.fixture(autouse=True)
def isolated_store(tmp_path: Path) -> JsonStore:
    store = JsonStore(tmp_path / "bizia.json")
    set_store(store)
    yield store
    set_store(None)


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
