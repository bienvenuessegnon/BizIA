"""Normalisation des fichiers importés.

Un fichier brut n'entre jamais dans le moteur ML : il est d'abord traduit
vers le schéma commun, exactement comme la saisie manuelle.
"""

from __future__ import annotations

import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd

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

PRODUCT_FIELDS = (
    "sku",
    "name",
    "category",
    "unit_cost",
    "unit_price",
    "stock_quantity",
    "low_stock_threshold",
)
SALE_FIELDS = (
    "product_sku",
    "quantity",
    "unit_price",
    "unit_cost",
    "sold_at",
    "channel",
)

_CSV_SUFFIXES = {".csv"}
_EXCEL_SUFFIXES = {".xlsx", ".xls"}


class IngestionError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def parse_tabular(path: str, filename: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """CSV / Excel → (products, sales) au schéma commun."""
    suffix = Path(filename).suffix.lower()
    if suffix not in _CSV_SUFFIXES | _EXCEL_SUFFIXES:
        raise IngestionError(
            415,
            "unsupported_type",
            "Seuls les fichiers CSV et Excel (.xlsx, .xls) sont acceptés.",
        )

    frame = _read_frame(path, suffix)
    headers = [str(column) for column in frame.columns]
    kind = _detect_kind(headers)
    if kind is None:
        raise IngestionError(
            422,
            "unknown_schema",
            "Colonnes non reconnues : impossible de distinguer un catalogue de produits d'un journal de ventes.",
        )

    if kind == "products":
        mapping = _map_headers(headers, PRODUCT_FIELDS)
        if "sku" not in mapping:
            raise IngestionError(
                422,
                "unknown_schema",
                "Aucune colonne SKU reconnue pour les produits.",
            )
        products = [
            record
            for record in _records(frame, mapping)
            if str(record.get("sku") or "").strip()
        ]
        return products, []

    mapping = _map_headers(headers, SALE_FIELDS)
    if "product_sku" not in mapping and "sku" in {
        _normalize(header) for header in headers
    }:
        sku_header = next(header for header in headers if _normalize(header) == "sku")
        mapping["product_sku"] = sku_header
    if "product_sku" not in mapping or "quantity" not in mapping:
        raise IngestionError(
            422,
            "unknown_schema",
            "Un fichier de ventes doit contenir un SKU produit et une quantité.",
        )
    source = "excel" if suffix in _EXCEL_SUFFIXES else "csv"
    sales: list[dict[str, Any]] = []
    for record in _records(frame, mapping):
        if not str(record.get("product_sku") or "").strip():
            continue
        if record.get("channel") in (None, ""):
            record["channel"] = source
        sales.append(record)
    return [], sales


def _read_frame(path: str, suffix: str) -> pd.DataFrame:
    try:
        if suffix in _CSV_SUFFIXES:
            frame = pd.read_csv(path, encoding="utf-8-sig")
        else:
            frame = pd.read_excel(path)
    except IngestionError:
        raise
    except Exception as exc:
        raise IngestionError(
            400,
            "parse_error",
            "Le fichier n'a pas pu être lu. Vérifiez le format CSV ou Excel.",
        ) from exc

    if frame is None or (frame.empty and len(frame.columns) == 0):
        raise IngestionError(400, "parse_error", "Le fichier importé est vide.")
    frame.columns = [_strip_header(column) for column in frame.columns]
    return frame


def _detect_kind(headers: list[str]) -> str | None:
    normalized = {_normalize(header) for header in headers}
    quantity_aliases = {_normalize(alias) for alias in COLUMN_ALIASES["quantity"]}
    if normalized & quantity_aliases:
        return "sales"
    product_hints = {_normalize(alias) for alias in COLUMN_ALIASES["sku"] | COLUMN_ALIASES["name"]}
    if normalized & product_hints:
        return "products"
    return None


def _map_headers(headers: list[str], fields: tuple[str, ...]) -> dict[str, str]:
    mapping: dict[str, str] = {}
    normalized_headers = {header: _normalize(header) for header in headers}
    for field in fields:
        aliases = {_normalize(alias) for alias in COLUMN_ALIASES.get(field, {field})}
        for header, normalized in normalized_headers.items():
            if normalized in aliases:
                mapping[field] = header
                break
    return mapping


def _records(frame: pd.DataFrame, mapping: dict[str, str]) -> list[dict[str, Any]]:
    records: list[dict[str, Any]] = []
    for _, row in frame.iterrows():
        record: dict[str, Any] = {}
        empty = True
        for field, column in mapping.items():
            value = _native(row[column])
            record[field] = value
            if value is not None and str(value).strip() != "":
                empty = False
        if not empty:
            records.append(record)
    return records


def _native(value: Any) -> Any:
    try:
        if value is None or pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(value, pd.Timestamp):
        stamp = value.tz_localize("UTC") if value.tzinfo is None else value.tz_convert("UTC")
        return stamp.isoformat()
    if hasattr(value, "item") and not isinstance(value, (bytes, str)):
        try:
            return value.item()
        except (ValueError, AttributeError):
            return value
    if isinstance(value, str):
        text = value.strip()
        return text if text else None
    return value


def _strip_header(column: Any) -> str:
    return str(column).replace("\ufeff", "").strip()


def _normalize(value: str) -> str:
    decomposed = unicodedata.normalize("NFKD", _strip_header(value).lower())
    without_accents = "".join(char for char in decomposed if not unicodedata.combining(char))
    return without_accents.replace(" ", "_").replace("-", "_")
