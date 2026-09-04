import uuid
import base64
import os
import io
import json
from typing import List, Optional
# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form, Response
# pyrefly: ignore [missing-import]
from fastapi.responses import StreamingResponse
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
# pyrefly: ignore [missing-import]
from sqlalchemy import desc

from app.db.conexion import get_db
from app.models.documento import Documento
from app.schemas.documento import (
    DocumentoCreate,
    DocumentoUpdate,
    DocumentoResponse,
)

router = APIRouter(prefix="/documentos", tags=["Gestión de Documentos y PDF"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "uploads", "documentos")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def format_bytes(size: int) -> str:
    if size < 1024:
        return f"{size} B"
    elif size < 1024 * 1024:
        return f"{(size / 1024):.1f} KB"
    elif size < 1024 * 1024 * 1024:
        return f"{(size / (1024 * 1024)):.2f} MB"
    else:
        return f"{(size / (1024 * 1024 * 1024)):.2f} GB"


def detect_file_type(filename: str) -> str:
    fn = filename.lower()
    if fn.endswith(".pdf"):
        return "pdf"
    elif fn.endswith(".docx"):
        return "docx"
    elif fn.endswith(".doc"):
        return "doc"
    elif fn.endswith(".rtf"):
        return "rtf"
    elif fn.endswith(".odt"):
        return "odt"
    return "documento"


@router.get("/", response_model=List[DocumentoResponse])
def listar_documentos(
    tipo: Optional[str] = Query(None, description="Filtrar por tipo: pdf, word, docx, doc"),
    categoria: Optional[str] = Query(None, description="Filtrar por categoría empresarial"),
    usuario_rol: Optional[str] = Query(None, description="Filtrar por rol de quien subió el archivo"),
    search: Optional[str] = Query(None, description="Buscar por nombre, autor o descripción"),
    db: Session = Depends(get_db),
):
    """Lista todos los documentos compartidos entre todas las vistas de la organización."""
    query = db.query(Documento)

    if tipo:
        t = tipo.lower()
        if t in ["word", "doc", "docx"]:
            query = query.filter(Documento.tipo.in_(["word", "doc", "docx"]))
        else:
            query = query.filter(Documento.tipo == t)

    if categoria and categoria != "todos":
        query = query.filter(Documento.categoria == categoria)

    if usuario_rol:
        query = query.filter(Documento.usuario_rol == usuario_rol.lower())

    docs = query.order_by(desc(Documento.created_at)).all()

    if search:
        s = search.lower().strip()
        docs = [
            d for d in docs
            if s in d.nombre.lower()
            or (d.descripcion and s in d.descripcion.lower())
            or (d.subido_por and s in d.subido_por.lower())
            or (d.categoria and s in d.categoria.lower())
            or (d.tags_json and any(s in str(tag).lower() for tag in d.tags_json))
        ]

    return docs


@router.get("/{documento_id}", response_model=DocumentoResponse)
def obtener_documento(documento_id: str, db: Session = Depends(get_db)):
    """Obtiene los detalles completos de un documento por su ID."""
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID '{documento_id}' no encontrado",
        )
    return doc


@router.post("/", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
def crear_documento_json(body: DocumentoCreate, db: Session = Depends(get_db)):
    """Crea un documento vía payload JSON con soporte para contenido base64."""
    nuevo_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"

    tipo = detect_file_type(body.nombre) if body.tipo in ["otro", "", None] else body.tipo

    nuevo = Documento(
        id=nuevo_id,
        nombre=body.nombre,
        tipo=tipo,
        tamanio=body.tamanio,
        tamanio_bytes=body.tamanio_bytes or 0,
        categoria=body.categoria or "General",
        descripcion=body.descripcion,
        archivo_url=body.archivo_url,
        archivo_base64=body.archivo_base64,
        subido_por=body.subido_por,
        usuario_id=body.usuario_id,
        usuario_rol=body.usuario_rol or "analista",
        tags_json=body.tags_json or [],
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.post("/upload", response_model=DocumentoResponse, status_code=status.HTTP_201_CREATED)
async def subir_documento_archivo(
    file: UploadFile = File(...),
    categoria: str = Form("General"),
    descripcion: Optional[str] = Form(None),
    subido_por: str = Form("Usuario"),
    usuario_id: Optional[str] = Form(None),
    usuario_rol: str = Form("analista"),
    tags: Optional[str] = Form(None),
    destinatarios_roles: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    """Sube un archivo Word o PDF, guarda una copia binaria y su registro en la base de datos."""
    content = await file.read()
    size_bytes = len(content)
    size_readable = format_bytes(size_bytes)
    tipo = detect_file_type(file.filename or "")

    # Convertir a base64 para preview/descarga inmediata segura
    b64_str = base64.b64encode(content).decode("utf-8")
    content_type = file.content_type or ("application/pdf" if tipo == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    archivo_base64 = f"data:{content_type};base64,{b64_str}"

    nuevo_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"

    # Guardar también archivo en disco
    safe_filename = f"{nuevo_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    try:
        with open(file_path, "wb") as f:
            f.write(content)
        archivo_url = f"/uploads/documentos/{safe_filename}"
    except Exception:
        archivo_url = None

    parsed_tags = []
    if tags:
        try:
            parsed_tags = json.loads(tags)
            if not isinstance(parsed_tags, list):
                parsed_tags = [str(tags)]
        except Exception:
            parsed_tags = [t.strip() for t in tags.split(",") if t.strip()]

    parsed_destinatarios = ["todos"]
    if destinatarios_roles:
        try:
            parsed_destinatarios = json.loads(destinatarios_roles)
            if not isinstance(parsed_destinatarios, list):
                parsed_destinatarios = [str(destinatarios_roles)]
        except Exception:
            parsed_destinatarios = [r.strip() for r in destinatarios_roles.split(",") if r.strip()]
        # Si está vacío o solo contiene "todos", normalizar
        if not parsed_destinatarios:
            parsed_destinatarios = ["todos"]

    nuevo = Documento(
        id=nuevo_id,
        nombre=file.filename or "Documento",
        tipo=tipo,
        tamanio=size_readable,
        tamanio_bytes=size_bytes,
        categoria=categoria,
        descripcion=descripcion,
        archivo_url=archivo_url,
        archivo_base64=archivo_base64,
        subido_por=subido_por,
        usuario_id=usuario_id,
        usuario_rol=usuario_rol.lower(),
        tags_json=parsed_tags,
        destinatarios_roles=parsed_destinatarios,
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


@router.get("/{documento_id}/download")
def descargar_documento(documento_id: str, db: Session = Depends(get_db)):
    """Descarga el archivo real almacenado en el documento."""
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID '{documento_id}' no encontrado",
        )

    # Si tiene base64
    if doc.archivo_base64 and "," in doc.archivo_base64:
        header, encoded = doc.archivo_base64.split(",", 1)
        binary_data = base64.b64decode(encoded)
        mime_type = "application/pdf" if doc.tipo == "pdf" else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        if "data:" in header and ";base64" in header:
            mime_type = header.replace("data:", "").replace(";base64", "")

        return Response(
            content=binary_data,
            media_type=mime_type,
            headers={"Content-Disposition": f'attachment; filename="{doc.nombre}"'},
        )

    # Si está guardado en disco
    if doc.archivo_url and os.path.exists(doc.archivo_url):
        with open(doc.archivo_url, "rb") as f:
            data = f.read()
        return Response(
            content=data,
            media_type="application/octet-stream",
            headers={"Content-Disposition": f'attachment; filename="{doc.nombre}"'},
        )

    # Si es un documento generado de muestra o demo
    dummy_text = f"DataTech Analytics - Documento: {doc.nombre}\nCategoría: {doc.categoria}\nSubido por: {doc.subido_por}\n\nDescripción:\n{doc.descripcion or 'Sin descripción adicional'}"
    return Response(
        content=dummy_text.encode("utf-8"),
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{doc.nombre}.txt"'},
    )


@router.patch("/{documento_id}", response_model=DocumentoResponse)
def actualizar_documento(
    documento_id: str,
    body: DocumentoUpdate,
    db: Session = Depends(get_db),
):
    """Actualiza los metadatos de un documento (categoría, nombre, descripción o tags)."""
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID '{documento_id}' no encontrado",
        )

    if body.nombre is not None:
        doc.nombre = body.nombre
    if body.categoria is not None:
        doc.categoria = body.categoria
    if body.descripcion is not None:
        doc.descripcion = body.descripcion
    if body.tags_json is not None:
        doc.tags_json = body.tags_json

    db.commit()
    db.refresh(doc)
    return doc


@router.delete("/{documento_id}", status_code=status.HTTP_200_OK)
def eliminar_documento(documento_id: str, db: Session = Depends(get_db)):
    """Elimina un documento de la base de datos compartida."""
    doc = db.query(Documento).filter(Documento.id == documento_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Documento con ID '{documento_id}' no encontrado",
        )

    db.delete(doc)
    db.commit()
    return {"message": f"Documento '{doc.nombre}' eliminado exitosamente"}
