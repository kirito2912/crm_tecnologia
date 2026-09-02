import os
from datetime import datetime, timedelta
import jwt
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.db.conexion import Base
from app.models.user import User
from app.models.otp_code import OTPCode
from app.schemas.auth import OTPRequest, OTPVerifyRequest
from app.services.otp_service import generate_otp_code, get_otp_expiration
from app.services.auth_service import create_access_token, request_otp, verify_otp

# 1. Usar SQLite en memoria para test unitario
test_engine = create_engine("sqlite:///:memory:")
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)

print("[OK] Tablas creadas con exito en base de datos de prueba")

db = TestSession()

# 2. Test OTP Generation & Expiration
code = generate_otp_code()
assert len(code) == 6 and code.isdigit(), f"OTP invalido: {code}"
exp = get_otp_expiration()
assert exp > datetime.utcnow(), "Expiracion invalida"
print(f"[OK] Servicio OTP genera codigo valido: {code}, expira: {exp}")

# 3. Test Creacion de Usuario y Token JWT
test_user = User(
    email="test.executive@hardcrm.tech",
    full_name="Test Executive",
    is_active=True,
    is_verified=False,
)
db.add(test_user)
db.commit()
db.refresh(test_user)

assert test_user.id is not None
print(f"[OK] Usuario creado con ID: {test_user.id}, email: {test_user.email}")

token = create_access_token(test_user)
payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
assert payload["sub"] == str(test_user.id)
assert payload["email"] == test_user.email
print(f"[OK] Token JWT codificado y decodificado correctamente: sub={payload['sub']}")

# 4. Test OTP Code Registration & Verification Flow
otp_record = OTPCode(
    email=test_user.email,
    code=code,
    expires_at=get_otp_expiration(),
    user_id=test_user.id,
)
db.add(otp_record)
db.commit()

verify_data = OTPVerifyRequest(email=test_user.email, otp_code=code)
access_token, verified_user = verify_otp(verify_data, db)

assert verified_user.is_verified is True
assert verified_user.email == test_user.email
assert access_token is not None

print(f"[OK] Verificacion OTP completada exitosamente. Usuario verificado: {verified_user.is_verified}")

# 5. Test Seed database
from app.db.seed_data import seed_database
seed_database(db, force_reset=False)
users_count = db.query(User).count()
print(f"[OK] Base de datos semillada. Total usuarios: {users_count}")

# 6. Test Endpoint / Routes
from app.main import app
routes = []
for r in app.routes:
    if hasattr(r, "routes"):
        for sub_r in r.routes:
            routes.append(f"{list(sub_r.methods)} {sub_r.path}")
    elif hasattr(r, "path"):
        methods = list(r.methods) if hasattr(r, "methods") else []
        routes.append(f"{methods} {r.path}")

print("[OK] Rutas registradas en la aplicacion:")
for route_str in sorted(routes):
    print(f"    - {route_str}")

print("\n==========================================")
print("TODAS LAS PRUEBAS PASARON EXITOSAMENTE")
print("==========================================")
