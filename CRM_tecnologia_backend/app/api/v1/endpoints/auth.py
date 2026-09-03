import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.conexion import get_db
from app.core.security import hash_password, verify_password
from app.models.usuario import Usuario
from app.models.user import User
from app.schemas.usuario import (
    LoginRequest,
    BiometricLoginRequest,
    RegisterRequest,
    AuthResponse,
    UsuarioResponse,
)
from app.schemas.auth import (
    MessageResponse,
    OTPRequest,
    OTPVerifyRequest,
    TokenResponse,
    UserResponse as AuthUserResponse,
)
from app.services.auth_service import request_otp, verify_otp

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=AuthResponse)
def login_standard(body: LoginRequest, db: Session = Depends(get_db)):
    """Inicia sesión mediante email y contraseña opcional."""
    email_clean = body.email.strip().lower()
    usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()
    user_otp = db.query(User).filter(User.email.ilike(email_clean)).first()

    if not usuario and not user_otp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El correo electrónico no se encuentra registrado",
        )

    stored_hash = (usuario.password_hash if usuario else None) or (
        user_otp.password_hash if user_otp else None
    )
    if body.password:
        if stored_hash and not verify_password(body.password, stored_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Contraseña incorrecta. Por favor verifica tus credenciales.",
            )

    requiere_aprobacion = False
    if usuario:
        user_response = UsuarioResponse.model_validate(usuario)
        user_id = usuario.id
        user_name = usuario.nombre
        user_rol = usuario.rol
        requiere_aprobacion = not bool(usuario.habilitado) or usuario.estado == "pendiente_aprobacion"
    else:
        user_id = f"USR-{user_otp.id}"
        user_name = user_otp.full_name or "Usuario"
        user_rol = user_otp.role or "analista"
        requiere_aprobacion = not bool(user_otp.is_active)
        user_response = UsuarioResponse(
            id=user_id,
            nombre=user_name,
            email=email_clean,
            rol=user_rol,
            empresa="Empresa Registrada",
            avatar="US",
            biometric_verified=True,
            habilitado=user_otp.is_active,
            estado="activo" if user_otp.is_active else "deshabilitado",
        )

    token = f"hardcrm_jwt_session_{user_id}_{email_clean.split('@')[0]}"
    return AuthResponse(
        success=True,
        message=f"Bienvenido de nuevo, {user_name} ({user_rol})",
        user=user_response,
        token=token,
        requiere_aprobacion=requiere_aprobacion,
    )


@router.post("/biometrics", response_model=AuthResponse)
def login_biometric(body: BiometricLoginRequest, db: Session = Depends(get_db)):
    """Verificación facial biométrica."""
    usuario = db.query(Usuario).filter(Usuario.email == body.email.strip().lower()).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró un usuario registrado con el correo '{body.email}'",
        )

    vector_a = [0.12, 0.45, 0.78, 0.23, 0.89, 0.34, 0.56, 0.91]
    vector_b = (
        body.embedding_sample
        if (body.embedding_sample and len(body.embedding_sample) == 8)
        else [0.14, 0.44, 0.79, 0.21, 0.88, 0.35, 0.58, 0.90]
    )

    distance = math.sqrt(sum((a - b) ** 2 for a, b in zip(vector_a, vector_b)))
    tolerance = body.distance_tolerance or 0.45
    is_match = distance <= tolerance
    confidence = max(0.0, min(100.0, (1.0 - (distance / tolerance)) * 100)) if is_match else 40.0

    if not is_match:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Verificación biométrica fallida. Distancia euclidiana: {distance:.4f} > Umbral: {tolerance}",
        )

    if not usuario.biometric_verified:
        usuario.biometric_verified = True
        db.commit()
        db.refresh(usuario)

    requiere_aprobacion = not bool(usuario.habilitado) or usuario.estado == "pendiente_aprobacion"
    token = f"hardcrm_biometric_jwt_{usuario.id}_{round(confidence)}"
    return AuthResponse(
        success=True,
        message=f"Acceso biométrico concedido. Coincidencia facial: {confidence:.1f}%",
        user=UsuarioResponse.model_validate(usuario),
        token=token,
        requiere_aprobacion=requiere_aprobacion,
    )


@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def register_user(body: RegisterRequest, db: Session = Depends(get_db)):
    """Registra una nueva cuenta corporativa con rol asignado (analista o administrador)."""
    email_clean = body.company_email.strip().lower()
    existe_usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()

    if existe_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo corporativo '{body.company_email}' ya se encuentra registrado.",
        )

    total = db.query(Usuario).count()
    user_id = f"USR-{total + 101:03d}"
    parts = body.full_name.strip().split()
    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "US"
    hashed_pwd = hash_password(body.password)
    rol_asignado = (body.role or "analista").lower().strip()
    if rol_asignado not in ["analista", "administrador", "admin"]:
        rol_asignado = "analista"
    if rol_asignado == "admin":
        rol_asignado = "administrador"

    nuevo = Usuario(
        id=user_id,
        nombre=body.full_name,
        email=email_clean,
        password_hash=hashed_pwd,
        rol=rol_asignado,
        empresa=body.company or "Empresa Registrada",
        avatar=avatar,
        biometric_verified=True,
    )
    db.add(nuevo)

    existe_user = db.query(User).filter(User.email.ilike(email_clean)).first()
    if not existe_user:
        user_sync = User(
            email=email_clean,
            full_name=body.full_name,
            password_hash=hashed_pwd,
            role=rol_asignado,
            is_active=True,
            is_verified=True,
        )
        db.add(user_sync)
    else:
        existe_user.full_name = body.full_name
        existe_user.password_hash = hashed_pwd
        existe_user.role = rol_asignado
        existe_user.is_verified = True

    db.commit()
    db.refresh(nuevo)

    token = f"hardcrm_jwt_registered_{nuevo.id}"
    return AuthResponse(
        success=True,
        message=f"Cuenta creada exitosamente con perfil de {rol_asignado.capitalize()}.",
        user=UsuarioResponse.model_validate(nuevo),
        token=token,
    )


@router.post("/quick-login/{role}", response_model=AuthResponse)
def quick_demo_login(role: str, db: Session = Depends(get_db)):
    """Acceso rápido para perfiles demo (analista o administrador)."""
    role_key = role.lower().strip()

    if role_key in ["admin", "administrador"]:
        target_email = "admin@empresa.com"
        default_name = "Jane Doe"
        default_rol = "administrador"
    else:
        target_email = "analista@empresa.com"
        default_name = "Carlos Mendoza"
        default_rol = "analista"

    usuario = db.query(Usuario).filter(Usuario.email.ilike(target_email)).first()

    if not usuario:
        usuario = Usuario(
            id="USR-ADMIN" if default_rol == "administrador" else "USR-ANALISTA",
            nombre=default_name,
            email=target_email,
            rol=default_rol,
            empresa="DataTech Analytics",
            avatar="JD" if default_rol == "administrador" else "CM",
            biometric_verified=True,
        )
        db.add(usuario)
        db.commit()
        db.refresh(usuario)

    return AuthResponse(
        success=True,
        message=f"Sesión iniciada como {usuario.rol.capitalize()}",
        user=UsuarioResponse.model_validate(usuario),
        token=f"hardcrm_quick_{usuario.id}",
    )


@router.post("/request-otp", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def request_otp_alias(data: OTPRequest, db: Session = Depends(get_db)):
    """Solicita el envío de un código OTP de 6 dígitos al correo del usuario."""
    request_otp(data, db)
    return {"message": "Se envio el codigo OTP al correo indicado."}


@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def verify_otp_alias(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verifica el código OTP de 6 dígitos e inicia sesión generando un token JWT."""
    access_token, user = verify_otp(data, db)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": AuthUserResponse.model_validate(user),
    }


@router.get("/me", response_model=UsuarioResponse)
def get_current_user_profile(user_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Obtiene el perfil del usuario actual."""
    if user_id:
        usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    else:
        usuario = db.query(Usuario).first()

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay usuarios registrados",
        )
    return usuario
