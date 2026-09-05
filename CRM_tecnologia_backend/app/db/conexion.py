import os
from pathlib import Path

from dotenv import load_dotenv

# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text

# pyrefly: ignore [missing-import]
from sqlalchemy.engine import URL

# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker

# Cargar .env desde la raíz del backend (un nivel arriba de /app)
_BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(_BASE_DIR / ".env")
load_dotenv()  # fallback por si se ejecuta desde otro directorio

# ---------------------------------------------------------------
# Construir la URL de conexión
# ---------------------------------------------------------------
_DATABASE_URL_ENV = os.getenv("DATABASE_URL")

_SUPABASE_HOSTS = ("supabase.co", "supabase.com", "neon.tech", "render.com")

connect_args: dict = {}

if _DATABASE_URL_ENV:
    db_url: str | URL = _DATABASE_URL_ENV
    if str(db_url).startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    elif any(h in str(db_url) for h in _SUPABASE_HOSTS):
        connect_args = {"sslmode": "require", "connect_timeout": 10}
else:
    # Variables separadas como alternativa
    _DB_USER     = os.getenv("DB_USER",     "postgres")
    _DB_PASSWORD = os.getenv("DB_PASSWORD", "")
    _DB_HOST     = os.getenv("DB_HOST",     "localhost")
    _DB_PORT     = int(os.getenv("DB_PORT", "5432"))
    _DB_NAME     = os.getenv("DB_NAME",     "postgres")

    db_url = URL.create(
        drivername="postgresql+psycopg2",
        username=_DB_USER,
        password=_DB_PASSWORD,
        host=_DB_HOST,
        port=_DB_PORT,
        database=_DB_NAME,
    )
    if any(h in _DB_HOST for h in _SUPABASE_HOSTS):
        connect_args = {"sslmode": "require", "connect_timeout": 10}


# ---------------------------------------------------------------
# Crear el engine con fallback automático a SQLite
# ---------------------------------------------------------------
def create_db_engine():
    """
    Intenta conectar a la base de datos configurada (Supabase/PostgreSQL).
    Si la conexión falla, cae automáticamente a SQLite local para que el
    servidor pueda arrancar sin interrupciones durante desarrollo.
    """
    is_sqlite = str(db_url).startswith("sqlite")

    # Pool args solo aplican a PostgreSQL
    pool_kwargs: dict = {}
    if not is_sqlite:
        pool_kwargs = {
            "pool_pre_ping": True,    # verifica conexión antes de usarla
            "pool_recycle": 1800,     # recicla conexiones cada 30 min (evita timeouts de Supabase)
            "pool_size": 5,
            "max_overflow": 10,
        }

    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            **pool_kwargs,
        )
        # Prueba real de conexión
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))

        host_label = str(db_url).split("@")[-1].split("/")[0] if "@" in str(db_url) else str(db_url)
        print(f"\n[Base de Datos] ✓ Conectado correctamente a: {host_label}\n")
        return eng

    except Exception as exc:
        print(f"\n[Base de Datos] ✗ No se pudo conectar a la base de datos principal.")
        print(f"[Base de Datos]   Motivo: {exc}")
        print(f"[Base de Datos]   Usando SQLite local (crm.db) como fallback.\n")
        return create_engine(
            "sqlite:///./crm.db",
            connect_args={"check_same_thread": False},
        )


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Generador de sesiones de base de datos para FastAPI (dependency injection)."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
