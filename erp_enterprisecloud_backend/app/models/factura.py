"""
Modelos de Factura
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Factura(Base):
    __tablename__ = "facturas"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_numero = Column(String(20), unique=True, nullable=False, index=True)  # F001-00000001
    serie = Column(String(4), nullable=False)  # F001
    correlativo = Column(Integer, nullable=False)
    tipo_comprobante = Column(String(20), default="factura")  # factura, boleta, nota_credito, nota_debito
    pedido_id = Column(Integer, ForeignKey("pedidos.id"))
    cliente_id = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    fecha_emision = Column(Date, nullable=False)
    fecha_vencimiento = Column(Date)
    moneda = Column(String(3), default="PEN")
    tipo_cambio = Column(Numeric(10, 4), default=1)
    subtotal = Column(Numeric(12, 2), default=0)
    descuento = Column(Numeric(12, 2), default=0)
    igv = Column(Numeric(12, 2), default=0)
    total = Column(Numeric(12, 2), default=0)
    total_letras = Column(String(255))
    estado = Column(String(20), default="emitida")  # emitida, pagada, anulada
    estado_sunat = Column(String(20))  # aceptado, rechazado, pendiente
    tipo_pago = Column(String(20), default="credito")  # contado, credito
    forma_pago = Column(String(50))  # efectivo, transferencia, tarjeta
    observaciones = Column(Text)
    hash_cpe = Column(String(255))  # Hash del comprobante electrónico
    xml_sunat = Column(Text)  # XML enviado a SUNAT
    cdr_sunat = Column(Text)  # CDR de SUNAT
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    cliente = relationship("Cliente", back_populates="facturas")
    detalles = relationship("FacturaDetalle", back_populates="factura", cascade="all, delete-orphan")


class FacturaDetalle(Base):
    __tablename__ = "factura_detalles"
    
    id = Column(Integer, primary_key=True, index=True)
    factura_id = Column(Integer, ForeignKey("facturas.id", ondelete="CASCADE"), nullable=False)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), nullable=False)
    precio_unitario = Column(Numeric(12, 2), nullable=False)
    descuento = Column(Numeric(12, 2), default=0)
    subtotal = Column(Numeric(12, 2), nullable=False)
    igv = Column(Numeric(12, 2), nullable=False)
    total = Column(Numeric(12, 2), nullable=False)
    observaciones = Column(Text)
    
    # Relaciones
    factura = relationship("Factura", back_populates="detalles")
    producto = relationship("Producto", back_populates="factura_detalles")
