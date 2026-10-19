"""
Modelos de Producto, Categoría y Unidad de Medida
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Numeric
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CategoriaProducto(Base):
    __tablename__ = "categorias_producto"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    estado = Column(String(20), default="activo")
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    productos = relationship("Producto", back_populates="categoria")


class UnidadMedida(Base):
    __tablename__ = "unidades_medida"
    
    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(10), unique=True, nullable=False)  # UND, KG, LT, M, etc.
    nombre = Column(String(50), nullable=False)  # Unidad, Kilogramo, Litro, Metro
    simbolo = Column(String(10))  # ud, kg, lt, m
    estado = Column(String(20), default="activo")
    
    # Relaciones
    productos = relationship("Producto", back_populates="unidad_medida")


class Producto(Base):
    __tablename__ = "productos"
    
    id = Column(Integer, primary_key=True, index=True)
    producto_codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    categoria_id = Column(Integer, ForeignKey("categorias_producto.id"))
    unidad_medida_id = Column(Integer, ForeignKey("unidades_medida.id"), nullable=False)
    tipo = Column(String(20), default="producto")  # producto, servicio
    precio_compra = Column(Numeric(12, 2), default=0)
    precio_venta = Column(Numeric(12, 2), nullable=False)
    margen_utilidad = Column(Numeric(5, 2), default=0)  # Porcentaje
    stock_actual = Column(Numeric(12, 2), default=0)
    stock_minimo = Column(Numeric(12, 2), default=0)
    stock_maximo = Column(Numeric(12, 2), default=0)
    afecto_igv = Column(Boolean, default=True)
    codigo_barras = Column(String(100))
    codigo_sunat = Column(String(50))  # Código de producto SUNAT
    imagen_url = Column(String(255))
    estado = Column(String(20), default="activo")  # activo, inactivo, descontinuado
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    creado_por = Column(Integer, ForeignKey("usuarios.id"))
    modificado_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    categoria = relationship("CategoriaProducto", back_populates="productos")
    unidad_medida = relationship("UnidadMedida", back_populates="productos")
    stocks = relationship("Stock", back_populates="producto")
    cotizacion_detalles = relationship("CotizacionDetalle", back_populates="producto")
    pedido_detalles = relationship("PedidoDetalle", back_populates="producto")
    factura_detalles = relationship("FacturaDetalle", back_populates="producto")
