from fastapi import APIRouter, UploadFile

router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile) -> dict[str, str]:
    """Import CSV, Excel, PDF ou document — à implémenter dans app.ingestion."""
    return {
        "status": "accepted",
        "filename": file.filename or "unknown",
        "detail": "Ingestion à implémenter",
    }
