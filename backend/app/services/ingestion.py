"""Normalisation des fichiers importés — TODO(uriel).

Règle d'architecture : un fichier brut n'entre jamais dans le moteur ML.
Il est d'abord traduit vers le schéma commun, exactement comme la saisie manuelle.
"""

from __future__ import annotations

from typing import Any

COLUMN_ALIASES: dict[str, set[str]] = {
    "sku": {"sku", "code", "ref", "reference"},
    "name": {"name", "nom", "produit", "product", "libelle"},
    "category": {"category", "categorie", "cat"},
    "unit_cost": {"unit_cost", "cout", "cost", "prix_achat"},
    "unit_price": {"unit_price", "prix", "price", "prix_vente"},
    "stock_quantity": {"stock_quantity", "stock", "qte_stock"},
    "low_stock_threshold": {"low_stock_threshold", "seuil", "seuil_stock"},
    "product_sku": {"product_sku", "sku", "code", "produit"},
    "quantity": {"quantity", "qte", "quantite", "qty"},
    "sold_at": {"sold_at", "date", "jour", "timestamp"},
    "channel": {"channel", "canal", "source"},
}


def parse_tabular(path: str, filename: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """CSV / Excel → (products, sales) au schéma commun.

    Erreurs attendues (voir docs/api/README.md) : `unsupported_type` (415),
    `parse_error` (400), `unknown_schema` (422).
    """
    raise NotImplementedError("À implémenter : lecture pandas + mapping des colonnes.")
