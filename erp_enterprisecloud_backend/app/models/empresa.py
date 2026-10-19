"""
Modelo de Empresa
"""
from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func

from app.db.session import Base


class Empresa(Base):
    __tablename__ = "empresa"
    
    id = Column(Integer, primary_key=True, index=True)
    ruc = Column(String(20), unique=True, nullable=False)
    razon_social = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    direccion = Column(Text)
    distrito = Column(String(100))
    provincia = Column(String(100))
    departamento = Column(String(100))
    telefono = Column(String(20))
    email = Column(String(150))
    web = Column(String(255))
    logo_url = Column(String(255))
    representante_legal = Column(String(200))
    regimen_tributario = Column(String(100))
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
