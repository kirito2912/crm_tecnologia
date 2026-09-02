import urllib.request
import json
import sqlite3
from pathlib import Path

BASE_URL = "http://127.0.0.1:8000"
db_path = Path(__file__).resolve().parent.parent / "crm.db"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))
    except Exception as e:
        return 500, {"error": str(e)}

print("=" * 60)
print("TEST COMPLETO DE FLUJO DE AUTENTICACION Y OTP")
print("=" * 60)

test_email = "alex.rivera@nexaflow.tech"
test_password = "SecurePassword2026!"

# Limpiar usuario previo de prueba en base de datos si existe
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute("DELETE FROM usuarios WHERE email = ?", (test_email,))
cursor.execute("DELETE FROM users WHERE email = ?", (test_email,))
cursor.execute("DELETE FROM otp_codes WHERE email = ?", (test_email,))
conn.commit()
conn.close()

# 1. Solicitar OTP para Registro
print("\n[1] Probando Solicitud de OTP para Registro (nuevo usuario)...")
status, data = post("/api/v1/login/request-otp", {
    "email": test_email,
    "full_name": "Alex Rivera",
    "password": test_password,
    "mode": "register",
    "company": "Nexaflow B2B"
})
print(f"Status: {status} | Data: {data}")
assert status == 200, f"Fallo al solicitar OTP: {data}"

# 2. Obtener el código OTP generado en BD
conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()
cursor.execute("SELECT code FROM otp_codes WHERE email = ? AND is_used = 0 ORDER BY id DESC LIMIT 1", (test_email,))
row = cursor.fetchone()
conn.close()

assert row is not None, "No se guardó el OTP en la BD"
otp_code = row[0]
print(f"Código OTP generado en BD: {otp_code}")

# 3. Verificar código OTP
print("\n[2] Probando Verificación de OTP...")
status, data = post("/api/v1/login/verify-otp", {
    "email": test_email,
    "otp_code": otp_code
})
print(f"Status: {status} | Data: {data}")
assert status == 200, f"Fallo al verificar OTP: {data}"
assert "access_token" in data, "No se devolvió access_token"

# 4. Completar Registro en base de datos
print("\n[3] Registrando usuario en base de datos...")
status, data = post("/api/v1/auth/register", {
    "company_email": test_email,
    "full_name": "Alex Rivera",
    "password": test_password,
    "company": "Nexaflow B2B"
})
print(f"Status: {status} | Data: {data}")
assert status == 201, f"Fallo al registrar usuario: {data}"

# 5. Intentar registrar el MISMO correo otra vez (debe fallar con 400)
print("\n[4] Probando Prevención de Correo Duplicado en Registro...")
status, data = post("/api/v1/login/request-otp", {
    "email": test_email,
    "full_name": "Alex Rivera",
    "password": test_password,
    "mode": "register"
})
print(f"Status: {status} (Esperado 400) | Detail: {data.get('detail')}")
assert status == 400, f"Debería haber rechazado correo duplicado: {status}"

# 6. Intentar Login con CONTRASEÑA INCORRECTA (debe fallar con 401 y bloquear OTP)
print("\n[5] Probando Validación de Contraseña Errónea en Login...")
status, data = post("/api/v1/login/request-otp", {
    "email": test_email,
    "password": "PasswordIncorrecta999",
    "mode": "login"
})
print(f"Status: {status} (Esperado 401) | Detail: {data.get('detail')}")
assert status == 401, f"Debería haber rechazado contraseña incorrecta: {status}"

# 7. Intentar Login con CONTRASEÑA CORRECTA (debe generar OTP con 200)
print("\n[6] Probando Login con Contraseña Correcta...")
status, data = post("/api/v1/login/request-otp", {
    "email": test_email,
    "password": test_password,
    "mode": "login"
})
print(f"Status: {status} (Esperado 200) | Data: {data}")
assert status == 200, f"Fallo login con contraseña correcta: {data}"

print("\n" + "=" * 60)
print(">>> TODOS LOS TESTS DE VALIDACION Y OTP PASARON AL 100% <<<")
print("=" * 60)
