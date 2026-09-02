from unittest.mock import patch
# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
# pyrefly: ignore [missing-import]
from sqlalchemy.pool import StaticPool

from app.main import app
from app.db.conexion import Base, get_db
from app.models.user import User
from app.models.otp_code import OTPCode

test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
Base.metadata.create_all(bind=test_engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)

# 1. Test GET /
res_root = client.get("/")
assert res_root.status_code == 200
print("[OK] GET / ->", res_root.json()["status"])

# 2. Test POST /api/v1/login/request-otp (mockeando el envio SMTP para testing)
with patch("app.services.auth_service.send_otp_email") as mock_email:
    mock_email.return_value = None

    req_payload = {
        "email": "carlos.mendoza@empresa.com",
        "full_name": "Carlos Mendoza",
    }
    res_otp = client.post("/api/v1/login/request-otp", json=req_payload)
    assert res_otp.status_code == 200, res_otp.text
    print("[OK] POST /api/v1/login/request-otp ->", res_otp.json())

# 3. Obtener el codigo OTP generado desde la BD de prueba
db = TestSession()
otp_obj = (
    db.query(OTPCode)
    .filter(OTPCode.email == "carlos.mendoza@empresa.com", OTPCode.is_used == False)
    .first()
)
assert otp_obj is not None, "No se guardo el OTP en la BD"
otp_code = otp_obj.code
print(f"[OK] OTP Code generado en BD: {otp_code}")

# 4. Test POST /api/v1/login/verify-otp
verify_payload = {
    "email": "carlos.mendoza@empresa.com",
    "otp_code": otp_code,
}
res_verify = client.post("/api/v1/login/verify-otp", json=verify_payload)
assert res_verify.status_code == 200, res_verify.text
data = res_verify.json()
assert "access_token" in data
assert data["user"]["email"] == "carlos.mendoza@empresa.com"
assert data["user"]["is_verified"] is True
token = data["access_token"]
print("[OK] POST /api/v1/login/verify-otp ->", data["user"])

# 5. Test GET /api/v1/auth/me con Token Bearer
res_me = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
assert res_me.status_code == 200, res_me.text
assert res_me.json()["email"] == "carlos.mendoza@empresa.com"
print("[OK] GET /api/v1/auth/me ->", res_me.json())

# 6. Test GET /api/v1/usuarios/
res_users = client.get("/api/v1/usuarios/")
assert res_users.status_code == 200
print(f"[OK] GET /api/v1/usuarios/ -> {len(res_users.json())} usuarios encontrados")

# 7. Test alias endpoints /api/v1/auth/request-otp and /api/v1/auth/verify-otp
with patch("app.services.auth_service.send_otp_email") as mock_email:
    mock_email.return_value = None
    res_auth_req = client.post("/api/v1/auth/request-otp", json={"email": "jane@company.com", "full_name": "Jane Doe"})
    assert res_auth_req.status_code == 200

otp_jane = db.query(OTPCode).filter(OTPCode.email == "jane@company.com", OTPCode.is_used == False).first()
res_auth_ver = client.post("/api/v1/auth/verify-otp", json={"email": "jane@company.com", "otp_code": otp_jane.code})
assert res_auth_ver.status_code == 200
assert res_auth_ver.json()["user"]["email"] == "jane@company.com"
print("[OK] Alias POST /api/v1/auth/request-otp y verify-otp funcionando correctamente")

print("\n==========================================")
print("TEST CLIENT HTTP ENDPOINTS: EXITOSO (100%)")
print("==========================================")
