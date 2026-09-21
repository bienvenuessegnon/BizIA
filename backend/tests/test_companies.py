"""Tests pour la gestion des entreprises (Multi-entreprises V2)."""

from fastapi.testclient import TestClient

from app.main import app


def test_list_companies_creates_default(client: TestClient) -> None:
    response = client.get("/api/companies")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert len(data["items"]) >= 1
    first = data["items"][0]
    assert first["role"] == "owner"
    assert "name" in first


def test_create_company(client: TestClient) -> None:
    payload = {
        "name": "Dakar High-Tech SARL",
        "category": "Informatique",
        "currency": "FCFA",
    }
    response = client.post("/api/companies", json=payload)
    assert response.status_code == 201
    created = response.json()["company"]
    assert created["name"] == "Dakar High-Tech SARL"
    assert created["role"] == "owner"
    assert created["category"] == "Informatique"

    # Vérifier qu'elle est listée
    list_res = client.get("/api/companies")
    items = list_res.json()["items"]
    assert any(c["id"] == created["id"] for c in items)


def test_get_and_update_company(client: TestClient) -> None:
    create_res = client.post(
        "/api/companies",
        json={"name": "Lomé Agro", "category": "Agroalimentaire"},
    )
    assert create_res.status_code == 201
    comp_id = create_res.json()["company"]["id"]

    # Lecture individuelle
    get_res = client.get(f"/api/companies/{comp_id}")
    assert get_res.status_code == 200
    assert get_res.json()["company"]["name"] == "Lomé Agro"

    # Mise à jour
    patch_res = client.patch(
        f"/api/companies/{comp_id}",
        json={"name": "Lomé Agro & Distribution", "currency": "EUR"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()["company"]
    assert updated["name"] == "Lomé Agro & Distribution"
    assert updated["currency"] == "EUR"


def test_unauthenticated_access_denied() -> None:
    anon_client = TestClient(app)
    response = anon_client.get("/api/companies")
    assert response.status_code == 401
