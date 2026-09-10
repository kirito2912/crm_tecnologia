import unittest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from app.db.conexion import Base
from app.models.usuario import Usuario
from app.models.user import User
from app.models.invitacion import Invitacion
from app.schemas.usuario import UsuarioResponse
from app.schemas.invitacion import InvitacionResponse
from app.core.roles import database_role


class DatabaseRolesTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine("sqlite://")
        Base.metadata.create_all(self.engine)
        self.addCleanup(self.engine.dispose)
        with self.engine.begin() as conn:
            for table, field in [("usuarios", "rol"), ("users", "role"), ("invitaciones", "rol_asignado")]:
                for operation in ["INSERT", "UPDATE"]:
                    conn.execute(text(f"CREATE TRIGGER check_{table}_{operation} BEFORE {operation} ON {table} WHEN NEW.{field} NOT IN ('administrador', 'analista') BEGIN SELECT RAISE(ABORT, 'invalid database role'); END"))

    def test_collaborator_is_stored_as_analyst_and_returned_as_collaborator(self):
        with Session(self.engine) as db:
            account = Usuario(id="u1", nombre="Test", email="test@example.com", rol="colaborador")
            otp = User(email="test@example.com", role="colaborador")
            invitation = Invitacion(id="i1", email="test@example.com", token="test", rol_asignado="colaborador")
            db.add_all([account, otp, invitation])
            db.commit()
            self.assertEqual(db.execute(text("SELECT rol FROM usuarios")).scalar_one(), "analista")
            self.assertEqual(db.execute(text("SELECT role FROM users")).scalar_one(), "analista")
            self.assertEqual(db.execute(text("SELECT rol_asignado FROM invitaciones")).scalar_one(), "analista")
            self.assertEqual(UsuarioResponse.model_validate(account).rol, "colaborador")
            self.assertEqual(InvitacionResponse.model_validate(invitation).rol_asignado, "colaborador")
            for row, field in [(account, "rol"), (otp, "role"), (invitation, "rol_asignado")]:
                setattr(row, field, "administrador")
            db.commit()
            self.assertEqual(account.rol, "administrador")
            self.assertEqual(otp.role, "administrador")
            self.assertEqual(invitation.rol_asignado, "administrador")
            account.rol = "colaborador"
            db.commit()
            self.assertEqual(account.rol, "analista")

    def test_defaults_fit_existing_database_roles(self):
        with Session(self.engine) as db:
            account = Usuario(id="u2", nombre="Default", email="default@example.com")
            otp = User(email="default@example.com")
            invitation = Invitacion(id="i2", email="default@example.com", token="default")
            db.add_all([account, otp, invitation])
            db.commit()
            self.assertEqual((account.rol, otp.role, invitation.rol_asignado), ("analista", "analista", "analista"))

    def test_aliases_keep_the_same_access_level(self):
        self.assertEqual(database_role("Colaborador"), "analista")
        self.assertEqual(database_role("analista"), "analista")
        self.assertEqual(database_role("admin"), "administrador")
