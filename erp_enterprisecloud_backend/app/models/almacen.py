"""
Modelo de Almacén
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Almacen(Base):
    __tablename__ = "almacenes"
    
    id = Column(Integer, primary_key=True, index=True)
    almacen_codigo = Column(String(20), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    direccion = Column(Text)
    responsable = Column(String(200))
    telefono = Column(String(20))
    es_principal = Column(Boolean, default=False)
    estado = Column(String(20), default="activo")  # activo, inactivo
    fecha_creacion = Column(DateTime, default=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    stocks = relationship("Stock", back_populates="almacen")
