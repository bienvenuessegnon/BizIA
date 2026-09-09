"""Tests backend — contrat API.

Les assertions métier sont ajoutées au fur et à mesure de l'implémentation.
"""

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


def test_manual_entry_persists(client: TestClient) -> None:
    created = client.post(
        "/api/products",
        json={
            "sku": "HUILE-1L",
            "name": "Huile 1L",
            "category": "Épicerie",
            "unit_cost": 1000,
            "unit_price": 1500,
            "stock_quantity": 4,
        },
    )
    assert created.status_code == 201
    product = created.json()["item"]
    assert product["id"]
    assert product["sku"] == "HUILE-1L"
    assert product["low_stock_threshold"] == 5
    assert "status" not in created.json()

    listed = client.get("/api/products")
    assert listed.status_code == 200
    assert len(listed.json()["items"]) == 1

    unknown = client.post(
        "/api/sales",
        json={"product_sku": "INCONNU", "quantity": 1, "unit_price": 10},
    )
    assert unknown.status_code == 404
    assert unknown.json()["error"]["code"] == "unknown_product"

    sale = client.post(
        "/api/sales",
        json={
            "product_sku": "huile-1l",
            "quantity": 3,
            "unit_price": 1500,
            "unit_cost": None,
            "sold_at": None,
        },
    )
    assert sale.status_code == 201
    item = sale.json()["item"]
    assert item["product_sku"] == "HUILE-1L"
    assert item["unit_cost"] == 1000.0
    assert item["sold_at"]
    assert item["channel"] == "manual"

    sales = client.get("/api/sales")
    assert sales.status_code == 200
    assert len(sales.json()["items"]) == 1


def test_import_feeds_same_store(client: TestClient) -> None:
    from app.utils.settings import REPO_ROOT

    samples = REPO_ROOT / "data" / "samples"

    products_response = client.post(
        "/api/ingestion/files",
        files={"file": ("produits.csv", samples.joinpath("produits.csv").read_bytes(), "text/csv")},
    )
    assert products_response.status_code == 200
    products_body = products_response.json()
    assert products_body["status"] == "accepted"
    assert products_body["source"] == "csv"
    assert products_body["products_ingested"] == 5
    assert products_body["sales_ingested"] == 0

    sales_response = client.post(
        "/api/ingestion/files",
        files={"file": ("ventes.csv", samples.joinpath("ventes.csv").read_bytes(), "text/csv")},
    )
    assert sales_response.status_code == 200
    assert sales_response.json()["sales_ingested"] == 16

    excel_response = client.post(
        "/api/ingestion/files",
        files={
            "file": (
                "ventes.xlsx",
                samples.joinpath("ventes.xlsx").read_bytes(),
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
        },
    )
    assert excel_response.status_code == 200
    assert excel_response.json()["source"] == "excel"
    assert excel_response.json()["sales_ingested"] == 16

    listed_products = client.get("/api/products")
    listed_sales = client.get("/api/sales")
    assert len(listed_products.json()["items"]) == 5
    assert len(listed_sales.json()["items"]) == 32

    rejected = client.post(
        "/api/ingestion/files",
        files={"file": ("notes.pdf", b"%PDF-fake", "application/pdf")},
    )
    assert rejected.status_code == 415
    assert rejected.json()["error"]["code"] == "unsupported_type"
