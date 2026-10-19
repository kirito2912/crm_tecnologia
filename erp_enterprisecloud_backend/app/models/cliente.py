"""
Modelo de Cliente
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class Cliente(Base):
    __tablename__ = "clientes"
    
    id = Column(Integer, primary_key=True, index=True)
    cliente_codigo = Column(String(20), unique=True, nullable=False, index=True)
    tipo_documento = Column(String(20), nullable=False)  # RUC, DNI, CE, Pasaporte
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
    limite_credito = Column(Numeric(12, 2), default=0)
    dias_credito = Column(Integer, default=30)
    estado = Column(String(20), default="activo")  # activo, inactivo
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    cotizaciones = relationship("Cotizacion", back_populates="cliente")
    pedidos = relationship("Pedido", back_populates="cliente")
    facturas = relationship("Factura", back_populates="cliente")
    cuentas_por_cobrar = relationship("CuentaPorCobrar", back_populates="cliente")
