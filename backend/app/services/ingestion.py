"""Normalisation des fichiers importés.

Un fichier brut n'entre jamais dans le moteur ML : il est d'abord traduit
vers le schéma commun, exactement comme la saisie manuelle.
"""

from __future__ import annotations

import csv
import io
import re
import unicodedata
from collections.abc import Iterable
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
_PDF_SUFFIXES = {".pdf"}
_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tif", ".tiff"}

_SOURCE_BY_SUFFIX: dict[str, str] = {}
_SOURCE_BY_SUFFIX.update({suffix: "csv" for suffix in _CSV_SUFFIXES})
_SOURCE_BY_SUFFIX.update({suffix: "excel" for suffix in _EXCEL_SUFFIXES})
_SOURCE_BY_SUFFIX.update({suffix: "pdf" for suffix in _PDF_SUFFIXES})
_SOURCE_BY_SUFFIX.update({suffix: "image" for suffix in _IMAGE_SUFFIXES})

_ocr_engine: Any | None = None


class IngestionError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def source_for_filename(filename: str) -> str | None:
    return _SOURCE_BY_SUFFIX.get(Path(filename).suffix.lower())


def parse_tabular(path: str, filename: str) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    """CSV / Excel / PDF / image → (products, sales) au schéma commun."""
    suffix = Path(filename).suffix.lower()
    source = source_for_filename(filename)
    if source is None:
        raise IngestionError(
            415,
            "unsupported_type",
            "Formats acceptés : CSV, Excel (.xlsx, .xls), PDF et images (PNG, JPEG, WebP).",
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
        elif suffix in _EXCEL_SUFFIXES:
            frame = pd.read_excel(path)
        elif suffix in _PDF_SUFFIXES:
            frame = _read_pdf(path)
        else:
            frame = _read_image(path)
    except IngestionError:
        raise
    except Exception as exc:
        raise IngestionError(
            400,
            "parse_error",
            "Le fichier n'a pas pu être lu. Vérifiez qu'il contient un tableau (CSV, Excel, PDF ou image lisible).",
        ) from exc

    return _prepare_frame(frame)


def _prepare_frame(frame: pd.DataFrame | None) -> pd.DataFrame:
    if frame is None or (frame.empty and len(frame.columns) == 0):
        raise IngestionError(400, "parse_error", "Le fichier importé est vide.")
    frame = frame.copy()
    frame.columns = [_strip_header(column) for column in frame.columns]
    return frame


def _read_pdf(path: str) -> pd.DataFrame:
    import pdfplumber

    tables: list[list[list[Any]]] = []
    texts: list[str] = []
    try:
        with pdfplumber.open(path) as pdf:
            if not pdf.pages:
                raise IngestionError(400, "parse_error", "Le PDF importé est vide.")
            for page in pdf.pages:
                for table in page.extract_tables() or []:
                    tables.append(table)
                extracted = page.extract_text() or ""
                if extracted.strip():
                    texts.append(extracted)
    except IngestionError:
        raise
    except Exception as exc:
        raise IngestionError(
            400,
            "parse_error",
            "Le PDF n'a pas pu être lu. Vérifiez qu'il n'est pas corrompu.",
        ) from exc

    merged = _merge_frames(_rows_to_frame(table) for table in tables)
    if merged is not None:
        return merged

    frame = _text_to_frame("\n".join(texts))
    if frame is not None and _detect_kind([str(c) for c in frame.columns]):
        return frame

    merged = _merge_frames(_ocr_image_to_frame(image) for image in _render_pdf_pages(path))
    if merged is not None:
        return merged

    raise IngestionError(
        422,
        "unknown_schema",
        "Aucun tableau de produits ou de ventes n'a été reconnu dans le PDF.",
    )


def _merge_frames(candidates: Iterable[pd.DataFrame | None]) -> pd.DataFrame | None:
    """Un tableau coupé sur plusieurs pages ne doit pas perdre ses lignes.

    Les pages suivantes ne sont reprises que si elles portent les mêmes colonnes,
    ce qui écarte au passage un second tableau sans rapport.
    """
    kept: list[pd.DataFrame] = []
    for frame in candidates:
        if frame is None or not _detect_kind([str(column) for column in frame.columns]):
            continue
        if kept and list(kept[0].columns) != list(frame.columns):
            continue
        kept.append(frame)
    if not kept:
        return None
    if len(kept) == 1:
        return kept[0]
    return pd.concat(kept, ignore_index=True)


def _read_image(path: str) -> pd.DataFrame:
    from PIL import Image

    try:
        with Image.open(path) as image:
            frame = _ocr_image_to_frame(image.convert("RGB"))
    except IngestionError:
        raise
    except Exception as exc:
        raise IngestionError(
            400,
            "parse_error",
            "L'image n'a pas pu être lue. Utilisez PNG, JPEG ou WebP.",
        ) from exc

    if frame is None or not _detect_kind([str(c) for c in frame.columns]):
        raise IngestionError(
            422,
            "unknown_schema",
            "Aucun tableau de produits ou de ventes n'a été reconnu dans l'image.",
        )
    return frame


def _render_pdf_pages(path: str) -> list[Any]:
    try:
        import pypdfium2 as pdfium
    except ImportError:
        return []

    rendered: list[Any] = []
    document = pdfium.PdfDocument(path)
    try:
        for index in range(len(document)):
            page = document[index]
            rendered.append(page.render(scale=2).to_pil().convert("RGB"))
    finally:
        document.close()
    return rendered


def _ocr_engine_instance() -> Any:
    global _ocr_engine
    if _ocr_engine is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
        except ImportError as exc:
            raise IngestionError(
                400,
                "parse_error",
                "La lecture d'image n'est pas disponible sur ce serveur.",
            ) from exc
        _ocr_engine = RapidOCR()
    return _ocr_engine


def _ocr_image_to_frame(image: Any) -> pd.DataFrame | None:
    engine = _ocr_engine_instance()
    result, _elapsed = engine(image)
    if not result:
        return None
    rows = _ocr_items_to_rows(result)
    frame = _rows_to_frame(rows)
    if frame is not None:
        return frame
    lines = [" ".join(cell for cell in row if cell) for row in rows]
    return _text_to_frame("\n".join(lines))


def _ocr_items_to_rows(result: list[Any]) -> list[list[str]]:
    items: list[tuple[float, float, str]] = []
    heights: list[float] = []
    for item in result:
        box, text = item[0], item[1]
        if not str(text).strip():
            continue
        ys = [float(point[1]) for point in box]
        xs = [float(point[0]) for point in box]
        heights.append(max(ys) - min(ys) if ys else 16.0)
        items.append((sum(ys) / len(ys), min(xs), str(text).strip()))
    if not items:
        return []

    threshold = max(10.0, (sorted(heights)[len(heights) // 2] if heights else 16.0) * 0.7)
    items.sort(key=lambda entry: (entry[0], entry[1]))
    clusters: list[list[tuple[float, float, str]]] = []
    for y, x, text in items:
        if not clusters:
            clusters.append([(y, x, text)])
            continue
        last_y = sum(entry[0] for entry in clusters[-1]) / len(clusters[-1])
        if abs(y - last_y) <= threshold:
            clusters[-1].append((y, x, text))
        else:
            clusters.append([(y, x, text)])
    return [[text for _, _, text in sorted(cluster, key=lambda entry: entry[1])] for cluster in clusters]


def _rows_to_frame(rows: list[list[Any]] | None) -> pd.DataFrame | None:
    if not rows:
        return None
    cleaned: list[list[str]] = []
    for row in rows:
        cells = [_cell_text(value) for value in row]
        if any(cells):
            cleaned.append(cells)
    if len(cleaned) < 2:
        return None
    width = max(len(row) for row in cleaned)
    if width < 2:
        return None
    padded = [row + [""] * (width - len(row)) for row in cleaned]
    headers = _unique_headers(padded[0])
    body = padded[1:]
    if not any(any(cell for cell in row) for row in body):
        return None
    return pd.DataFrame(body, columns=headers)


def _text_to_frame(text: str) -> pd.DataFrame | None:
    stripped = (text or "").strip()
    if not stripped:
        return None

    candidates = [stripped]
    collapsed = re.sub(r"[ \t]{2,}", ",", stripped)
    if collapsed != stripped:
        candidates.append(collapsed)

    for candidate in candidates:
        buffer = io.StringIO(candidate)
        try:
            dialect = csv.Sniffer().sniff(candidate[:4096], delimiters=",;\t|")
            buffer.seek(0)
            frame = pd.read_csv(buffer, dialect=dialect)
        except Exception:
            buffer.seek(0)
            try:
                frame = pd.read_csv(buffer, sep=None, engine="python")
            except Exception:
                continue
        if frame is not None and len(frame.columns) >= 2:
            return frame

    lines = [line.strip() for line in stripped.splitlines() if line.strip()]
    if len(lines) < 2:
        return None
    split_rows = [re.split(r"\s{2,}|\t+", line) for line in lines]
    return _rows_to_frame(split_rows)


def _unique_headers(headers: list[str]) -> list[str]:
    seen: dict[str, int] = {}
    unique: list[str] = []
    for header in headers:
        base = _strip_header(header) or "col"
        count = seen.get(base, 0)
        seen[base] = count + 1
        unique.append(base if count == 0 else f"{base}_{count}")
    return unique


def _cell_text(value: Any) -> str:
    if value is None:
        return ""
    try:
        if pd.isna(value):
            return ""
    except (TypeError, ValueError):
        pass
    return str(value).replace("\n", " ").strip()


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
