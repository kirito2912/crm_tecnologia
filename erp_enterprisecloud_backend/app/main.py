"""
ERP EnterpriseCloud - FastAPI Main Application
Sistema Integrado de Gestión Empresarial en AWS
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
import time
from pathlib import Path

from app.core.config import settings
from app.db.session import engine, Base, init_db


# Inicializar base de datos al iniciar la aplicación
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Eventos de lifecycle de la aplicación"""
    # Startup
    print("🚀 Iniciando ERP EnterpriseCloud...")
    print(f"📊 Conectando a base de datos: {settings.DB_HOST}/{settings.DB_NAME}")
    
    # Crear todas las tablas
    try:
        init_db()
        print("✅ Tablas de base de datos verificadas")
    except Exception as e:
        print(f"❌ Error al inicializar base de datos: {e}")
    
    yield
    
    # Shutdown
    print("👋 Apagando ERP EnterpriseCloud...")


# Crear aplicación FastAPI
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sistema Integrado de Gestión Empresarial en AWS (EC2 + RDS + S3)",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción, especificar dominios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Middleware para logging de requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    print(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.2f}s")
    
    return response


# Health Check Endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Endpoint de health check para AWS Load Balancer
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


# Root Endpoint - Servir página HTML de inicio
@app.get("/", response_class=HTMLResponse, tags=["Root"])
async def root():
    """
    Página de inicio del sistema ERP
    """
    html_path = Path(__file__).parent.parent / "public" / "index.html"
    if html_path.exists():
        return FileResponse(html_path)
    
    # Fallback si no existe el archivo HTML
    return {
        "message": "Bienvenido a ERP EnterpriseCloud",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "api": settings.API_V1_PREFIX,
        "stack": {
            "backend": "FastAPI + Python 3.13",
            "database": "SQLite / PostgreSQL",
            "storage": "AWS S3",
            "features": "29 endpoints, 37 tablas, JWT auth"
        }
    }


# Exception Handler Global
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Manejador global de excepciones
    """
    return JSONResponse(
        status_code=500,
        content={
            "message": "Error interno del servidor",
            "detail": str(exc) if settings.DEBUG else "Contacte al administrador"
        }
    )


# Importar y registrar routers
from app.api.v1.router import api_router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
