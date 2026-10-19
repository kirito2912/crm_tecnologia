"""
Modelos de Recepción de Mercadería
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Recepcion(Base):
    __tablename__ = "recepciones"
    
    id = Column(Integer, primary_key=True, index=True)
    recepcion_numero = Column(String(20), unique=True, nullable=False, index=True)
    orden_compra_id = Column(Integer, ForeignKey("ordenes_compra.id"), nullable=False)
    fecha_recepcion = Column(Date, nullable=False)
    guia_remision = Column(String(50))
    transportista = Column(String(200))
    placa_vehiculo = Column(String(20))
    estado = Column(String(20), default="recibido")  # recibido, verificado, observado
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    detalles = relationship("RecepcionDetalle", back_populates="recepcion", cascade="all, delete-orphan")


class RecepcionDetalle(Base):
    __tablename__ = "recepcion_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    recepcion_id = Column(Integer, ForeignKey("recepciones.id", ondelete="CASCADE"), nullable=False)
    orden_compra_detalle_id = Column(Integer, ForeignKey("orden_compra_detalles.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad_ordenada = Column(Numeric(12, 2), nullable=False)
    cantidad_recibida = Column(Numeric(12, 2), nullable=False)
    cantidad_aceptada = Column(Numeric(12, 2), nullable=False)
    cantidad_rechazada = Column(Numeric(12, 2), default=0)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    lote = Column(String(50))
    fecha_vencimiento = Column(Date)
    observaciones = Column(Text)
    
    # Relaciones
    recepcion = relationship("Recepcion", back_populates="detalles")
