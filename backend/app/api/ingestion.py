import uuid
from pathlib import Path

from fastapi import APIRouter, File, UploadFile

from app.services.ingestion import IngestionError, parse_tabular
from app.services.store import get_store
from app.utils.errors import ApiError
from app.utils.settings import settings

router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile = File(...)) -> dict:
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

    get_store().extend_dataset(products, sales)
    suffix = Path(filename).suffix.lower()
    source = "excel" if suffix in {".xlsx", ".xls"} else "csv"
    return {
        "status": "accepted",
        "filename": filename,
        "source": source,
        "products_ingested": len(products),
        "sales_ingested": len(sales),
    }
