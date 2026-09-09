"""Nettoyage et préparation — TODO(farid)."""

from __future__ import annotations

from typing import Any


def clean_dataset(dataset: dict[str, Any]) -> dict[str, Any]:
    """Doublons, valeurs manquantes, types, coûts absents.

    Entrée et sortie respectent `ml/schemas.py`.
    """
    raise NotImplementedError("À implémenter : nettoyage produits / ventes.")
