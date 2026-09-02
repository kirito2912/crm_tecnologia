import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# pyrefly: ignore [missing-import]
from fastapi.testclient import TestClient
# pyrefly: ignore [missing-import]
from sqlalchemy import create_engine
# pyrefly: ignore [missing-import]
from sqlalchemy.orm import sessionmaker
# pyrefly: ignore [missing-import]
from sqlalchemy.pool import StaticPool

from app.db.conexion import Base, get_db
import app.models
from app.main import app
from app.db.seed_data import seed_database

# Create testing engine (SQLite in-memory with foreign keys enabled)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

def run_tests():
    print("=== 1. Probando inicialización de BD y seed_data ===")
    db = TestingSessionLocal()
    seed_database(db, force_reset=True)
    
    # Verificar tablas creadas
    tables = list(Base.metadata.tables.keys())
    print(f"Tablas registradas ({len(tables)}): {sorted(tables)}")
    assert len(tables) == 10, f"Se esperaban 10 tablas, se encontraron {len(tables)}"

    print("\n=== 2. Probando Endpoints de Categorías y Productos ===")
    # Listar categorías
    res_cat = client.get("/api/v1/categorias-hardware/")
    assert res_cat.status_code == 200, res_cat.text
    cats = res_cat.json()
    print(f"Categorías cargadas: {len(cats)}")
    cat_id = cats[0]["id"]

    # Crear producto con categoria_id
    res_prod = client.post("/api/v1/productos/", json={
        "codigo": "TEST-PROD-01",
        "nombre": "Servidor Test Enterprise 1U",
        "categoria": "Servidores Rack",
        "categoria_id": cat_id,
        "stock": 10,
        "stock_minimo": 5,
        "precio_unitario": 5000.00
    })
    assert res_prod.status_code == 201, res_prod.text
    prod = res_prod.json()
    print(f"Producto creado: {prod['id']} - Categoria ID: {prod['categoria_id']} - Estado: {prod['estado']}")
    assert prod["categoria_id"] == cat_id
    assert prod["estado"] == "Disponible"

    print("\n=== 3. Probando Endpoints de Clientes y Ventas ===")
    # Listar clientes
    res_cli = client.get("/api/v1/clientes/")
    assert res_cli.status_code == 200, res_cli.text
    clientes = res_cli.json()
    cliente_id = clientes[0]["id"]
    print(f"Cliente seleccionado: {cliente_id} ({clientes[0]['empresa']})")

    # Crear venta con FKs explícitas
    res_venta = client.post("/api/v1/ventas/", json={
        "cliente_id": cliente_id,
        "cliente_nombre": clientes[0]["empresa"],
        "producto_id": prod["id"],
        "producto_nombre": prod["nombre"],
        "cantidad": 2,
        "monto_total": 10000.00,
        "estado": "Completada"
    })
    assert res_venta.status_code == 201, res_venta.text
    venta = res_venta.json()
    print(f"Venta creada: {venta['id']} - Cliente FK: {venta['cliente_id']} - Producto FK: {venta['producto_id']}")
    assert venta["cliente_id"] == cliente_id
    assert venta["producto_id"] == prod["id"]

    # Verificar reducción de stock
    res_prod_after = client.get(f"/api/v1/productos/{prod['id']}")
    assert res_prod_after.status_code == 200
    prod_after = res_prod_after.json()
    print(f"Stock después de venta: {prod_after['stock']} (esperado 8)")
    assert prod_after["stock"] == 8

    print("\n=== 4. Probando Autenticación por Código TP / OTP ===")
    # 1. Login exitoso con código TP por defecto ('123456')
    res_tp = client.post("/api/v1/auth/login-tp", json={
        "email": "carlos.m@hardcrm.tech",
        "codigo_tp": "123456"
    })
    assert res_tp.status_code == 200, res_tp.text
    tp_data = res_tp.json()
    print(f"Login TP exitoso: {tp_data['message']} (Token: {tp_data['token']})")
    assert tp_data["user"]["codigo_tp"] == "123456"
    assert tp_data["user"]["tp_enabled"] is True

    # 2. Login fallido con código TP incorrecto
    res_tp_fail = client.post("/api/v1/auth/login-tp", json={
        "email": "carlos.m@hardcrm.tech",
        "codigo_tp": "999999"
    })
    assert res_tp_fail.status_code == 401, f"Se esperaba 401 pero se obtuvo {res_tp_fail.status_code}"
    print(f"Login TP fallido verificado (401 esperado): {res_tp_fail.json()['detail']}")

    # 3. Generar nuevo código TP dinámico
    res_gen = client.post("/api/v1/auth/generate-tp", json={
        "email": "carlos.m@hardcrm.tech"
    })
    assert res_gen.status_code == 200, res_gen.text
    gen_data = res_gen.json()
    nuevo_tp = gen_data["codigo_tp"]
    print(f"Código TP dinámico generado: {nuevo_tp} para {gen_data['email']}")
    assert len(nuevo_tp) == 6

    # 4. Login exitoso con el nuevo código generado dinámicamente
    res_tp_nuevo = client.post("/api/v1/auth/login-tp", json={
        "email": "carlos.m@hardcrm.tech",
        "codigo_tp": nuevo_tp
    })
    assert res_tp_nuevo.status_code == 200, res_tp_nuevo.text
    print(f"Login TP con nuevo código dinámico exitoso: {res_tp_nuevo.json()['message']}")

    # 5. Login estándar con código TP opcional
    res_std_tp = client.post("/api/v1/auth/login", json={
        "email": "carlos.m@hardcrm.tech",
        "codigo_tp": nuevo_tp
    })
    assert res_std_tp.status_code == 200, res_std_tp.text
    print("Login estándar con validación de código TP exitoso")


    print("\n=== 5. Probando Predicción ML y Persistencia de SHAP y Recomendaciones ===")
    res_pred = client.post("/api/v1/datasets-ml/dataset-demand/predict", json={
        "task": "demand_forecast",
        "dataset_id": "dataset-demand",
        "horizon_months": 6,
        "confidence_level": 0.95
    })
    assert res_pred.status_code == 200, res_pred.text
    pred_res = res_pred.json()
    print(f"Predicción ejecutada con métricas: {pred_res['metrics']['algorithm']} (R2: {pred_res['metrics']['r2_score']})")

    # Verificar historial de predicciones endpoint
    res_hist = client.get("/api/v1/datasets-ml/predictions/history?dataset_id=dataset-demand")
    assert res_hist.status_code == 200, res_hist.text
    hist = res_hist.json()
    print(f"Predicciones guardadas en historial: {len(hist)}")
    assert len(hist) >= 1
    assert len(hist[0]["factores_shap"]) >= 1
    assert len(hist[0]["recomendaciones"]) >= 1
    print(f"Factores SHAP persistidos: {len(hist[0]['factores_shap'])}")
    print(f"Recomendaciones persistidas: {len(hist[0]['recomendaciones'])}")

    print("\n=== 6. Probando Dashboard Overview ===")
    res_dash = client.get("/api/v1/dashboard/overview")
    assert res_dash.status_code == 200, res_dash.text
    dash = res_dash.json()
    print(f"Dashboard cargado: Total clientes={dash['total_clients']}, Total productos={dash['total_products']}, Total ventas={dash['total_sales']}")

    db.close()
    print("\n==============================================")
    print(" >>> TODAS LAS PRUEBAS PASARON EXITOSAMENTE <<< ")
    print("==============================================")

if __name__ == "__main__":
    run_tests()
