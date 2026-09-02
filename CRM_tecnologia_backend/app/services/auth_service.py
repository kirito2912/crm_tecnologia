import base64
from datetime import datetime, timedelta
import hashlib
import hmac
import json

# pyrefly: ignore [missing-import]
from fastapi import HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy import desc
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, verify_password
from app.models.otp_code import OTPCode
from app.models.user import User
from app.models.usuario import Usuario
from app.schemas.auth import OTPRequest, OTPVerifyRequest
from app.services.email_service import send_otp_email
from app.services.otp_service import generate_otp_code, get_otp_expiration


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode("utf-8")


def create_access_token(user: User) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    expire = (datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)).isoformat()
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": expire,
    }
    header_b64 = _b64encode(json.dumps(header).encode("utf-8"))
    payload_b64 = _b64encode(json.dumps(payload).encode("utf-8"))
    signature = hmac.new(
        settings.jwt_secret_key.encode("utf-8"),
        f"{header_b64}.{payload_b64}".encode("utf-8"),
        hashlib.sha256,
    ).digest()
    sig_b64 = _b64encode(signature)
    return f"{header_b64}.{payload_b64}.{sig_b64}"


def request_otp(data: OTPRequest, db: Session) -> str:
    try:
        mode = (data.mode or "").lower().strip()
        email_clean = data.email.lower().strip()

        # 1. Modo REGISTER: no permitir registrar dos veces con el mismo correo si ya está registrado
        if mode == "register":
            existing_usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()
            if existing_usuario:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Este correo electrónico ya se encuentra registrado. Por favor inicia sesión.",
                )

            existing_user = db.query(User).filter(User.email.ilike(email_clean)).first()
            user = existing_user
            if not user:
                user = User(
                    email=email_clean,
                    full_name=data.full_name,
                    password_hash=hash_password(data.password) if data.password else None,
                    is_active=True,
                    is_verified=False,
                )
                db.add(user)
                db.flush()
            else:
                if data.full_name:
                    user.full_name = data.full_name
                if data.password:
                    user.password_hash = hash_password(data.password)
                db.flush()

        # 2. Modo LOGIN: validar que el usuario exista y que la contraseña sea la correcta
        elif mode == "login":
            usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()
            user = db.query(User).filter(User.email.ilike(email_clean)).first()

            if not usuario and not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="El correo electrónico no se encuentra registrado. Por favor crea una cuenta primero.",
                )

            # Obtener hash de contraseña almacenado
            stored_hash = None
            if usuario and usuario.password_hash:
                stored_hash = usuario.password_hash
            elif user and user.password_hash:
                stored_hash = user.password_hash

            if not data.password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Por favor introduce tu contraseña para generar el código OTP.",
                )

            if stored_hash:
                if not verify_password(data.password, stored_hash):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Contraseña incorrecta. No se puede generar el código OTP hasta que ingreses la contraseña correcta.",
                    )

            if not user:
                user = User(
                    email=email_clean,
                    full_name=usuario.nombre if usuario else data.full_name,
                    password_hash=stored_hash,
                    is_active=True,
                    is_verified=True,
                )
                db.add(user)
                db.flush()

        # 3. Modo general / Testing / Fallback
        else:
            user = db.query(User).filter(User.email.ilike(email_clean)).first()
            usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()

            stored_hash = (usuario.password_hash if usuario and usuario.password_hash else None) or (
                user.password_hash if user and user.password_hash else None
            )
            if data.password and stored_hash:
                if not verify_password(data.password, stored_hash):
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Contraseña incorrecta.",
                    )

            if not user:
                user = User(
                    email=email_clean,
                    full_name=data.full_name or (usuario.nombre if usuario else None),
                    password_hash=hash_password(data.password) if data.password else stored_hash,
                )
                db.add(user)
                db.flush()
            elif data.full_name and not user.full_name:
                user.full_name = data.full_name

        # Invalidar códigos OTP previos no usados para este correo
        active_otps = (
            db.query(OTPCode)
            .filter(OTPCode.email == email_clean, OTPCode.is_used.is_(False))
            .all()
        )
        for otp in active_otps:
            otp.is_used = True

        otp_code = generate_otp_code()
        otp_record = OTPCode(
            email=email_clean,
            code=otp_code,
            expires_at=get_otp_expiration(),
            user_id=user.id,
        )
        db.add(otp_record)
        db.flush()

        send_otp_email(email_clean, otp_code)
        db.commit()
        return otp_code
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise


def verify_otp(data: OTPVerifyRequest, db: Session) -> tuple[str, User]:
    otp_record = (
        db.query(OTPCode)
        .filter(
            OTPCode.email == data.email,
            OTPCode.code == data.otp_code,
            OTPCode.is_used.is_(False),
        )
        .order_by(desc(OTPCode.created_at))
        .first()
    )

    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El codigo OTP es invalido o ya fue utilizado.",
        )

    if otp_record.expires_at < datetime.utcnow():
        otp_record.is_used = True
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El codigo OTP ha expirado. Solicita uno nuevo.",
        )

    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontro un usuario asociado a este correo.",
        )

    otp_record.is_used = True
    user.is_verified = True
    db.commit()
    db.refresh(user)

    access_token = create_access_token(user)
    return access_token, user
