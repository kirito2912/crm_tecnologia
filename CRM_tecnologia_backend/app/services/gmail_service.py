"""Gmail API transport using an OAuth refresh token stored on the server."""
import base64
import logging
import os
from email.message import EmailMessage
from email.utils import formataddr

import httpx

logger = logging.getLogger(__name__)
GMAIL_ALIASES = {
    "GMAIL_CLIENT_ID": ("GMAIL_CLIENT_ID", "GOOGLE_CLIENT_ID"),
    "GMAIL_CLIENT_SECRET": ("GMAIL_CLIENT_SECRET", "GOOGLE_CLIENT_SECRET"),
    "GMAIL_REFRESH_TOKEN": ("GMAIL_REFRESH_TOKEN", "GOOGLE_REFRESH_TOKEN"),
    "GMAIL_SENDER_EMAIL": ("GMAIL_SENDER_EMAIL", "GOOGLE_SENDER_EMAIL", "EMAIL_USER"),
}


def gmail_config() -> dict[str, str]:
    return {
        key: next((os.getenv(name, "").strip() for name in names
                   if os.getenv(name, "").strip()), "")
        for key, names in GMAIL_ALIASES.items()
    }


def gmail_configured() -> bool:
    """EMAIL_USER alone must keep existing SMTP installations working."""
    return any(
        os.getenv(name, "").strip()
        for names in GMAIL_ALIASES.values()
        for name in names
        if name != "EMAIL_USER"
    )


def send_via_gmail(to: str, subject: str, html: str, text: str) -> bool:
    config = gmail_config()
    missing = [name for name, value in config.items() if not value]
    if missing:
        logger.error("[Gmail API] Faltan variables: %s", ", ".join(missing))
        return False

    stage = "autorizacion"
    try:
        message = EmailMessage()
        message["From"] = formataddr((
            os.getenv("EMAIL_FROM_NAME", "DataTech Analytics"),
            config["GMAIL_SENDER_EMAIL"],
        ))
        message["To"] = to
        message["Subject"] = subject
        message.set_content(text)
        message.add_alternative(html, subtype="html")
        raw = base64.urlsafe_b64encode(message.as_bytes()).decode("ascii")

        # No automatic retries: a timed-out send might already be accepted.
        with httpx.Client(timeout=20.0) as client:
            response = client.post("https://oauth2.googleapis.com/token", data={
                "client_id": config["GMAIL_CLIENT_ID"],
                "client_secret": config["GMAIL_CLIENT_SECRET"],
                "refresh_token": config["GMAIL_REFRESH_TOKEN"],
                "grant_type": "refresh_token",
            })
            if response.status_code != 200:
                logger.error(
                    "[Gmail API] Autorizacion rechazada (HTTP %s). "
                    "Revisa cliente OAuth y refresh token; si caduco, vuelve a autorizar.",
                    response.status_code,
                )
                return False
            access_token = response.json().get("access_token")
            if not isinstance(access_token, str) or not access_token:
                logger.error("[Gmail API] Google no devolvio un access token.")
                return False

            stage = "envio"
            response = client.post(
                "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
                headers={"Authorization": f"Bearer {access_token}"},
                json={"raw": raw},
            )
            if response.status_code != 200:
                logger.error(
                    "[Gmail API] Envio rechazado (HTTP %s). "
                    "Revisa Gmail API habilitada, permiso gmail.send, remitente y cuota.",
                    response.status_code,
                )
                return False
            if not response.json().get("id"):
                logger.error("[Gmail API] Respuesta sin identificador de mensaje.")
                return False

        logger.info("[Gmail API] Google acepto el correo para envio.")
        return True
    except (httpx.HTTPError, ValueError, TypeError, AttributeError):
        # Do not log response bodies, tokens, MIME contents or credentials.
        logger.error("[Gmail API] Fallo de conexion o respuesta invalida durante %s.", stage)
        return False
