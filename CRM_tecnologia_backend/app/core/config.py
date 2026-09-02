import os
from dataclasses import dataclass

from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")
load_dotenv()


@dataclass
class Settings:
    app_name: str = os.getenv("APP_NAME", "HardCRM Pro - Big Data & Enterprise API")
    app_version: str = os.getenv("APP_VERSION", "1.0.0")
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
    otp_expiration_minutes: int = int(os.getenv("OTP_EXPIRATION_MINUTES", "10"))
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "cambia-esta-clave-en-produccion")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(
        os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60")
    )
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "465"))
    smtp_use_ssl: bool = os.getenv("SMTP_USE_SSL", "true").lower() == "true"
    email_user: str = os.getenv("EMAIL_USER", "").strip()
    email_password: str = os.getenv("EMAIL_PASSWORD", "").replace(" ", "").strip()
    email_from: str = os.getenv("EMAIL_FROM", os.getenv("EMAIL_USER", "")).strip()


settings = Settings()
