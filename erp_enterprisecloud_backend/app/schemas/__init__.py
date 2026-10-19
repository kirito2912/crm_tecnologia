"""
Schemas Pydantic para validación de datos
"""
from app.schemas.auth import LoginRequest, RegisterRequest, TokenResponse, UserResponse
from app.schemas.usuario import UsuarioCreate, UsuarioUpdate, UsuarioResponse, UsuarioList
from app.schemas.cliente import ClienteCreate, ClienteUpdate, ClienteResponse, ClienteList
from app.schemas.producto import ProductoCreate, ProductoUpdate, ProductoResponse, ProductoList

__all__ = [
    # Auth
    "LoginRequest", "RegisterRequest", "TokenResponse", "UserResponse",
    # Usuario
    "UsuarioCreate", "UsuarioUpdate", "UsuarioResponse", "UsuarioList",
    # Cliente
    "ClienteCreate", "ClienteUpdate", "ClienteResponse", "ClienteList",
    # Producto
    "ProductoCreate", "ProductoUpdate", "ProductoResponse", "ProductoList",
]
