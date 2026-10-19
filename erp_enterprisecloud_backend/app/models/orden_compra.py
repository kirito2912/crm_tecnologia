"""
Modelos de Orden de Compra y Solicitud de Compra
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class SolicitudCompra(Base):
    __tablename__ = "solicitudes_compra"
    
    id = Column(Integer, primary_key=True, index=True)
    solicitud_numero = Column(String(20), unique=True, nullable=False, index=True)
    fecha_solicitud = Column(Date, nullable=False)
    fecha_necesidad = Column(Date, nullable=False)
    area_solicitante = Column(String(100))
    estado = Column(String(20), default="pendiente")  # pendiente, aprobada, rechazada, convertida
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    aprobado_por = Column(Integer, ForeignKey("usuarios.id"))


class OrdenCompra(Base):
    __tablename__ = "ordenes_compra"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_numero = Column(String(20), unique=True, nullable=False, index=True)
    solicitud_compra_id = Column(Integer, ForeignKey("solicitudes_compra.id"))
    proveedor_id = Column(Integer, ForeignKey("proveedores.id"), nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_entrega = Column(Date)
    moneda = Column(String(3), default="PEN")
    tipo_cambio = Column(Numeric(10, 4), default=1)
    subtotal = Column(Numeric(12, 2), default=0)
    descuento = Column(Numeric(12, 2), default=0)
    igv = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    estado = Column(String(20), default="pendiente")  # pendiente, aprobada, recibida, cancelada
    tipo_pago = Column(String(20), default="credito")
    observaciones = Column(Text)
    direccion_entrega = Column(Text)
    requiere_aprobacion = Column(String(20), default="no")  # si, no
    aprobado_por = Column(Integer, ForeignKey("usuarios.id"))
    fecha_aprobacion = Column(DateTime)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    proveedor = relationship("Proveedor", back_populates="ordenes_compra")
    detalles = relationship("OrdenCompraDetalle", back_populates="orden_compra", cascade="all, delete-orphan")


class OrdenCompraDetalle(Base):
    __tablename__ = "orden_compra_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    orden_compra_id = Column(Integer, ForeignKey("ordenes_compra.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False)
    cantidad_recibida = Column(Numeric(12, 2), default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(12, 2), default=0)
    subtotal = Column(Numeric(12, 2), nullable=False)
    observaciones = Column(Text)
    
    # Relaciones
    orden_compra = relationship("OrdenCompra", back_populates="detalles")
