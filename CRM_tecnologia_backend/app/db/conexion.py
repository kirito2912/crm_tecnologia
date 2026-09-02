import os
import urllib.parse
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine, text
# pyrefly: ignore [missing-import]
from sqlalchemy.engine import URL
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

DATABASE_URL_ENV = os.getenv("DATABASE_URL")

connect_args = {}

if DATABASE_URL_ENV:
    db_url = DATABASE_URL_ENV
    if db_url.startswith("sqlite"):
        connect_args = {"check_same_thread": False}
    elif any(host_key in db_url for host_key in ["supabase.co", "neon.tech", "render.com"]):
        connect_args = {"sslmode": "require", "connect_timeout": 5}
else:
    DB_USER = os.getenv("DB_USER", "postgres")
    DB_PASSWORD = os.getenv("DB_PASSWORD", "crm89SeM#12")
    DB_HOST = os.getenv("DB_HOST", "db.ctvzryjpycworkkaarkx.supabase.co")
    DB_PORT = int(os.getenv("DB_PORT", "5432"))
    DB_NAME = os.getenv("DB_NAME", "postgres")

    db_url = URL.create(
        drivername="postgresql+psycopg2",
        username=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )
    if any(host_key in DB_HOST for host_key in ["supabase.co", "neon.tech", "render.com"]):
        connect_args = {"sslmode": "require", "connect_timeout": 5}


def create_db_engine():
    """Intenta inicializar el engine con la URL configurada y recurre a SQLite si falla la conexión."""
    is_sqlite = str(db_url).startswith("sqlite")
    try:
        eng = create_engine(
            db_url,
            connect_args=connect_args,
            pool_pre_ping=True,
            pool_recycle=3600 if not is_sqlite else None,
        )
        # Probar conexión rápidamente
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        return eng
    except Exception as exc:
        print(f"\n[Aviso Base de Datos] No se pudo conectar a la base de datos principal ({exc}).")
        print("[Aviso Base de Datos] Utilizando base de datos local SQLite (crm.db) para continuar sin interrupciones.\n")
        fallback_url = "sqlite:///./crm.db"
        return create_engine(
            fallback_url,
            connect_args={"check_same_thread": False},
        )


engine = create_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """Generador de sesiones de base de datos para FastAPI."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

