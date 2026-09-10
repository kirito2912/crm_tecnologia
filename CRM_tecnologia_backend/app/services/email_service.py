"""
Servicio de envío de emails — DataTech Analytics
=================================================
Estrategia de envío:
  0. Si hay variables GMAIL_* → usa Gmail API (HTTPS con OAuth).
  1. Si RESEND_API_KEY está configurado → usa Resend (HTTP API, funciona en Render)
  2. Si no → fallback a SMTP Gmail (solo funciona en desarrollo local)
  3. Si ninguno está configurado → imprime el código en consola (modo dev sin credenciales)
"""

import os
from pathlib import Path
from dotenv import load_dotenv
from app.core.config import settings
from app.services.gmail_service import gmail_configured, send_via_gmail

# Cargar valores locales sin reemplazar las variables del servidor.
_backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
load_dotenv(_backend_env, override=False)
load_dotenv(override=False)


# ──────────────────────────────────────────────
# MÉTODO 1: Resend (HTTP API — funciona en Render)
# ──────────────────────────────────────────────

def _send_via_resend(to: str, subject: str, html: str, text: str) -> bool:
    """Envía el email usando la API HTTP de Resend. No usa SMTP."""
    api_key = os.getenv("RESEND_API_KEY", "").strip() or settings.resend_api_key
    if not api_key:
        return False

    try:
        import resend
        resend.api_key = api_key

        from_name = settings.email_from_name or "DataTech Analytics"
        # Resend requiere un dominio verificado para el from.
        # resend.dev solo permite pruebas al correo propietario de la cuenta.
        from_address = os.getenv("RESEND_FROM_EMAIL", "onboarding@resend.dev").strip()

        params = {
            "from": f"{from_name} <{from_address}>",
            "to": [to],
            "subject": subject,
            "html": html,
            "text": text,
        }
        response = resend.Emails.send(params)
        print(f"[Resend] ✓ Email enviado a {to} — ID: {response.get('id', 'ok')}")
        return True

    except Exception as e:
        print(f"[Resend] ✗ Error al enviar a {to}: {e}")
        return False


# ──────────────────────────────────────────────
# MÉTODO 2: SMTP Gmail (solo para desarrollo local)
# ──────────────────────────────────────────────

def _send_via_smtp(to: str, subject: str, html: str, text: str) -> bool:
    """Fallback SMTP — solo funciona en local (Render bloquea estos puertos)."""
    import smtplib
    import ssl
    from email.message import EmailMessage

    email_user = os.getenv("EMAIL_USER", "").strip()
    email_password = os.getenv("EMAIL_PASSWORD", "").replace(" ", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()

    if not email_user or not email_password:
        return False

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"DataTech Analytics <{email_user}>"
    message["To"] = to
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    ssl_ctx = ssl.create_default_context()

    # Puerto 587 STARTTLS
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=15) as server:
            server.ehlo()
            server.starttls(context=ssl_ctx)
            server.ehlo()
            server.login(email_user, email_password)
            server.send_message(message)
            print(f"[SMTP 587] ✓ Email enviado a {to}")
            return True
    except Exception as e:
        print(f"[SMTP 587] ✗ {e} — intentando puerto 465...")

    # Puerto 465 SSL
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, timeout=15, context=ssl_ctx) as server:
            server.login(email_user, email_password)
            server.send_message(message)
            print(f"[SMTP 465] ✓ Email enviado a {to}")
            return True
    except Exception as e:
        print(f"[SMTP 465] ✗ {e}")

    return False


# ──────────────────────────────────────────────
# Función principal de envío
# ──────────────────────────────────────────────

def _send_email(to: str, subject: str, html: str, text: str) -> bool:
    """Intenta Resend primero, luego SMTP, luego imprime en consola."""

    # Gmail is authoritative when configured; avoid duplicate sends on failure.
    if gmail_configured():
        return send_via_gmail(to, subject, html, text)

    # 1. Resend
    if _send_via_resend(to, subject, html, text):
        return True

    # 2. SMTP (local)
    if _send_via_smtp(to, subject, html, text):
        return True

    # 3. Sin credenciales — solo consola
    print("\n" + "=" * 60)
    print(f"[EMAIL NO ENVIADO] Destino: {to}")
    print(f"Asunto: {subject}")
    print("No se pudo enviar: revisa los errores anteriores y la configuración del proveedor.")
    print("=" * 60 + "\n")
    return False


# ──────────────────────────────────────────────
# Templates HTML
# ──────────────────────────────────────────────

def _otp_html(otp_code: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #f4f6fa; margin: 0; padding: 24px; }}
    .card {{ max-width: 480px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }}
    .brand {{ font-size: 20px; font-weight: 800; color: #4f46e5; letter-spacing: -0.4px; margin-bottom: 24px; }}
    .badge {{ display: inline-block; background: #eef2ff; color: #4f46e5; border-radius: 99px; padding: 4px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }}
    h1 {{ font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }}
    p {{ font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px; }}
    .code-box {{ background: #f8fafc; border: 2px dashed #6366f1; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }}
    .code {{ font-family: 'Courier New', monospace; font-size: 36px; font-weight: 900; letter-spacing: 10px; color: #4338ca; }}
    .expire {{ font-size: 12px; color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-top: 4px; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">DataTech Analytics</div>
    <div class="badge">Verificación 2FA</div>
    <h1>Tu código de acceso</h1>
    <p>Has solicitado ingresar al sistema. Usa el siguiente código para verificar tu identidad:</p>
    <div class="code-box">
      <div class="code">{otp_code}</div>
    </div>
    <div class="expire">
      ⚠️ Este código es de <strong>uso único</strong> y expira en <strong>{settings.otp_expiration_minutes} minutos</strong>.
      Nunca compartas este código con nadie.
    </div>
    <div class="footer">&copy; 2026 DataTech Analytics &mdash; Autenticación Segura</div>
  </div>
</body>
</html>"""


def _invite_html(
    nombre: str,
    invite_link: str,
    rol_display: str,
    rol_color: str,
    rol_bg: str,
    creado_por: str,
    expires_days: int,
) -> str:
    return f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background: #f4f6fa; margin: 0; padding: 24px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }}
    .brand {{ font-size: 20px; font-weight: 800; color: #4f46e5; margin-bottom: 24px; }}
    .badge {{ display: inline-block; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 99px; padding: 4px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 16px; }}
    h1 {{ font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 10px; }}
    p {{ font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 16px; }}
    .role-box {{ background: {rol_bg}; border: 1px solid {rol_color}44; border-radius: 10px; padding: 12px 16px; margin: 16px 0; }}
    .role-label {{ font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; display: block; margin-bottom: 3px; }}
    .role-value {{ font-size: 15px; font-weight: 700; color: {rol_color}; }}
    .cta {{ display: block; background: #4f46e5; color: #fff; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 15px 24px; border-radius: 10px; margin: 24px 0; }}
    .link-small {{ font-size: 11px; color: #94a3b8; text-align: center; word-break: break-all; margin-bottom: 16px; }}
    .link-url {{ color: #6366f1; }}
    .step {{ display: flex; gap: 10px; margin-bottom: 10px; align-items: flex-start; }}
    .step-num {{ min-width: 22px; height: 22px; background: #e0e7ff; color: #4338ca; border-radius: 50%; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }}
    .step-text {{ font-size: 13px; color: #475569; line-height: 1.5; }}
    .expire {{ font-size: 12px; color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-top: 16px; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="brand">DataTech Analytics</div>
    <div class="badge">✦ Invitación de Acceso Corporativo</div>
    <h1>Hola {nombre}, te esperamos en el equipo</h1>
    <p><strong>{creado_por}</strong> te ha invitado a unirte a la plataforma de inteligencia comparativa de DataTech Analytics.</p>

    <div class="role-box">
      <span class="role-label">Tu rol asignado</span>
      <span class="role-value">{rol_display}</span>
    </div>

    <a href="{invite_link}" class="cta">Configurar mi cuenta y acceder →</a>

    <p class="link-small">Si el botón no funciona, copia este enlace:<br>
      <span class="link-url">{invite_link}</span>
    </p>

    <div class="step"><div class="step-num">1</div><span class="step-text">Haz clic en el botón para abrir el formulario de registro.</span></div>
    <div class="step"><div class="step-num">2</div><span class="step-text">Introduce tu nombre y crea una contraseña segura.</span></div>
    <div class="step"><div class="step-num">3</div><span class="step-text">Verifica tu identidad con el código OTP que recibirás en tu correo.</span></div>
    <div class="step"><div class="step-num">4</div><span class="step-text">El administrador habilitará tu acceso tras revisar tu solicitud.</span></div>

    <div class="expire">⚠️ Enlace de <strong>uso único</strong> — expira en <strong>{expires_days} días</strong>.</div>
    <div class="footer">&copy; 2026 DataTech Analytics &mdash; Sistema de Invitaciones Seguras</div>
  </div>
</body>
</html>"""


# ──────────────────────────────────────────────
# Funciones públicas
# ──────────────────────────────────────────────

def send_otp_email(recipient_email: str, otp_code: str) -> None:
    """Envía el código OTP de 6 dígitos al correo del usuario."""
    subject = f"Tu código de verificación: {otp_code} — DataTech Analytics"
    html = _otp_html(otp_code)
    text = (
        f"Tu código de verificación es: {otp_code}\n"
        f"Expira en {settings.otp_expiration_minutes} minutos.\n"
        f"No compartas este código con nadie."
    )

    sent = _send_email(recipient_email, subject, html, text)

    if not sent:
        # Siempre imprimir en consola como respaldo de desarrollo
        print("\n" + "=" * 60)
        print(f"[OTP] Código para {recipient_email}: {otp_code}")
        print(f"[OTP] Expira en {settings.otp_expiration_minutes} minutos")
        print("=" * 60 + "\n")

    # Enviar a destinatarios adicionales del whitelist
    for extra_email in _get_whitelist_emails():
        try:
            _send_email(extra_email, subject, html, text)
            print(f"[WHITELIST] OTP enviado a: {extra_email}")
        except Exception as exc:
            print(f"[WHITELIST ERROR] Fallo enviando a {extra_email}: {exc}")


def send_invitation_email(
    recipient_email: str,
    invite_link: str,
    nombre_referencial: str,
    rol_asignado: str,
    creado_por: str = "el Administrador",
    expires_days: int = 7,
) -> bool:
    """Envía el enlace de invitación al correo del trabajador invitado."""
    rol_map = {
        "analista": ("Analista de Datos", "#15803d", "#dcfce7"),
        "programador": ("Programador / Developer", "#1d4ed8", "#dbeafe"),
        "auditor": ("Auditor IT & Seguridad", "#b45309", "#fef3c7"),
        "administrador": ("Administrador", "#4338ca", "#e0e7ff"),
    }
    rol_display, rol_color, rol_bg = rol_map.get(
        rol_asignado.lower(), (rol_asignado.capitalize(), "#4338ca", "#e0e7ff")
    )

    subject = f"Has sido invitado a DataTech Analytics — {rol_display}"
    html = _invite_html(nombre_referencial, invite_link, rol_display, rol_color, rol_bg, creado_por, expires_days)
    text = (
        f"Hola {nombre_referencial},\n\n"
        f"{creado_por} te ha invitado a DataTech Analytics con el rol de {rol_display}.\n\n"
        f"Enlace de registro: {invite_link}\n\n"
        f"Este enlace es válido durante {expires_days} días y es de uso único.\n"
        f"Si no esperabas esta invitación, puedes ignorar este mensaje.\n\n"
        f"Equipo de DataTech Analytics"
    )

    sent = _send_email(recipient_email, subject, html, text)

    if not sent:
        print("\n" + "=" * 60)
        print(f"[INVITACIÓN] Enlace para {recipient_email}: {invite_link}")
        print(f"[INVITACIÓN] Nombre: {nombre_referencial} | Rol: {rol_display}")
        print("=" * 60 + "\n")

    return sent


def _get_whitelist_emails() -> list[str]:
    """Lee EMAIL_WHITELIST del entorno y retorna una lista de direcciones válidas."""
    raw = os.getenv("EMAIL_WHITELIST", "").strip()
    if not raw:
        return []
    return [e.strip() for e in raw.split(",") if e.strip() and "@" in e]
