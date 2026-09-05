from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.db.conexion import engine, Base, SessionLocal, get_db
from app.db.seed_data import seed_database
import app.models  # Carga todos los modelos SQLAlchemy para que Base.metadata los reconozca
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ciclo de vida de la aplicación: crea tablas y puebla datos iniciales si no existen."""
    # 1. Crear tablas si no existen
    Base.metadata.create_all(bind=engine)

    # 2. Migración segura de columnas (solo aplica a SQLite)
    if engine.dialect.name == "sqlite":
        try:
            with engine.connect() as conn:
                res_u = conn.execute(text("PRAGMA table_info(users);")).fetchall()
                cols_u = [row[1] for row in res_u]
                if "password_hash" not in cols_u:
                    conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);"))
                if "role" not in cols_u:
                    conn.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'analista';"))

                res_usr = conn.execute(text("PRAGMA table_info(usuarios);")).fetchall()
                cols_usr = [row[1] for row in res_usr]
                if "habilitado" not in cols_usr:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN habilitado BOOLEAN DEFAULT 1;"))
                if "estado" not in cols_usr:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN estado VARCHAR(50) DEFAULT 'activo';"))
                if "invitado_por" not in cols_usr:
                    conn.execute(text("ALTER TABLE usuarios ADD COLUMN invitado_por VARCHAR(150);"))
                conn.commit()
        except Exception as mig_err:
            print(f"[Aviso Migración SQLite] {mig_err}")


    # 3. Sembrar datos iniciales si la base está vacía o actualizar roles
    db = SessionLocal()
    try:
        seed_database(db, force_reset=False)
    finally:
        db.close()

    yield


app = FastAPI(
    title="DataTech Analytics - Comparativas de Empresas API",
    description="API RESTful para gestión de Datasets, Comparativas de Empresas y Reportes entre Analistas y Administradores.",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configuración de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusión del Router API v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/", tags=["General"])
def read_root():
    return {
        "app": "DataTech Analytics - Comparativas de Empresas API",
        "status": "online",
        "version": "2.0.0",
        "docs": "/docs",
        "api_v1": "/api/v1",
    }


@app.get("/test-db", tags=["General"])
def test_database_connection(db: Session = Depends(get_db)):
    """Endpoint para verificar la conexión y estado con la base de datos."""
    try:
        if engine.dialect.name == "sqlite":
            result = db.execute(text("SELECT sqlite_version();")).fetchone()
            return {
                "status": "Conexión exitosa a la base de datos local SQLite",
                "database_version": f"SQLite {result[0]}",
                "motor": "sqlite",
            }
        else:
            result = db.execute(text("SELECT version();")).fetchone()
            return {
                "status": "Conexión exitosa a la base de datos PostgreSQL",
                "database_version": result[0],
                "motor": "postgresql",
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error de conexión: {str(e)}")