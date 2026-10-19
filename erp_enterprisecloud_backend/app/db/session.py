"""
Configuración de la sesión de base de datos
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator

from app.core.config import settings


# Crear engine de SQLAlchemy
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_size=10,  # Tamaño del pool de conexiones
    max_overflow=20,  # Conexiones adicionales cuando el pool está lleno
    echo=settings.DEBUG  # Log de SQL queries en modo debug
)

# Crear SessionLocal
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency para obtener una sesión de base de datos
    
    Uso en FastAPI:
        @router.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa la base de datos creando todas las tablas
    """
    # Importar todos los modelos aquí para que SQLAlchemy los registre
    from app.models import usuario, cliente, proveedor, producto
    from app.models import cotizacion, pedido, factura
    from app.models import orden_compra, recepcion
    from app.models import almacen, stock, movimiento_inventario
    from app.models import cuenta_por_cobrar, cuenta_por_pagar
    from app.models import documento_s3
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Base de datos inicializada correctamente")
