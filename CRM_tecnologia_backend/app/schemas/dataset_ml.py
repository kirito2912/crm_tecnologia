from typing import Optional, Any, List, Dict
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict, Field


class DatasetMLBase(BaseModel):
    nombre: str = Field(..., max_length=200)
    categoria: Optional[str] = "Empresarial"
    registros_totales: int = Field(default=0, ge=0)
    features_count: int = Field(default=0, ge=0)
    columna_objetivo: Optional[str] = None
    tamanio_archivo: Optional[str] = None
    descripcion: Optional[str] = None
    creado_por: Optional[str] = None


class DatasetMLCreate(DatasetMLBase):
    id: str = Field(..., max_length=100)
    columnas_json: Optional[List[str]] = None
    muestra_filas_json: Optional[List[Dict[str, Any]]] = None


class DatasetMLUpdate(BaseModel):
    nombre: Optional[str] = None
    categoria: Optional[str] = None
    registros_totales: Optional[int] = None
    features_count: Optional[int] = None
    columna_objetivo: Optional[str] = None
    tamanio_archivo: Optional[str] = None
    descripcion: Optional[str] = None
    columnas_json: Optional[List[str]] = None
    muestra_filas_json: Optional[List[Dict[str, Any]]] = None


class DatasetMLResponse(DatasetMLBase):
    id: str
    columnas_json: Optional[List[str]] = None
    muestra_filas_json: Optional[List[Dict[str, Any]]] = None
    sample_rows: Optional[List[Dict[str, Any]]] = None
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
