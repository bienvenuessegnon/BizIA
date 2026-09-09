"""Assistant IA côté serveur — TODO(uriel).

Règle produit : les réponses s'appuient sur le dernier résultat d'analyse
(`store.get_last_analysis()`). L'assistant n'invente pas de chiffres.

Questions cibles du MVP :
- « Pourquoi mon bénéfice a-t-il diminué cette semaine ? » → `week_over_week`
- « Quels produits dois-je surveiller ? »                  → `low_stock`, `anomalies`
- « Quel produit me rapporte le plus ? »                   → `top_profit`
- « Résume-moi mon activité de la semaine. »               → `insights`, `kpis`
- « Que devrais-je vérifier avant mes prochains achats ? » → `recommendations`
"""

from __future__ import annotations

from typing import Any


def answer_from_analysis(question: str, analysis: dict[str, Any] | None) -> dict[str, Any]:
    """Retourne {"reply": str, "grounded": bool}.

    `grounded=False` quand aucune analyse n'est disponible.
    """
    raise NotImplementedError("À implémenter : routage question → résultats d'analyse.")
