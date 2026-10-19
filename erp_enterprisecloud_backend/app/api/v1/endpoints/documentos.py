"""
Endpoints de Documentos (AWS S3)
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query
from sqlalchemy.orm import Session
from typing import Optional
import os

from app.db.session import get_db
from app.models.documento_s3 import DocumentoS3, CategoriaDocumento
from app.models.usuario import Usuario
from app.core.security import get_current_active_user
from app.services.s3_service import s3_service


router = APIRouter()


@router.post("/upload", tags=["Documentos"])
async def upload_documento(
    file: UploadFile = File(...),
    categoria_id: Optional[int] = Query(None),
    modulo_origen: Optional[str] = Query(None),
    registro_id: Optional[int] = Query(None),
    descripcion: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Subir un documento a AWS S3
    
    El archivo se encripta automáticamente (AES-256) y se organiza por fecha.
    """
    try:
        # Leer contenido del archivo
        file_content = await file.read()
        
        # Determinar tipo de archivo
        file_extension = os.path.splitext(file.filename)[1].lower()
        mime_type = file.content_type or "application/octet-stream"
        
        # Subir a S3
        folder = modulo_origen if modulo_origen else "documentos"
        s3_result = s3_service.upload_file(
            file_content=file_content,
            file_name=file.filename,
            folder=folder,
            content_type=mime_type
        )
        
        if not s3_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error al subir archivo a S3"
            )
        
        # Generar código de documento
        last_doc = db.query(DocumentoS3).order_by(DocumentoS3.id.desc()).first()
        next_id = (last_doc.id + 1) if last_doc else 1
        documento_codigo = f"DOC-{next_id:08d}"
        
        # Guardar registro en base de datos
        nuevo_documento = DocumentoS3(
            documento_codigo=documento_codigo,
            nombre_original=file.filename,
            nombre_s3=s3_result["unique_filename"],
            s3_key=s3_result["s3_key"],
            s3_bucket=s3_result["s3_bucket"],
            categoria_id=categoria_id,
            tipo_archivo=file_extension.replace(".", ""),
            mime_type=mime_type,
            tamanio_bytes=s3_result["size"],
            descripcion=descripcion,
            modulo_origen=modulo_origen,
            registro_id=registro_id,
            url_descarga=s3_result["file_url"],
            estado="activo",
            subido_por=current_user.id
        )
        
        db.add(nuevo_documento)
        db.commit()
        db.refresh(nuevo_documento)
        
        # Generar URL pre-firmada (válida por 1 hora)
        presigned_url = s3_service.generate_presigned_url(s3_result["s3_key"])
        
        return {
            "success": True,
            "message": "Archivo subido exitosamente",
            "documento": {
                "id": nuevo_documento.id,
                "codigo": nuevo_documento.documento_codigo,
                "nombre_original": nuevo_documento.nombre_original,
                "s3_key": nuevo_documento.s3_key,
                "tamanio_bytes": nuevo_documento.tamanio_bytes,
                "tipo_archivo": nuevo_documento.tipo_archivo,
                "url_descarga": presigned_url,
                "fecha_creacion": nuevo_documento.fecha_creacion.isoformat()
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al procesar archivo: {str(e)}"
        )


@router.get("/", tags=["Documentos"])
async def listar_documentos(
    pagina: int = Query(1, ge=1),
    por_pagina: int = Query(10, ge=1, le=100),
    modulo_origen: Optional[str] = None,
    categoria_id: Optional[int] = None,
    tipo_archivo: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Listar documentos con paginación y filtros
    """
    # Query base
    query = db.query(DocumentoS3).filter(DocumentoS3.estado == "activo")
    
    # Filtros
    if modulo_origen:
        query = query.filter(DocumentoS3.modulo_origen == modulo_origen)
    
    if categoria_id:
        query = query.filter(DocumentoS3.categoria_id == categoria_id)
    
    if tipo_archivo:
        query = query.filter(DocumentoS3.tipo_archivo == tipo_archivo)
    
    # Total de registros
    total = query.count()
    
    # Paginación
    offset = (pagina - 1) * por_pagina
    documentos = query.order_by(DocumentoS3.fecha_creacion.desc()).offset(offset).limit(por_pagina).all()
    
    # Generar URLs pre-firmadas
    documentos_response = []
    for doc in documentos:
        presigned_url = s3_service.generate_presigned_url(doc.s3_key)
        documentos_response.append({
            "id": doc.id,
            "codigo": doc.documento_codigo,
            "nombre_original": doc.nombre_original,
            "tamanio_bytes": doc.tamanio_bytes,
            "tipo_archivo": doc.tipo_archivo,
            "modulo_origen": doc.modulo_origen,
            "registro_id": doc.registro_id,
            "descripcion": doc.descripcion,
            "url_descarga": presigned_url,
            "fecha_creacion": doc.fecha_creacion.isoformat(),
            "categoria": doc.categoria.nombre if doc.categoria else None
        })
    
    return {
        "total": total,
        "documentos": documentos_response,
        "pagina": pagina,
        "por_pagina": por_pagina
    }


@router.get("/{documento_id}", tags=["Documentos"])
async def obtener_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener información de un documento y URL de descarga
    """
    documento = db.query(DocumentoS3).filter(
        DocumentoS3.id == documento_id,
        DocumentoS3.estado == "activo"
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Generar URL pre-firmada (válida por 1 hora)
    presigned_url = s3_service.generate_presigned_url(documento.s3_key)
    
    return {
        "id": documento.id,
        "codigo": documento.documento_codigo,
        "nombre_original": documento.nombre_original,
        "s3_key": documento.s3_key,
        "tamanio_bytes": documento.tamanio_bytes,
        "tipo_archivo": documento.tipo_archivo,
        "mime_type": documento.mime_type,
        "modulo_origen": documento.modulo_origen,
        "registro_id": documento.registro_id,
        "descripcion": documento.descripcion,
        "url_descarga": presigned_url,
        "fecha_creacion": documento.fecha_creacion.isoformat(),
        "categoria": documento.categoria.nombre if documento.categoria else None
    }


@router.delete("/{documento_id}", tags=["Documentos"])
async def eliminar_documento(
    documento_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Eliminar un documento (S3 y base de datos)
    """
    documento = db.query(DocumentoS3).filter(
        DocumentoS3.id == documento_id
    ).first()
    
    if not documento:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )
    
    # Eliminar de S3
    s3_deleted = s3_service.delete_file(documento.s3_key)
    
    if not s3_deleted:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al eliminar archivo de S3"
        )
    
    # Cambiar estado a eliminado
    documento.estado = "eliminado"
    db.commit()
    
    return {
        "success": True,
        "message": "Documento eliminado exitosamente",
        "documento_id": documento_id
    }


@router.get("/modulo/{modulo_origen}/{registro_id}", tags=["Documentos"])
async def obtener_documentos_por_registro(
    modulo_origen: str,
    registro_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """
    Obtener todos los documentos asociados a un registro específico
    
    Ejemplo: GET /documentos/modulo/facturas/123
    Retorna todos los documentos de la factura ID 123
    """
    documentos = db.query(DocumentoS3).filter(
        DocumentoS3.modulo_origen == modulo_origen,
        DocumentoS3.registro_id == registro_id,
        DocumentoS3.estado == "activo"
    ).all()
    
    # Generar URLs pre-firmadas
    documentos_response = []
    for doc in documentos:
        presigned_url = s3_service.generate_presigned_url(doc.s3_key)
        documentos_response.append({
            "id": doc.id,
            "codigo": doc.documento_codigo,
            "nombre_original": doc.nombre_original,
            "tamanio_bytes": doc.tamanio_bytes,
            "tipo_archivo": doc.tipo_archivo,
            "descripcion": doc.descripcion,
            "url_descarga": presigned_url,
            "fecha_creacion": doc.fecha_creacion.isoformat()
        })
    
    return {
        "modulo": modulo_origen,
        "registro_id": registro_id,
        "total": len(documentos_response),
        "documentos": documentos_response
    }
