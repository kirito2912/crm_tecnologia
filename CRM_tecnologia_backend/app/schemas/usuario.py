from typing import Optional
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, ConfigDict


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Optional[str] = "analista"  # "analista" | "administrador" | "programador" | "auditor"
    empresa: Optional[str] = None
    avatar: Optional[str] = None
    biometric_verified: Optional[bool] = False
    habilitado: Optional[bool] = True
    estado: Optional[str] = "activo"  # "activo" | "deshabilitado" | "pendiente_aprobacion"
    invitado_por: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    id: Optional[str] = None
    password: Optional[str] = None


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[EmailStr] = None
    rol: Optional[str] = None
    empresa: Optional[str] = None
    avatar: Optional[str] = None
    biometric_verified: Optional[bool] = None
    habilitado: Optional[bool] = None
    estado: Optional[str] = None
    invitado_por: Optional[str] = None
    password: Optional[str] = None


class UsuarioResponse(UsuarioBase):
    id: str
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    role: Optional[str] = None
    remember_me: Optional[bool] = False


class BiometricLoginRequest(BaseModel):
    email: EmailStr
    distance_tolerance: Optional[float] = 0.45
    embedding_sample: Optional[list[float]] = None


class RegisterRequest(BaseModel):
    full_name: str
    company_email: EmailStr
    password: str
    role: Optional[str] = "analista"
    company: Optional[str] = None
    invitacion_token: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UsuarioResponse] = None
    token: Optional[str] = None
    requiere_aprobacion: Optional[bool] = False

