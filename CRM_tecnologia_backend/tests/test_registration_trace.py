import unittest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.middleware.cors import CORSMiddleware
from app.api.registration_trace import trace_registration


class RegistrationTraceTests(unittest.TestCase):
    def setUp(self):
        api = FastAPI()
        @api.post("/api/v1/invitaciones/completar-registro")
        def register():
            raise RuntimeError("SECRET-password-and-token")
        api.middleware("http")(trace_registration)
        self.client = TestClient(CORSMiddleware(api, allow_origins=["https://crm-tecnologia.vercel.app"], allow_methods=["*"], allow_headers=["*"], expose_headers=["X-Request-ID"]), raise_server_exceptions=False)
        self.addCleanup(self.client.close)

    def test_internal_error_is_visible_to_browser_and_logged_without_secrets(self):
        with self.assertLogs("uvicorn.error", level="INFO") as logs:
            response = self.client.post("/api/v1/invitaciones/completar-registro", headers={"Origin": "https://crm-tecnologia.vercel.app"})
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.headers["access-control-allow-origin"], "https://crm-tecnologia.vercel.app")
        reference = response.json()["request_id"]
        self.assertEqual(reference, response.headers["x-request-id"])
        self.assertIn(reference, response.json()["detail"])
        text = " ".join(logs.output)
        self.assertIn("Inicio", text)
        self.assertIn("HTTP=500", text)
        self.assertIn("RuntimeError", text)
        self.assertNotIn("SECRET", text + response.text)

    def test_preflight_accepts_production_frontend(self):
        response = self.client.options("/api/v1/invitaciones/completar-registro", headers={"Origin": "https://crm-tecnologia.vercel.app", "Access-Control-Request-Method": "POST", "Access-Control-Request-Headers": "content-type"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers["access-control-allow-origin"], "https://crm-tecnologia.vercel.app")

    def test_production_app_has_cors_outside_error_handling(self):
        from app.main import app
        self.assertIsInstance(app, CORSMiddleware)
        self.assertIn("https://crm-tecnologia.vercel.app", app.allow_origins)
