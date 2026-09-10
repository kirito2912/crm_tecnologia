from app.core.roles import Role
from typing import Optional, Any
from datetime import datetime
import json
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator, model_validator


class UsuarioBase(BaseModel):
    nombre: str
    email: EmailStr
    rol: Optional[Role] = "colaborador"  # "colaborador" | "administrador" | "programador" | "auditor"
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
    rol: Optional[Role] = None
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
    permisos_proyectos: Optional[Any] = None

    model_config = ConfigDict(from_attributes=True)

    @field_validator("permisos_proyectos", mode="before")
    @classmethod
    def parse_permisos_proyectos(cls, v: Any) -> Any:
        if v is None:
            return []
        if isinstance(v, list):
            return v
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
                return []
            except (ValueError, TypeError):
                return []
        return []


class LoginRequest(BaseModel):
    email: EmailStr
    password: Optional[str] = None
    role: Optional[Role] = None
    remember_me: Optional[bool] = False


class BiometricLoginRequest(BaseModel):
    email: EmailStr
    distance_tolerance: Optional[float] = 0.45
    embedding_sample: Optional[list[float]] = None


class RegisterRequest(BaseModel):
    full_name: str
    company_email: EmailStr
    password: str
    role: Optional[Role] = "colaborador"
    company: Optional[str] = None
    invitacion_token: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    user: Optional[UsuarioResponse] = None
    token: Optional[str] = None
    requiere_aprobacion: Optional[bool] = False

