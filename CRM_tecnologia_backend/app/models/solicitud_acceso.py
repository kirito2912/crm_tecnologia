from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean, ForeignKey
from app.db.conexion import Base


class SolicitudAcceso(Base):
    __tablename__ = "solicitudes_acceso"

    id = Column(String(50), primary_key=True)
    email = Column(String(150), unique=True, nullable=False, index=True)
    nombre = Column(String(150), nullable=False)
    empresa = Column(String(150), nullable=True)
    motivo = Column(String(1000), nullable=False)
    estado = Column(String(30), nullable=False, default="pendiente", index=True)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    resuelta_at = Column(DateTime, nullable=True)
    resuelta_por = Column(String(150), nullable=True)
    invitacion_id = Column(String(50), ForeignKey("invitaciones.id"), nullable=True)
    correo_enviado = Column(Boolean, nullable=True)
