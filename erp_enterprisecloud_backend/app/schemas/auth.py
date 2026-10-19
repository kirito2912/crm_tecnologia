"""
Schemas de Autenticación
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    """Request para login"""
    email: EmailStr
    password: str
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "admin@empresa.com",
                "password": "Admin123!"
            }
        }


class RegisterRequest(BaseModel):
    """Request para registro de nuevo usuario"""
    nombre_completo: str
    email: EmailStr
    password: str
    telefono: Optional[str] = None
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v
    
    @validator('nombre_completo')
    def validate_nombre(cls, v):
        if len(v) < 3:
            raise ValueError('El nombre debe tener al menos 3 caracteres')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre_completo": "Juan Pérez García",
                "email": "juan.perez@empresa.com",
                "password": "MiPassword123",
                "telefono": "987654321"
            }
        }


class UserResponse(BaseModel):
    """Respuesta con información básica del usuario"""
    id: int
    usuario_codigo: str
    nombre_completo: str
    email: str
    telefono: Optional[str]
    foto_perfil: Optional[str]
    estado: str
    roles: List[str] = []
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Respuesta con token de acceso"""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": 1,
                    "usuario_codigo": "USR-000001",
                    "nombre_completo": "Administrador del Sistema",
                    "email": "admin@empresa.com",
                    "telefono": "987654321",
                    "estado": "activo",
                    "roles": ["Administrador"]
                }
            }
        }


class ChangePasswordRequest(BaseModel):
    """Request para cambiar contraseña"""
    password_actual: str
    password_nueva: str
    
    @validator('password_nueva')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v
