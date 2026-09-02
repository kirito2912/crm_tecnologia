from typing import Optional, Any, Dict, List
from datetime import datetime
# pyrefly: ignore [missing-import]
from pydantic import BaseModel, ConfigDict


class ReporteCreate(BaseModel):
    titulo: str
    analista_id: Optional[str] = "analista-001"
    analista_nombre: str
    dataset_a_id: str
    dataset_a_nombre: str
    dataset_b_id: str
    dataset_b_nombre: str
    resumen_ejecutivo: str
    hallazgos_clave: Optional[str] = None
    metricas_json: Optional[Dict[str, Any]] = None
    recomendaciones: Optional[str] = None


class ReporteUpdateEstado(BaseModel):
    estado: str  # "recibido", "en_revision", "aprobado", "con_observaciones"
    feedback_admin: Optional[str] = None
    admin_responsable: Optional[str] = None


class ReporteResponse(BaseModel):
    id: str
    titulo: str
    analista_id: str
    analista_nombre: str
    dataset_a_id: str
    dataset_a_nombre: str
    dataset_b_id: str
    dataset_b_nombre: str
    resumen_ejecutivo: str
    hallazgos_clave: Optional[str] = None
    metricas_json: Optional[Dict[str, Any]] = None
    recomendaciones: Optional[str] = None
    estado: str
    feedback_admin: Optional[str] = None
    admin_responsable: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
