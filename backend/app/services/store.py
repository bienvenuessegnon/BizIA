"""Persistance MVP — fichier JSON local (`data/local/bizia.json`).

Saisie manuelle et import écrivent dans le même store. Remplaçable plus tard
par SQLite/Postgres sans changer les routes.
"""

from __future__ import annotations

import copy
import json
import threading
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.utils.settings import settings

_store: "JsonStore | None" = None

_EMPTY: dict[str, Any] = {
    "products": [],
    "sales": [],
    "last_analysis": None,
    "last_source": "manual",
}


def _sku_key(value: Any) -> str:
    return str(value or "").strip().upper()


def _as_float(value: Any, default: float = 0.0) -> float:
    if value is None or value == "":
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _as_iso_utc(value: Any | None) -> str:
    if value is None or value == "":
        return datetime.now(timezone.utc).isoformat()
    if isinstance(value, datetime):
        moment = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return moment.astimezone(timezone.utc).isoformat()
    text = str(value).strip()
    if not text:
        return datetime.now(timezone.utc).isoformat()
    try:
        parsed = datetime.fromisoformat(text.replace("Z", "+00:00"))
    except ValueError:
        return datetime.now(timezone.utc).isoformat()
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed.astimezone(timezone.utc).isoformat()


def _new_id() -> str:
    return str(uuid.uuid4())


class JsonStore:
    """Source unique de vérité : saisie manuelle et import écrivent ici."""

    def __init__(self, path: Path) -> None:
        self.path = Path(path)
        self._lock = threading.RLock()

    def list_products(self) -> list[dict[str, Any]]:
        with self._lock:
            return copy.deepcopy(self._load()["products"])

    def list_sales(self) -> list[dict[str, Any]]:
        with self._lock:
            return copy.deepcopy(self._load()["sales"])

    def get_product(self, sku: str) -> dict[str, Any] | None:
        with self._lock:
            found = self._find_product(self._load()["products"], sku)
            return copy.deepcopy(found) if found is not None else None

    def add_product(self, payload: dict[str, Any]) -> dict[str, Any]:
        """Crée ou met à jour par SKU (insensible à la casse)."""
        sku = str(payload.get("sku") or "").strip()
        if not sku:
            raise ValueError("Un produit doit avoir un SKU.")

        with self._lock:
            data = self._load()
            product = self._normalize_product(payload, existing=self._find_product(data["products"], sku))
            index = self._product_index(data["products"], sku)
            if index is None:
                data["products"].append(product)
            else:
                data["products"][index] = product
            self._dump(data)
            return copy.deepcopy(product)

    def add_sale(self, payload: dict[str, Any]) -> dict[str, Any]:
        product_sku = str(payload.get("product_sku") or "").strip()
        if not product_sku:
            raise ValueError("Une vente doit référencer un product_sku.")

        with self._lock:
            data = self._load()
            catalog = self._find_product(data["products"], product_sku)
            sale = self._normalize_sale(payload, catalog)
            data["sales"].append(sale)
            self._dump(data)
            return copy.deepcopy(sale)

    def extend_dataset(
        self,
        products: list[dict[str, Any]],
        sales: list[dict[str, Any]],
        source: str = "csv",
    ) -> dict[str, int]:
        """Fusion d'un lot importé dans le même store que la saisie manuelle.

        Les ventes dont le SKU n'est pas au catalogue sont ignorées (comme le 404
        de la saisie manuelle). Les doublons exacts (réimport) aussi.
        """
        stats = {
            "products_ingested": 0,
            "sales_ingested": 0,
            "sales_skipped_unknown": 0,
            "sales_skipped_duplicate": 0,
        }
        for product in products:
            self.add_product(product)
            stats["products_ingested"] += 1
        for sale in sales:
            sku = str(sale.get("product_sku") or "").strip()
            if not sku or self.get_product(sku) is None:
                stats["sales_skipped_unknown"] += 1
                continue
            if self.has_equivalent_sale(sale):
                stats["sales_skipped_duplicate"] += 1
                continue
            self.add_sale(sale)
            stats["sales_ingested"] += 1
        if stats["products_ingested"] or stats["sales_ingested"]:
            self.record_source(source)
        return stats

    def has_equivalent_sale(self, payload: dict[str, Any]) -> bool:
        product_sku = str(payload.get("product_sku") or "").strip()
        incoming_id = str(payload.get("id") or "").strip()
        with self._lock:
            data = self._load()
            catalog = self._find_product(data["products"], product_sku)
            incoming = self._normalize_sale(payload, catalog)
            incoming_key = self._sale_key(incoming)
            for existing in data["sales"]:
                if incoming_id and str(existing.get("id") or "") == incoming_id:
                    return True
                if self._sale_key(existing) == incoming_key:
                    return True
            return False

    def record_source(self, source: str) -> None:
        with self._lock:
            data = self._load()
            data["last_source"] = source if source in {"manual", "csv", "excel"} else "unknown"
            self._dump(data)

    def save_analysis(self, analysis: dict[str, Any]) -> None:
        with self._lock:
            data = self._load()
            data["last_analysis"] = copy.deepcopy(analysis)
            self._dump(data)

    def get_last_analysis(self) -> dict[str, Any] | None:
        with self._lock:
            analysis = self._load()["last_analysis"]
            return copy.deepcopy(analysis) if analysis is not None else None

    def last_source(self) -> str:
        with self._lock:
            return str(self._load().get("last_source") or "manual")

    def as_dataset(self, source: str | None = None) -> dict[str, Any]:
        """Sortie conforme à `shared/contrats/canonical-dataset.schema.json`."""
        with self._lock:
            data = self._load()
            resolved = source or data.get("last_source") or "manual"
            return {
                "source": resolved,
                "products": copy.deepcopy(data["products"]),
                "sales": copy.deepcopy(data["sales"]),
            }

    def _sale_key(self, sale: dict[str, Any]) -> tuple[str, float, float, str]:
        return (
            _sku_key(sale.get("product_sku")),
            round(_as_float(sale.get("quantity")), 6),
            round(_as_float(sale.get("unit_price")), 6),
            str(sale.get("sold_at") or ""),
        )

    def _normalize_product(
        self, payload: dict[str, Any], existing: dict[str, Any] | None
    ) -> dict[str, Any]:
        sku = str(payload.get("sku") or "").strip()
        if "low_stock_threshold" not in payload or payload.get("low_stock_threshold") is None:
            threshold = float(settings.default_low_stock_threshold)
        else:
            threshold = _as_float(payload.get("low_stock_threshold"), 0.0)

        name = payload.get("name")
        if name is None or str(name).strip() == "":
            name = existing["name"] if existing else sku
        else:
            name = str(name).strip()

        category = payload.get("category")
        if category is not None:
            category = str(category).strip() or None
        elif existing is not None:
            category = existing.get("category")

        return {
            "id": existing["id"] if existing else str(payload.get("id") or _new_id()),
            "sku": sku,
            "name": name,
            "category": category,
            "unit_cost": _as_float(payload.get("unit_cost"), 0.0),
            "unit_price": _as_float(payload.get("unit_price"), 0.0),
            "stock_quantity": _as_float(payload.get("stock_quantity"), 0.0),
            "low_stock_threshold": threshold,
        }

    def _normalize_sale(
        self, payload: dict[str, Any], catalog: dict[str, Any] | None
    ) -> dict[str, Any]:
        product_sku = str(payload.get("product_sku") or "").strip()
        if catalog is not None:
            product_sku = catalog["sku"]

        unit_cost = payload.get("unit_cost")
        if unit_cost is None or unit_cost == "":
            unit_cost = catalog["unit_cost"] if catalog is not None else 0.0

        channel = payload.get("channel")
        if channel is not None:
            channel = str(channel).strip() or None

        return {
            "id": str(payload.get("id") or _new_id()),
            "product_sku": product_sku,
            "quantity": _as_float(payload.get("quantity"), 0.0),
            "unit_price": _as_float(payload.get("unit_price"), 0.0),
            "unit_cost": _as_float(unit_cost, 0.0),
            "sold_at": _as_iso_utc(payload.get("sold_at")),
            "channel": channel,
        }

    def _find_product(self, products: list[dict[str, Any]], sku: str) -> dict[str, Any] | None:
        index = self._product_index(products, sku)
        return products[index] if index is not None else None

    def _product_index(self, products: list[dict[str, Any]], sku: str) -> int | None:
        key = _sku_key(sku)
        for index, product in enumerate(products):
            if _sku_key(product.get("sku")) == key:
                return index
        return None

    def _load(self) -> dict[str, Any]:
        if not self.path.exists():
            return copy.deepcopy(_EMPTY)
        raw = json.loads(self.path.read_text(encoding="utf-8"))
        if not isinstance(raw, dict):
            raise ValueError(f"Store JSON invalide : {self.path}")
        return {
            "products": list(raw.get("products") or []),
            "sales": list(raw.get("sales") or []),
            "last_analysis": raw.get("last_analysis"),
            "last_source": raw.get("last_source") or "manual",
        }

    def _dump(self, data: dict[str, Any]) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        payload = json.dumps(data, ensure_ascii=False, indent=2)
        tmp = self.path.with_name(self.path.name + ".tmp")
        tmp.write_text(payload + "\n", encoding="utf-8")
        tmp.replace(self.path)


def get_store() -> JsonStore:
    global _store
    if _store is None:
        _store = JsonStore(settings.resolve(settings.database_path))
    return _store


def set_store(store: JsonStore | None) -> None:
    """Injection utilisée par les tests."""
    global _store
    _store = store
