from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.utils.errors import ApiError
from app.utils.settings import settings

app = FastAPI(
    title="BizIA API",
    description=(
        "Analyste de données IA pour PME. "
        "Saisie manuelle et import CSV/Excel alimentent le même pipeline d'analyse."
    ),
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bizia-backend"}
