"""Tests backend — squelettes (Uriel).

Vérifient que les routes du contrat existent. Les assertions métier seront
ajoutées au fur et à mesure de l'implémentation.
"""

import pytest
from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_contract_routes_exist(client: TestClient) -> None:
    assert client.get("/api/products").status_code == 200
    assert client.get("/api/sales").status_code == 200
    assert client.get("/api/alerts").status_code == 200
    assert client.get("/api/analysis/summary").status_code == 200
    assert client.post("/api/analysis/run").status_code == 200
    assert client.post("/api/chat/messages", json={"message": "test"}).status_code == 200


def test_payload_validation(client: TestClient) -> None:
    """Un payload invalide doit être rejeté par les schémas Pydantic."""
    assert client.post("/api/products", json={"sku": "X"}).status_code == 422
    assert client.post("/api/sales", json={"quantity": -1}).status_code == 422


@pytest.mark.skip(reason="TODO(uriel): implémenter produits, ventes et store")
def test_manual_entry_persists() -> None:
    ...


@pytest.mark.skip(reason="TODO(uriel): implémenter l'import CSV/Excel")
def test_import_feeds_same_store() -> None:
    ...
