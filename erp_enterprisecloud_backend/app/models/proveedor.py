"""
Modelo de Proveedor
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Proveedor(Base):
    __tablename__ = "proveedores"
    
    id = Column(Integer, primary_key=True, index=True)
    proveedor_codigo = Column(String(20), unique=True, nullable=False, index=True)
    tipo_documento = Column(String(20), nullable=False)  # RUC, DNI
    numero_documento = Column(String(20), unique=True, nullable=False, index=True)
    razon_social = Column(String(200), nullable=False)
    nombre_comercial = Column(String(200))
    email = Column(String(150))
    telefono = Column(String(20))
    celular = Column(String(20))
    direccion = Column(Text)
    distrito = Column(String(100))
    provincia = Column(String(100))
    departamento = Column(String(100))
    pais = Column(String(100), default="Perú")
    contacto_nombre = Column(String(200))
    contacto_telefono = Column(String(20))
    contacto_email = Column(String(150))
    banco = Column(String(100))
    numero_cuenta = Column(String(50))
    cci = Column(String(50))
    dias_credito = Column(Integer, default=30)
    estado = Column(String(20), default="activo")  # activo, inactivo
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    ordenes_compra = relationship("OrdenCompra", back_populates="proveedor")
    cuentas_por_pagar = relationship("CuentaPorPagar", back_populates="proveedor")
