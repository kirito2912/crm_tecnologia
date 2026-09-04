from datetime import datetime
# pyrefly: ignore [missing-import]
from sqlalchemy import Column, String, Text, DateTime, Integer, JSON
from app.db.conexion import Base


class Documento(Base):
    __tablename__ = "documentos"

    id = Column(String(50), primary_key=True, index=True)
    nombre = Column(String(255), nullable=False, index=True)
    tipo = Column(String(20), nullable=False, index=True)  # 'pdf', 'word', 'docx', 'doc'
    tamanio = Column(String(50), nullable=False)  # Ej: '2.4 MB'
    tamanio_bytes = Column(Integer, default=0, nullable=False)
    categoria = Column(String(100), default="General", nullable=False, index=True)
    descripcion = Column(Text, nullable=True)
    archivo_url = Column(String(500), nullable=True)
    archivo_base64 = Column(Text, nullable=True)  # Almacenamiento directo para descarga/preview
    subido_por = Column(String(150), nullable=False)
    usuario_id = Column(String(50), nullable=True, index=True)
    usuario_rol = Column(String(50), default="analista", nullable=False)  # 'analista' | 'administrador'
    tags_json = Column(JSON, nullable=True)
    # Roles que pueden ver este documento: ['todos'] | ['analista', 'programador', ...] | etc.
    destinatarios_roles = Column(JSON, nullable=True, default=lambda: ["todos"])
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
