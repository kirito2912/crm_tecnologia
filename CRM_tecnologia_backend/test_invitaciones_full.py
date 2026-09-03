from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    with TestClient(app) as client:
        print("=== TEST 1: Admin Dashboard ===")
        r = client.get("/api/v1/invitaciones/dashboard")
        assert r.status_code == 200, f"Status {r.status_code}"
        data = r.json()
        print(f"[OK] Dashboard cargado exitosamente. Total usuarios: {data['total_usuarios']}")

        print("\n=== TEST 2: Generar Invitacion estilo GitHub ===")
        r = client.post("/api/v1/invitaciones/", json={
            "email": "lucia.dev@empresa.com",
            "nombre_referencial": "Lucia Ramos",
            "rol_asignado": "programador"
        })
        assert r.status_code == 201, f"Status {r.status_code}"
        inv = r.json()
        token = inv["token"]
        print(f"[OK] Invitacion creada para {inv['email']} con rol {inv['rol_asignado']}. Token: {token}")

        print("\n=== TEST 3: Validar Token de Invitacion ===")
        r = client.get(f"/api/v1/invitaciones/validar/{token}")
        assert r.status_code == 200
        val = r.json()
        assert val["valido"] is True
        print(f"[OK] Validacion exitosa: {val['mensaje']}")

        print("\n=== TEST 4: Registro de Trabajador Invitado (Bloqueo Preventivo) ===")
        r = client.post("/api/v1/invitaciones/completar-registro", json={
            "token": token,
            "full_name": "Lucia Ramos",
            "password": "secretpassword123"
        })
        assert r.status_code == 201
        reg = r.json()
        assert reg["requiere_aprobacion"] is True
        user = reg["user"]
        assert user["habilitado"] is False
        assert user["estado"] == "pendiente_aprobacion"
        print(f"[OK] Trabajador registrado: {user['nombre']}. Estado={user['estado']}, Habilitado={user['habilitado']}")

        print("\n=== TEST 5: Supervision en Bandeja de Solicitudes del Admin ===")
        r = client.get("/api/v1/invitaciones/dashboard")
        assert r.status_code == 200
        dash = r.json()
        assert dash["usuarios_pendientes"] >= 1
        found_sol = any(s["usuario_id"] == user["id"] for s in dash["solicitudes_pendientes"])
        assert found_sol, "La solicitud no aparecio en la bandeja del administrador"
        print(f"[OK] Solicitud detectada en la bandeja del Administrador. Solicitudes pendientes: {len(dash['solicitudes_pendientes'])}")

        print("\n=== TEST 6: Autorizacion / Habilitar Cuenta por el Admin ===")
        r = client.patch(f"/api/v1/invitaciones/usuarios/{user['id']}/toggle-status", json={"habilitado": True})
        assert r.status_code == 200
        u_hab = r.json()
        assert u_hab["habilitado"] is True
        assert u_hab["estado"] == "activo"
        print(f"[OK] Cuenta habilitada con exito: {u_hab['nombre']} -> Estado: {u_hab['estado']}")

        print("\n=== TEST 7: Deshabilitar Cuenta Inmediatamente ===")
        r = client.patch(f"/api/v1/invitaciones/usuarios/{user['id']}/toggle-status", json={"habilitado": False})
        assert r.status_code == 200
        u_des = r.json()
        assert u_des["habilitado"] is False
        assert u_des["estado"] == "deshabilitado"
        print(f"[OK] Cuenta deshabilitada con exito: {u_des['nombre']} -> Estado: {u_des['estado']}")

        print("\n=== TEST 8: Revocar Invitacion ===")
        r = client.delete(f"/api/v1/invitaciones/{inv['id']}")
        assert r.status_code == 200
        print(f"[OK] Invitacion {inv['id']} revocada exitosamente.")

    print("\n=============================================")
    print("TODOS LOS TESTS BACKEND PASARON CON EXITO!")
    print("=============================================")

if __name__ == "__main__":
    run_tests()
