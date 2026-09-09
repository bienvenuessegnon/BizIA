from fastapi import APIRouter, File, UploadFile

router = APIRouter()


@router.post("/files")
async def upload_file(file: UploadFile = File(...)) -> dict:
    """Import CSV / Excel.

    TODO(uriel): sauvegarder dans `data/uploads/`, appeler `services.ingestion.parse_tabular`,
    puis `store.extend_dataset` — même destination que la saisie manuelle.
    """
    filename = file.filename or "upload.bin"
    source = "excel" if filename.lower().endswith((".xlsx", ".xls")) else "csv"
    return {
        "status": "not_implemented",
        "filename": filename,
        "source": source,
        "products_ingested": 0,
        "sales_ingested": 0,
    }
