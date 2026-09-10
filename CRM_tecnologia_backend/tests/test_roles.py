import unittest
from app.core.roles import normalize_role
from app.schemas.invitacion import InvitacionCreate
from app.schemas.usuario import UsuarioBase, RegisterRequest

class RolesTests(unittest.TestCase):
    def test_legacy_roles_become_collaborators(self):
        for role in ("analista", "programador", "auditor", "colaborador"):
            with self.subTest(role=role):
                self.assertEqual(normalize_role(role), "colaborador")
                self.assertEqual(UsuarioBase(nombre="Test", email="test@example.com", rol=role).rol, "colaborador")
                self.assertEqual(InvitacionCreate(email="test@example.com", rol_asignado=role).rol_asignado, "colaborador")

    def test_administrators_remain_administrators(self):
        for role in ("admin", "administrador", " Administrador "):
            self.assertEqual(InvitacionCreate(email="test@example.com", rol_asignado=role).rol_asignado, "administrador")

    def test_defaults_are_collaborator(self):
        self.assertEqual(InvitacionCreate(email="test@example.com").rol_asignado, "colaborador")
        self.assertEqual(RegisterRequest(full_name="Test", company_email="test@example.com", password="testing123").role, "colaborador")
