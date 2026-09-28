import base64
import asyncio
import os
import unittest
from io import BytesIO
from unittest.mock import Mock, patch

from botocore.exceptions import NoCredentialsError
from fastapi import HTTPException
from PIL import Image

from app.api.v1.endpoints.facial_verification import VerificationRequest, verify_faces
from app.services.rekognition_service import RekognitionService, RekognitionServiceError


class RekognitionServiceTests(unittest.TestCase):
    def setUp(self):
        image = BytesIO()
        Image.new("RGB", (32, 32), color="white").save(image, format="JPEG")
        self.image_base64 = base64.b64encode(image.getvalue()).decode("ascii")
        self.service = object.__new__(RekognitionService)
        self.service.client = Mock()

    def test_returns_normalized_face_landmarks_for_overlay(self):
        self.service.client.detect_faces.return_value = {
            "FaceDetails": [
                {
                    "Confidence": 99.8,
                    "Landmarks": [
                        {"Type": "eyeLeft", "X": 0.23456, "Y": 0.67891},
                        {"Type": "nose", "X": 0.50123, "Y": 0.45678},
                    ],
                    "Quality": {"Brightness": 80, "Sharpness": 90},
                }
            ]
        }

        result = self.service.detect_faces(self.image_base64)

        self.assertEqual(
            result["landmarks"],
            [
                {"type": "eyeLeft", "x": 0.235, "y": 0.679},
                {"type": "nose", "x": 0.501, "y": 0.457},
            ],
        )

    def test_missing_aws_credentials_are_not_reported_as_no_face(self):
        self.service.client.detect_faces.side_effect = NoCredentialsError()

        with self.assertRaisesRegex(RekognitionServiceError, "credenciales"):
            self.service.detect_faces(self.image_base64)

    def test_aws_comparison_errors_are_not_reported_as_a_non_match(self):
        self.service.client.compare_faces.side_effect = NoCredentialsError()

        with self.assertRaisesRegex(RekognitionServiceError, "credenciales"):
            self.service.compare_faces(self.image_base64, self.image_base64)

    def test_api_reports_aws_configuration_errors_as_service_unavailable(self):
        request = VerificationRequest(
            registrationPhoto="registration",
            verificationPhoto="verification",
            userName="test",
        )
        with patch(
            "app.api.v1.endpoints.facial_verification.rekognition_service.detect_faces",
            side_effect=RekognitionServiceError("AWS credentials missing"),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(verify_faces(request))

        self.assertEqual(raised.exception.status_code, 503)
        self.assertIn("AWS credentials missing", raised.exception.detail)

    def test_partial_credentials_do_not_crash_service_startup(self):
        with patch.dict(
            os.environ,
            {"AWS_ACCESS_KEY_ID": "", "AWS_SECRET_ACCESS_KEY": "test-secret"},
        ):
            service = RekognitionService()

        self.assertIsNone(service.client)
        with self.assertRaisesRegex(RekognitionServiceError, "AWS_ACCESS_KEY_ID"):
            service.detect_faces(self.image_base64)


if __name__ == "__main__":
    unittest.main()
