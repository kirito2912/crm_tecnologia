from fastapi import APIRouter
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.usuarios import router as usuarios_router
from app.api.v1.endpoints.datasets_ml import router as datasets_router
from app.api.v1.endpoints.reportes import router as reportes_router

api_router = APIRouter()

api_router.include_router(auth_router)
api_router.include_router(usuarios_router)
api_router.include_router(datasets_router)
api_router.include_router(reportes_router)
