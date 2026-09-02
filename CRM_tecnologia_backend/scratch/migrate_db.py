import sys
import sqlite3
from pathlib import Path

db_path = Path(__file__).resolve().parent.parent / "crm.db"
print(f"Verificando estructura de: {db_path}")

conn = sqlite3.connect(str(db_path))
cursor = conn.cursor()

# Verificar columnas de tabla users
cursor.execute("PRAGMA table_info(users)")
columns = [col[1] for col in cursor.fetchall()]
print(f"Columnas en tabla users: {columns}")

if "password_hash" not in columns:
    print("Agregando columna 'password_hash' a tabla users...")
    cursor.execute("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255)")
    conn.commit()
    print("Columna 'password_hash' agregada exitosamente!")
else:
    print("La columna 'password_hash' ya existe en users.")

# Verificar columnas de tabla usuarios
cursor.execute("PRAGMA table_info(usuarios)")
cols_usuarios = [col[1] for col in cursor.fetchall()]
print(f"Columnas en tabla usuarios: {cols_usuarios}")

conn.close()
print("Migracion completada con exito.")
