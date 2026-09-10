from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.utils.errors import ApiError
from app.utils.settings import settings

app = FastAPI(
    title="BizIA API",
    description=(
        "Analyste de données IA pour PME. "
        "Saisie manuelle et import CSV/Excel/PDF/image alimentent le même pipeline d'analyse."
    ),
    version="0.2.0",
)

_origins = settings.cors_origin_list
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_origins != ["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api")


@app.exception_handler(ApiError)
async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    if not errors:
        message = "Le payload est invalide."
    else:
        first = errors[0]
        loc = " → ".join(str(part) for part in first.get("loc", ()) if part != "body")
        detail = first.get("msg", "valeur invalide")
        message = f"{loc}: {detail}" if loc else str(detail)
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "validation_error", "message": message}},
    )


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "bizia-backend"}


_web_dist = settings.resolve(settings.web_dist)

if _web_dist.is_dir():
    # Un seul service : l'interface exportée est servie sur la même origine que
    # l'API, donc le frontend appelle `/api/...` sans CORS. Monté en dernier
    # pour ne pas masquer /api, /health et /docs.
    app.mount("/", StaticFiles(directory=_web_dist, html=True), name="web")
else:

    @app.get("/")
    def root() -> dict[str, str]:
        """Sans interface embarquée, la racine sert de repère vers l'API."""
        return {
            "service": "bizia-backend",
            "message": "API BizIA. L'interface web n'est pas embarquée dans ce service.",
            "docs": "/docs",
            "health": "/health",
        }
