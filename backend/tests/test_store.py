"""Persistance JSON — étape store uniquement."""

from datetime import datetime, timezone
from pathlib import Path

from ml.pipeline import analyze

from app.services.store import JsonStore
from app.utils.settings import settings


def _store(tmp_path: Path) -> JsonStore:
    return JsonStore(tmp_path / "bizia.json")


def test_empty_dataset_shape(tmp_path: Path) -> None:
    dataset = _store(tmp_path).as_dataset("manual")
    assert dataset == {"source": "manual", "products": [], "sales": []}


def test_add_product_persists_across_instances(tmp_path: Path) -> None:
    path = tmp_path / "bizia.json"
    first = JsonStore(path)
    created = first.add_product(
        {
            "sku": "HUILE-1L",
            "name": "Huile 1L",
            "category": "Épicerie",
            "unit_cost": "1000",
            "unit_price": 1500,
            "stock_quantity": 4,
        }
    )
    assert created["id"]
    assert created["low_stock_threshold"] == settings.default_low_stock_threshold

    reloaded = JsonStore(path)
    products = reloaded.list_products()
    assert len(products) == 1
    assert products[0]["sku"] == "HUILE-1L"
    assert products[0]["unit_cost"] == 1000.0
    assert products[0]["id"] == created["id"]


def test_upsert_product_by_sku_case_insensitive(tmp_path: Path) -> None:
    store = _store(tmp_path)
    first = store.add_product(
        {"sku": "HUILE-1L", "name": "Huile", "unit_cost": 1000, "unit_price": 1500, "stock_quantity": 4}
    )
    updated = store.add_product(
        {
            "sku": "huile-1l",
            "name": "Huile végétale 1L",
            "unit_cost": 1100,
            "unit_price": 1600,
            "stock_quantity": 2,
            "low_stock_threshold": 8,
        }
    )
    products = store.list_products()
    assert len(products) == 1
    assert products[0]["id"] == first["id"] == updated["id"]
    assert products[0]["sku"] == "huile-1l"
    assert products[0]["name"] == "Huile végétale 1L"
    assert products[0]["low_stock_threshold"] == 8.0


def test_explicit_zero_threshold_is_kept(tmp_path: Path) -> None:
    store = _store(tmp_path)
    product = store.add_product(
        {
            "sku": "X",
            "name": "X",
            "unit_cost": 1,
            "unit_price": 2,
            "stock_quantity": 1,
            "low_stock_threshold": 0,
        }
    )
    assert product["low_stock_threshold"] == 0.0


def test_add_sale_fills_cost_sold_at_and_catalog_sku(tmp_path: Path) -> None:
    store = _store(tmp_path)
    store.add_product(
        {"sku": "HUILE-1L", "name": "Huile", "unit_cost": 1000, "unit_price": 1500, "stock_quantity": 4}
    )
    sale = store.add_sale(
        {"product_sku": "huile-1l", "quantity": 3, "unit_price": "1500", "unit_cost": None, "sold_at": None}
    )
    assert sale["product_sku"] == "HUILE-1L"
    assert sale["unit_cost"] == 1000.0
    assert sale["quantity"] == 3.0
    datetime.fromisoformat(sale["sold_at"])
    assert len(store.list_sales()) == 1


def test_extend_dataset_merges_into_same_store(tmp_path: Path) -> None:
    store = _store(tmp_path)
    store.add_product(
        {"sku": "HUILE-1L", "name": "Huile", "unit_cost": 1000, "unit_price": 1500, "stock_quantity": 4}
    )
    store.extend_dataset(
        products=[
            {
                "sku": "RIZ-5KG",
                "name": "Riz 5kg",
                "unit_cost": 2200,
                "unit_price": 3000,
                "stock_quantity": 18,
                "low_stock_threshold": 6,
            }
        ],
        sales=[
            {
                "product_sku": "RIZ-5KG",
                "quantity": 1,
                "unit_price": 3000,
                "sold_at": "2026-08-26T16:00:00+00:00",
                "channel": "csv",
            }
        ],
    )
    assert {item["sku"] for item in store.list_products()} == {"HUILE-1L", "RIZ-5KG"}
    assert len(store.list_sales()) == 1
    dataset = store.as_dataset()
    assert dataset["source"] == "csv"
    assert len(dataset["products"]) == 2
    assert store.last_source() == "csv"


def test_extend_skips_unknown_and_duplicate_sales(tmp_path: Path) -> None:
    store = _store(tmp_path)
    store.add_product(
        {"sku": "HUILE-1L", "name": "Huile", "unit_cost": 1000, "unit_price": 1500, "stock_quantity": 4}
    )
    sale = {
        "product_sku": "HUILE-1L",
        "quantity": 1,
        "unit_price": 1500,
        "sold_at": "2026-08-26T16:00:00+00:00",
        "channel": "csv",
    }
    first = store.extend_dataset(products=[], sales=[sale, {"product_sku": "GHOST", "quantity": 1, "unit_price": 1}], source="csv")
    assert first["sales_ingested"] == 1
    assert first["sales_skipped_unknown"] == 1
    second = store.extend_dataset(products=[], sales=[sale], source="excel")
    assert second["sales_ingested"] == 0
    assert second["sales_skipped_duplicate"] == 1
    assert len(store.list_sales()) == 1
    assert store.last_source() == "csv"


def test_save_and_get_last_analysis(tmp_path: Path) -> None:
    store = _store(tmp_path)
    assert store.get_last_analysis() is None
    store.save_analysis({"kpis": {"revenue": 10.0}})
    assert store.get_last_analysis() == {"kpis": {"revenue": 10.0}}
    store.get_last_analysis()["kpis"]["revenue"] = 0
    assert store.get_last_analysis()["kpis"]["revenue"] == 10.0


def test_as_dataset_is_accepted_by_ml_engine(tmp_path: Path) -> None:
    store = _store(tmp_path)
    store.add_product(
        {
            "sku": "A",
            "name": "Produit A",
            "category": "Test",
            "unit_cost": 100,
            "unit_price": 150,
            "stock_quantity": 2,
            "low_stock_threshold": 5,
        }
    )
    store.add_sale(
        {
            "product_sku": "A",
            "quantity": 2,
            "unit_price": 150,
            "sold_at": datetime(2026, 1, 1, 9, 0, tzinfo=timezone.utc),
            "channel": "manual",
        }
    )
    result = analyze(store.as_dataset("manual"))
    assert result["kpis"]["revenue"] == 300.0
    assert result["kpis"]["sales_count"] == 1
