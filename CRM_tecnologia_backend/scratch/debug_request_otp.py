import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import traceback
from app.db.conexion import SessionLocal
from app.schemas.auth import OTPRequest
from app.services.auth_service import request_otp

db = SessionLocal()
try:
    data = OTPRequest(
        email="eduardocaballero392@gmail.com",
        full_name="Eduardo Caballero",
        mode="register",
        company="Nexaflow Inc"
    )
    print("Ejecutando request_otp...")
    code = request_otp(data, db)
    print(f"Resultado exitoso, codigo generado: {code}")
except Exception as e:
    print(f"Excepcion capturada: {type(e).__name__}: {e}")
    traceback.print_exc()
finally:
    db.close()
