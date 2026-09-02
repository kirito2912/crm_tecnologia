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
    rol = Column(String(80), default="analista", nullable=False)  # "analista" | "administrador"
    empresa = Column(String(150), nullable=True)
    avatar = Column(String(10), nullable=True)
    biometric_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
