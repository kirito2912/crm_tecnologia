# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, status
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session

from app.db.conexion import get_db
from app.schemas.auth import (
    MessageResponse,
    OTPRequest,
    OTPVerifyRequest,
    TokenResponse,
    UserResponse,
)
from app.services.auth_service import request_otp, verify_otp

router = APIRouter(prefix="/login", tags=["Autenticación OTP"])


@router.post("/request-otp", response_model=MessageResponse, status_code=status.HTTP_200_OK)
def request_otp_endpoint(data: OTPRequest, db: Session = Depends(get_db)):
    request_otp(data, db)
    return {"message": "Se envio el codigo OTP al correo indicado."}


@router.post("/verify-otp", response_model=TokenResponse, status_code=status.HTTP_200_OK)
def verify_otp_endpoint(data: OTPVerifyRequest, db: Session = Depends(get_db)):
    access_token, user = verify_otp(data, db)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse.model_validate(user),
    }
