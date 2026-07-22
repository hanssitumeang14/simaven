from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    APP_NAME: str = "simaven-service"
    ENVIRONMENT: str = "local"
    LOG_LEVEL: str = "INFO"
    API_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://simaven:simaven@localhost:5432/simaven"
    DB_ECHO: bool = False
    DB_POOL_SIZE: int = 5
    DB_MAX_OVERFLOW: int = 10

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]

    # Dipakai sebagai kop surat pada dokumen SPK
    ORG_NAME: str = "RSAB Harapan Kita"
    ORG_ADDRESS: str = "Jl. Letjen S. Parman Kav. 87, Slipi, Jakarta Barat 11420"
    ORG_LOGO_PATH: str = ""

    @property
    def is_local(self) -> bool:
        return self.ENVIRONMENT == "local"


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
