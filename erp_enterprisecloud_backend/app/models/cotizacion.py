"""
Modelos de Cotización
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Cotizacion(Base):
    __tablename__ = "cotizaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    cotizacion_numero = Column(String(20), unique=True, nullable=False, index=True)
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    moneda = Column(String(3), default="PEN")  # PEN, USD
    tipo_cambio = Column(Numeric(10, 4), default=1)
    subtotal = Column(Numeric(12, 2), default=0)
    descuento = Column(Numeric(12, 2), default=0)
    igv = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    estado = Column(String(20), default="pendiente")  # pendiente, aprobada, rechazada, convertida
    observaciones = Column(Text)
    condiciones_pago = Column(Text)
    tiempo_entrega = Column(String(100))
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="cotizaciones")
    detalles = relationship("CotizacionDetalle", back_populates="cotizacion", cascade="all, delete-orphan")


class CotizacionDetalle(Base):
    __tablename__ = "cotizacion_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    cotizacion_id = Column(Integer, ForeignKey("cotizaciones.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(12, 2), default=0)
    subtotal = Column(Numeric(12, 2), nullable=False)
    observaciones = Column(Text)
    
    # Relaciones
    cotizacion = relationship("Cotizacion", back_populates="detalles")
    producto = relationship("Producto", back_populates="cotizacion_detalles")
