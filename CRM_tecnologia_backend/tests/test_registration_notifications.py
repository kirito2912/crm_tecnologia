import unittest
from datetime import datetime, timedelta
from unittest.mock import patch
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.db.conexion import Base, get_db
from app.models.usuario import Usuario
from app.models.invitacion import Invitacion
from app.api.v1.endpoints import invitaciones, solicitudes_acceso
from app.services import admin_notifications


class RegistrationNotificationsTests(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
        Base.metadata.create_all(engine)
        self.addCleanup(engine.dispose)
        self.session = sessionmaker(bind=engine)
        with self.session() as db:
            db.add_all([
                Usuario(id="USR-103", nombre="Admin", email="admin@example.com", rol="administrador", habilitado=True),
                Usuario(id="disabled", nombre="Disabled", email="disabled@example.com", rol="administrador", habilitado=False),
                Invitacion(id="inv", email="new@example.com", token="test-token", rol_asignado="colaborador", estado="pendiente", expires_at=datetime.utcnow() + timedelta(days=1)),
            ])
            db.commit()
        app = FastAPI()
        app.include_router(invitaciones.router)
        app.include_router(solicitudes_acceso.router)
        def database():
            with self.session() as db:
                yield db
        app.dependency_overrides[get_db] = database
        self.client = TestClient(app)
        self.addCleanup(self.client.close)
        self.mail = patch.object(admin_notifications, "_send_email", return_value=True).start()
        self.addCleanup(patch.stopall)

    def register(self):
        return self.client.post("/invitaciones/completar-registro", json={"token": "test-token", "full_name": "New User", "password": "secret123"})

    def test_saved_account_is_visible_and_notifies_only_enabled_admin(self):
        response = self.register()
        self.assertEqual(response.status_code, 201, response.text)
        self.mail.assert_called_once()
        self.assertEqual(self.mail.call_args.args[0], "admin@example.com")
        dashboard = self.client.get("/invitaciones/dashboard").json()
        self.assertIn("new@example.com", [r["email"] for r in dashboard["solicitudes_pendientes"]])
        self.assertEqual(self.register().status_code, 400)
        self.mail.assert_called_once()

    def test_email_failure_does_not_undo_registration(self):
        self.mail.side_effect = RuntimeError("provider unavailable")
        self.assertEqual(self.register().status_code, 201)
        with self.session() as db:
            self.assertEqual(db.query(Usuario).filter_by(email="new@example.com").one().estado, "pendiente_aprobacion")

    def test_expired_invitation_does_not_register_or_notify(self):
        with self.session() as db:
            db.get(Invitacion, "inv").expires_at = datetime.utcnow() - timedelta(days=1)
            db.commit()
        self.assertEqual(self.register().status_code, 400)
        self.mail.assert_not_called()

    def test_access_request_notifies_admin_without_creating_account(self):
        response = self.client.post("/solicitudes-acceso/", json={"nombre": "Applicant", "email": "applicant@example.com", "motivo": "Necesito ingresar"})
        self.assertEqual(response.status_code, 201, response.text)
        self.mail.assert_called_once()
        self.assertEqual(self.mail.call_args.args[1], "Nueva solicitud de acceso")
        with self.session() as db:
            self.assertIsNone(db.query(Usuario).filter_by(email="applicant@example.com").first())
