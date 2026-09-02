import random
from datetime import datetime, timedelta

from app.core.config import settings


def generate_otp_code() -> str:
    return f"{random.randint(0, 999999):06d}"


def get_otp_expiration() -> datetime:
    return datetime.utcnow() + timedelta(minutes=settings.otp_expiration_minutes)
