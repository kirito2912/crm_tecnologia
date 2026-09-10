"""Notify enabled administrators after an access request has been committed."""
import logging
from html import escape

from app.core.config import settings
from app.core.roles import normalize_role
from app.models.usuario import Usuario
from app.services.email_service import _send_email

logger = logging.getLogger(__name__)


def admin_recipients(db):
    return sorted({u.email.strip().lower() for u in db.query(Usuario).filter(
        Usuario.habilitado.is_(True), Usuario.estado == "activo"
    ).all() if normalize_role(u.rol) == "administrador" and u.email})


def notify_admins(recipients, nombre, email, registered=False):
    subject = "Cuenta pendiente de habilitación" if registered else "Nueva solicitud de acceso"
    action = "completó su registro y espera la habilitación de su cuenta" if registered else "solicitó permiso para ingresar al sistema"
    message = f"{nombre} ({email}) {action}.\nRevisa Gestión de invitaciones en {settings.frontend_url}"
    if not recipients:
        logger.warning("[ADMIN NOTIFICATION] Sin administradores activos para notificar.")
    for recipient in recipients:
        try:
            sent = _send_email(recipient, subject, f"<p>{escape(message).replace(chr(10), '<br>')}</p>", message)
            if sent:
                logger.info("[ADMIN NOTIFICATION] Correo aceptado para envío al administrador.")
            else:
                logger.error("[ADMIN NOTIFICATION] Correo no enviado; revisa la configuración del proveedor. La solicitud permanece en el panel.")
        except Exception:
            logger.error("[ADMIN NOTIFICATION] Falló el envío al administrador. La solicitud permanece en el panel.")
