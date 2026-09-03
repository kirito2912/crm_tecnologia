from typing import Optional, List, Any
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


class DocumentoBase(BaseModel):
    nombre: str
    tipo: str  # 'pdf', 'word', 'docx', 'doc'
    tamanio: str  # '2.4 MB'
    tamanio_bytes: Optional[int] = 0
    categoria: Optional[str] = "General"
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    archivo_base64: Optional[str] = None
    subido_por: str
    usuario_id: Optional[str] = None
    usuario_rol: Optional[str] = "analista"
    tags_json: Optional[List[str]] = None


class DocumentoCreate(DocumentoBase):
    pass


class DocumentoUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    descripcion: Optional[str] = None
    tags_json: Optional[List[str]] = None


class DocumentoResponse(BaseModel):
    id: str
    nombre: str
    tipo: str
    tamanio: str
    tamanio_bytes: int
    categoria: str
    descripcion: Optional[str] = None
    archivo_url: Optional[str] = None
    archivo_base64: Optional[str] = None
    subido_por: str
    usuario_id: Optional[str] = None
    usuario_rol: str
    tags_json: Optional[List[Any]] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
