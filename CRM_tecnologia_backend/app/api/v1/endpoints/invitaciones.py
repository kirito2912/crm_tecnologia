import uuid
import secrets
from datetime import datetime, timedelta
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import desc

from app.db.conexion import get_db
from app.core.security import hash_password
from app.models.invitacion import Invitacion
from app.models.usuario import Usuario
from app.models.user import User
from app.schemas.usuario import UsuarioResponse
from app.schemas.invitacion import (
    InvitacionCreate,
    InvitacionResponse,
    ValidateTokenResponse,
    RegisterInvitedRequest,
    ToggleUserStatusRequest,
    NotificacionSolicitud,
    InvitacionDashboardResponse,
)
from app.services.email_service import send_invitation_email

router = APIRouter(prefix="/invitaciones", tags=["Gestión de Invitaciones y Personal"])

FRONTEND_URL = "http://localhost:5173"


@router.get("/", response_model=List[InvitacionResponse])
def listar_invitaciones(db: Session = Depends(get_db)):
    """Lista todas las invitaciones enviadas a trabajadores."""
    invitaciones = db.query(Invitacion).order_by(desc(Invitacion.created_at)).all()
    # Construir enlace_completo dinámicamente
    for inv in invitaciones:
        inv.enlace_completo = f"{FRONTEND_URL}/?invite_token={inv.token}"
    return invitaciones


@router.post("/", response_model=InvitacionResponse, status_code=status.HTTP_201_CREATED)
def crear_invitacion(
    body: InvitacionCreate,
    creado_por: Optional[str] = "Jane Doe (Administrador)",
    db: Session = Depends(get_db),
):
    """Genera una nueva invitación para un trabajador con rol predefinido y enlace único."""
    email_clean = body.email.strip().lower()

    # Verificar si el usuario ya existe en el sistema
    usuario_existente = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()
    if usuario_existente and usuario_existente.habilitado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El correo '{email_clean}' ya pertenece a un usuario activo en el sistema.",
        )

    # Cancelar invitaciones previas pendientes del mismo correo
    previas = db.query(Invitacion).filter(
        Invitacion.email.ilike(email_clean),
        Invitacion.estado == "pendiente",
    ).all()
    for p in previas:
        p.estado = "cancelado"

    inv_id = f"INV-{uuid.uuid4().hex[:8].upper()}"
    token_str = f"inv_tok_{secrets.token_urlsafe(24)}"

    nueva = Invitacion(
        id=inv_id,
        email=email_clean,
        nombre_referencial=body.nombre_referencial or email_clean.split("@")[0],
        rol_asignado=body.rol_asignado or "analista",
        token=token_str,
        estado="pendiente",
        creado_por=creado_por or "Jane Doe (Administrador)",
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=7),
    )

    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    enlace = f"{FRONTEND_URL}/?invite_token={token_str}"
    nueva.enlace_completo = enlace

    # Enviar el enlace al correo del trabajador invitado
    email_enviado = send_invitation_email(
        recipient_email=email_clean,
        invite_link=enlace,
        nombre_referencial=nueva.nombre_referencial,
        rol_asignado=nueva.rol_asignado,
        creado_por=creado_por or "el Administrador",
        expires_days=7,
    )
    nueva.email_enviado = email_enviado

    return nueva


@router.get("/validar/{token}", response_model=ValidateTokenResponse)
def validar_token_invitacion(token: str, db: Session = Depends(get_db)):
    """Valida la vigencia y estado de un token de invitación."""
    inv = db.query(Invitacion).filter(Invitacion.token == token).first()
    if not inv:
        return ValidateTokenResponse(
            valido=False,
            mensaje="El enlace de invitación no es válido o no existe.",
        )

    if inv.estado == "registrado":
        return ValidateTokenResponse(
            valido=False,
            email=inv.email,
            nombre_referencial=inv.nombre_referencial,
            rol_asignado=inv.rol_asignado,
            mensaje="Esta invitación ya fue utilizada para completar el registro.",
        )

    if inv.estado != "pendiente":
        return ValidateTokenResponse(
            valido=False,
            mensaje=f"Esta invitación se encuentra en estado '{inv.estado}'.",
        )

    if inv.expires_at and inv.expires_at < datetime.utcnow():
        inv.estado = "expirado"
        db.commit()
        return ValidateTokenResponse(
            valido=False,
            mensaje="El enlace de invitación ha expirado. Solicita uno nuevo al administrador.",
        )

    return ValidateTokenResponse(
        valido=True,
        email=inv.email,
        nombre_referencial=inv.nombre_referencial,
        rol_asignado=inv.rol_asignado,
        mensaje=f"Invitación válida para el rol de {inv.rol_asignado.capitalize()}.",
    )


@router.post("/completar-registro", status_code=status.HTTP_201_CREATED)
def completar_registro_invitado(
    body: RegisterInvitedRequest,
    db: Session = Depends(get_db),
):
    """Completa el registro del trabajador invitado. La cuenta queda en estado 'pendiente_aprobacion' (deshabilitada) hasta autorización del admin."""
    inv = db.query(Invitacion).filter(Invitacion.token == body.token).first()
    if not inv or inv.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La invitación no es válida o ya fue utilizada.",
        )

    email_clean = inv.email.strip().lower()
    hashed_pwd = hash_password(body.password)

    # Generar o actualizar Usuario
    usuario = db.query(Usuario).filter(Usuario.email.ilike(email_clean)).first()
    parts = body.full_name.strip().split()
    avatar = "".join([p[0].upper() for p in parts[:2]]) if parts else "TR"

    if not usuario:
        total = db.query(Usuario).count()
        user_id = f"USR-{total + 101:03d}"
        usuario = Usuario(
            id=user_id,
            nombre=body.full_name,
            email=email_clean,
            password_hash=hashed_pwd,
            rol=inv.rol_asignado,
            empresa="DataTech Analytics",
            avatar=avatar,
            biometric_verified=True,
            habilitado=False,  # IMPORTANTE: Deshabilitado hasta aprobación
            estado="pendiente_aprobacion",
            invitado_por=inv.creado_por,
        )
        db.add(usuario)
    else:
        usuario.nombre = body.full_name
        usuario.password_hash = hashed_pwd
        usuario.rol = inv.rol_asignado
        usuario.avatar = avatar
        usuario.biometric_verified = True
        usuario.habilitado = False
        usuario.estado = "pendiente_aprobacion"
        usuario.invitado_por = inv.creado_por

    # Sincronizar en User
    user_otp = db.query(User).filter(User.email.ilike(email_clean)).first()
    if not user_otp:
        user_otp = User(
            email=email_clean,
            full_name=body.full_name,
            password_hash=hashed_pwd,
            role=inv.rol_asignado,
            is_active=False,
            is_verified=True,
        )
        db.add(user_otp)
    else:
        user_otp.full_name = body.full_name
        user_otp.password_hash = hashed_pwd
        user_otp.role = inv.rol_asignado
        user_otp.is_active = False
        user_otp.is_verified = True

    # Marcar invitación como completada
    inv.estado = "registrado"

    db.commit()
    db.refresh(usuario)

    return {
        "success": True,
        "message": "Registro completado con éxito. Tu cuenta fue enviada a la bandeja de autorización del Administrador.",
        "user": UsuarioResponse.model_validate(usuario),
        "requiere_aprobacion": True,
    }


@router.get("/dashboard", response_model=InvitacionDashboardResponse)
def obtener_dashboard_invitaciones(db: Session = Depends(get_db)):
    """Retorna las métricas, usuarios, invitaciones y solicitudes pendientes de autorización para el Administrador."""
    usuarios = db.query(Usuario).order_by(desc(Usuario.created_at)).all()
    invitaciones = db.query(Invitacion).order_by(desc(Invitacion.created_at)).all()

    for inv in invitaciones:
        inv.enlace_completo = f"{FRONTEND_URL}/?invite_token={inv.token}"

    total_usuarios = len(usuarios)
    usuarios_habilitados = sum(1 for u in usuarios if u.habilitado)
    usuarios_pendientes = sum(1 for u in usuarios if not u.habilitado or u.estado == "pendiente_aprobacion")
    invitaciones_activas = sum(1 for i in invitaciones if i.estado == "pendiente")

    solicitudes = [
        NotificacionSolicitud(
            id=f"SOL-{u.id}",
            usuario_id=u.id,
            nombre=u.nombre,
            email=u.email,
            rol=u.rol,
            fecha=u.created_at or datetime.utcnow(),
            mensaje=f"El trabajador {u.nombre} ({u.email}) completó su verificación OTP con rol '{u.rol}'. Requiere autorización.",
        )
        for u in usuarios
        if not u.habilitado or u.estado == "pendiente_aprobacion"
    ]

    return InvitacionDashboardResponse(
        total_usuarios=total_usuarios,
        usuarios_habilitados=usuarios_habilitados,
        usuarios_pendientes=usuarios_pendientes,
        invitaciones_activas=invitaciones_activas,
        usuarios=[UsuarioResponse.model_validate(u) for u in usuarios],
        invitaciones=[InvitacionResponse.model_validate(i) for i in invitaciones],
        solicitudes_pendientes=solicitudes,
    )


@router.patch("/usuarios/{usuario_id}/toggle-status", response_model=UsuarioResponse)
def alternar_estado_usuario(
    usuario_id: str,
    body: ToggleUserStatusRequest,
    db: Session = Depends(get_db),
):
    """Permite al Administrador habilitar o deshabilitar la cuenta de un trabajador con efecto inmediato."""
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID '{usuario_id}' no encontrado",
        )

    usuario.habilitado = body.habilitado
    usuario.estado = "activo" if body.habilitado else "deshabilitado"

    # Sincronizar en tabla User
    user_otp = db.query(User).filter(User.email.ilike(usuario.email)).first()
    if user_otp:
        user_otp.is_active = body.habilitado

    db.commit()
    db.refresh(usuario)
    return usuario


@router.delete("/{invitacion_id}", status_code=status.HTTP_200_OK)
def revocar_invitacion(invitacion_id: str, db: Session = Depends(get_db)):
    """Revoca o cancela una invitación pendiente."""
    inv = db.query(Invitacion).filter(Invitacion.id == invitacion_id).first()
    if not inv:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Invitación con ID '{invitacion_id}' no encontrada",
        )

    inv.estado = "cancelado"
    db.commit()
    return {"message": f"Invitación para '{inv.email}' cancelada exitosamente"}
