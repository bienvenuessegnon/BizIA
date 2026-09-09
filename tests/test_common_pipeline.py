"""Test transverse (Bienv) : le pipeline est indépendant de la source.

Quand le moteur sera implémenté, une saisie manuelle et un import CSV portant les
mêmes données doivent produire exactement les mêmes indicateurs.
"""

from ml.pipeline import analyze

PRODUCTS = [
    {
        "sku": "EAU-15L",
        "name": "Eau 1.5L",
        "unit_cost": 180,
        "unit_price": 300,
        "stock_quantity": 40,
        "low_stock_threshold": 10,
    }
]

SALES = [
    {
        "product_sku": "EAU-15L",
        "quantity": 4,
        "unit_price": 300,
        "unit_cost": 180,
        "sold_at": "2026-09-02T12:00:00+00:00",
    }
]


def test_source_does_not_change_the_contract() -> None:
    manual = analyze({"source": "manual", "products": PRODUCTS, "sales": SALES})
    imported = analyze({"source": "csv", "products": PRODUCTS, "sales": SALES})
    assert manual.keys() == imported.keys()


def test_manual_and_csv_yield_same_kpis() -> None:
    manual = analyze({"source": "manual", "products": PRODUCTS, "sales": SALES})
    imported = analyze({"source": "csv", "products": PRODUCTS, "sales": SALES})
    assert manual["kpis"] == imported["kpis"]
