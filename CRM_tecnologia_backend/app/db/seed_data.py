# pyrefly: ignore [missing-import]
from sqlalchemy.orm import Session
from app.models.usuario import Usuario
from app.models.user import User
from app.models.dataset_ml import DatasetML
from app.models.reporte_comparativo import ReporteComparativo
from app.models.documento import Documento
from app.core.security import hash_password

INITIAL_USUARIOS = [
    {
        "id": "USR-ADMIN",
        "nombre": "Eduardo Caballero",
        "email": "eduardocaballero392@gmail.com",
        "password_hash": hash_password("4n6yFksPaxQwzNMI"),
        "rol": "administrador",
        "empresa": "DataTech Analytics",
        "avatar": "EC",
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
        "email": "eduardocaballero392@gmail.com",
        "full_name": "Eduardo Caballero",
        "password_hash": hash_password("4n6yFksPaxQwzNMI"),
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


INITIAL_DOCUMENTOS = [
    {
        "id": "DOC-2026-001",
        "nombre": "Contrato Marco de Suministro Tecnológico 2026 - Alfa Corp.pdf",
        "tipo": "pdf",
        "tamanio": "2.84 MB",
        "tamanio_bytes": 2977955,
        "categoria": "Contratos",
        "descripcion": "Acuerdo legal de provisión mayorista de hardware Dell PowerEdge y switches Cisco con condiciones de pago a 60 días.",
        "subido_por": "Eduardo Caballero",
        "usuario_id": "USR-ADMIN",
        "usuario_rol": "administrador",
        "tags_json": ["contrato", "legal", "alfa corp", "hardware"],
    },
    {
        "id": "DOC-2026-002",
        "nombre": "Especificaciones Técnicas y SLA de Servidores Enterprise.docx",
        "tipo": "docx",
        "tamanio": "1.45 MB",
        "tamanio_bytes": 1520435,
        "categoria": "Especificaciones Técnicas",
        "descripcion": "Requisitos de arquitectura, memoria ECC, redundancia de fuentes y soporte 24/7 para despliegue de infraestructura.",
        "subido_por": "Carlos Mendoza",
        "usuario_id": "USR-ANALISTA",
        "usuario_rol": "analista",
        "tags_json": ["hardware", "sla", "servidores", "datacenter"],
    },
    {
        "id": "DOC-2026-003",
        "nombre": "Informe Ejecutivo de Auditoría y Precios Competitivos Q3.pdf",
        "tipo": "pdf",
        "tamanio": "3.12 MB",
        "tamanio_bytes": 3271557,
        "categoria": "Reportes Ejecutivos",
        "descripcion": "Dossier con gráficos de dispersión de precios de mercado, márgenes brutos por línea de producto y comparativa con competidores.",
        "subido_por": "Carlos Mendoza",
        "usuario_id": "USR-ANALISTA",
        "usuario_rol": "analista",
        "tags_json": ["auditoria", "q3", "precios", "competencia"],
    },
    {
        "id": "DOC-2026-004",
        "nombre": "Propuesta Comercial y Cotización Licitación Hardware.docx",
        "tipo": "docx",
        "tamanio": "980 KB",
        "tamanio_bytes": 1003520,
        "categoria": "Propuestas Comerciales",
        "descripcion": "Pliego de cotización para licitación pública corporativa de 80 Workstations Lenovo ThinkPad y 20 Monitores 4K.",
        "subido_por": "Eduardo Caballero",
        "usuario_id": "USR-ADMIN",
        "usuario_rol": "administrador",
        "tags_json": ["licitacion", "propuesta", "ventas", "b2b"],
    },
]

INITIAL_INVITACIONES = [
    {
        "id": "INV-DEV01",
        "email": "dev.frontend@empresa.com",
        "nombre_referencial": "Lucía Ramos",
        "rol_asignado": "programador",
        "token": "inv_tok_lucia_ramosp982",
        "estado": "pendiente",
        "creado_por": "Jane Doe (Administrador)",
    },
    {
        "id": "INV-AUD02",
        "email": "auditor.it@empresa.com",
        "nombre_referencial": "Roberto Silva",
        "rol_asignado": "auditor",
        "token": "inv_tok_roberto_silva841",
        "estado": "pendiente",
        "creado_por": "Jane Doe (Administrador)",
    },
]


def seed_database(db: Session, force_reset: bool = False):
    """Puebla la base de datos con los usuarios, datasets, reportes, documentos e invitaciones iniciales."""
    from app.models.invitacion import Invitacion

    if force_reset:
        db.query(Invitacion).delete()
        db.query(Documento).delete()
        db.query(ReporteComparativo).delete()
        db.query(DatasetML).delete()
        db.query(Usuario).delete()
        db.query(User).delete()
        db.commit()

    # 1. Usuarios (Usuario) — upsert por id
    for u in INITIAL_USUARIOS:
        existing = db.query(Usuario).filter(Usuario.id == u["id"]).first()
        if not existing:
            # Verificar también que el email no esté tomado por otro registro
            email_taken = db.query(Usuario).filter(Usuario.email == u["email"]).first()
            if not email_taken:
                db.add(Usuario(
                    **u,
                    habilitado=True,
                    estado="activo",
                    invitado_por="Sistema Principal",
                ))
        else:
            # Actualizar datos del existente
            existing.email = u["email"]
            existing.nombre = u["nombre"]
            existing.rol = u["rol"]
            existing.password_hash = u["password_hash"]
            existing.avatar = u.get("avatar", existing.avatar)
            existing.habilitado = True
            existing.estado = "activo"

    # 2. Users (User) — upsert por email
    for usr in INITIAL_USERS:
        existing_u = db.query(User).filter(User.email == usr["email"]).first()
        if not existing_u:
            db.add(User(**usr))
        else:
            existing_u.role = usr["role"]
            existing_u.full_name = usr["full_name"]
            existing_u.password_hash = usr["password_hash"]

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

    # 5. Documentos compartidos
    for doc in INITIAL_DOCUMENTOS:
        existing_doc = db.query(Documento).filter(Documento.id == doc["id"]).first()
        if not existing_doc:
            db.add(Documento(**doc))

    # 6. Invitaciones iniciales
    for inv in INITIAL_INVITACIONES:
        existing_inv = db.query(Invitacion).filter(Invitacion.id == inv["id"]).first()
        if not existing_inv:
            db.add(Invitacion(**inv))

    db.commit()


