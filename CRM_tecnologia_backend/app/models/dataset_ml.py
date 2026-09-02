# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Integer, Text, JSON, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from app.db.conexion import Base


class DatasetML(Base):
    __tablename__ = "datasets_ml"

    id = Column(String(100), primary_key=True, index=True)
    nombre = Column(String(200), nullable=False)
    categoria = Column(String(100), default="Empresarial", nullable=False, index=True)
    registros_totales = Column(Integer, default=0, nullable=False)
    features_count = Column(Integer, default=0, nullable=False)
    columna_objetivo = Column(String(100), nullable=True)
    tamanio_archivo = Column(String(30), nullable=True)
    descripcion = Column(Text, nullable=True)
    columnas_json = Column(JSON, nullable=True)
    muestra_filas_json = Column(JSON, nullable=True)
    creado_por = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
