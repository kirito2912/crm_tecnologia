"""
Schemas de Producto
"""
from pydantic import BaseModel, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


class ProductoBase(BaseModel):
    """Base de producto"""
    nombre: str
    descripcion: Optional[str] = None
    categoria_id: Optional[int] = None
    unidad_medida_id: int
    tipo: str = "producto"  # producto, servicio


class ProductoCreate(ProductoBase):
    """Crear producto"""
    precio_compra: Optional[Decimal] = Decimal("0")
    precio_venta: Decimal
    margen_utilidad: Optional[Decimal] = Decimal("0")
    stock_minimo: Optional[Decimal] = Decimal("0")
    stock_maximo: Optional[Decimal] = Decimal("0")
    afecto_igv: Optional[bool] = True
    codigo_barras: Optional[str] = None
    observaciones: Optional[str] = None
    
    @validator('precio_venta')
    def validate_precio_venta(cls, v):
        if v <= 0:
            raise ValueError('El precio de venta debe ser mayor a 0')
        return v
    
    @validator('tipo')
    def validate_tipo(cls, v):
        tipos_validos = ['producto', 'servicio']
        if v not in tipos_validos:
            raise ValueError(f'Tipo debe ser: {", ".join(tipos_validos)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Laptop Dell Latitude 5420",
                "descripcion": "Laptop empresarial i5 11va Gen, 16GB RAM, 512GB SSD",
                "categoria_id": 1,
                "unidad_medida_id": 1,
                "tipo": "producto",
                "precio_compra": 3500.00,
                "precio_venta": 4500.00,
                "margen_utilidad": 28.57,
                "stock_minimo": 5,
                "stock_maximo": 50,
                "afecto_igv": True,
                "codigo_barras": "7501234567890"
            }
        }


class ProductoUpdate(BaseModel):
    """Actualizar producto"""
    nombre: Optional[str] = None
    descripcion: Optional[str] = None
    categoria_id: Optional[int] = None
    unidad_medida_id: Optional[int] = None
    tipo: Optional[str] = None
    precio_compra: Optional[Decimal] = None
    precio_venta: Optional[Decimal] = None
    margen_utilidad: Optional[Decimal] = None
    stock_minimo: Optional[Decimal] = None
    stock_maximo: Optional[Decimal] = None
    afecto_igv: Optional[bool] = None
    codigo_barras: Optional[str] = None
    imagen_url: Optional[str] = None
    estado: Optional[str] = None
    observaciones: Optional[str] = None


class ProductoResponse(ProductoBase):
    """Respuesta de producto"""
    id: int
    producto_codigo: str
    precio_compra: Decimal
    precio_venta: Decimal
    margen_utilidad: Decimal
    stock_actual: Decimal
    stock_minimo: Decimal
    stock_maximo: Decimal
    afecto_igv: bool
    codigo_barras: Optional[str]
    imagen_url: Optional[str]
    estado: str
    observaciones: Optional[str]
    fecha_creacion: datetime
    categoria_nombre: Optional[str] = None
    unidad_medida_nombre: Optional[str] = None
    
    class Config:
        from_attributes = True


class ProductoList(BaseModel):
    """Lista paginada de productos"""
    total: int
    productos: List[ProductoResponse]
    pagina: int
    por_pagina: int


class StockResponse(BaseModel):
    """Respuesta de stock por almacén"""
    producto_id: int
    producto_codigo: str
    producto_nombre: str
    almacen_id: int
    almacen_nombre: str
    cantidad: Decimal
    cantidad_reservada: Decimal
    cantidad_disponible: Decimal
    fecha_actualizacion: datetime
    
    class Config:
        from_attributes = True
