"""Jeu de données de référence partagé par les tests du moteur.

Chiffres attendus : CA 1090, coût 700, bénéfice 390, 11 unités, 4 ventes.
"""

import pytest

PRODUCTS = [
    {
        "sku": "A",
        "name": "Produit A",
        "category": "Test",
        "unit_cost": 100,
        "unit_price": 150,
        "stock_quantity": 2,
        "low_stock_threshold": 5,
    },
    {
        "sku": "B",
        "name": "Produit B",
        "category": "Test",
        "unit_cost": 50,
        "unit_price": 80,
        "stock_quantity": 100,
        "low_stock_threshold": 10,
    },
]

SALES = [
    {"product_sku": "A", "quantity": 2, "unit_price": 150, "sold_at": "2026-01-01T09:00:00+00:00"},
    {"product_sku": "B", "quantity": 5, "unit_price": 80, "sold_at": "2026-01-02T09:00:00+00:00"},
    {"product_sku": "A", "quantity": 1, "unit_price": 150, "sold_at": "2026-01-03T09:00:00+00:00"},
    {"product_sku": "B", "quantity": 3, "unit_price": 80, "sold_at": "2026-01-04T09:00:00+00:00"},
]


@pytest.fixture
def dataset() -> dict:
    return {
        "source": "manual",
        "products": [dict(product) for product in PRODUCTS],
        "sales": [dict(sale) for sale in SALES],
    }
