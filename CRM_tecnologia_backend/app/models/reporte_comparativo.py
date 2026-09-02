from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, JSON
from app.db.conexion import Base


class ReporteComparativo(Base):
    __tablename__ = "reportes_comparativos"

    id = Column(String(50), primary_key=True, index=True)
    titulo = Column(String(200), nullable=False)
    analista_id = Column(String(50), nullable=False, index=True)
    analista_nombre = Column(String(150), nullable=False)
    dataset_a_id = Column(String(100), nullable=False)
    dataset_a_nombre = Column(String(150), nullable=False)
    dataset_b_id = Column(String(100), nullable=False)
    dataset_b_nombre = Column(String(150), nullable=False)
    resumen_ejecutivo = Column(Text, nullable=False)
    hallazgos_clave = Column(Text, nullable=True)
    metricas_json = Column(JSON, nullable=True)
    recomendaciones = Column(Text, nullable=True)
    estado = Column(String(50), default="recibido", nullable=False, index=True)  # recibido, en_revision, aprobado, con_observaciones
    feedback_admin = Column(Text, nullable=True)
    admin_responsable = Column(String(150), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
