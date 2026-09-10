"""Tests backend — contrat API.

Les assertions métier sont ajoutées au fur et à mesure de l'implémentation.
"""

from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_root_is_served(client: TestClient) -> None:
    """Site exporté quand il est embarqué, repère JSON vers /docs sinon."""
    response = client.get("/")
    assert response.status_code == 200


def test_contract_routes_exist(client: TestClient) -> None:
    assert client.get("/api/products").status_code == 200
    assert client.get("/api/sales").status_code == 200
    assert client.get("/api/alerts").status_code == 200
    assert client.get("/api/analysis/summary").status_code == 200
    assert client.post("/api/analysis/run").status_code == 200
    assert client.post("/api/chat/messages", json={"message": "test"}).status_code == 200


def test_payload_validation(client: TestClient) -> None:
    """Un payload invalide doit être rejeté par les schémas Pydantic."""
    response = client.post("/api/products", json={"sku": "X"})
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "validation_error"
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
    assert excel_response.json()["sales_ingested"] == 0
    assert excel_response.json()["sales_skipped_duplicate"] == 16

    listed_products = client.get("/api/products")
    listed_sales = client.get("/api/sales")
    assert len(listed_products.json()["items"]) == 5
    assert len(listed_sales.json()["items"]) == 16

    rejected = client.post(
        "/api/ingestion/files",
        files={"file": ("notes.docx", b"PK", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")},
    )
    assert rejected.status_code == 415
    assert rejected.json()["error"]["code"] == "unsupported_type"


def test_empty_analysis_contract(client: TestClient) -> None:
    summary = client.get("/api/analysis/summary")
    assert summary.status_code == 200
    assert summary.json() == {"result": None}

    alerts = client.get("/api/alerts")
    assert alerts.status_code == 200
    assert alerts.json() == {"items": []}

    ran = client.post("/api/analysis/run")
    assert ran.status_code == 200
    body = ran.json()["result"]
    assert body["kpis"]["sales_count"] == 0
    assert "forecast" not in body
    assert [alert["code"] for alert in body["alerts"]] == ["no_data"]
    assert client.get("/api/alerts").json()["items"][0]["code"] == "no_data"


def test_analysis_on_sample_import(client: TestClient) -> None:
    from app.utils.settings import REPO_ROOT

    samples = REPO_ROOT / "data" / "samples"
    client.post(
        "/api/ingestion/files",
        files={"file": ("produits.csv", samples.joinpath("produits.csv").read_bytes(), "text/csv")},
    )
    client.post(
        "/api/ingestion/files",
        files={"file": ("ventes.csv", samples.joinpath("ventes.csv").read_bytes(), "text/csv")},
    )

    ran = client.post("/api/analysis/run")
    result = ran.json()["result"]
    assert result["source"] == "csv"
    assert result["kpis"]["revenue"] == 57700.0
    assert result["kpis"]["sales_count"] == 16
    assert result["top_profit"][0]["sku"] == "RIZ-5KG"
    assert {item["sku"] for item in result["low_stock"]} == {"SAVON", "HUILE-1L"}

    summary = client.get("/api/analysis/summary")
    assert summary.json()["result"]["kpis"] == result["kpis"]
    assert len(client.get("/api/alerts").json()["items"]) == len(result["alerts"])

    forecasted = client.post("/api/analysis/run?include_forecast=true")
    assert "forecast" in forecasted.json()["result"]


def test_chat_requires_analysis_then_answers(client: TestClient) -> None:
    from app.utils.settings import REPO_ROOT

    samples = REPO_ROOT / "data" / "samples"
    ungrounded = client.post(
        "/api/chat/messages",
        json={"message": "Quel produit me rapporte le plus ?"},
    )
    assert ungrounded.status_code == 200
    assert ungrounded.json()["grounded"] is False
    assert ungrounded.json()["reply"]

    client.post(
        "/api/ingestion/files",
        files={"file": ("produits.csv", samples.joinpath("produits.csv").read_bytes(), "text/csv")},
    )
    client.post(
        "/api/ingestion/files",
        files={"file": ("ventes.csv", samples.joinpath("ventes.csv").read_bytes(), "text/csv")},
    )
    client.post("/api/analysis/run")

    best = client.post(
        "/api/chat/messages",
        json={"message": "Quel produit me rapporte le plus ?"},
    )
    assert best.status_code == 200
    body = best.json()
    assert body["grounded"] is True
    assert "RIZ" in body["reply"].upper() or "Riz" in body["reply"]
    assert "status" not in body

    pdf = client.post("/api/reports/generate?format=pdf")
    assert pdf.status_code == 200
    assert pdf.headers["content-type"] == "application/pdf"
    assert pdf.content.startswith(b"%PDF")

    docx = client.post("/api/reports/generate?format=docx")
    assert docx.status_code == 200
    assert "wordprocessingml" in docx.headers["content-type"]
    assert docx.content.startswith(b"PK")


def test_report_without_analysis(client: TestClient) -> None:
    response = client.post("/api/reports/generate")
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "no_analysis"


def test_server_auth_round_trip(client: TestClient) -> None:
    registered = client.post(
        "/api/auth/register",
        json={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ADA@example.com",
            "password": "mot-de-passe-solide",
        },
    )
    assert registered.status_code == 201
    session = registered.json()
    assert session["user"]["email"] == "ada@example.com"
    assert session["token"]

    duplicate = client.post(
        "/api/auth/register",
        json={
            "first_name": "Ada",
            "last_name": "Lovelace",
            "email": "ada@example.com",
            "password": "mot-de-passe-solide",
        },
    )
    assert duplicate.status_code == 409
    assert duplicate.json()["error"]["code"] == "email_already_used"

    bad_login = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "incorrect"},
    )
    assert bad_login.status_code == 401

    logged_in = client.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "mot-de-passe-solide"},
    )
    token = logged_in.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    assert client.get("/api/auth/me", headers=headers).json()["user"]["first_name"] == "Ada"
    assert client.post("/api/auth/logout", headers=headers).status_code == 204
    assert client.get("/api/auth/me", headers=headers).status_code == 401


def test_new_account_has_no_business_data(client: TestClient) -> None:
    created = client.post(
        "/api/products",
        json={
            "sku": "PRIVATE",
            "name": "Produit privé",
            "unit_cost": 1,
            "unit_price": 2,
            "stock_quantity": 1,
        },
    )
    assert created.status_code == 201

    second = client.post(
        "/api/auth/register",
        json={
            "first_name": "Nouveau",
            "last_name": "Compte",
            "email": "nouveau@example.com",
            "password": "mot-de-passe-solide",
        },
    ).json()
    headers = {"Authorization": f"Bearer {second['token']}"}
    assert client.get("/api/products", headers=headers).json() == {"items": []}
    assert client.get("/api/sales", headers=headers).json() == {"items": []}
    assert client.get("/api/analysis/summary", headers=headers).json() == {"result": None}


def test_import_csv_keeps_unit_price_and_revenue(client: TestClient) -> None:
    """Scénario du rapport de bug : `sku,quantite,prix_unitaire,date`."""
    client.post(
        "/api/products",
        json={
            "sku": "Piment",
            "name": "Piment",
            "unit_cost": 150,
            "unit_price": 250,
            "stock_quantity": 20,
        },
    )

    csv_content = "sku,quantite,prix_unitaire,date\nPiment,4,250,2026-09-01\n"
    imported = client.post(
        "/api/ingestion/files",
        files={"file": ("ventes.csv", csv_content.encode("utf-8"), "text/csv")},
    )
    assert imported.status_code == 200
    assert imported.json()["sales_ingested"] == 1

    sales = client.get("/api/sales").json()["items"]
    assert len(sales) == 1
    assert sales[0]["unit_price"] == 250.0
    assert sales[0]["quantity"] == 4.0

    analysis = client.post("/api/analysis/run").json()["result"]
    assert analysis["kpis"]["revenue"] == 1000.0


def test_import_preview_does_not_write_before_confirmation(client: TestClient) -> None:
    client.post(
        "/api/products",
        json={
            "sku": "Piment",
            "name": "Piment",
            "unit_cost": 150,
            "unit_price": 250,
            "stock_quantity": 20,
        },
    )
    csv_content = "sku,quantite,prix_unitaire,date\nPiment,4,250,2026-09-01\n"

    preview = client.post(
        "/api/ingestion/preview",
        files={"file": ("ventes.csv", csv_content.encode(), "text/csv")},
    )

    assert preview.status_code == 200
    body = preview.json()
    assert body["status"] == "preview"
    assert body["extraction_method"] == "local"
    assert body["document_type"] == "sales"
    assert body["sales"][0]["unit_price"] == 250
    assert client.get("/api/sales").json()["items"] == []

    committed = client.post(
        "/api/ingestion/commit",
        json={
            "filename": body["filename"],
            "source": body["source"],
            "products": body["products"],
            "sales": body["sales"],
        },
    )
    assert committed.status_code == 200
    assert committed.json()["sales_ingested"] == 1
    assert client.get("/api/sales").json()["items"][0]["unit_price"] == 250


def test_import_preview_can_be_edited_before_confirmation(client: TestClient) -> None:
    client.post(
        "/api/products",
        json={
            "sku": "Piment",
            "name": "Piment",
            "unit_cost": 150,
            "unit_price": 250,
            "stock_quantity": 20,
        },
    )
    committed = client.post(
        "/api/ingestion/commit",
        json={
            "filename": "reconnaissance.pdf",
            "source": "pdf",
            "products": [],
            "sales": [
                {
                    "product_sku": "Piment",
                    "quantity": 6,
                    "unit_price": 300,
                    "sold_at": "2026-09-05",
                }
            ],
        },
    )
    assert committed.status_code == 200
    sale = client.get("/api/sales").json()["items"][0]
    assert sale["quantity"] == 6
    assert sale["unit_price"] == 300
    assert sale["channel"] == "pdf"


def test_import_preview_pdf_uses_gemini_when_enabled(
    client: TestClient, monkeypatch
) -> None:
    from app.api import ingestion

    client.post(
        "/api/products",
        json={
            "sku": "PIMENT",
            "name": "Piment",
            "unit_cost": 150,
            "unit_price": 250,
            "stock_quantity": 20,
        },
    )
    extracted = {
        "document_type": "sales",
        "products": [],
        "sales": [
            {
                "product_sku": "PIMENT",
                "quantity": 4,
                "unit_price": 250,
                "sold_at": "2026-09-01",
            }
        ],
        "warnings": ["Date confirmée depuis le texte."],
    }
    called = {}

    def fake_extract(payload, mime_type, filename, catalog):
        called.update(
            payload=payload,
            mime_type=mime_type,
            filename=filename,
            catalog=catalog,
        )
        return extracted

    monkeypatch.setattr(ingestion, "gemini_enabled", lambda: True)
    monkeypatch.setattr(ingestion, "extract_document_with_gemini", fake_extract)

    response = client.post(
        "/api/ingestion/preview",
        files={"file": ("notes.pdf", b"%PDF-fake-for-mock", "application/pdf")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["extraction_method"] == "gemini"
    assert body["sales"][0]["channel"] == "pdf"
    assert body["warnings"] == ["Date confirmée depuis le texte."]
    assert called["mime_type"] == "application/pdf"
    assert called["catalog"][0]["sku"] == "PIMENT"
    assert client.get("/api/sales").json()["items"] == []


def test_import_commit_rejects_empty_or_invalid_rows(client: TestClient) -> None:
    empty = client.post(
        "/api/ingestion/commit",
        json={
            "filename": "vide.pdf",
            "source": "pdf",
            "products": [],
            "sales": [],
        },
    )
    assert empty.status_code == 422
    assert empty.json()["error"]["code"] == "empty_import"

    invalid = client.post(
        "/api/ingestion/commit",
        json={
            "filename": "incorrect.pdf",
            "source": "pdf",
            "products": [],
            "sales": [{"product_sku": "", "quantity": 0}],
        },
    )
    assert invalid.status_code == 422


def test_import_csv_without_price_column_uses_catalog(client: TestClient) -> None:
    client.post(
        "/api/products",
        json={
            "sku": "Piment",
            "name": "Piment",
            "unit_cost": 150,
            "unit_price": 250,
            "stock_quantity": 20,
        },
    )

    csv_content = "sku,quantite,date\nPiment,4,2026-09-01\n"
    imported = client.post(
        "/api/ingestion/files",
        files={"file": ("ventes.csv", csv_content.encode("utf-8"), "text/csv")},
    )
    assert imported.json()["sales_ingested"] == 1
    assert client.get("/api/sales").json()["items"][0]["unit_price"] == 250.0


def test_import_skips_unknown_sku(client: TestClient) -> None:
    from app.utils.settings import REPO_ROOT

    ghost = "sku,quantity,unit_price,sold_at\nGHOST,1,99,2026-01-01T00:00:00Z\n"
    response = client.post(
        "/api/ingestion/files",
        files={"file": ("orphan.csv", ghost.encode("utf-8"), "text/csv")},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["sales_ingested"] == 0
    assert body["sales_skipped_unknown"] == 1
    assert client.get("/api/sales").json()["items"] == []

    samples = REPO_ROOT / "data" / "samples"
    client.post(
        "/api/ingestion/files",
        files={"file": ("produits.csv", samples.joinpath("produits.csv").read_bytes(), "text/csv")},
    )
    retry = client.post(
        "/api/ingestion/files",
        files={"file": ("orphan.csv", ghost.encode("utf-8"), "text/csv")},
    )
    assert retry.json()["sales_skipped_unknown"] == 1
    assert client.get("/api/sales").json()["items"] == []
