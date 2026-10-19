"""
Modelos de Pedido de Venta
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Pedido(Base):
    __tablename__ = "pedidos"
    
    id = Column(Integer, primary_key=True, index=True)
    pedido_numero = Column(String(20), unique=True, nullable=False, index=True)
    cotizacion_id = Column(Integer, ForeignKey("cotizaciones.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_entrega = Column(Date)
    moneda = Column(String(3), default="PEN")
    tipo_cambio = Column(Numeric(10, 4), default=1)
    subtotal = Column(Numeric(12, 2), default=0)
    descuento = Column(Numeric(12, 2), default=0)
    igv = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    estado = Column(String(20), default="pendiente")  # pendiente, en_proceso, entregado, cancelado
    tipo_pago = Column(String(20), default="credito")  # contado, credito
    observaciones = Column(Text)
    direccion_entrega = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="pedidos")
    detalles = relationship("PedidoDetalle", back_populates="pedido", cascade="all, delete-orphan")


class PedidoDetalle(Base):
    __tablename__ = "pedido_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    pedido_id = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False)
    cantidad_entregada = Column(Numeric(12, 2), default=0)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(12, 2), default=0)
    subtotal = Column(Numeric(12, 2), nullable=False)
    observaciones = Column(Text)
    
    # Relaciones
    pedido = relationship("Pedido", back_populates="detalles")
    producto = relationship("Producto", back_populates="pedido_detalles")
