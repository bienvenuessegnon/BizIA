from app.services.chat import answer_from_analysis

ANALYSIS = {
    "kpis": {
        "revenue": 57700.0,
        "cost": 38600.0,
        "profit": 19100.0,
        "margin_pct": 33.1,
        "units_sold": 84.0,
        "sales_count": 16,
    },
    "top_profit": [
        {"sku": "RIZ-5KG", "name": "Riz 5kg", "profit": 5600.0, "revenue": 21000.0, "units_sold": 7}
    ],
    "low_stock": [
        {
            "sku": "HUILE-1L",
            "name": "Huile végétale 1L",
            "stock_quantity": 4,
            "low_stock_threshold": 5,
        }
    ],
    "anomalies": [
        {"period": "2026-08-26", "severity": "high", "message": "pic de CA"}
    ],
    "week_over_week": {
        "current_window_profit": 8000.0,
        "previous_window_profit": 11100.0,
        "delta": -3100.0,
        "delta_pct": -27.9,
    },
    "insights": ["Chiffre d'affaires : 57 700 pour un bénéfice de 19 100."],
    "recommendations": [
        {
            "priority": "high",
            "action": "Réapprovisionner l'huile.",
            "why": "Le stock est sous le seuil.",
        }
    ],
}


def test_ungrounded_without_analysis() -> None:
    result = answer_from_analysis("Quel produit me rapporte le plus ?", None)
    assert result["grounded"] is False
    assert "analyse" in result["reply"].lower()


def test_five_target_questions() -> None:
    profit = answer_from_analysis("Pourquoi mon bénéfice a-t-il diminué cette semaine ?", ANALYSIS)
    assert profit["grounded"] is True
    assert "8" in profit["reply"] or "8000" in profit["reply"].replace("\u202f", "")

    watch = answer_from_analysis("Quels produits dois-je surveiller ?", ANALYSIS)
    assert "Huile" in watch["reply"]
    assert "2026-08-26" in watch["reply"]

    best = answer_from_analysis("Quel produit me rapporte le plus ?", ANALYSIS)
    assert "Riz" in best["reply"]

    summary = answer_from_analysis("Résume-moi mon activité de la semaine.", ANALYSIS)
    assert "57700" in summary["reply"].replace("\u202f", "").replace(" ", "") or "57" in summary["reply"]

    purchases = answer_from_analysis("Que devrais-je vérifier avant mes prochains achats ?", ANALYSIS)
    assert "Réapprovisionner" in purchases["reply"]
