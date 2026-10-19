"""
Modelos de Documentos en S3
"""
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text, BigInteger
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.session import Base


class CategoriaDocumento(Base):
    __tablename__ = "categorias_documento"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False)
    descripcion = Column(Text)
    estado = Column(String(20), default="activo")
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    documentos = relationship("DocumentoS3", back_populates="categoria")


class DocumentoS3(Base):
    __tablename__ = "documentos_s3"
    
    id = Column(Integer, primary_key=True, index=True)
    documento_codigo = Column(String(50), unique=True, nullable=False, index=True)
    nombre_original = Column(String(255), nullable=False)
    nombre_s3 = Column(String(255), nullable=False)  # Nombre único en S3
    s3_key = Column(String(500), nullable=False)  # Ruta completa en S3
    s3_bucket = Column(String(100), nullable=False)
    categoria_id = Column(Integer, ForeignKey("categorias_documento.id"))
    tipo_archivo = Column(String(50))  # pdf, xlsx, jpg, png, etc.
    mime_type = Column(String(100))
    tamanio_bytes = Column(BigInteger)
    descripcion = Column(Text)
    modulo_origen = Column(String(50))  # ventas, compras, inventario, etc.
    registro_id = Column(Integer)  # ID del registro relacionado (factura_id, oc_id, etc.)
    url_descarga = Column(Text)  # URL pre-firmada (temporal)
    estado = Column(String(20), default="activo")  # activo, eliminado
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())
    subido_por = Column(Integer, ForeignKey("usuarios.id"))
    
    # Relaciones
    categoria = relationship("CategoriaDocumento", back_populates="documentos")
