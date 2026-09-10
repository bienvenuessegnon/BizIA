import uuid
from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends, File, UploadFile
from pydantic import BaseModel, Field

from app.api.auth import current_user
from app.services.gemini import extract_document_with_gemini, gemini_enabled
from app.services.ingestion import IngestionError, parse_tabular, source_for_filename
from app.services.store import get_user_store
from app.utils.errors import ApiError
from app.utils.settings import settings

router = APIRouter()

Source = Literal["csv", "excel", "pdf", "image"]


class ImportedProduct(BaseModel):
    sku: str = Field(min_length=1, max_length=200)
    name: str | None = Field(default=None, max_length=300)
    category: str | None = Field(default=None, max_length=200)
    unit_cost: float | None = Field(default=None, ge=0)
    unit_price: float | None = Field(default=None, ge=0)
    stock_quantity: float | None = Field(default=None, ge=0)
    low_stock_threshold: float | None = Field(default=None, ge=0)


class ImportedSale(BaseModel):
    product_sku: str = Field(min_length=1, max_length=200)
    quantity: float = Field(gt=0)
    unit_price: float | None = Field(default=None, ge=0)
    unit_cost: float | None = Field(default=None, ge=0)
    sold_at: str | None = Field(default=None, max_length=100)
    channel: str | None = Field(default=None, max_length=100)


class ImportCommit(BaseModel):
    filename: str = Field(min_length=1, max_length=255)
    source: Source
    products: list[ImportedProduct] = Field(default_factory=list, max_length=2_000)
    sales: list[ImportedSale] = Field(default_factory=list, max_length=2_000)


_MIME_BY_SOURCE = {
    "pdf": "application/pdf",
    "image": "image/jpeg",
}


@router.post("/files")
async def upload_file(
    file: UploadFile = File(...), user: dict = Depends(current_user)
) -> dict:
    filename = Path(file.filename or "upload.bin").name
    payload = await file.read()
    if not payload:
        raise ApiError(400, "parse_error", "Le fichier importé est vide.")

    upload_dir = settings.resolve(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved = upload_dir / f"{uuid.uuid4().hex}_{filename}"
    saved.write_bytes(payload)

    try:
        products, sales = parse_tabular(str(saved), filename)
    except IngestionError as exc:
        saved.unlink(missing_ok=True)
        raise ApiError(exc.status_code, exc.code, exc.message) from exc

    source = source_for_filename(filename) or "unknown"
    stats = get_user_store(user["id"]).extend_dataset(products, sales, source=source)
    return {
        "status": "accepted",
        "filename": filename,
        "source": source,
        **stats,
    }


@router.post("/preview")
async def preview_file(
    file: UploadFile = File(...), user: dict = Depends(current_user)
) -> dict[str, Any]:
    """Reconstruit le tableau sans écrire dans le store.

    PDF et images passent par Gemini quand il est configuré. CSV et Excel
    restent déterministes. L'utilisateur corrige ensuite l'aperçu et appelle
    `/commit`.
    """
    filename, payload, source = await _uploaded_document(file)
    saved = _save_upload(filename, payload)
    extraction_method = "local"
    warnings: list[str] = []
    document_type: str | None = None
    extracted: dict[str, Any] | None = None

    try:
        if source in {"pdf", "image"} and gemini_enabled():
            mime_type = (
                "application/pdf"
                if source == "pdf"
                else (file.content_type or _MIME_BY_SOURCE["image"])
            )
            extracted = extract_document_with_gemini(
                payload,
                mime_type,
                filename,
                get_user_store(user["id"]).list_products(),
            )

        if extracted is not None:
            products = extracted["products"]
            sales = extracted["sales"]
            warnings = extracted["warnings"]
            document_type = extracted["document_type"]
            extraction_method = "gemini"
        else:
            products, sales = parse_tabular(str(saved), filename)
    except IngestionError as exc:
        raise ApiError(exc.status_code, exc.code, exc.message) from exc
    finally:
        saved.unlink(missing_ok=True)

    if not products and not sales:
        raise ApiError(
            422,
            "empty_extraction",
            "Aucune ligne de produit ou de vente n'a été reconnue dans ce document.",
        )

    if document_type is None:
        document_type = "mixed" if products and sales else ("products" if products else "sales")
    for sale in sales:
        if not sale.get("channel"):
            sale["channel"] = source

    return {
        "status": "preview",
        "filename": filename,
        "source": source,
        "document_type": document_type,
        "extraction_method": extraction_method,
        "products": products,
        "sales": sales,
        "warnings": warnings,
    }


@router.post("/commit")
def commit_preview(payload: ImportCommit, user: dict = Depends(current_user)) -> dict:
    """Enregistre uniquement les lignes relues et confirmées dans l'aperçu."""
    if not payload.products and not payload.sales:
        raise ApiError(422, "empty_import", "Ajoutez au moins une ligne avant de confirmer.")

    products = [
        item.model_dump(exclude_none=True)
        for item in payload.products
    ]
    sales = [
        item.model_dump(exclude_none=True)
        for item in payload.sales
    ]
    for sale in sales:
        if not sale.get("channel"):
            sale["channel"] = payload.source
    stats = get_user_store(user["id"]).extend_dataset(
        products, sales, source=payload.source
    )
    return {
        "status": "accepted",
        "filename": Path(payload.filename).name,
        "source": payload.source,
        **stats,
    }


async def _uploaded_document(file: UploadFile) -> tuple[str, bytes, Source]:
    filename = Path(file.filename or "upload.bin").name
    source = source_for_filename(filename)
    if source is None:
        raise ApiError(
            415,
            "unsupported_type",
            "Formats acceptés : CSV, Excel (.xlsx, .xls), PDF et images (PNG, JPEG, WebP).",
        )
    payload = await file.read(settings.max_upload_bytes + 1)
    if not payload:
        raise ApiError(400, "parse_error", "Le fichier importé est vide.")
    if len(payload) > settings.max_upload_bytes:
        raise ApiError(
            413,
            "file_too_large",
            f"Le fichier dépasse la taille maximale de {settings.max_upload_bytes // 1024 // 1024} Mo.",
        )
    return filename, payload, source


def _save_upload(filename: str, payload: bytes) -> Path:
    upload_dir = settings.resolve(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    saved = upload_dir / f"{uuid.uuid4().hex}_{filename}"
    saved.write_bytes(payload)
    return saved
