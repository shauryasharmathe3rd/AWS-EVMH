import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    APP_NAME: str = "Tript-Dhara"
    APP_VERSION: str = "1.0.0"
    MIN_CLIENT_VERSION: str = "1.0.0"
    CITY_NAME: str = "Ghaziabad"
    CITY_LAT: float = 28.6345839
    CITY_LON: float = 77.4477459
    DEMO_MODE: bool = True
    ALLOW_PUBLIC_STATUS_CHANGES: bool = True
    ENABLE_IMPORT_API: bool = False

    DATABASE_URL: str = "postgresql://tript_user:tript_secure_pass@db:5432/tript_dhara"
    CORS_ORIGINS: str = "*"

    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"
    DATA_GOV_IN_API_KEY: Optional[str] = None

    ENABLE_STRANDS_BRIEFING: bool = True
    MODEL_PROVIDER: Optional[str] = None
    MODEL_ID: Optional[str] = None
    MODEL_API_KEY: Optional[str] = None

    STORAGE_ADAPTER: str = "local"
    PHOTO_MAX_MB: int = 5
    PHOTOS_DIR: str = "/app/storage/photos"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
