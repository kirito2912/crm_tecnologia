import base64
import os
import unittest
from email import policy
from email.parser import BytesParser
from unittest.mock import patch

import httpx
from app.services import email_service, gmail_service

class GmailDeliveryTests(unittest.TestCase):
    def setUp(self):
        self.env = patch.dict(os.environ, {
            "GMAIL_CLIENT_ID": "client-test",
            "GMAIL_CLIENT_SECRET": "secret-test",
            "GMAIL_REFRESH_TOKEN": "refresh-test",
            "GMAIL_SENDER_EMAIL": "sender@gmail.com",
        })
        self.env.start()
        self.addCleanup(self.env.stop)

    def run_transport(self, handler):
        client = httpx.Client(transport=httpx.MockTransport(handler))
        with patch.object(gmail_service.httpx, "Client", return_value=client):
            return gmail_service.send_via_gmail(
                "recipient@example.com", "Invitación", "<p>Enlace</p>", "Enlace"
            )

    def test_refresh_and_send_mime_to_selected_recipient(self):
        requests = []
        def handler(request):
            requests.append(request)
            if len(requests) == 1:
                self.assertEqual(str(request.url), "https://oauth2.googleapis.com/token")
                self.assertIn(b"grant_type=refresh_token", request.content)
                return httpx.Response(200, json={"access_token": "access-test"})
            import json
            self.assertEqual(str(request.url), "https://gmail.googleapis.com/gmail/v1/users/me/messages/send")
            self.assertEqual(request.headers["Authorization"], "Bearer access-test")
            raw = json.loads(request.content)["raw"]
            message = BytesParser(policy=policy.default).parsebytes(base64.urlsafe_b64decode(raw))
            self.assertEqual(message["To"], "recipient@example.com")
            self.assertIn("sender@gmail.com", message["From"])
            self.assertEqual(message["Subject"], "Invitación")
            self.assertIn("Enlace", message.get_body(preferencelist=("html",)).get_content())
            return httpx.Response(200, json={"id": "message-test"})
        self.assertTrue(self.run_transport(handler))
        self.assertEqual(len(requests), 2)

    def test_invalid_token_does_not_send_or_log_secrets(self):
        calls = []
        def handler(request):
            calls.append(request)
            return httpx.Response(400, json={"error": "invalid_grant", "error_description": "secret-test"})
        with self.assertLogs(gmail_service.logger, level="ERROR") as logs:
            self.assertFalse(self.run_transport(handler))
        self.assertEqual(len(calls), 1)
        self.assertNotIn("secret-test", str(logs.output))

    def test_send_rejections_and_missing_id_are_not_success(self):
        for status, data in [(403, {"error": {}}), (429, {"error": {}}), (200, {})]:
            with self.subTest(status=status, data=data):
                def handler(request):
                    if request.url.host == "oauth2.googleapis.com":
                        return httpx.Response(200, json={"access_token": "access-test"})
                    return httpx.Response(status, json=data)
                with self.assertLogs(gmail_service.logger, level="ERROR"):
                    self.assertFalse(self.run_transport(handler))

    def test_partial_configuration_does_not_contact_google(self):
        with patch.dict(os.environ, {"GMAIL_REFRESH_TOKEN": ""}), patch.object(gmail_service.httpx, "Client") as client:
            with self.assertLogs(gmail_service.logger, level="ERROR"):
                self.assertFalse(gmail_service.send_via_gmail("a@example.com", "s", "h", "t"))
            client.assert_not_called()

    def test_timeout_does_not_retry(self):
        requests = []
        def handler(request):
            requests.append(request)
            if request.url.host == "oauth2.googleapis.com":
                return httpx.Response(200, json={"access_token": "access-test"})
            raise httpx.ReadTimeout("timeout", request=request)
        with self.assertLogs(gmail_service.logger, level="ERROR"):
            self.assertFalse(self.run_transport(handler))
        self.assertEqual(len(requests), 2)

    def test_configured_gmail_has_priority_without_fallback(self):
        for result in (True, False):
            with patch.object(email_service, "send_via_gmail", return_value=result) as gmail, patch.object(email_service, "_send_via_resend") as resend, patch.object(email_service, "_send_via_smtp") as smtp:
                self.assertEqual(email_service._send_email("a@example.com", "s", "h", "t"), result)
                gmail.assert_called_once()
                resend.assert_not_called()
                smtp.assert_not_called()
