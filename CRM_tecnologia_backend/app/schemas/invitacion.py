from typing import Optional, List
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, ConfigDict
from app.schemas.usuario import UsuarioResponse


class InvitacionCreate(BaseModel):
    email: EmailStr
    nombre_referencial: Optional[str] = None
    rol_asignado: Optional[str] = "analista"  # "analista", "programador", "auditor", "administrador"


class InvitacionResponse(BaseModel):
    id: str
    email: EmailStr
    nombre_referencial: Optional[str] = None
    rol_asignado: str
    token: str
    enlace_completo: Optional[str] = None
    estado: str  # "pendiente", "registrado", "cancelado", "expirado"
    creado_por: str
    created_at: datetime
    expires_at: datetime
    email_enviado: Optional[bool] = None  # True si el correo de invitación fue enviado con éxito

    model_config = ConfigDict(from_attributes=True)


class ValidateTokenResponse(BaseModel):
    valido: bool
    email: Optional[str] = None
    nombre_referencial: Optional[str] = None
    rol_asignado: Optional[str] = None
    mensaje: str


class RegisterInvitedRequest(BaseModel):
    token: str
    full_name: str
    password: str
    phone: Optional[str] = None


class ToggleUserStatusRequest(BaseModel):
    habilitado: bool
    motivo: Optional[str] = None


class NotificacionSolicitud(BaseModel):
    id: str
    usuario_id: str
    nombre: str
    email: str
    rol: str
    fecha: datetime
    mensaje: str


class InvitacionDashboardResponse(BaseModel):
    total_usuarios: int
    usuarios_habilitados: int
    usuarios_pendientes: int
    invitaciones_activas: int
    usuarios: List[UsuarioResponse]
    invitaciones: List[InvitacionResponse]
    solicitudes_pendientes: List[NotificacionSolicitud]
