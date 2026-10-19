"""
Modelo de Cuentas por Pagar
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CuentaPorPagar(Base):
    __tablename__ = "cuentas_por_pagar"
    
    id = Column(Integer, primary_key=True, index=True)
    cuenta_numero = Column(String(20), unique=True, nullable=False, index=True)
    orden_compra_id = Column(Integer, ForeignKey("ordenes_compra.id"), nullable=False)
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    monto_original = Column(Numeric(12, 2), nullable=False)
    monto_pagado = Column(Numeric(12, 2), default=0)
    monto_pendiente = Column(Numeric(12, 2), nullable=False)
    moneda = Column(String(3), default="PEN")
    estado = Column(String(20), default="pendiente")  # pendiente, pagada_parcial, pagada, vencida
    dias_vencimiento = Column(Integer, default=0)
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relaciones
    proveedor = relationship("Proveedor", back_populates="cuentas_por_pagar")
