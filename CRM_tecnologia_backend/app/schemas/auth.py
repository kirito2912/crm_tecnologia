# pyrefly: ignore [missing-import]
from pydantic import BaseModel, EmailStr, Field


class OTPRequest(BaseModel):
    email: EmailStr
    full_name: str | None = Field(default=None, max_length=255)
    password: str | None = None
    mode: str | None = None
    company: str | None = None


class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=6, max_length=6)


class MessageResponse(BaseModel):
    message: str


class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str | None = None
    is_active: bool
    is_verified: bool

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
