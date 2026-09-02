# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.models.user import User
from app.models.dataset_ml import DatasetML
from app.models.reporte_comparativo import ReporteComparativo
from app.core.security import hash_password

INITIAL_USUARIOS = [
    {
        "id": "USR-ADMIN",
        "nombre": "Jane Doe",
        "email": "admin@empresa.com",
        "password_hash": hash_password("admin123"),
        "rol": "administrador",
        "empresa": "DataTech Analytics",
        "avatar": "JD",
        "biometric_verified": True,
    },
    {
        "id": "USR-ANALISTA",
        "nombre": "Carlos Mendoza",
        "email": "analista@empresa.com",
        "password_hash": hash_password("analista123"),
        "rol": "analista",
        "empresa": "DataTech Analytics",
        "avatar": "CM",
        "biometric_verified": True,
    },
]

INITIAL_USERS = [
    {
        "email": "admin@empresa.com",
        "full_name": "Jane Doe",
        "password_hash": hash_password("admin123"),
        "role": "administrador",
        "is_active": True,
        "is_verified": True,
    },
    {
        "email": "analista@empresa.com",
        "full_name": "Carlos Mendoza",
        "password_hash": hash_password("analista123"),
        "role": "analista",
        "is_active": True,
        "is_verified": True,
    },
]

INITIAL_DATASETS_ML = [
    {
        "id": "dataset-alfa-q3",
        "nombre": "Empresa Alfa - Ventas y Catálogo Q3 2026",
        "categoria": "Hardware & Servidores",
        "registros_totales": 120,
        "features_count": 6,
        "columna_objetivo": "total_ventas",
        "tamanio_archivo": "1.4 MB",
        "descripcion": "Catálogo comercial y ventas registradas de Empresa Alfa: servidores rack, laptops workstation y switches.",
        "columnas_json": ["Producto", "Categoria", "Cantidad", "Precio_Unitario", "Total_Ventas", "Margen"],
        "muestra_filas_json": [
            {"Producto": "Servidor Dell PowerEdge R740", "Categoria": "Servidores", "Cantidad": "25", "Precio_Unitario": "8450", "Total_Ventas": "211250", "Margen": "32%"},
            {"Producto": "Lenovo ThinkPad P16", "Categoria": "Laptops", "Cantidad": "60", "Precio_Unitario": "2890", "Total_Ventas": "173400", "Margen": "28%"},
            {"Producto": "Dell UltraSharp 32 4K", "Categoria": "Monitores", "Cantidad": "80", "Precio_Unitario": "820", "Total_Ventas": "65600", "Margen": "35%"},
            {"Producto": "Cisco Catalyst 9300 24P", "Categoria": "Redes", "Cantidad": "18", "Precio_Unitario": "4150", "Total_Ventas": "74700", "Margen": "25%"},
        ],
        "creado_por": "Carlos Mendoza (Analista)",
    },
    {
        "id": "dataset-beta-q3",
        "nombre": "Empresa Beta - Ventas y Catálogo Q3 2026",
        "categoria": "Hardware & Servidores",
        "registros_totales": 105,
        "features_count": 6,
        "columna_objetivo": "total_ventas",
        "tamanio_archivo": "1.2 MB",
        "descripcion": "Catálogo comercial y ventas de Empresa Beta competidora en sector corporativo.",
        "columnas_json": ["Producto", "Categoria", "Cantidad", "Precio_Unitario", "Total_Ventas", "Margen"],
        "muestra_filas_json": [
            {"Producto": "Servidor Dell PowerEdge R740", "Categoria": "Servidores", "Cantidad": "18", "Precio_Unitario": "8600", "Total_Ventas": "154800", "Margen": "30%"},
            {"Producto": "Lenovo ThinkPad P16", "Categoria": "Laptops", "Cantidad": "75", "Precio_Unitario": "2750", "Total_Ventas": "206250", "Margen": "24%"},
            {"Producto": "Dell UltraSharp 32 4K", "Categoria": "Monitores", "Cantidad": "65", "Precio_Unitario": "850", "Total_Ventas": "55250", "Margen": "32%"},
            {"Producto": "Cisco Catalyst 9300 24P", "Categoria": "Redes", "Cantidad": "30", "Precio_Unitario": "3890", "Total_Ventas": "116700", "Margen": "22%"},
        ],
        "creado_por": "Carlos Mendoza (Analista)",
    },
]

INITIAL_REPORTES = [
    {
        "id": "REP-2026-001",
        "titulo": "Auditoría Comparativa Q3: Empresa Alfa vs Empresa Beta",
        "analista_id": "USR-ANALISTA",
        "analista_nombre": "Carlos Mendoza",
        "dataset_a_id": "dataset-alfa-q3",
        "dataset_a_nombre": "Empresa Alfa Q3 2026",
        "dataset_b_id": "dataset-beta-q3",
        "dataset_b_nombre": "Empresa Beta Q3 2026",
        "resumen_ejecutivo": "Se realizó una auditoría comparativa de volumen y precios entre Empresa Alfa y Empresa Beta para el tercer trimestre. Empresa Alfa lidera en ingresos de Servidores (+36.4%), pero Empresa Beta tiene una ventaja de volumen (+66.7%) y precio más competitivo en Networking.",
        "hallazgos_clave": "- Brecha de facturación favorable para Alfa en Servidores Rack ($211.2K vs $154.8K).\n- Beta supera a Alfa en venta de Laptops corporativas ($206.2K vs $173.4K) debido a un precio $140 menor por unidad.\n- En switches Cisco, Beta comercializó 30 unidades frente a 18 de Alfa.\n- Margen promedio ponderado: Alfa 30.8% vs Beta 26.5%.",
        "metricas_json": {
            "totalA": 524950,
            "totalB": 533000,
            "deltaPercent": -1.5,
            "topProductA": "Servidor Dell PowerEdge R740",
            "topProductB": "Lenovo ThinkPad P16",
            "qtyA": 183,
            "qtyB": 188
        },
        "recomendaciones": "1. Ajustar levemente el precio de las ThinkPad P16 en Alfa para contrarrestar la oferta de Beta.\n2. Aprovechar el mayor margen en Servidores para ofrecer garantías extendidas sin costo adicional.\n3. Reevaluar estrategia de distribución para switches y equipos de red.",
        "estado": "recibido",
    }
]


def seed_database(db: Session, force_reset: bool = False):
    """Puebla la base de datos con los usuarios analista/admin, datasets y reporte comparativo inicial."""
    if force_reset:
        db.query(ReporteComparativo).delete()
        db.query(DatasetML).delete()
        db.query(Usuario).delete()
        db.query(User).delete()
        db.commit()

    # 1. Usuarios (Usuario)
    for u in INITIAL_USUARIOS:
        existing = db.query(Usuario).filter(Usuario.email == u["email"]).first()
        if not existing:
            db.add(Usuario(**u))
        else:
            existing.rol = u["rol"]
            existing.nombre = u["nombre"]

    # 2. Users (User)
    for usr in INITIAL_USERS:
        existing_u = db.query(User).filter(User.email == usr["email"]).first()
        if not existing_u:
            db.add(User(**usr))
        else:
            existing_u.role = usr["role"]

    # 3. Datasets
    for d in INITIAL_DATASETS_ML:
        existing_d = db.query(DatasetML).filter(DatasetML.id == d["id"]).first()
        if not existing_d:
            db.add(DatasetML(**d))

    # 4. Reportes comparativos
    for r in INITIAL_REPORTES:
        existing_r = db.query(ReporteComparativo).filter(ReporteComparativo.id == r["id"]).first()
        if not existing_r:
            db.add(ReporteComparativo(**r))

    db.commit()
