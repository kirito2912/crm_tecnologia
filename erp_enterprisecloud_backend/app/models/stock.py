"""
Modelo de Stock
"""
from sqlalchemy import Column, Integer, DateTime, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Stock(Base):
    __tablename__ = "stocks"
    
    id = Column(Integer, primary_key=True, index=True)
    producto_id = Column(Integer, ForeignKey("productos.id"), nullable=False)
    almacen_id = Column(Integer, ForeignKey("almacenes.id"), nullable=False)
    cantidad = Column(Numeric(12, 2), default=0, nullable=False)
    cantidad_reservada = Column(Numeric(12, 2), default=0)
    cantidad_disponible = Column(Numeric(12, 2), default=0)
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relaciones
    producto = relationship("Producto", back_populates="stocks")
    almacen = relationship("Almacen", back_populates="stocks")
