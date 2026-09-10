from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(REPO_ROOT / ".env"),
        extra="ignore",
    )

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    data_dir: str = "data"
    upload_dir: str = "data/uploads"
    database_path: str = "data/local/bizia.json"
    llm_provider: str = "none"
    google_client_id: str = ""
    default_low_stock_threshold: float = 5

    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]

    def resolve(self, path: str) -> Path:
        candidate = Path(path)
        if candidate.is_absolute():
            return candidate
        return (REPO_ROOT / candidate).resolve()


settings = Settings()
