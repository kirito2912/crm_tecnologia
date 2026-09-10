from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SolicitudCreate(BaseModel):
    nombre: str = Field(min_length=2, max_length=150)
    email: EmailStr = Field(max_length=150)
    empresa: str = Field(default="", max_length=150)
    motivo: str = Field(min_length=5, max_length=1000)

    @field_validator("nombre", "empresa", "motivo", mode="before")
    @classmethod
    def trim_fields(cls, value):
        return value.strip() if isinstance(value, str) else value


class SolicitudResponse(BaseModel):
    id: str
    email: str
    nombre: str
    empresa: str | None
    motivo: str
    estado: str
    created_at: datetime
    resuelta_at: datetime | None
    resuelta_por: str | None
    invitacion_id: str | None
    correo_enviado: bool | None
    model_config = ConfigDict(from_attributes=True)


class SolicitudDecision(BaseModel):
    decision: Literal["aprobar", "rechazar"]
    rol: Literal["administrador", "colaborador"] = "colaborador"
