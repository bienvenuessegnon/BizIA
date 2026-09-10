import json
import sys
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
    insight = "Le chiffre d'affaires atteint 1 000 FCFA pour un bénéfice de 400 FCFA."
    response = SimpleNamespace(
        text=json.dumps(
            {
                "insights": [insight],
                "recommendations": [
                    {
                        "priority": "high",
                        "action": "Suivre le volume de ventes chaque semaine.",
                        "why": "Le bénéfice de 400 FCFA reste concentré sur peu de ventes.",
                    }
                ],
            }
        )
    )
    client = SimpleNamespace(
        models=SimpleNamespace(generate_content=Mock(return_value=response))
    )
    monkeypatch.setattr(gemini, "_client", lambda: client)

    enriched = gemini.enrich_analysis_with_gemini(ANALYSIS)

    assert enriched["kpis"] == ANALYSIS["kpis"]
    assert enriched["insights"] == [insight]
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


def test_fragmented_or_truncated_texts_are_rejected() -> None:
    """Le décodage contraint peut couper une phrase sur un guillemet."""
    fragmented = {
        "insights": ["Le produit ", "Riz 5kg", " est le plus vendu avec 7 unites."],
        "recommendations": [],
    }
    truncated = {
        "insights": ["Le benefice a augmente de 5 200 FCFA, soit une hausse de 1300,0 %. Le "],
        "recommendations": [],
    }
    complete = {
        "insights": ["Le produit Riz 5kg represente 21 000 FCFA de chiffre d'affaires."],
        "recommendations": [
            {
                "priority": "high",
                "action": "Reapprovisionner le Piment sans attendre.",
                "why": "Le stock de 3 unites est sous le seuil de 5 unites.",
            }
        ],
    }

    assert gemini._valid_enrichment(fragmented) is False
    assert gemini._valid_enrichment(truncated) is False
    assert gemini._valid_enrichment(complete) is True


def test_enrichment_prompt_forbids_straight_quotes(monkeypatch) -> None:
    _enable(monkeypatch)
    generate = Mock(return_value=SimpleNamespace(text='{"insights":[],"recommendations":[]}'))
    monkeypatch.setattr(
        gemini, "_client", lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate))
    )

    gemini.enrich_analysis_with_gemini(ANALYSIS)

    call = generate.call_args.kwargs
    assert "guillemet droit" in call["contents"]
    schema = call["config"]["response_json_schema"]
    assert schema["properties"]["insights"]["items"]["minLength"] == gemini._MIN_TEXT_LENGTH
    assert schema["properties"]["insights"]["items"]["maxLength"] == 220


def test_gemini_is_disabled_without_api_key(monkeypatch) -> None:
    monkeypatch.setattr(gemini.settings, "llm_provider", "gemini")
    monkeypatch.setattr(gemini.settings, "gemini_api_key", "")
    assert gemini.answer_with_gemini("Question", ANALYSIS) is None


def test_amounts_are_requested_in_fcfa(monkeypatch) -> None:
    _enable(monkeypatch)
    generate = Mock(return_value=SimpleNamespace(text="1 000 FCFA"))
    monkeypatch.setattr(
        gemini, "_client", lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate))
    )
    gemini.answer_with_gemini("Quel est mon CA ?", ANALYSIS)
    assert "FCFA" in generate.call_args.kwargs["contents"]


def test_thinking_is_disabled_so_json_is_not_truncated() -> None:
    """Le budget de tokens doit aller à la réponse, pas à la réflexion interne."""
    config = gemini._config(2_000, response_mime_type="application/json")
    assert config["thinking_config"] == {"thinking_budget": 0}
    assert config["max_output_tokens"] == 2_000
    assert config["response_mime_type"] == "application/json"


def _stub_genai(monkeypatch) -> Mock:
    """Remplace `from google import genai` sans dépendre de l'ordre des tests."""
    import google

    built = Mock(side_effect=lambda api_key: SimpleNamespace(key=api_key))
    stub = SimpleNamespace(Client=built)
    monkeypatch.setitem(sys.modules, "google.genai", stub)
    monkeypatch.setattr(google, "genai", stub, raising=False)
    monkeypatch.setattr(gemini, "_cached_client", None)
    return built


def test_client_is_reused_across_calls(monkeypatch) -> None:
    """Un client jetable serait fermé avant l'envoi de la requête."""
    _enable(monkeypatch)
    built = _stub_genai(monkeypatch)

    first = gemini._client()
    second = gemini._client()

    assert first is second
    assert built.call_count == 1
    assert first.key == "test-key"


def test_client_is_rebuilt_when_the_key_changes(monkeypatch) -> None:
    _enable(monkeypatch)
    _stub_genai(monkeypatch)

    first = gemini._client()
    monkeypatch.setattr(gemini.settings, "gemini_api_key", "autre-cle")
    second = gemini._client()

    assert first is not second
    assert second.key == "autre-cle"


def test_document_extraction_sends_file_and_catalog(monkeypatch) -> None:
    _enable(monkeypatch)
    response = SimpleNamespace(
        text=json.dumps(
            {
                "document_type": "sales",
                "products": [],
                "sales": [
                    {
                        "product_sku": "PIMENT",
                        "quantity": 4,
                        "unit_price": 250,
                        "sold_at": "2026-09-01",
                    }
                ],
                "warnings": [],
            }
        )
    )
    generate = Mock(return_value=response)
    monkeypatch.setattr(
        gemini,
        "_client",
        lambda: SimpleNamespace(models=SimpleNamespace(generate_content=generate)),
    )

    result = gemini.extract_document_with_gemini(
        b"%PDF-content",
        "application/pdf",
        "ventes.pdf",
        [{"sku": "PIMENT", "name": "Piment", "unit_price": 250, "unit_cost": 150}],
    )

    assert result is not None
    assert result["sales"][0]["unit_price"] == 250
    call = generate.call_args.kwargs
    assert call["model"] == gemini.settings.gemini_model
    assert call["contents"][1].inline_data.data == b"%PDF-content"
    assert "PIMENT" in call["contents"][0]
    assert "toutes les pages" in call["contents"][0]
    assert call["config"]["response_mime_type"] == "application/json"


def test_invalid_document_extraction_is_rejected(monkeypatch) -> None:
    _enable(monkeypatch)
    invalid = {
        "document_type": "sales",
        "products": [],
        "sales": [{"product_sku": "PIMENT", "quantity": 0}],
        "warnings": [],
    }
    monkeypatch.setattr(
        gemini,
        "_client",
        lambda: SimpleNamespace(
            models=SimpleNamespace(
                generate_content=Mock(
                    return_value=SimpleNamespace(text=json.dumps(invalid))
                )
            )
        ),
    )
    assert (
        gemini.extract_document_with_gemini(
            b"image", "image/jpeg", "note.jpg", []
        )
        is None
    )
