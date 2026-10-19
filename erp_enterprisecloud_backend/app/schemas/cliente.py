"""
Schemas de Cliente
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ClienteBase(BaseModel):
    """Base de cliente"""
    tipo_documento: str  # RUC, DNI, CE, Pasaporte
    numero_documento: str
    razon_social: str
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None
    provincia: Optional[str] = None
    departamento: Optional[str] = None


class ClienteCreate(ClienteBase):
    """Crear cliente"""
    limite_credito: Optional[Decimal] = Decimal("0")
    dias_credito: Optional[int] = 30
    observaciones: Optional[str] = None
    
    @validator('tipo_documento')
    def validate_tipo_documento(cls, v):
        tipos_validos = ['RUC', 'DNI', 'CE', 'Pasaporte']
        if v not in tipos_validos:
            raise ValueError(f'Tipo de documento debe ser uno de: {", ".join(tipos_validos)}')
        return v
    
    @validator('numero_documento')
    def validate_numero_documento(cls, v, values):
        tipo = values.get('tipo_documento')
        if tipo == 'RUC' and len(v) != 11:
            raise ValueError('RUC debe tener 11 dígitos')
        elif tipo == 'DNI' and len(v) != 8:
            raise ValueError('DNI debe tener 8 dígitos')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "tipo_documento": "RUC",
                "numero_documento": "20123456789",
                "razon_social": "Empresa Cliente S.A.C.",
                "nombre_comercial": "Cliente SAC",
                "email": "contacto@cliente.com",
                "telefono": "01-1234567",
                "celular": "987654321",
                "direccion": "Av. Principal 123",
                "distrito": "Miraflores",
                "provincia": "Lima",
                "departamento": "Lima",
                "limite_credito": 50000,
                "dias_credito": 30
            }
        }


class ClienteUpdate(BaseModel):
    """Actualizar cliente"""
    razon_social: Optional[str] = None
    nombre_comercial: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    celular: Optional[str] = None
    direccion: Optional[str] = None
    distrito: Optional[str] = None
    provincia: Optional[str] = None
    departamento: Optional[str] = None
    limite_credito: Optional[Decimal] = None
    dias_credito: Optional[int] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None


class ClienteResponse(ClienteBase):
    """Respuesta de cliente"""
    id: int
    cliente_codigo: str
    limite_credito: Decimal
    dias_credito: int
    estado: str
    observaciones: Optional[str]
    fecha_creacion: datetime
    
    class Config:
        from_attributes = True


class ClienteList(BaseModel):
    """Lista paginada de clientes"""
    total: int
    clientes: List[ClienteResponse]
    pagina: int
    por_pagina: int
