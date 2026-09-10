from types import SimpleNamespace
from unittest.mock import Mock

from app.services import gemini


ANALYSIS = {
    "kpis": {"revenue": 1000.0, "profit": 400.0, "margin_pct": 40.0},
    "insights": ["Constat local"],
    "recommendations": [],
}


def _enable(monkeypatch) -> None:
    monkeypatch.setattr(gemini.settings, "llm_provider", "gemini")
    monkeypatch.setattr(gemini.settings, "gemini_api_key", "test-key")
    monkeypatch.setattr(gemini.settings, "gemini_enrich_analysis", True)


def test_chat_uses_grounded_gemini_response(monkeypatch) -> None:
    _enable(monkeypatch)
    generate = Mock(return_value=SimpleNamespace(text="Le CA est de 1 000 FCFA."))
    client = SimpleNamespace(models=SimpleNamespace(generate_content=generate))
    monkeypatch.setattr(gemini, "_client", lambda: client)

    reply = gemini.answer_with_gemini("Quel est mon CA ?", ANALYSIS)

    assert reply == "Le CA est de 1 000 FCFA."
    call = generate.call_args.kwargs
    assert call["model"] == gemini.settings.gemini_model
    assert '"revenue":1000.0' in call["contents"]
    assert "uniquement" in call["contents"]


def test_chat_falls_back_when_gemini_is_unavailable(monkeypatch) -> None:
    _enable(monkeypatch)
    monkeypatch.setattr(gemini, "_client", Mock(side_effect=RuntimeError("offline")))
    assert gemini.answer_with_gemini("Quel est mon CA ?", ANALYSIS) is None


def test_analysis_enrichment_does_not_change_calculated_kpis(monkeypatch) -> None:
    _enable(monkeypatch)
    response = SimpleNamespace(
        text=(
            '{"insights":["Le CA atteint 1 000 FCFA."],'
            '"recommendations":[{"priority":"high","action":"Suivre les ventes",'
            '"why":"Le bénéfice est de 400 FCFA."}]}'
        )
    )
    client = SimpleNamespace(
        models=SimpleNamespace(generate_content=Mock(return_value=response))
    )
    monkeypatch.setattr(gemini, "_client", lambda: client)

    enriched = gemini.enrich_analysis_with_gemini(ANALYSIS)

    assert enriched["kpis"] == ANALYSIS["kpis"]
    assert enriched["insights"] == ["Le CA atteint 1 000 FCFA."]
    assert enriched["recommendations"][0]["priority"] == "high"
    assert ANALYSIS["insights"] == ["Constat local"]


def test_invalid_enrichment_keeps_local_analysis(monkeypatch) -> None:
    _enable(monkeypatch)
    client = SimpleNamespace(
        models=SimpleNamespace(
            generate_content=Mock(
                return_value=SimpleNamespace(text='{"insights":[],"recommendations":"bad"}')
            )
        )
    )
    monkeypatch.setattr(gemini, "_client", lambda: client)
    assert gemini.enrich_analysis_with_gemini(ANALYSIS) is ANALYSIS


def test_gemini_is_disabled_without_api_key(monkeypatch) -> None:
    monkeypatch.setattr(gemini.settings, "llm_provider", "gemini")
    monkeypatch.setattr(gemini.settings, "gemini_api_key", "")
    assert gemini.answer_with_gemini("Question", ANALYSIS) is None
