import unittest
from datetime import datetime, timedelta
import test_access_requests as fixtures
from app.api.v1.endpoints.usuarios import router
from app.models.usuario import Usuario
from app.models.user import User
from app.models.otp_code import OTPCode
from app.models.invitacion import Invitacion


class DeleteCollaboratorTests(unittest.TestCase):
    def setUp(self):
        fixtures.AccessRequestsTests.setUp(self)
        self.client.app.include_router(router)
        with self.session() as db:
            user = db.get(Usuario, 'collab')
            user.habilitado = False
            user.estado = 'deshabilitado'
            account = User(email=user.email, full_name=user.nombre, role='colaborador', is_active=False)
            db.add(account)
            db.flush()
            db.add(OTPCode(user_id=account.id, email=user.email, code='123456', expires_at=datetime.utcnow() + timedelta(minutes=10)))
            db.add(Invitacion(id='old-link', email=user.email, token='old-token', estado='pendiente'))
            db.commit()

    def test_deletes_disabled_collaborator_credentials_and_revokes_links(self):
        response = self.client.delete('/usuarios/collab', headers=self.headers)
        self.assertEqual(response.status_code, 200, response.text)
        with self.session() as db:
            self.assertIsNone(db.get(Usuario, 'collab'))
            self.assertEqual(db.query(User).count(), 0)
            self.assertEqual(db.query(OTPCode).count(), 0)
            self.assertEqual(db.get(Invitacion, 'old-link').estado, 'cancelado')
            self.assertIsNotNone(db.get(Usuario, 'admin'))
        self.assertEqual(self.client.delete('/usuarios/collab', headers=self.headers).status_code, 404)

    def test_active_pending_and_admin_accounts_cannot_be_deleted(self):
        for enabled, state in [(True, 'activo'), (False, 'pendiente_aprobacion')]:
            with self.session() as db:
                user = db.get(Usuario, 'collab')
                user.habilitado, user.estado = enabled, state
                db.commit()
            self.assertEqual(self.client.delete('/usuarios/collab', headers=self.headers).status_code, 409)
        self.assertEqual(self.client.delete('/usuarios/admin', headers=self.headers).status_code, 403)

    def test_requires_admin_and_preserves_legacy_collaborators(self):
        self.assertEqual(self.client.delete('/usuarios/collab').status_code, 401)
        with self.session() as db:
            db.get(Usuario, 'collab').rol = 'analista'
            db.commit()
        self.assertEqual(self.client.delete('/usuarios/collab', headers=self.headers).status_code, 200)
