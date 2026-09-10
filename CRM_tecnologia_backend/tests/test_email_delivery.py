import importlib
import os
import unittest
from unittest.mock import patch
from app.services import email_service

class EmailConfigurationTests(unittest.TestCase):
    def test_server_environment_is_not_overwritten(self):
        with patch.dict(os.environ, {"EMAIL_USER": "server@example.com"}):
            importlib.reload(email_service)
            self.assertEqual(os.environ["EMAIL_USER"], "server@example.com")

    def test_invitation_uses_recipient_and_reports_failure(self):
        with patch.object(email_service, "_send_email", return_value=False) as send, patch("builtins.print"):
            result = email_service.send_invitation_email(
                recipient_email="invited@example.com",
                invite_link="https://example.com/?invite_token=test",
                nombre_referencial="Invitado",
                rol_asignado="analista",
                creado_por="Admin",
                expires_days=7,
            )
        self.assertFalse(result)
        self.assertEqual(send.call_args.args[0], "invited@example.com")
        self.assertIn("https://example.com/?invite_token=test", send.call_args.args[2])

    def test_resend_success_does_not_attempt_smtp(self):
        with patch.object(email_service, "gmail_configured", return_value=False), patch.object(email_service, "_send_via_resend", return_value=True), patch.object(email_service, "_send_via_smtp") as smtp:
            self.assertTrue(email_service._send_email("test@example.com", "test", "test", "test"))
        smtp.assert_not_called()
