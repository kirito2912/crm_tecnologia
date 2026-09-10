from sqlalchemy.orm import validates
from app.core.roles import database_role
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Boolean, DateTime
# pyrefly: ignore [missing-import]
from sqlalchemy.sql import func
from app.db.conexion import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(150), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=True)
    rol = Column(String(80), default="analista", nullable=False)  # "colaborador" | "administrador"
    empresa = Column(String(150), nullable=True)
    avatar = Column(String(10), nullable=True)
    biometric_verified = Column(Boolean, default=False)
    habilitado = Column(Boolean, default=True, nullable=False)  # True = Acceso permitido, False = Deshabilitado/Pendiente
    estado = Column(String(50), default="activo", nullable=False)  # "activo", "deshabilitado", "pendiente_aprobacion"
    invitado_por = Column(String(150), nullable=True)
    permisos_proyectos = Column(String(500), nullable=True, default=None)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


    @validates("rol")
    def validate_database_role(self, key, value):
        return database_role(value)
