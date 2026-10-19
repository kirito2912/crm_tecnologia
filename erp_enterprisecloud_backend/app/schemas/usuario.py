"""
Schemas de Usuario
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime


class UsuarioBase(BaseModel):
    """Base de usuario"""
    nombre_completo: str
    email: EmailStr
    telefono: Optional[str] = None


class UsuarioCreate(UsuarioBase):
    """Crear usuario"""
    password: str
    roles: List[int] = []  # IDs de roles
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('La contraseña debe tener al menos 6 caracteres')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre_completo": "María López Sánchez",
                "email": "maria.lopez@empresa.com",
                "password": "Password123",
                "telefono": "987654321",
                "roles": [2]  # ID del rol "Vendedor"
            }
        }


class UsuarioUpdate(BaseModel):
    """Actualizar usuario"""
    nombre_completo: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    foto_perfil: Optional[str] = None
    estado: Optional[str] = None
    roles: Optional[List[int]] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre_completo": "María López Sánchez",
                "telefono": "999888777",
                "estado": "activo"
            }
        }


class UsuarioResponse(UsuarioBase):
    """Respuesta de usuario"""
    id: int
    usuario_codigo: str
    foto_perfil: Optional[str]
    estado: str
    ultimo_acceso: Optional[datetime]
    fecha_creacion: datetime
    roles: List[str] = []
    
    class Config:
        from_attributes = True


class UsuarioList(BaseModel):
    """Lista paginada de usuarios"""
    total: int
    usuarios: List[UsuarioResponse]
    pagina: int
    por_pagina: int
    
    class Config:
        json_schema_extra = {
            "example": {
                "total": 25,
                "usuarios": [],
                "pagina": 1,
                "por_pagina": 10
            }
        }
