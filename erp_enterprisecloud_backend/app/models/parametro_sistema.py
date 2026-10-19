"""
Modelos de Parámetros del Sistema y Secuencias
"""
from sqlalchemy import Column, Integer, String, DateTime, Text, Numeric
from sqlalchemy.sql import func

from app.db.session import Base


class ParametroSistema(Base):
    __tablename__ = "parametros_sistema"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    valor = Column(Text)
    tipo_dato = Column(String(20))  # string, number, boolean, json
    descripcion = Column(Text)
    modulo = Column(String(50))  # general, ventas, compras, inventario, etc.
    es_editable = Column(String(20), default="si")  # si, no
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())


class Secuencia(Base):
    __tablename__ = "secuencias"
    
    id = Column(Integer, primary_key=True, index=True)
    tabla = Column(String(100), unique=True, nullable=False, index=True)
    prefijo = Column(String(10))
    siguiente_numero = Column(Integer, default=1, nullable=False)
    longitud = Column(Integer, default=8)
    descripcion = Column(Text)
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
