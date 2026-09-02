import uuid
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import desc

from app.db.conexion import get_db
from app.models.reporte_comparativo import ReporteComparativo
from app.schemas.reporte import (
    ReporteCreate,
    ReporteUpdateEstado,
    ReporteResponse,
)

router = APIRouter(prefix="/reportes", tags=["Reportes de Comparativas"])


@router.get("/", response_model=List[ReporteResponse])
def listar_reportes(
    estado: Optional[str] = Query(None, description="Filtrar por estado: recibido, en_revision, aprobado, con_observaciones"),
    analista_id: Optional[str] = Query(None, description="Filtrar por ID de analista"),
    db: Session = Depends(get_db),
):
    """Lista todos los reportes de comparativas enviados por los analistas al administrador."""
    query = db.query(ReporteComparativo)
    if estado:
        query = query.filter(ReporteComparativo.estado == estado)
    if analista_id:
        query = query.filter(ReporteComparativo.analista_id == analista_id)
    return query.order_by(desc(ReporteComparativo.created_at)).all()


@router.get("/{reporte_id}", response_model=ReporteResponse)
def obtener_reporte(reporte_id: str, db: Session = Depends(get_db)):
    """Obtiene el detalle completo de un reporte comparativo específico."""
    reporte = db.query(ReporteComparativo).filter(ReporteComparativo.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporte con ID '{reporte_id}' no encontrado",
        )
    return reporte


@router.post("/", response_model=ReporteResponse, status_code=status.HTTP_201_CREATED)
def crear_reporte(body: ReporteCreate, db: Session = Depends(get_db)):
    """Crea y envía un nuevo reporte comparativo desde el analista hacia el administrador."""
    nuevo_id = f"REP-{uuid.uuid4().hex[:8].upper()}"

    nuevo = ReporteComparativo(
        id=nuevo_id,
        titulo=body.titulo,
        analista_id=body.analista_id,
        analista_nombre=body.analista_nombre,
        dataset_a_id=body.dataset_a_id,
        dataset_a_nombre=body.dataset_a_nombre,
        dataset_b_id=body.dataset_b_id,
        dataset_b_nombre=body.dataset_b_nombre,
        resumen_ejecutivo=body.resumen_ejecutivo,
        hallazgos_clave=body.hallazgos_clave,
        metricas_json=body.metricas_json,
        recomendaciones=body.recomendaciones,
        estado="recibido",
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.patch("/{reporte_id}/estado", response_model=ReporteResponse)
def actualizar_estado_reporte(
    reporte_id: str,
    body: ReporteUpdateEstado,
    db: Session = Depends(get_db),
):
    """Permite al Administrador cambiar el estado del reporte y dejar feedback o retroalimentación ejecutiva."""
    reporte = db.query(ReporteComparativo).filter(ReporteComparativo.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporte con ID '{reporte_id}' no encontrado",
        )

    reporte.estado = body.estado
    if body.feedback_admin is not None:
        reporte.feedback_admin = body.feedback_admin
    if body.admin_responsable is not None:
        reporte.admin_responsable = body.admin_responsable

    db.commit()
    db.refresh(reporte)
    return reporte


@router.delete("/{reporte_id}", status_code=status.HTTP_200_OK)
def eliminar_reporte(reporte_id: str, db: Session = Depends(get_db)):
    """Elimina un reporte comparativo."""
    reporte = db.query(ReporteComparativo).filter(ReporteComparativo.id == reporte_id).first()
    if not reporte:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Reporte con ID '{reporte_id}' no encontrado",
        )
    db.delete(reporte)
    db.commit()
    return {"message": f"Reporte '{reporte_id}' eliminado exitosamente"}
