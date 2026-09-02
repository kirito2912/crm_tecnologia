import uuid
from typing import List, Any
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.db.conexion import get_db
from app.models.dataset_ml import DatasetML
from app.schemas.dataset_ml import (
    DatasetMLCreate,
    DatasetMLUpdate,
    DatasetMLResponse,
)

router = APIRouter(prefix="/datasets", tags=["Módulo Datasets"])


@router.get("/", response_model=List[DatasetMLResponse])
def listar_datasets(db: Session = Depends(get_db)):
    """Obtiene la lista de datasets de empresas disponibles en el sistema."""
    datasets = db.query(DatasetML).order_by(DatasetML.created_at.desc()).all()
    resultado = []
    for d in datasets:
        resp = DatasetMLResponse.model_validate(d)
        resp.sample_rows = d.muestra_filas_json or []
        resultado.append(resp)
    return resultado


@router.get("/{dataset_id}", response_model=DatasetMLResponse)
def obtener_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Obtiene información detallada, columnas y registros de muestra de un dataset."""
    dataset = db.query(DatasetML).filter(DatasetML.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset con ID '{dataset_id}' no encontrado",
        )
    resp = DatasetMLResponse.model_validate(dataset)
    resp.sample_rows = dataset.muestra_filas_json or []
    return resp


@router.post("/", response_model=DatasetMLResponse, status_code=status.HTTP_201_CREATED)
def crear_dataset(dataset_in: DatasetMLCreate, db: Session = Depends(get_db)):
    """Registra o guarda un nuevo dataset CSV subido por el analista."""
    dataset_id = dataset_in.id or f"ds-{uuid.uuid4().hex[:8]}"

    existente = db.query(DatasetML).filter(DatasetML.id == dataset_id).first()
    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Ya existe un dataset con el ID '{dataset_id}'",
        )

    nuevo = DatasetML(
        id=dataset_id,
        nombre=dataset_in.nombre,
        categoria=dataset_in.categoria or "Empresarial",
        registros_totales=dataset_in.registros_totales or 0,
        features_count=dataset_in.features_count or (len(dataset_in.columnas_json) if dataset_in.columnas_json else 0),
        columna_objetivo=dataset_in.columna_objetivo,
        tamanio_archivo=dataset_in.tamanio_archivo or "1.2 MB",
        descripcion=dataset_in.descripcion,
        columnas_json=dataset_in.columnas_json,
        muestra_filas_json=dataset_in.muestra_filas_json,
        creado_por=dataset_in.creado_por,
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    resp = DatasetMLResponse.model_validate(nuevo)
    resp.sample_rows = nuevo.muestra_filas_json or []
    return resp


@router.put("/{dataset_id}", response_model=DatasetMLResponse)
def actualizar_dataset(
    dataset_id: str,
    dataset_in: DatasetMLUpdate,
    db: Session = Depends(get_db),
):
    """Actualiza los metadatos de un dataset."""
    dataset = db.query(DatasetML).filter(DatasetML.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset con ID '{dataset_id}' no encontrado",
        )

    update_data = dataset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(dataset, field, value)

    db.commit()
    db.refresh(dataset)

    resp = DatasetMLResponse.model_validate(dataset)
    resp.sample_rows = dataset.muestra_filas_json or []
    return resp


@router.delete("/{dataset_id}", status_code=status.HTTP_200_OK)
def eliminar_dataset(dataset_id: str, db: Session = Depends(get_db)):
    """Elimina un dataset del catálogo."""
    dataset = db.query(DatasetML).filter(DatasetML.id == dataset_id).first()
    if not dataset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset con ID '{dataset_id}' no encontrado",
        )
    db.delete(dataset)
    db.commit()
    return {"message": f"Dataset '{dataset_id}' eliminado exitosamente"}
