import unittest
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.conexion import Base, get_db
from app.models.usuario import Usuario
from app.models.user import User
from app.models.invitacion import Invitacion
from app.models.solicitud_acceso import SolicitudAcceso
from app.api.v1.endpoints import solicitudes_acceso as routes
from app.services.auth_service import create_access_token


class AccessRequestsTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        self.addCleanup(engine.dispose)
        self.session = sessionmaker(bind=engine)
        with self.session() as db:
            db.add_all([
                Usuario(id="admin", nombre="Admin", email="admin@example.com", rol="administrador", habilitado=True, estado="activo"),
                Usuario(id="collab", nombre="Colaborador", email="collab@example.com", rol="colaborador", habilitado=True, estado="activo"),
            ])
            db.commit()
        app = FastAPI()
        app.include_router(routes.router)
        def get_test_db():
            with self.session() as db:
                yield db
        app.dependency_overrides[get_db] = get_test_db
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.headers = {"Authorization": f"Bearer {create_access_token(User(id=1, email='admin@example.com'))}"}
        patch("app.services.admin_notifications._send_email", return_value=True).start()
        self.mail = patch.object(routes, "send_invitation_email", return_value=True).start()
        self.reject_mail = patch.object(routes, "_send_email", return_value=True).start()
        self.addCleanup(patch.stopall)

    def submit(self):
        response = self.client.post('/solicitudes-acceso/', json={"nombre": "Solicitante", "email": "NEW@example.com", "empresa": "Empresa", "motivo": "Necesito acceso a los reportes"})
        self.assertEqual(response.status_code, 201, response.text)
        rows = self.client.get('/solicitudes-acceso/', headers=self.headers).json()
        return rows[0]["id"]

    def decide(self, sid, decision):
        return self.client.post(f'/solicitudes-acceso/{sid}/resolver', headers=self.headers, json={"decision": decision})

    def test_request_does_not_create_account_or_email_and_rejects_duplicate(self):
        self.submit()
        with self.session() as db:
            self.assertEqual(db.query(Usuario).count(), 2)
            self.assertEqual(db.query(Invitacion).count(), 0)
            self.assertEqual(db.query(SolicitudAcceso).one().email, "new@example.com")
        self.mail.assert_not_called()
        response = self.client.post('/solicitudes-acceso/', json={"nombre": "Duplicado", "email": "new@example.com", "motivo": "Otro intento"})
        self.assertEqual(response.status_code, 409)

    def test_approval_creates_one_invitation_and_cannot_be_repeated(self):
        sid = self.submit()
        response = self.decide(sid, 'aprobar')
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["estado"], "aprobada")
        self.assertTrue(response.json()["correo_enviado"])
        with self.session() as db:
            inv = db.query(Invitacion).one()
            self.assertEqual(inv.rol_asignado, "analista")
            self.assertEqual(inv.id, response.json()["invitacion_id"])
        self.assertEqual(self.mail.call_args.kwargs['recipient_email'], 'new@example.com')
        self.assertEqual(self.decide(sid, 'rechazar').status_code, 409)
        self.mail.assert_called_once()

    def test_rejection_sends_requested_message_without_invitation(self):
        response = self.decide(self.submit(), 'rechazar')
        self.assertEqual(response.json()["estado"], "rechazada")
        self.assertIn("Lo sentimos, se denegó tu solicitud", self.reject_mail.call_args.args[3])
        with self.session() as db:
            self.assertEqual(db.query(Invitacion).count(), 0)

    def test_failed_mail_can_be_retried_without_changing_decision(self):
        sid = self.submit()
        self.reject_mail.return_value = False
        self.assertFalse(self.decide(sid, 'rechazar').json()["correo_enviado"])
        self.reject_mail.return_value = True
        response = self.client.post(f'/solicitudes-acceso/{sid}/reenviar', headers=self.headers)
        self.assertTrue(response.json()["correo_enviado"])
        self.assertEqual(response.json()["estado"], "rechazada")
        self.assertEqual(self.client.post(f'/solicitudes-acceso/{sid}/reenviar', headers=self.headers).status_code, 409)

    def test_administration_requires_authenticated_admin(self):
        sid = self.submit()
        collab = {"Authorization": f"Bearer {create_access_token(User(id=2, email='collab@example.com'))}"}
        for path, method, payload in [('/solicitudes-acceso/', 'get', None), (f'/solicitudes-acceso/{sid}/resolver', 'post', {"decision": "aprobar"}), (f'/solicitudes-acceso/{sid}/reenviar', 'post', None)]:
            options = {"json": payload} if payload else {}
            self.assertEqual(self.client.request(method, path, **options).status_code, 401)
            self.assertEqual(self.client.request(method, path, headers=collab, **options).status_code, 403)
        tampered = {"Authorization": self.headers["Authorization"] + "x"}
        self.assertEqual(self.client.get('/solicitudes-acceso/', headers=tampered).status_code, 401)

    def test_validation_and_existing_accounts(self):
        self.assertEqual(self.client.post('/solicitudes-acceso/', json={"nombre": " ", "email": "bad", "motivo": " "}).status_code, 422)
        self.assertEqual(self.client.post('/solicitudes-acceso/', json={"nombre": "Admin", "email": "admin@example.com", "motivo": "Solicitar acceso"}).status_code, 409)

    def test_standard_login_provides_signed_admin_session(self):
        from app.core.security import hash_password
        from app.api.v1.endpoints.auth import router as auth_router
        self.client.app.include_router(auth_router)
        with self.session() as db:
            db.get(Usuario, 'admin').password_hash = hash_password('test-password')
            db.commit()
        response = self.client.post('/auth/login', json={'email': 'admin@example.com', 'password': 'test-password'})
        self.assertEqual(response.status_code, 200)
        headers = {'Authorization': 'Bearer ' + response.json()['token']}
        self.assertEqual(self.client.get('/solicitudes-acceso/', headers=headers).status_code, 200)
        self.assertIsNone(self.client.post('/auth/login', json={'email': 'admin@example.com'}).json()['token'])

    def test_disabled_admin_is_rejected(self):
        with self.session() as db:
            db.get(Usuario, 'admin').habilitado = False
            db.commit()
        self.assertEqual(self.client.get('/solicitudes-acceso/', headers=self.headers).status_code, 403)

    def test_existing_invitation_uses_selected_role_without_duplicate(self):
        from datetime import datetime, timedelta
        sid = self.submit()
        with self.session() as db:
            db.add(Invitacion(id="existing", email="new@example.com", token="existing-token", rol_asignado="administrador", estado="pendiente", expires_at=datetime.utcnow() + timedelta(days=7)))
            db.commit()
        response = self.decide(sid, 'aprobar')
        self.assertEqual(response.json()['invitacion_id'], 'existing')
        with self.session() as db:
            self.assertEqual(db.query(Invitacion).count(), 1)
            self.assertEqual(db.get(Invitacion, 'existing').rol_asignado, 'analista')
