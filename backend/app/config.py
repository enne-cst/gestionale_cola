from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = "development"

    database_url: str = "postgresql+psycopg://gestionale:gestionale@db:5432/gestionale"

    storage_backend: str = "local"
    storage_local_path: str = "/data/storage"

    cors_origins: list[str] = ["http://localhost:3000"]

    secret_key: str = "changeme_dev_secret_key_please_rotate"
    access_token_expire_minutes: int = 60 * 12


@lru_cache
def get_settings() -> Settings:
    return Settings()
