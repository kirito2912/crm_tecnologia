"""
Servicio de AWS Rekognition para análisis facial
"""
import boto3
import base64
from io import BytesIO
from PIL import Image
from typing import Optional, Dict, List, Any
import os


class RekognitionService:
    def __init__(self):
        """Inicializar cliente de AWS Rekognition"""
        self.client = boto3.client(
            'rekognition',
            region_name=os.getenv('AWS_DEFAULT_REGION', 'us-east-1'),
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
        )

    def base64_to_bytes(self, base64_string: str) -> bytes:
        """Convertir base64 a bytes"""
        if ',' in base64_string:
            base64_string = base64_string.split(',')[1]
        return base64.b64decode(base64_string)

    def detect_faces(self, image_base64: str) -> Optional[Dict[str, Any]]:
        """
        Detectar rostros en una imagen usando AWS Rekognition
        Retorna landmarks, atributos y calidad del rostro
        """
        try:
            print(f"[Rekognition] Iniciando detección de rostro...")
            print(f"[Rekognition] Longitud de imagen base64: {len(image_base64)} caracteres")
            
            image_bytes = self.base64_to_bytes(image_base64)
            print(f"[Rekognition] Tamaño de imagen en bytes: {len(image_bytes)} bytes")
            
            # Verificar que sea una imagen válida
            try:
                img = Image.open(BytesIO(image_bytes))
                print(f"[Rekognition] Imagen válida: {img.format} {img.size} modo={img.mode}")
            except Exception as img_err:
                print(f"[Rekognition] ❌ Error: No es una imagen válida - {img_err}")
                return None
            
            response = self.client.detect_faces(
                Image={'Bytes': image_bytes},
                Attributes=['ALL']
            )

            print(f"[Rekognition] Rostros detectados: {len(response['FaceDetails'])}")
            
            if not response['FaceDetails']:
                print("[Rekognition] ❌ No se detectaron rostros en la imagen")
                return None

            face = response['FaceDetails'][0]  # Tomar el primer rostro detectado
            print(f"[Rekognition] ✓ Rostro detectado con confianza: {face.get('Confidence', 0)}%")

            # Extraer landmarks
            landmarks = []
            for landmark in face.get('Landmarks', []):
                landmarks.append({
                    'type': landmark['Type'],
                    'x': round(landmark['X'], 3),
                    'y': round(landmark['Y'], 3)
                })

            print(f"[Rekognition] Landmarks extraídos: {len(landmarks)}")

            # Extraer atributos faciales
            attributes = {
                'eyesOpen': face.get('EyesOpen', {}).get('Confidence', 0),
                'mouthOpen': face.get('MouthOpen', {}).get('Confidence', 0),
                'smile': face.get('Smile', {}).get('Confidence', 0),
                'eyeglasses': face.get('Eyeglasses', {}).get('Value', False),
                'sunglasses': face.get('Sunglasses', {}).get('Value', False),
                'beard': face.get('Beard', {}).get('Value', False),
                'mustache': face.get('Mustache', {}).get('Value', False),
                'emotions': []
            }

            # Extraer emociones
            for emotion in face.get('Emotions', []):
                if emotion['Confidence'] > 5:  # Solo emociones con confianza > 5%
                    attributes['emotions'].append({
                        'type': emotion['Type'],
                        'confidence': round(emotion['Confidence'], 1)
                    })

            # Ordenar emociones por confianza
            attributes['emotions'] = sorted(
                attributes['emotions'],
                key=lambda x: x['confidence'],
                reverse=True
            )[:3]  # Top 3 emociones

            return {
                'landmarks': landmarks,
                'attributes': attributes,
                'confidence': round(face.get('Confidence', 0), 1),
                'quality': {
                    'brightness': round(face.get('Quality', {}).get('Brightness', 0), 1),
                    'sharpness': round(face.get('Quality', {}).get('Sharpness', 0), 1)
                }
            }

        except Exception as e:
            print(f"[Rekognition] ❌ Error en detect_faces: {str(e)}")
            import traceback
            print(traceback.format_exc())
            return None

    def compare_faces(self, source_image_base64: str, target_image_base64: str) -> Optional[Dict[str, Any]]:
        """
        Comparar dos rostros y calcular similitud
        """
        try:
            source_bytes = self.base64_to_bytes(source_image_base64)
            target_bytes = self.base64_to_bytes(target_image_base64)

            response = self.client.compare_faces(
                SourceImage={'Bytes': source_bytes},
                TargetImage={'Bytes': target_bytes},
                SimilarityThreshold=0
            )

            if not response['FaceMatches']:
                # No se encontró coincidencia
                return {
                    'similarity': 0,
                    'confidence': 0,
                    'matched': False
                }

            match = response['FaceMatches'][0]
            
            return {
                'similarity': round(match['Similarity'], 1),
                'confidence': round(match['Face']['Confidence'], 1),
                'matched': match['Similarity'] >= 85.0  # Umbral de 85%
            }

        except Exception as e:
            print(f"Error en compare_faces: {str(e)}")
            return None


# Instancia global
rekognition_service = RekognitionService()
