from pathlib import Path
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv(Path(__file__).resolve().parent.parent / ".env")
from app.core.config import settings

engine = create_engine(settings.database_url)
with engine.connect() as conn:
    cols = [
        r[0]
        for r in conn.execute(
            text(
                "SELECT column_name FROM information_schema.columns "
                "WHERE table_name = 'usuarios' ORDER BY ordinal_position"
            )
        ).fetchall()
    ]
    print("cols:", cols)
    if "permisos_proyectos" not in cols:
        conn.execute(text("ALTER TABLE usuarios ADD COLUMN permisos_proyectos VARCHAR(500)"))
        conn.commit()
        print("ADDED permisos_proyectos")
    else:
        print("already exists")
