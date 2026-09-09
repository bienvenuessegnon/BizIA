"""Analyse des jeux d'exemple versionnés (`data/samples/`).

Ces fichiers sont ceux de la démo : ils valident le moteur sur des données
réalistes, avec les types tels qu'ils arrivent d'un CSV (tout en texte) et d'un
Excel (entiers déjà typés).
"""

from __future__ import annotations

import csv
from pathlib import Path

import pandas as pd
import pytest

from ml.pipeline import analyze

SAMPLES = Path(__file__).resolve().parents[2] / "data" / "samples"

EXPECTED_KPIS = {
    "revenue": 57700.0,
    "cost": 38600.0,
    "profit": 19100.0,
    "margin_pct": 33.1,
    "units_sold": 84.0,
    "sales_count": 16,
}


@pytest.fixture
def products() -> list[dict]:
    with (SAMPLES / "produits.csv").open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


@pytest.fixture
def csv_sales() -> list[dict]:
    with (SAMPLES / "ventes.csv").open(encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


@pytest.fixture
def excel_sales() -> list[dict]:
    frame = pd.read_excel(SAMPLES / "ventes.xlsx")
    return frame.to_dict(orient="records")


def test_sample_kpis(products: list[dict], csv_sales: list[dict]) -> None:
    result = analyze({"source": "csv", "products": products, "sales": csv_sales})

    assert result["kpis"] == EXPECTED_KPIS


def test_sample_rankings_and_stock(products: list[dict], csv_sales: list[dict]) -> None:
    result = analyze({"source": "csv", "products": products, "sales": csv_sales})

    assert result["top_sold"][0]["sku"] == "EAU-15L"
    assert result["top_profit"][0]["sku"] == "RIZ-5KG"
    assert {item["sku"] for item in result["low_stock"]} == {"SAVON", "HUILE-1L"}


def test_sample_trend_is_continuous(products: list[dict], csv_sales: list[dict]) -> None:
    trend = analyze({"source": "csv", "products": products, "sales": csv_sales})["trend"]

    # 25 août → 8 septembre, sans trou
    assert len(trend) == 15
    assert trend[0]["period"] == "2026-08-25"
    assert trend[-1]["period"] == "2026-09-08"
    assert sum(point["revenue"] for point in trend) == EXPECTED_KPIS["revenue"]


def test_sample_anomaly_and_narrative(products: list[dict], csv_sales: list[dict]) -> None:
    result = analyze({"source": "csv", "products": products, "sales": csv_sales})

    assert [anomaly["period"] for anomaly in result["anomalies"]] == ["2026-08-26"]
    assert result["anomalies"][0]["severity"] == "high"
    assert result["alerts"] and result["insights"] and result["recommendations"]


def test_csv_and_excel_samples_agree(
    products: list[dict], csv_sales: list[dict], excel_sales: list[dict]
) -> None:
    """Mêmes lignes en CSV (texte) et en Excel (entiers) → mêmes résultats."""
    from_csv = analyze({"source": "csv", "products": products, "sales": csv_sales})
    from_excel = analyze({"source": "excel", "products": products, "sales": excel_sales})

    assert from_csv["kpis"] == from_excel["kpis"]
    assert from_csv["trend"] == from_excel["trend"]
    assert from_csv["anomalies"] == from_excel["anomalies"]
    assert from_csv["insights"] == from_excel["insights"]
