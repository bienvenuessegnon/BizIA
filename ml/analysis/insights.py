"""Alertes, insights et recommandations dérivés des résultats chiffrés.

Ces trois listes sont la couche « lisible » du moteur : le dashboard les affiche
telles quelles et l'assistant IA s'appuie dessus plutôt que de recalculer.
"""

from __future__ import annotations

from typing import Any

from ml.utils.frames import match_key, products_frame, sales_frame
from ml.utils.numbers import format_amount, to_float

LOW_MARGIN_PCT = 15.0
PROFIT_DROP_PCT = -20.0
THIN_DATASET_SALES = 10

SEVERITY_ORDER = {"high": 0, "medium": 1, "low": 2}
PRIORITY_ORDER = SEVERITY_ORDER


def build_alerts(result: dict[str, Any], dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """[{"code", "severity", "title", "detail"}] trié du plus grave au moins grave."""
    kpis = result.get("kpis", {})
    alerts: list[dict[str, Any]] = []

    if not to_float(kpis.get("sales_count")):
        alerts.append(
            _alert(
                "no_data",
                "low",
                "Aucune vente exploitable",
                "Saisissez des ventes ou importez un fichier pour lancer l'analyse.",
            )
        )

    alerts.extend(_stock_alerts(result))
    alerts.extend(_anomaly_alerts(result))
    alerts.extend(_margin_alerts(kpis))
    alerts.extend(_trend_alerts(result))
    alerts.extend(_catalog_alerts(dataset))

    return sorted(alerts, key=lambda alert: SEVERITY_ORDER.get(alert["severity"], 3))


def build_insights(result: dict[str, Any]) -> list[str]:
    """Phrases courtes prêtes à afficher, dans l'ordre de lecture du dashboard."""
    kpis = result.get("kpis", {})
    if not to_float(kpis.get("sales_count")):
        return ["Aucune vente exploitable : tous les indicateurs sont à zéro."]

    insights = [
        f"Chiffre d'affaires : {format_amount(kpis.get('revenue'))} pour un bénéfice de "
        f"{format_amount(kpis.get('profit'))} ({to_float(kpis.get('margin_pct')):.1f} % de marge) "
        f"sur {int(to_float(kpis.get('sales_count')))} ventes."
    ]

    best_seller = _first(result.get("top_sold"))
    if best_seller:
        insights.append(
            f"Produit le plus vendu : {best_seller['name']} "
            f"({format_amount(best_seller['units_sold'])} unités)."
        )

    best_profit = _first(result.get("top_profit"))
    if best_profit:
        insights.append(
            f"Produit le plus rentable : {best_profit['name']} "
            f"({format_amount(best_profit['profit'])} de bénéfice)."
        )

    comparison = result.get("week_over_week")
    if comparison:
        insights.append(_comparison_sentence(comparison))

    anomalies = result.get("anomalies") or []
    if anomalies:
        insights.append(
            f"{len(anomalies)} journée(s) atypique(s) sur le chiffre d'affaires, "
            f"la plus marquée le {anomalies[0]['period']}."
        )

    low_stock_items = result.get("low_stock") or []
    if low_stock_items:
        insights.append(f"{len(low_stock_items)} produit(s) sous leur seuil de stock.")

    return insights


def build_recommendations(result: dict[str, Any]) -> list[dict[str, Any]]:
    """[{"priority", "action", "why"}] trié par priorité."""
    kpis = result.get("kpis", {})
    recommendations: list[dict[str, Any]] = []

    low_stock_items = result.get("low_stock") or []
    if low_stock_items:
        names = ", ".join(item["name"] for item in low_stock_items[:3])
        recommendations.append(
            _recommendation(
                "high",
                f"Réapprovisionner en priorité : {names}.",
                f"{len(low_stock_items)} produit(s) sont au niveau ou en dessous de leur "
                "seuil d'alerte et risquent la rupture.",
            )
        )

    comparison = result.get("week_over_week")
    if comparison and _is_dropping(comparison):
        recommendations.append(
            _recommendation(
                "high",
                "Analyser la baisse de bénéfice de la dernière période.",
                _comparison_sentence(comparison),
            )
        )

    margin = to_float(kpis.get("margin_pct"))
    if to_float(kpis.get("sales_count")) and margin < LOW_MARGIN_PCT:
        recommendations.append(
            _recommendation(
                "medium",
                "Revoir les prix de vente ou renégocier les coûts d'achat.",
                f"La marge globale est de {margin:.1f} %, en dessous du seuil de confort "
                f"de {LOW_MARGIN_PCT:.0f} %.",
            )
        )

    anomalies = result.get("anomalies") or []
    if anomalies:
        periods = ", ".join(anomaly["period"] for anomaly in anomalies[:3])
        recommendations.append(
            _recommendation(
                "medium",
                f"Vérifier ce qui s'est passé le {periods}.",
                "Ces journées s'écartent nettement du chiffre d'affaires habituel "
                "(erreur de saisie, promotion, rupture).",
            )
        )

    best_profit = _first(result.get("top_profit"))
    if best_profit and to_float(best_profit.get("profit")) > 0:
        recommendations.append(
            _recommendation(
                "medium",
                f"Mettre en avant {best_profit['name']}.",
                f"C'est le produit qui rapporte le plus "
                f"({format_amount(best_profit['profit'])} de bénéfice).",
            )
        )

    sales_count = to_float(kpis.get("sales_count"))
    if 0 < sales_count < THIN_DATASET_SALES:
        recommendations.append(
            _recommendation(
                "low",
                "Enrichir l'historique de ventes.",
                f"Avec {int(sales_count)} ventes, les tendances et les anomalies "
                "restent peu fiables.",
            )
        )

    return sorted(
        recommendations, key=lambda item: PRIORITY_ORDER.get(item["priority"], 3)
    )


def _stock_alerts(result: dict[str, Any]) -> list[dict[str, Any]]:
    alerts = []
    for item in result.get("low_stock") or []:
        stock = to_float(item.get("stock_quantity"))
        threshold = to_float(item.get("low_stock_threshold"))
        critical = stock <= 0 or stock * 2 <= threshold
        alerts.append(
            _alert(
                "low_stock",
                "high" if critical else "medium",
                f"Stock faible : {item.get('name')}",
                f"{format_amount(stock)} en stock pour un seuil d'alerte de "
                f"{format_amount(threshold)}.",
            )
        )
    return alerts


def _anomaly_alerts(result: dict[str, Any]) -> list[dict[str, Any]]:
    return [
        _alert(
            "revenue_anomaly",
            anomaly.get("severity", "low"),
            f"Chiffre d'affaires atypique le {anomaly.get('period')}",
            anomaly.get("message", ""),
        )
        for anomaly in result.get("anomalies") or []
    ]


def _margin_alerts(kpis: dict[str, Any]) -> list[dict[str, Any]]:
    if not to_float(kpis.get("sales_count")):
        return []

    profit = to_float(kpis.get("profit"))
    if profit < 0:
        return [
            _alert(
                "negative_profit",
                "high",
                "Bénéfice négatif",
                f"Les coûts ({format_amount(kpis.get('cost'))}) dépassent le chiffre "
                f"d'affaires ({format_amount(kpis.get('revenue'))}).",
            )
        ]

    margin = to_float(kpis.get("margin_pct"))
    if margin < LOW_MARGIN_PCT:
        return [
            _alert(
                "low_margin",
                "medium",
                "Marge faible",
                f"La marge globale est de {margin:.1f} %.",
            )
        ]
    return []


def _trend_alerts(result: dict[str, Any]) -> list[dict[str, Any]]:
    comparison = result.get("week_over_week")
    if not comparison or not _is_dropping(comparison):
        return []
    return [
        _alert(
            "profit_drop",
            "high",
            "Bénéfice en baisse",
            _comparison_sentence(comparison),
        )
    ]


def _catalog_alerts(dataset: dict[str, Any]) -> list[dict[str, Any]]:
    """Signale les ventes qui pointent vers un SKU absent du catalogue."""
    products = products_frame(dataset.get("products"))
    sales = sales_frame(dataset.get("sales"))
    if products.empty or sales.empty:
        return []

    known = set(match_key(products["sku"]).dropna())
    unknown = sorted(
        {
            sku
            for sku in match_key(sales["product_sku"]).dropna()
            if sku not in known
        }
    )
    if not unknown:
        return []

    return [
        _alert(
            "unknown_product",
            "medium",
            "Ventes sans produit correspondant",
            f"{len(unknown)} SKU vendus sont absents du catalogue : "
            f"{', '.join(unknown[:5])}. Leur coût d'achat est compté à zéro.",
        )
    ]


def _comparison_sentence(comparison: dict[str, Any]) -> str:
    delta = to_float(comparison.get("delta"))
    delta_pct = comparison.get("delta_pct")
    direction = "en hausse" if delta >= 0 else "en baisse"
    sentence = (
        f"Bénéfice {direction} de {format_amount(abs(delta))} par rapport à la "
        f"période précédente ({format_amount(comparison.get('previous_window_profit'))} "
        f"→ {format_amount(comparison.get('current_window_profit'))})"
    )
    if delta_pct is None:
        return f"{sentence}."
    return f"{sentence}, soit {to_float(delta_pct):+.1f} %."


def _is_dropping(comparison: dict[str, Any]) -> bool:
    delta_pct = comparison.get("delta_pct")
    if delta_pct is None:
        return to_float(comparison.get("delta")) < 0
    return to_float(delta_pct) <= PROFIT_DROP_PCT


def _alert(code: str, severity: str, title: str, detail: str) -> dict[str, Any]:
    return {"code": code, "severity": severity, "title": title, "detail": detail}


def _recommendation(priority: str, action: str, why: str) -> dict[str, Any]:
    return {"priority": priority, "action": action, "why": why}


def _first(items: Any) -> dict[str, Any] | None:
    if isinstance(items, list) and items and isinstance(items[0], dict):
        return items[0]
    return None
