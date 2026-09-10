from app.services.admin_notifications import admin_recipients, notify_admins
import logging
import secrets
import uuid
from datetime import datetime, timedelta
from html import escape

from fastapi import BackgroundTasks, APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.admin_access import require_admin
from app.core.config import settings
from app.db.conexion import get_db
from app.models.invitacion import Invitacion
from app.models.solicitud_acceso import SolicitudAcceso
from app.models.usuario import Usuario
from app.schemas.solicitud_acceso import SolicitudCreate, SolicitudDecision, SolicitudResponse
from app.services.email_service import _send_email, send_invitation_email

router = APIRouter(prefix="/solicitudes-acceso", tags=["Solicitudes de acceso"])
logger = logging.getLogger(__name__)


def send_decision(row: SolicitudAcceso, db: Session) -> bool:
    try:
        if row.estado == "aprobada":
            inv = db.get(Invitacion, row.invitacion_id)
            if not inv or inv.estado != "pendiente" or inv.expires_at <= datetime.utcnow():
                return False
            return send_invitation_email(
                recipient_email=row.email,
                invite_link=f"{settings.frontend_url}/?invite_token={inv.token}",
                nombre_referencial=row.nombre,
                rol_asignado=inv.rol_asignado,
                creado_por=row.resuelta_por,
                expires_days=max(1, (inv.expires_at - datetime.utcnow()).days),
            )
        text = (
            f"Hola {row.nombre},\n\nLo sentimos, se denegó tu solicitud para ingresar al sistema.\n"
            "Si necesitas más información, comunícate con el administrador.\n\nDataTech Analytics"
        )
        return _send_email(row.email, "Resultado de tu solicitud de acceso", f"<p>{escape(text).replace(chr(10), '<br>')}</p>", text)
    except Exception:
        logger.error("No se pudo enviar el correo de resolución de solicitud.")
        return False


@router.post("/", status_code=201)
def solicitar(body: SolicitudCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    email = str(body.email).strip().lower()
    if db.query(Usuario).filter(Usuario.email.ilike(email)).first():
        raise HTTPException(409, "Ya existe una cuenta con este correo. Contacta al administrador.")
    row = SolicitudAcceso(id=f"SOL-{uuid.uuid4().hex}", email=email, nombre=body.nombre, empresa=body.empresa, motivo=body.motivo)
    db.add(row)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Ya enviaste una solicitud con este correo. Contacta al administrador para consultar su estado.")
    background_tasks.add_task(notify_admins, admin_recipients(db), row.nombre, row.email)
    return {"message": "Solicitud enviada al administrador. Recibirás su respuesta por correo."}


@router.get("/", response_model=list[SolicitudResponse])
def listar(db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    return db.query(SolicitudAcceso).order_by(SolicitudAcceso.created_at.desc()).all()


@router.post("/{solicitud_id}/resolver", response_model=SolicitudResponse)
def resolver(solicitud_id: str, body: SolicitudDecision, db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    # Compare-and-set works on PostgreSQL and SQLite, including concurrent decisions.
    count = db.query(SolicitudAcceso).filter(
        SolicitudAcceso.id == solicitud_id, SolicitudAcceso.estado == "pendiente"
    ).update({"estado": "aprobada" if body.decision == "aprobar" else "rechazada", "resuelta_at": datetime.utcnow(), "resuelta_por": admin.nombre}, synchronize_session=False)
    if count != 1:
        db.rollback()
        raise HTTPException(409, "La solicitud ya fue resuelta o no existe. Actualiza la tabla.")
    row = db.get(SolicitudAcceso, solicitud_id)
    if body.decision == "aprobar":
        if db.query(Usuario).filter(Usuario.email.ilike(row.email)).first():
            db.rollback()
            raise HTTPException(409, "Ya existe una cuenta con este correo. Revisa el directorio de personal.")
        inv = db.query(Invitacion).filter(Invitacion.email.ilike(row.email), Invitacion.estado == "pendiente", Invitacion.expires_at > datetime.utcnow()).first()
        if not inv:
            inv = Invitacion(id=f"INV-{uuid.uuid4().hex}", email=row.email, nombre_referencial=row.nombre, rol_asignado=body.rol, token=f"inv_tok_{secrets.token_urlsafe(24)}", creado_por=admin.nombre, estado="pendiente", created_at=datetime.utcnow(), expires_at=datetime.utcnow() + timedelta(days=7))
            db.add(inv)
            db.flush()
        inv.rol_asignado = body.rol
        inv.nombre_referencial = row.nombre
        inv.creado_por = admin.nombre
        row.invitacion_id = inv.id
    db.commit()
    row = db.query(SolicitudAcceso).filter(SolicitudAcceso.id == solicitud_id).populate_existing().with_for_update().one()
    if not row.correo_enviado:
        row.correo_enviado = send_decision(row, db)
    db.commit()
    db.refresh(row)
    return row


@router.post("/{solicitud_id}/reenviar", response_model=SolicitudResponse)
def reenviar(solicitud_id: str, db: Session = Depends(get_db), admin: Usuario = Depends(require_admin)):
    row = db.query(SolicitudAcceso).filter(SolicitudAcceso.id == solicitud_id).with_for_update().first()
    if not row or row.estado == "pendiente":
        raise HTTPException(409, "Primero debes resolver la solicitud.")
    if row.correo_enviado:
        raise HTTPException(409, "El proveedor ya aceptó el correo de respuesta.")
    row.correo_enviado = send_decision(row, db)
    db.commit()
    db.refresh(row)
    return row
