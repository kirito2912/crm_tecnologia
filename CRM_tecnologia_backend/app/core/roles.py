"""Canonical roles; legacy profiles retain collaborator access."""
from typing import Annotated, Literal
from pydantic import BeforeValidator


def normalize_role(value: object) -> str:
    role = str(value or "").strip().lower()
    return "administrador" if role in {"admin", "administrador"} else "colaborador"


Role = Annotated[Literal["administrador", "colaborador"], BeforeValidator(normalize_role)]


def database_role(value: object) -> str:
    """Map the UI collaborator label to the existing database role."""
    return "administrador" if normalize_role(value) == "administrador" else "analista"
