"""Tests du moteur d'analyse (Farid)."""

from ml.pipeline import analyze, empty_result
from ml.preprocessing.clean import clean_dataset


def test_result_contract_shape() -> None:
    """Le contrat de sortie doit rester stable pour le backend et le frontend."""
    result = analyze({"source": "manual", "products": [], "sales": []})
    for key in empty_result():
        assert key in result
    for key in ("revenue", "cost", "profit", "margin_pct", "units_sold", "sales_count"):
        assert key in result["kpis"]


def test_clean_dataset() -> None:
    """Doublons, SKU inconnus, champs manquants et lignes invalides."""
    cleaned = clean_dataset(
        {
            "source": "csv",
            "products": [
                {"sku": " A ", "name": "Ancien nom", "unit_cost": 100, "unit_price": 150},
                {"sku": "A", "name": "Produit A", "unit_cost": 120, "unit_price": 150},
            ],
            "sales": [
                # casse différente du catalogue et coût absent
                {"product_sku": "a", "quantity": 2, "unit_price": 150, "sold_at": "2026-01-01T09:00:00+00:00"},
                # doublon exact du précédent : double import
                {"product_sku": "a", "quantity": 2, "unit_price": 150, "sold_at": "2026-01-01T09:00:00+00:00"},
                # quantité nulle, produit manquant, date illisible
                {"product_sku": "A", "quantity": 0, "unit_price": 150, "sold_at": "2026-01-02T09:00:00+00:00"},
                {"product_sku": None, "quantity": 3, "unit_price": 150, "sold_at": "2026-01-02T09:00:00+00:00"},
                {"product_sku": "A", "quantity": 1, "unit_price": None, "sold_at": "pas une date"},
            ],
        }
    )

    assert [product["sku"] for product in cleaned["products"]] == ["A"]
    assert cleaned["products"][0]["name"] == "Produit A"
    assert cleaned["products"][0]["unit_cost"] == 120.0
    assert cleaned["products"][0]["low_stock_threshold"] == 0.0

    assert len(cleaned["sales"]) == 2
    first, second = cleaned["sales"]
    assert first["product_sku"] == "A"
    assert first["unit_cost"] == 120.0
    assert first["channel"] == "csv"
    # prix repris du catalogue, date illisible ramenée à la vente connue la plus récente
    assert second["unit_price"] == 150.0
    assert second["sold_at"] == first["sold_at"]


def test_duplicate_product_keeps_known_values() -> None:
    """Un réimport avec des colonnes vides met à jour sans effacer l'existant."""
    cleaned = clean_dataset(
        {
            "source": "csv",
            "products": [
                {
                    "sku": "A",
                    "name": "Produit A",
                    "unit_cost": 100,
                    "unit_price": 150,
                    "stock_quantity": 20,
                    "low_stock_threshold": 5,
                },
                {"sku": "a", "name": "", "unit_cost": "", "unit_price": 180},
            ],
        }
    )

    assert len(cleaned["products"]) == 1
    product = cleaned["products"][0]
    # la casse du catalogue ne se dégrade pas vers celle du fichier réimporté
    assert product["sku"] == "A"
    assert product["unit_price"] == 180.0
    assert product["name"] == "Produit A"
    assert product["unit_cost"] == 100.0
    assert product["stock_quantity"] == 20.0


def test_clean_dataset_survives_garbage_input() -> None:
    cleaned = clean_dataset({"source": "hacked", "products": "nope", "sales": [None, 42]})
    assert cleaned == {"source": "unknown", "products": [], "sales": []}


def test_compute_kpis(dataset: dict) -> None:
    """CA, bénéfice et marges sur un jeu de données aux totaux connus."""
    kpis = analyze(dataset)["kpis"]

    assert kpis["revenue"] == 1090.0
    assert kpis["cost"] == 700.0
    assert kpis["profit"] == 390.0
    assert kpis["margin_pct"] == 35.78
    assert kpis["units_sold"] == 11.0
    assert kpis["sales_count"] == 4


def test_rankings_and_low_stock(dataset: dict) -> None:
    result = analyze(dataset)

    assert [item["sku"] for item in result["top_sold"]] == ["B", "A"]
    assert [item["sku"] for item in result["top_profit"]] == ["B", "A"]
    assert result["top_profit"][0]["profit"] == 240.0
    assert [item["sku"] for item in result["low_stock"]] == ["A"]


def test_trends_and_anomalies(dataset: dict) -> None:
    """Série journalière continue, comparaison de périodes et journée atypique."""
    dataset["sales"].append(
        {
            "product_sku": "B",
            "quantity": 200,
            "unit_price": 80,
            "sold_at": "2026-01-06T09:00:00+00:00",
        }
    )
    result = analyze(dataset)

    periods = [point["period"] for point in result["trend"]]
    assert periods == [
        "2026-01-01",
        "2026-01-02",
        "2026-01-03",
        "2026-01-04",
        "2026-01-05",
        "2026-01-06",
    ]
    # le 5 janvier n'a aucune vente : il apparaît quand même, à zéro
    assert result["trend"][4]["revenue"] == 0.0

    assert result["week_over_week"]["delta"] > 0
    assert [anomaly["period"] for anomaly in result["anomalies"]] == ["2026-01-06"]
    assert result["anomalies"][0]["type"] == "revenue_spike"


def test_alerts_insights_and_recommendations(dataset: dict) -> None:
    result = analyze(dataset)

    codes = {alert["code"] for alert in result["alerts"]}
    assert "low_stock" in codes
    assert all(alert["severity"] in ("low", "medium", "high") for alert in result["alerts"])

    assert result["insights"]
    assert all(isinstance(insight, str) for insight in result["insights"])
    assert all(
        set(recommendation) == {"priority", "action", "why"}
        for recommendation in result["recommendations"]
    )


def test_empty_dataset_reports_no_data() -> None:
    result = analyze({"source": "manual", "products": [], "sales": []})

    assert result["kpis"] == empty_result()["kpis"]
    assert [alert["code"] for alert in result["alerts"]] == ["no_data"]
    assert result["insights"] == ["Aucune vente exploitable : tous les indicateurs sont à zéro."]


def test_unknown_product_is_flagged(dataset: dict) -> None:
    dataset["sales"].append(
        {
            "product_sku": "FANTOME",
            "quantity": 1,
            "unit_price": 500,
            "sold_at": "2026-01-05T09:00:00+00:00",
        }
    )
    result = analyze(dataset)

    assert "unknown_product" in {alert["code"] for alert in result["alerts"]}


def test_source_does_not_change_the_numbers(dataset: dict) -> None:
    """Saisie manuelle et import doivent donner exactement les mêmes indicateurs."""
    manual = analyze({**dataset, "source": "manual"})
    imported = analyze({**dataset, "source": "csv"})

    assert manual["source"] == "manual"
    assert imported["source"] == "csv"
    for key in ("kpis", "top_sold", "top_profit", "low_stock", "trend", "anomalies"):
        assert manual[key] == imported[key]


def test_forecast_is_opt_in(dataset: dict) -> None:
    assert "forecast" not in analyze(dataset)

    forecast = analyze(dataset, include_forecast=True)["forecast"]
    assert forecast["period"] == "2026-01-05"
    assert forecast["method"] == "moving_average"
    assert forecast["revenue"] > 0
