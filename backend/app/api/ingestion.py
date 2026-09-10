import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.auth import current_user
from app.services.ingestion import IngestionError, parse_tabular, source_for_filename
from app.services.store import get_user_store
from app.utils.errors import ApiError
from app.utils.settings import settings

router = APIRouter()


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
