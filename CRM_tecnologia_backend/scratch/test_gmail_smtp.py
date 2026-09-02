import os
import smtplib
import ssl
from email.message import EmailMessage
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path, override=True)

user = os.getenv("EMAIL_USER", "").strip()
raw_pwd = os.getenv("EMAIL_PASSWORD", "").strip()
pwd = raw_pwd.replace(" ", "").replace('"', '').replace("'", "").strip()
recipient = user

print(f"Probando conexion SMTP con Gmail:")
print(f" - EMAIL_USER: {user}")
print(f" - Longitud password: {len(pwd)} caracteres ({pwd[:3]}...{pwd[-3:]})")
print(f" - Destinatario: {recipient}")
print("-" * 55)

msg = EmailMessage()
msg["Subject"] = "Código de Seguridad Verificado - Nexaflow CRM"
msg["From"] = f"Nexaflow CRM <{user}>"
msg["To"] = recipient
msg.set_content(
    "Hola,\n\n"
    "Este es un correo de confirmación de que el servicio SMTP de Gmail está "
    "perfectamente sincronizado y listo para enviar códigos OTP en Nexaflow CRM.\n\n"
    "Equipo de Seguridad Nexaflow"
)

ssl_context = ssl.create_default_context()

try:
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=15) as server:
        server.ehlo()
        server.starttls(context=ssl_context)
        server.ehlo()
        server.login(user, pwd)
        server.send_message(msg)
        print("✅ [EXITO] Correo enviado correctamente por puerto 587 STARTTLS a tu bandeja de entrada.")
except Exception as e:
    print(f"⚠️ [Puerto 587 falló]: {e}. Intentando puerto 465 SSL...")
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=15, context=ssl_context) as server:
            server.login(user, pwd)
            server.send_message(msg)
            print("✅ [EXITO] Correo enviado correctamente por puerto 465 SSL.")
    except Exception as ssl_e:
        print(f"❌ [ERROR SMTP]: {ssl_e}")
