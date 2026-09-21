"""Tests d'isolation stricte des données multi-entreprises (V2)."""

from fastapi.testclient import TestClient

from app.main import app


def test_company_isolation_products_and_sales(client: TestClient) -> None:
    """Vérifie que les produits et ventes créés dans une entreprise sont invisibles dans une autre."""
    # 1. Créer Entreprise A
    res_a = client.post(
        "/api/companies",
        json={"name": "Dakar Tech", "category": "Informatique", "currency": "FCFA"},
    )
    assert res_a.status_code == 201
    comp_a_id = res_a.json()["company"]["id"]

    # 2. Créer Entreprise B
    res_b = client.post(
        "/api/companies",
        json={"name": "Lomé Agro", "category": "Agroalimentaire", "currency": "FCFA"},
    )
    assert res_b.status_code == 201
    comp_b_id = res_b.json()["company"]["id"]

    # 3. Ajouter un produit dans Entreprise A
    prod_a_res = client.post(
        "/api/products",
        headers={"X-Company-ID": comp_a_id},
        json={
            "sku": "LAPTOP-01",
            "name": "Ordinateur Portable",
            "category": "Informatique",
            "unit_cost": 250000,
            "unit_price": 350000,
            "stock_quantity": 10,
        },
    )
    assert prod_a_res.status_code == 201

    # 4. Ajouter un produit dans Entreprise B
    prod_b_res = client.post(
        "/api/products",
        headers={"X-Company-ID": comp_b_id},
        json={
            "sku": "SAC-RIZ-25",
            "name": "Sac de riz 25kg",
            "category": "Agroalimentaire",
            "unit_cost": 12000,
            "unit_price": 16000,
            "stock_quantity": 50,
        },
    )
    assert prod_b_res.status_code == 201

    # 5. Vérifier que le catalogue de A contient uniquement LAPTOP-01
    list_a = client.get("/api/products", headers={"X-Company-ID": comp_a_id}).json()["items"]
    skus_a = [p["sku"] for p in list_a]
    assert "LAPTOP-01" in skus_a
    assert "SAC-RIZ-25" not in skus_a

    # 6. Vérifier que le catalogue de B contient uniquement SAC-RIZ-25
    list_b = client.get("/api/products", headers={"X-Company-ID": comp_b_id}).json()["items"]
    skus_b = [p["sku"] for p in list_b]
    assert "SAC-RIZ-25" in skus_b
    assert "LAPTOP-01" not in skus_b

    # 7. Vente de LAPTOP-01 dans A réussit
    sale_a_res = client.post(
        "/api/sales",
        headers={"X-Company-ID": comp_a_id},
        json={"product_sku": "LAPTOP-01", "quantity": 1, "unit_price": 350000, "channel": "boutique"},
    )
    assert sale_a_res.status_code == 201

    # 8. Vente de LAPTOP-01 dans B échoue avec 404 (inconnu au catalogue de B)
    sale_b_err = client.post(
        "/api/sales",
        headers={"X-Company-ID": comp_b_id},
        json={"product_sku": "LAPTOP-01", "quantity": 1, "unit_price": 350000},
    )
    assert sale_b_err.status_code == 404


def test_company_access_denied_for_other_user() -> None:
    """Vérifie qu'un utilisateur ne peut pas accéder aux données d'une entreprise tierce (403)."""
    client1 = TestClient(app)
    s1 = client1.post(
        "/api/auth/register",
        json={
            "first_name": "Alice",
            "last_name": "Owner",
            "email": "alice@company-a.com",
            "password": "mot-de-passe-solide",
        },
    ).json()
    client1.headers["Authorization"] = f"Bearer {s1['token']}"

    # Alice crée son entreprise
    res = client1.post("/api/companies", json={"name": "Alice Corp"})
    assert res.status_code == 201
    alice_comp_id = res.json()["company"]["id"]

    # Bob s'inscrit
    client2 = TestClient(app)
    s2 = client2.post(
        "/api/auth/register",
        json={
            "first_name": "Bob",
            "last_name": "Intruder",
            "email": "bob@outsider.com",
            "password": "mot-de-passe-solide",
        },
    ).json()
    client2.headers["Authorization"] = f"Bearer {s2['token']}"

    # Bob tente d'accéder aux produits de l'entreprise d'Alice
    denied = client2.get("/api/products", headers={"X-Company-ID": alice_comp_id})
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "company_access_denied"


def test_fallback_to_default_company_when_header_missing(client: TestClient) -> None:
    """Si aucun X-Company-ID n'est fourni, l'API utilise l'entreprise par défaut sans erreur."""
    res = client.get("/api/products")
    assert res.status_code == 200
    assert "items" in res.json()
