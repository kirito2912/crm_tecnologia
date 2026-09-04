import os
from email.message import EmailMessage
from pathlib import Path
import smtplib
import ssl
from dotenv import load_dotenv

from app.core.config import settings


def _load_smtp_credentials() -> tuple[str, str, str, str]:
    """Carga y limpia las credenciales SMTP desde .env. Retorna (email_user, email_password, smtp_host, email_from)."""
    backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(backend_env, override=True)
    load_dotenv(override=True)

    raw_user = os.getenv("EMAIL_USER", "").strip() or settings.email_user
    raw_pwd = os.getenv("EMAIL_PASSWORD", "").strip() or settings.email_password

    email_user = raw_user.replace('"', '').replace("'", "").strip()
    email_password = raw_pwd.replace(" ", "").replace('"', '').replace("'", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    email_from = os.getenv("EMAIL_FROM", "").strip() or email_user

    return email_user, email_password, smtp_host, email_from


def _send_message(message: EmailMessage, email_user: str, email_password: str, smtp_host: str) -> bool:
    """Intenta enviar el mensaje por STARTTLS:587 y luego por SSL:465. Retorna True si tuvo éxito."""
    ssl_context = ssl.create_default_context()

    # Intento 1: Puerto 587 STARTTLS
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=15) as server:
            server.ehlo()
            server.starttls(context=ssl_context)
            server.ehlo()
            server.login(email_user, email_password)
            server.send_message(message)
            return True
    except Exception as tls_err:
        print(f"⚠️ [STARTTLS 587 falló]: {tls_err}. Intentando SSL 465...")

    # Intento 2: Puerto 465 SSL Directo
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, timeout=15, context=ssl_context) as server:
            server.login(email_user, email_password)
            server.send_message(message)
            return True
    except smtplib.SMTPAuthenticationError as auth_err:
        print(f"❌ [ERROR DE AUTENTICACIÓN GMAIL SMTP]: {auth_err}")
    except Exception as exc:
        print(f"⚠️ [ERROR SMTP]: {exc}")

    return False


def send_invitation_email(
    recipient_email: str,
    invite_link: str,
    nombre_referencial: str,
    rol_asignado: str,
    creado_por: str = "el Administrador",
    expires_days: int = 7,
) -> bool:
    """
    Envía el enlace de invitación al correo del trabajador invitado.
    Retorna True si el correo fue enviado con éxito, False en caso contrario.
    """
    email_user, email_password, smtp_host, email_from = _load_smtp_credentials()

    if not email_user or not email_password:
        print("\n" + "=" * 60)
        print(f"🔗 [DEV INVITE LINK] Enlace de invitación generado para: {recipient_email}")
        print(f"👉 ENLACE: {invite_link}")
        print(f"👤 Nombre: {nombre_referencial} | Rol: {rol_asignado}")
        print("ℹ️ Para enviar correos reales, coloca EMAIL_USER y EMAIL_PASSWORD en tu .env")
        print("=" * 60 + "\n")
        return False

    rol_display_map = {
        "analista": "Analista de Datos",
        "programador": "Programador / Developer",
        "auditor": "Auditor IT & Seguridad",
        "administrador": "Administrador",
    }
    rol_display = rol_display_map.get(rol_asignado.lower(), rol_asignado.capitalize())

    rol_color_map = {
        "analista": "#15803d",
        "programador": "#1d4ed8",
        "auditor": "#b45309",
        "administrador": "#4338ca",
    }
    rol_bg_map = {
        "analista": "#dcfce7",
        "programador": "#dbeafe",
        "auditor": "#fef3c7",
        "administrador": "#e0e7ff",
    }
    rol_color = rol_color_map.get(rol_asignado.lower(), "#4338ca")
    rol_bg = rol_bg_map.get(rol_asignado.lower(), "#e0e7ff")

    message = EmailMessage()
    message["Subject"] = f"Has sido invitado a DataTech Analytics — Configura tu cuenta"
    message["From"] = f"DataTech Analytics <{email_user}>"
    message["To"] = recipient_email
    message["Reply-To"] = email_user

    plain_content = (
        f"Hola {nombre_referencial},\n\n"
        f"{creado_por} te ha invitado a unirte a DataTech Analytics con el rol de {rol_display}.\n\n"
        f"Para registrarte y configurar tu acceso, haz clic en el siguiente enlace:\n"
        f"{invite_link}\n\n"
        f"Este enlace es válido durante {expires_days} días y es de uso único.\n"
        f"Si no esperabas esta invitación, puedes ignorar este mensaje.\n\n"
        f"Equipo de DataTech Analytics"
    )
    message.set_content(plain_content)

    html_content = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6fa; margin: 0; padding: 24px; }}
    .card {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px; box-shadow: 0 4px 20px rgba(0,0,0,0.07); border: 1px solid #e2e8f0; }}
    .brand-row {{ display: flex; align-items: center; gap: 10px; margin-bottom: 28px; }}
    .brand-logo {{ width: 36px; height: 36px; background: #f1f5f9; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #e2e8f0; }}
    .brand-name {{ font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.4px; }}
    .invite-badge {{ display: inline-flex; align-items: center; gap: 6px; background: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0; border-radius: 999px; padding: 4px 12px; font-size: 11px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 16px; text-transform: uppercase; }}
    .title {{ font-size: 22px; font-weight: 800; color: #0f172a; margin: 0 0 10px; letter-spacing: -0.5px; }}
    .subtitle {{ font-size: 14px; color: #64748b; line-height: 1.6; margin: 0 0 24px; }}
    .role-box {{ background: {rol_bg}; border: 1px solid {rol_color}33; border-radius: 10px; padding: 12px 16px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px; }}
    .role-label {{ font-size: 11px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 2px; }}
    .role-value {{ font-size: 15px; font-weight: 700; color: {rol_color}; }}
    .cta-btn {{ display: block; width: 100%; box-sizing: border-box; background: #4f46e5; color: #ffffff; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 15px 24px; border-radius: 10px; margin: 24px 0; letter-spacing: 0.2px; }}
    .link-fallback {{ font-size: 12px; color: #94a3b8; text-align: center; margin-bottom: 20px; }}
    .link-url {{ font-size: 11px; color: #6366f1; word-break: break-all; }}
    .divider {{ border: none; border-top: 1px solid #f1f5f9; margin: 20px 0; }}
    .steps-title {{ font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }}
    .step {{ display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; }}
    .step-num {{ min-width: 22px; height: 22px; background: #e0e7ff; color: #4338ca; border-radius: 50%; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }}
    .step-text {{ font-size: 13px; color: #475569; line-height: 1.5; }}
    .expire-note {{ font-size: 12px; color: #f59e0b; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 10px 14px; margin-top: 20px; }}
    .footer {{ font-size: 11px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
  </style>
</head>
<body>
  <div class="card">
    <!-- Brand -->
    <div class="brand-row">
      <div class="brand-logo">
        <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="14" width="5.5" height="14" rx="2.75" fill="#4f5bc9" opacity="0.85"/>
          <rect x="13.25" y="6" width="5.5" height="22" rx="2.75" fill="#4f5bc9"/>
          <rect x="22.5" y="10" width="5.5" height="18" rx="2.75" fill="#7e87e8"/>
        </svg>
      </div>
      <span class="brand-name">DataTech Analytics</span>
    </div>

    <!-- Badge -->
    <div class="invite-badge">✦ Invitación de Acceso Corporativo</div>

    <!-- Title -->
    <h1 class="title">Hola {nombre_referencial}, te esperamos en el equipo</h1>
    <p class="subtitle">
      <strong>{creado_por}</strong> te ha invitado a unirte a la plataforma de inteligencia comparativa
      y análisis de datos de DataTech Analytics.
    </p>

    <!-- Role -->
    <div class="role-box">
      <div>
        <span class="role-label">Tu rol asignado en el sistema</span>
        <span class="role-value">{rol_display}</span>
      </div>
    </div>

    <!-- CTA -->
    <a href="{invite_link}" class="cta-btn">Configurar mi cuenta y acceder →</a>

    <p class="link-fallback">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br>
      <span class="link-url">{invite_link}</span>
    </p>

    <hr class="divider">

    <!-- Steps -->
    <div class="steps-title">¿Cómo completar tu registro?</div>
    <div class="step">
      <div class="step-num">1</div>
      <span class="step-text">Haz clic en el botón de arriba para abrir el formulario de registro.</span>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <span class="step-text">Introduce tu nombre completo y crea una contraseña segura.</span>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <span class="step-text">Verifica tu identidad con el código OTP que recibirás en este correo.</span>
    </div>
    <div class="step">
      <div class="step-num">4</div>
      <span class="step-text">Tu cuenta quedará pendiente de aprobación. El administrador te habilitará el acceso.</span>
    </div>

    <!-- Expire note -->
    <div class="expire-note">
      ⚠️ Este enlace es de <strong>uso único</strong> y expira en <strong>{expires_days} días</strong>.
      Si venció, solicita uno nuevo al administrador.
    </div>

    <div class="footer">
      &copy; 2026 DataTech Analytics &mdash; Sistema de Invitaciones Seguras
    </div>
  </div>
</body>
</html>"""

    message.add_alternative(html_content, subtype="html")

    sent = _send_message(message, email_user, email_password, smtp_host)
    if sent:
        print("\n" + "=" * 60)
        print(f"📧 [INVITACIÓN ENVIADA] Correo enviado a: {recipient_email}")
        print(f"👤 Nombre: {nombre_referencial} | Rol: {rol_display}")
        print("=" * 60 + "\n")
    else:
        print(f"❌ [INVITACIÓN NO ENVIADA] Falló el envío a: {recipient_email}")

    return sent


def send_otp_email(recipient_email: str, otp_code: str) -> None:
    email_user, email_password, smtp_host, email_from = _load_smtp_credentials()

    if not email_user or not email_password:
        print("\n" + "=" * 60)
        print(f"🔑 [DEV OTP CODE] Código OTP generado para: {recipient_email}")
        print(f"👉 CÓDIGO OTP: {otp_code}")
        print(f"⏱️ Expira en: {settings.otp_expiration_minutes} minutos")
        print("ℹ️ Para enviar correos reales por Gmail, coloca EMAIL_USER y EMAIL_PASSWORD en tu archivo .env")
        print("=" * 60 + "\n")
        return

    message = EmailMessage()
    message["Subject"] = f"Tu código de verificación: {otp_code} - Nexaflow CRM"
    message["From"] = f"Nexaflow CRM <{email_user}>"
    message["To"] = recipient_email
    message["Reply-To"] = email_user

    plain_content = (
        f"Hola,\n\n"
        f"Tu código de verificación de 6 dígitos para ingresar al sistema es: {otp_code}\n\n"
        f"Este código es válido durante {settings.otp_expiration_minutes} minutos.\n"
        f"Por tu seguridad, nunca compartas este código con nadie.\n\n"
        f"Equipo de Seguridad Nexaflow"
    )
    message.set_content(plain_content)

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f4f6fa; margin: 0; padding: 24px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
        .header {{ text-align: center; margin-bottom: 24px; }}
        .brand {{ font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }}
        .title {{ font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 12px; }}
        .text {{ font-size: 14px; color: #64748b; line-height: 1.5; margin-bottom: 24px; }}
        .code-box {{ background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 12px; padding: 18px; text-align: center; margin: 24px 0; }}
        .code {{ font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #4338ca; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <div class="brand">NEXAFLOW CRM</div>
          <div class="title">Código de Verificación en 2 Pasos</div>
        </div>
        <p class="text">Hola,</p>
        <p class="text">Has solicitado ingresar o registrarte en la plataforma. Utiliza el siguiente código de 6 dígitos para verificar tu identidad:</p>
        <div class="code-box">
          <div class="code">{otp_code}</div>
        </div>
        <p class="text" style="font-size: 13px;">Este código vence en <strong>{settings.otp_expiration_minutes} minutos</strong>. Si tú no realizaste esta solicitud, puedes ignorar este mensaje.</p>
        <div class="footer">
          &copy; 2026 Nexaflow CRM - Autenticación Segura
        </div>
      </div>
    </body>
    </html>
    """
    message.add_alternative(html_content, subtype="html")

    sent = _send_message(message, email_user, email_password, smtp_host)
    if sent:
        print("\n" + "=" * 60)
        print(f"📧 [EMAIL ENVIADO CON ÉXITO]")
        print(f"Destinatario: {recipient_email}")
        print(f"Código OTP: {otp_code}")
        print("=" * 60 + "\n")
    else:
        print("\n" + "!" * 65)
        print(f"⚠️ [ERROR SMTP AL ENVIAR CORREO A {recipient_email}]")
        print(f"🔑 [CÓDIGO OTP PARA PRUEBAS]: {otp_code}")
        print("💡 Recuerda que Gmail requiere una 'Contraseña de Aplicación' de 16 letras.")
        print("!" * 65 + "\n")
