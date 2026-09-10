"""Canonical roles; legacy profiles retain collaborator access."""
from typing import Annotated, Literal
from pydantic import BeforeValidator


def normalize_role(value: object) -> str:
    role = str(value or "").strip().lower()
    return "administrador" if role in {"admin", "administrador"} else "colaborador"


Role = Annotated[Literal["administrador", "colaborador"], BeforeValidator(normalize_role)]
