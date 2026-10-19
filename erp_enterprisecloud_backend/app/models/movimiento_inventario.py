"""
Modelos de Movimiento de Inventario y Ajustes
"""
from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"
    
    id = Column(Integer, primary_key=True, index=True)
    movimiento_numero = Column(String(20), unique=True, nullable=False, index=True)
    tipo_movimiento = Column(String(20), nullable=False)  # entrada, salida, transferencia
    subtipo = Column(String(50))  # compra, venta, ajuste, devolucion, traslado
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    almacen_origen_id = Column(Integer, ForeignKey("almacenes.id"))
    almacen_destino_id = Column(Integer, ForeignKey("almacenes.id"))
    cantidad = Column(Numeric(12, 2), nullable=False)
    costo_unitario = Column(Numeric(12, 2))
    costo_total = Column(Numeric(12, 2))
    fecha_movimiento = Column(Date, nullable=False)
    documento_referencia = Column(String(100))  # Factura, OC, Guía, etc.
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))


class AjusteInventario(Base):
    __tablename__ = "ajustes_inventario"
    
    id = Column(Integer, primary_key=True, index=True)
    ajuste_numero = Column(String(20), unique=True, nullable=False, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    cantidad_sistema = Column(Numeric(12, 2), nullable=False)
    cantidad_fisica = Column(Numeric(12, 2), nullable=False)
    diferencia = Column(Numeric(12, 2), nullable=False)
    tipo_ajuste = Column(String(20))  # sobrante, faltante
    motivo = Column(Text)
    fecha_ajuste = Column(Date, nullable=False)
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    aprobado_por = Column(Integer, ForeignKey("usuarios.id"))
