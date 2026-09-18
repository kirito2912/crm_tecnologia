"""
Endpoint para verificación facial con AWS Rekognition
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.rekognition_service import rekognition_service
from datetime import datetime


router = APIRouter()


class FacialLandmark(BaseModel):
    type: str
    x: float
    y: float


class FaceAttributes(BaseModel):
    eyesOpen: float
    mouthOpen: float
    smile: float
    eyeglasses: bool
    sunglasses: bool
    beard: bool
    mustache: bool
    emotions: List[Dict[str, Any]]


class VerificationRequest(BaseModel):
    registrationPhoto: str  # Base64
    verificationPhoto: str  # Base64
    userName: str


class VerificationResponse(BaseModel):
    verified: bool
    similarity: float
    confidence: float
    timestamp: str
    userName: str
    landmarks: Optional[List[FacialLandmark]] = None
    faceAttributes: Optional[FaceAttributes] = None
    error: Optional[str] = None


@router.post("/verify", response_model=VerificationResponse)
async def verify_faces(request: VerificationRequest):
    """
    Verificar dos fotos usando AWS Rekognition
    
    1. Detecta rostro en foto de registro
    2. Detecta rostro en foto de verificación
    3. Compara ambas fotos
    4. Retorna similitud, landmarks y atributos
    """
    try:
        # 1. Detectar rostro en foto de registro
        registration_face = rekognition_service.detect_faces(request.registrationPhoto)
        if not registration_face:
            return VerificationResponse(
                verified=False,
                similarity=0,
                confidence=0,
                timestamp=datetime.utcnow().isoformat(),
                userName=request.userName,
                error="No se detectó rostro en la foto de registro"
            )

        # 2. Detectar rostro en foto de verificación
        verification_face = rekognition_service.detect_faces(request.verificationPhoto)
        if not verification_face:
            return VerificationResponse(
                verified=False,
                similarity=0,
                confidence=0,
                timestamp=datetime.utcnow().isoformat(),
                userName=request.userName,
                error="No se detectó rostro en la foto de verificación"
            )

        # 3. Comparar ambas fotos
        comparison = rekognition_service.compare_faces(
            request.registrationPhoto,
            request.verificationPhoto
        )

        if not comparison:
            return VerificationResponse(
                verified=False,
                similarity=0,
                confidence=0,
                timestamp=datetime.utcnow().isoformat(),
                userName=request.userName,
                error="Error al comparar las fotos"
            )

        # 4. Construir respuesta con datos reales
        # Usar los landmarks de la foto de verificación (la más reciente)
        landmarks = [
            FacialLandmark(**landmark) 
            for landmark in verification_face['landmarks']
        ]

        attributes = FaceAttributes(**verification_face['attributes'])

        return VerificationResponse(
            verified=comparison['matched'],
            similarity=comparison['similarity'],
            confidence=comparison['confidence'],
            timestamp=datetime.utcnow().isoformat(),
            userName=request.userName,
            landmarks=landmarks,
            faceAttributes=attributes
        )

    except Exception as e:
        print(f"Error en verify_faces: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error al procesar la verificación facial: {str(e)}"
        )


@router.post("/detect-face")
async def detect_single_face(image_base64: str):
    """
    Detectar rostro en una sola imagen
    Usado para validar que hay un rostro antes de capturar
    """
    try:
        face_data = rekognition_service.detect_faces(image_base64)
        
        if not face_data:
            return {
                "detected": False,
                "message": "No se detectó ningún rostro en la imagen"
            }

        return {
            "detected": True,
            "confidence": face_data['confidence'],
            "landmarks_count": len(face_data['landmarks'])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al detectar rostro: {str(e)}"
        )
