"""Assistant IA côté serveur.

Les réponses s'appuient uniquement sur `store.get_last_analysis()`.
Aucun chiffre n'est recalculé ici.
"""

from __future__ import annotations

import unicodedata
from typing import Any, Callable

from ml.utils.numbers import format_amount, to_float

_NO_ANALYSIS = (
    "Je n'ai pas encore d'analyse à commenter. "
    "Saisissez ou importez des données, lancez l'analyse depuis le dashboard, "
    "puis reposez votre question."
)


def answer_from_analysis(question: str, analysis: dict[str, Any] | None) -> dict[str, Any]:
    """Retourne {"reply": str, "grounded": bool}."""
    if analysis is None:
        return {"reply": _NO_ANALYSIS, "grounded": False}

    intent = _detect_intent(_normalize(question))
    reply = _HANDLERS[intent](analysis)
    return {"reply": reply, "grounded": True}


def _detect_intent(question: str) -> str:
    if any(token in question for token in ("achat", "reappro", "commander", "prochain")):
        return "purchases"
    if any(token in question for token in ("rapporte", "rentable")) or (
        "meilleur" in question and "produit" in question
    ):
        return "top_profit"
    if any(token in question for token in ("surveill", "rupture", "anomal")) or (
        "stock" in question and "faible" in question
    ):
        return "watch"
    if ("benefice" in question or "profit" in question) and any(
        token in question for token in ("diminu", "baisse", "pourquoi")
    ):
        return "profit_drop"
    if any(token in question for token in ("resum", "activite", "synthese")):
        return "summary"
    return "fallback"


def _reply_profit_drop(analysis: dict[str, Any]) -> str:
    comparison = analysis.get("week_over_week")
    if not comparison:
        return (
            "Je n'ai pas assez d'historique pour comparer deux périodes de bénéfice. "
            "Ajoutez des ventes sur plusieurs jours, puis relancez l'analyse."
        )
    current = format_amount(comparison.get("current_window_profit"))
    previous = format_amount(comparison.get("previous_window_profit"))
    delta = to_float(comparison.get("delta"))
    delta_pct = comparison.get("delta_pct")
    if delta < 0:
        pct = f" ({delta_pct:.1f} %)" if isinstance(delta_pct, (int, float)) else ""
        return (
            f"Le bénéfice de la dernière période est de {current}, "
            f"contre {previous} sur la période précédente, "
            f"soit une baisse de {format_amount(abs(delta))}{pct}. "
            "Vérifiez les volumes, les prix et les journées atypiques du tableau de bord."
        )
    pct = f" ({delta_pct:.1f} %)" if isinstance(delta_pct, (int, float)) else ""
    return (
        f"Le bénéfice n'est pas en baisse sur cette fenêtre : {current} "
        f"contre {previous} précédemment (écart {format_amount(delta)}{pct})."
    )


def _reply_watch(analysis: dict[str, Any]) -> str:
    parts: list[str] = []
    low_stock = analysis.get("low_stock") or []
    if low_stock:
        names = ", ".join(
            f"{item.get('name')} ({format_amount(item.get('stock_quantity'))} en stock, "
            f"seuil {format_amount(item.get('low_stock_threshold'))})"
            for item in low_stock[:5]
        )
        parts.append(f"Stocks à surveiller : {names}.")
    anomalies = analysis.get("anomalies") or []
    if anomalies:
        marked = ", ".join(
            f"{item.get('period')} ({item.get('message') or item.get('severity')})"
            for item in anomalies[:3]
        )
        parts.append(f"Journées atypiques : {marked}.")
    if not parts:
        return "Aucun stock faible ni anomalie n'a été détecté sur la dernière analyse."
    return " ".join(parts)


def _reply_top_profit(analysis: dict[str, Any]) -> str:
    ranking = analysis.get("top_profit") or []
    if not ranking:
        return "Aucun produit rentable n'a pu être classé : il manque des ventes exploitables."
    best = ranking[0]
    return (
        f"Le produit qui rapporte le plus est {best.get('name')} "
        f"(SKU {best.get('sku')}) : {format_amount(best.get('profit'))} de bénéfice, "
        f"{format_amount(best.get('revenue'))} de chiffre d'affaires."
    )


def _reply_summary(analysis: dict[str, Any]) -> str:
    kpis = analysis.get("kpis") or {}
    insights = analysis.get("insights") or []
    header = (
        f"Sur la période analysée : CA {format_amount(kpis.get('revenue'))}, "
        f"bénéfice {format_amount(kpis.get('profit'))}, "
        f"marge {to_float(kpis.get('margin_pct')):.1f} %, "
        f"{int(to_float(kpis.get('sales_count')))} ventes."
    )
    if insights:
        return header + "\n" + " ".join(str(item) for item in insights)
    return header


def _reply_purchases(analysis: dict[str, Any]) -> str:
    recs = analysis.get("recommendations") or []
    if not recs:
        return "Aucune recommandation d'achat n'est disponible pour le moment."
    lines = [
        f"- [{item.get('priority', 'medium')}] {item.get('action')} ({item.get('why')})"
        for item in recs
    ]
    return "Avant vos prochains achats, voici ce que l'analyse recommande :\n" + "\n".join(lines)


def _reply_fallback(analysis: dict[str, Any]) -> str:
    insights = analysis.get("insights") or []
    if insights:
        return (
            "Voici ce que montrent vos données : "
            + " ".join(str(item) for item in insights[:3])
            + " Vous pouvez aussi demander le bénéfice de la semaine, les produits à surveiller, "
            "le plus rentable, un résumé ou les achats à vérifier."
        )
    return (
        "Je m'appuie sur la dernière analyse. Posez une question sur le bénéfice, "
        "les stocks, le produit le plus rentable, un résumé d'activité ou les prochains achats."
    )


_HANDLERS: dict[str, Callable[[dict[str, Any]], str]] = {
    "profit_drop": _reply_profit_drop,
    "watch": _reply_watch,
    "top_profit": _reply_top_profit,
    "summary": _reply_summary,
    "purchases": _reply_purchases,
    "fallback": _reply_fallback,
}


def _normalize(value: str) -> str:
    text = unicodedata.normalize("NFKD", (value or "").strip().lower())
    return "".join(char for char in text if not unicodedata.combining(char))
