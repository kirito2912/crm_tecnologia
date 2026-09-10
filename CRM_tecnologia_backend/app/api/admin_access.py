"""Validate existing signed sessions before exposing access requests."""
import base64
import hashlib
import hmac
import json
from datetime import datetime, timezone
from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.roles import normalize_role
from app.db.conexion import get_db
from app.models.usuario import Usuario


def require_admin(authorization: str | None = Header(default=None), db: Session = Depends(get_db)):
    try:
        scheme, token = (authorization or "").split(" ", 1)
        if scheme.lower() != "bearer":
            raise ValueError()
        header, payload, signature = token.split(".")
        expected = base64.urlsafe_b64encode(hmac.new(
            settings.jwt_secret_key.encode(), f"{header}.{payload}".encode(), hashlib.sha256
        ).digest()).rstrip(b"=").decode()
        if not hmac.compare_digest(signature, expected):
            raise ValueError()
        decode = lambda value: json.loads(base64.urlsafe_b64decode(value + "=" * (-len(value) % 4)))
        if decode(header).get("alg") != "HS256":
            raise ValueError()
        claims = decode(payload)
        expiry = datetime.fromisoformat(claims["exp"])
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if expiry <= datetime.now(timezone.utc):
            raise ValueError()
        email = claims["email"]
        if not isinstance(email, str) or not email:
            raise ValueError()
    except (ValueError, TypeError, KeyError, AttributeError):
        raise HTTPException(401, "Tu sesión venció o no es válida. Vuelve a iniciar sesión.")
    user = db.query(Usuario).filter(Usuario.email.ilike(email)).first()
    if not user or normalize_role(user.rol) != "administrador" or not user.habilitado or user.estado != "activo":
        raise HTTPException(403, "Solo un administrador habilitado puede gestionar solicitudes.")
    return user
