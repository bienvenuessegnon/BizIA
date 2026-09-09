from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.services.ingestion import IngestionError, parse_tabular
from app.utils.settings import REPO_ROOT

SAMPLES = REPO_ROOT / "data" / "samples"


def test_parse_sample_products() -> None:
    products, sales = parse_tabular(str(SAMPLES / "produits.csv"), "produits.csv")
    assert sales == []
    assert len(products) == 5
    assert products[0]["sku"] == "HUILE-1L"
    assert products[0]["low_stock_threshold"] == 5


def test_parse_sample_sales_csv() -> None:
    products, sales = parse_tabular(str(SAMPLES / "ventes.csv"), "ventes.csv")
    assert products == []
    assert len(sales) == 16
    assert sales[0]["product_sku"] == "HUILE-1L"
    assert sales[0]["sold_at"]


def test_parse_sample_sales_excel() -> None:
    products, sales = parse_tabular(str(SAMPLES / "ventes.xlsx"), "ventes.xlsx")
    assert products == []
    assert len(sales) == 16


def test_french_aliases(tmp_path: Path) -> None:
    path = tmp_path / "ventes.csv"
    path.write_text("produit,qte,prix,date\nHUILE-1L,3,1500,2026-08-25T09:00:00+00:00\n", encoding="utf-8")
    products, sales = parse_tabular(str(path), "ventes.csv")
    assert products == []
    assert sales[0]["product_sku"] == "HUILE-1L"
    assert sales[0]["quantity"] == 3
    assert sales[0]["unit_price"] == 1500
    assert sales[0]["channel"] == "csv"


def test_unsupported_type(tmp_path: Path) -> None:
    path = tmp_path / "notes.pdf"
    path.write_bytes(b"%PDF")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "notes.pdf")
    assert error.value.code == "unsupported_type"
    assert error.value.status_code == 415


def test_unknown_schema(tmp_path: Path) -> None:
    path = tmp_path / "misc.csv"
    path.write_text("foo,bar\n1,2\n", encoding="utf-8")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "misc.csv")
    assert error.value.code == "unknown_schema"
    assert error.value.status_code == 422


def test_parse_error(tmp_path: Path) -> None:
    path = tmp_path / "broken.xlsx"
    path.write_bytes(b"ceci n'est pas un excel")
    with pytest.raises(IngestionError) as error:
        parse_tabular(str(path), "broken.xlsx")
    assert error.value.code == "parse_error"
    assert error.value.status_code == 400
