from functools import lru_cache
import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "Apex CRM API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"

    # JWT Security Settings
    SECRET_KEY: str = "development_secret_key_crm_backend_change_in_production_32bytes_min"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    RESET_TOKEN_EXPIRE_MINUTES: int = 15

    # Database Configuration
    DATABASE_URL: str = "postgresql+asyncpg://dhairya:8953@localhost:5432/crm_db"

    # CORS Settings
    BACKEND_CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    @property
    def cors_origins(self) -> List[str]:
        if isinstance(self.BACKEND_CORS_ORIGINS, list):
            return self.BACKEND_CORS_ORIGINS
        if isinstance(self.BACKEND_CORS_ORIGINS, str):
            val = self.BACKEND_CORS_ORIGINS.strip()
            if val.startswith("[") and val.endswith("]"):
                try:
                    return json.loads(val)
                except Exception:
                    pass
            return [x.strip() for x in val.split(",") if x.strip()]
        return []

    # Initial Admin Seed
    FIRST_ADMIN_EMAIL: str = "admin@crm.com"
    FIRST_ADMIN_PASSWORD: str = "Admin@123456"
    FIRST_ADMIN_NAME: str = "CRM Administrator"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
