from sqlalchemy.orm import validates
from app.core.roles import database_role
from datetime import datetime, timedelta
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, DateTime, Boolean
from app.db.conexion import Base


class Invitacion(Base):
    __tablename__ = "invitaciones"

    id = Column(String(50), primary_key=True, index=True)
    email = Column(String(150), nullable=False, index=True)
    nombre_referencial = Column(String(150), nullable=True)
    rol_asignado = Column(String(80), default="analista", nullable=False)  # "colaborador", "programador", "auditor", "administrador"
    token = Column(String(100), unique=True, nullable=False, index=True)
    estado = Column(String(50), default="pendiente", nullable=False)  # "pendiente", "registrado", "cancelado", "expirado"
    creado_por = Column(String(150), default="Administrador", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=7), nullable=False)

    @validates("rol_asignado")
    def validate_database_role(self, key, value):
        return database_role(value)
