"""Persistance MVP — TODO(uriel).

Décision d'architecture : store JSON local (`data/local/bizia.json`), pas de base
de données à installer pour le hackathon. Remplaçable par SQLite/Postgres plus tard
sans changer les routes.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from app.utils.settings import settings

_store: "JsonStore | None" = None


class JsonStore:
    """Source unique de vérité : saisie manuelle et import écrivent ici."""

    def __init__(self, path: Path) -> None:
        self.path = path

    def list_products(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    def list_sales(self) -> list[dict[str, Any]]:
        raise NotImplementedError

    def add_product(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Crée ou met à jour par SKU."""
        raise NotImplementedError

    def add_sale(self, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError

    def extend_dataset(
        self, products: list[dict[str, Any]], sales: list[dict[str, Any]]
    ) -> None:
        """Fusion d'un lot importé dans le même store que la saisie manuelle."""
        raise NotImplementedError

    def save_analysis(self, analysis: dict[str, Any]) -> None:
        raise NotImplementedError

    def get_last_analysis(self) -> dict[str, Any] | None:
        raise NotImplementedError

    def as_dataset(self, source: str = "manual") -> dict[str, Any]:
        """Sortie conforme à `shared/contrats/canonical-dataset.schema.json`."""
        raise NotImplementedError


def get_store() -> JsonStore:
    global _store
    if _store is None:
        _store = JsonStore(settings.resolve(settings.database_path))
    return _store


def set_store(store: JsonStore) -> None:
    """Injection utilisée par les tests."""
    global _store
    _store = store
