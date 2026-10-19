"""
Router Principal API v1
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, usuarios, clientes, productos, documentos, dashboard


# Router principal v1
api_router = APIRouter()

# Incluir todos los routers de endpoints
api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(usuarios.router, prefix="/usuarios", tags=["Usuarios"])
api_router.include_router(clientes.router, prefix="/clientes", tags=["Clientes"])
api_router.include_router(productos.router, prefix="/productos", tags=["Productos"])
api_router.include_router(documentos.router, prefix="/documentos", tags=["Documentos"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
