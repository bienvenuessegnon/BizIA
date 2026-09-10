from app.services.pipeline import run_analysis
from app.services.store import JsonStore, get_store


def test_run_analysis_persists_and_never_raises(isolated_store: JsonStore) -> None:
    result = run_analysis()
    assert result["kpis"]["sales_count"] == 0
    assert result["alerts"][0]["code"] == "no_data"
    assert "forecast" not in result
    assert get_store().get_last_analysis() == result
    assert get_store() is isolated_store

    with_forecast = run_analysis(include_forecast=True)
    assert "forecast" in with_forecast
