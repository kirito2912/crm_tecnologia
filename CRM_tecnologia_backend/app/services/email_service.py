import os
from email.message import EmailMessage
from pathlib import Path
import smtplib
import ssl
from dotenv import load_dotenv

from app.core.config import settings


def send_otp_email(recipient_email: str, otp_code: str) -> None:
    # Cargar variables desde el archivo .env de forma explícita
    backend_env = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(backend_env, override=True)
    load_dotenv(override=True)

    raw_user = os.getenv("EMAIL_USER", "").strip() or settings.email_user
    raw_pwd = os.getenv("EMAIL_PASSWORD", "").strip() or settings.email_password

    # Limpiar posibles comillas y espacios en la contraseña de aplicación de Google
    email_user = raw_user.replace('"', '').replace("'", "").strip()
    email_password = raw_pwd.replace(" ", "").replace('"', '').replace("'", "").strip()
    smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
    email_from = os.getenv("EMAIL_FROM", "").strip() or email_user

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

    ssl_context = ssl.create_default_context()

    # Intento 1: Puerto 587 STARTTLS (Recomendado por Google y compatible con todos los proveedores)
    try:
        with smtplib.SMTP(smtp_host, 587, timeout=15) as server:
            server.ehlo()
            server.starttls(context=ssl_context)
            server.ehlo()
            server.login(email_user, email_password)
            server.send_message(message)
            print("\n" + "=" * 60)
            print(f"📧 [EMAIL ENVIADO CON ÉXITO vía STARTTLS:587]")
            print(f"Destinatario: {recipient_email}")
            print(f"Código OTP: {otp_code}")
            print("=" * 60 + "\n")
            return
    except Exception as tls_err:
        print(f"⚠️ [STARTTLS 587 falló]: {tls_err}. Intentando SSL 465...")

    # Intento 2: Puerto 465 SSL Directo
    try:
        with smtplib.SMTP_SSL(smtp_host, 465, timeout=15, context=ssl_context) as server:
            server.login(email_user, email_password)
            server.send_message(message)
            print("\n" + "=" * 60)
            print(f"📧 [EMAIL ENVIADO CON ÉXITO vía SSL:465]")
            print(f"Destinatario: {recipient_email}")
            print(f"Código OTP: {otp_code}")
            print("=" * 60 + "\n")
            return
    except smtplib.SMTPAuthenticationError as auth_err:
        print("\n" + "!" * 65)
        print("❌ [ERROR DE AUTENTICACIÓN GMAIL SMTP]")
        print(f"Detalle: {auth_err}")
        print("💡 Recuerda que Gmail requiere una 'Contraseña de Aplicación' de 16 letras.")
        print(f"Remitente: {email_user}")
        print(f"🔑 [CÓDIGO OTP PARA PRUEBAS]: {otp_code}")
        print("!" * 65 + "\n")
    except Exception as exc:
        print("\n" + "!" * 65)
        print(f"⚠️ [ERROR SMTP AL ENVIAR CORREO A {recipient_email}]: {exc}")
        print(f"🔑 [CÓDIGO OTP PARA PRUEBAS]: {otp_code}")
        print("!" * 65 + "\n")
