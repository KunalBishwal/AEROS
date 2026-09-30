import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_DIR = DATA_DIR / "raw"
PROCESSED_DATA_DIR = DATA_DIR / "processed"

# Ensure data directories exist
RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)


class Settings(BaseSettings):
    # App
    PROJECT_NAME: str = "Air Quality Intelligence & Urban Pollution Exposure Tracker"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    APP_MODE: str = "demo"  # "live" or "demo"

    # OpenAQ v3
    OPENAQ_API_KEY: Optional[str] = None
    OPENAQ_BASE_URL: str = "https://api.openaq.org/v3"

    # Firebase / Firestore
    FIREBASE_PROJECT_ID: str = "aqi-project-7e3bd"
    FIREBASE_API_KEY: Optional[str] = "AIzaSyD1E1mFt3GvV9SuKHyWw_h6A4vcOKzovac"
    FIREBASE_AUTH_DOMAIN: Optional[str] = "aqi-project-7e3bd.firebaseapp.com"
    FIREBASE_STORAGE_BUCKET: Optional[str] = "aqi-project-7e3bd.firebasestorage.app"
    FIREBASE_MESSAGING_SENDER_ID: Optional[str] = "757206945771"
    FIREBASE_APP_ID: Optional[str] = "1:757206945771:web:3a4b498753c70545da53ae"
    FIREBASE_MEASUREMENT_ID: Optional[str] = "G-XXHJP789WV"

    FIREBASE_CREDENTIALS_PATH: Optional[str] = None
    FIREBASE_CLIENT_EMAIL: Optional[str] = None
    FIREBASE_PRIVATE_KEY: Optional[str] = None

    # Server & CORS
    BACKEND_HOST: str = "127.0.0.1"
    BACKEND_PORT: int = 8000
    FRONTEND_URL: str = "http://localhost:3000"

    class Config:
        env_file = [
            str(BASE_DIR / ".env"),
            str(BACKEND_DIR / ".env"),
            ".env"
        ]
        extra = "ignore"


settings = Settings()
