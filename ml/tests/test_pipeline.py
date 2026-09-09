"""Tests du moteur d'analyse — squelettes (Farid)."""

import pytest

from ml.pipeline import analyze, empty_result


def test_result_contract_shape() -> None:
    """Le contrat de sortie doit rester stable pour le backend et le frontend."""
    result = analyze({"source": "manual", "products": [], "sales": []})
    for key in empty_result():
        assert key in result
    for key in ("revenue", "cost", "profit", "margin_pct", "units_sold", "sales_count"):
        assert key in result["kpis"]


@pytest.mark.skip(reason="TODO(farid): implémenter le nettoyage")
def test_clean_dataset() -> None:
    ...


@pytest.mark.skip(reason="TODO(farid): implémenter CA, bénéfice, marges")
def test_compute_kpis() -> None:
    ...


@pytest.mark.skip(reason="TODO(farid): implémenter tendances et anomalies")
def test_trends_and_anomalies() -> None:
    ...
