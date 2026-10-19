"""
Script para poblar la base de datos con datos iniciales
"""
import sys
from pathlib import Path

# Agregar el directorio raíz al path
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.db.session import SessionLocal, init_db
from app.models.usuario import Usuario, Rol, Permiso, UsuarioRol, RolPermiso
from app.models.producto import CategoriaProducto, UnidadMedida
from app.models.almacen import Almacen
from app.models.documento_s3 import CategoriaDocumento
from app.models.empresa import Empresa
from app.models.parametro_sistema import ParametroSistema, Secuencia
from app.core.security import hash_password
from app.core.config import settings


def crear_roles(db: Session):
    """Crear roles del sistema"""
    print("📋 Creando roles...")
    
    roles_data = [
        {
            "nombre": "Administrador",
            "descripcion": "Acceso total al sistema",
            "es_sistema": True
        },
        {
            "nombre": "Gerente",
            "descripcion": "Acceso a reportes y aprobaciones",
            "es_sistema": True
        },
        {
            "nombre": "Vendedor",
            "descripcion": "Gestión de ventas y clientes",
            "es_sistema": True
        },
        {
            "nombre": "Almacenero",
            "descripcion": "Gestión de inventario y almacén",
            "es_sistema": True
        },
        {
            "nombre": "Contador",
            "descripcion": "Gestión financiera y contable",
            "es_sistema": True
        },
        {
            "nombre": "Comprador",
            "descripcion": "Gestión de compras y proveedores",
            "es_sistema": True
        }
    ]
    
    for rol_data in roles_data:
        existing = db.query(Rol).filter(Rol.nombre == rol_data["nombre"]).first()
        if not existing:
            rol = Rol(**rol_data)
            db.add(rol)
    
    db.commit()
    print(f"✅ {len(roles_data)} roles creados")


def crear_permisos(db: Session):
    """Crear permisos del sistema"""
    print("🔐 Creando permisos...")
    
    modulos = [
        "dashboard", "usuarios", "clientes", "proveedores", "productos",
        "ventas", "compras", "inventario", "finanzas", "documentos", 
        "reportes", "configuracion"
    ]
    
    acciones = ["ver", "crear", "editar", "eliminar"]
    
    permisos_creados = 0
    for modulo in modulos:
        for accion in acciones:
            codigo = f"{modulo}.{accion}"
            existing = db.query(Permiso).filter(Permiso.codigo == codigo).first()
            if not existing:
                permiso = Permiso(
                    modulo=modulo,
                    accion=accion,
                    codigo=codigo,
                    descripcion=f"{accion.capitalize()} en {modulo}",
                    es_sistema=True
                )
                db.add(permiso)
                permisos_creados += 1
    
    db.commit()
    print(f"✅ {permisos_creados} permisos creados")


def asignar_permisos_admin(db: Session):
    """Asignar todos los permisos al rol Administrador"""
    print("👑 Asignando permisos a Administrador...")
    
    rol_admin = db.query(Rol).filter(Rol.nombre == "Administrador").first()
    if not rol_admin:
        print("❌ Rol Administrador no encontrado")
        return
    
    permisos = db.query(Permiso).all()
    permisos_asignados = 0
    
    for permiso in permisos:
        existing = db.query(RolPermiso).filter(
            RolPermiso.rol_id == rol_admin.id,
            RolPermiso.permiso_id == permiso.id
        ).first()
        
        if not existing:
            rol_permiso = RolPermiso(
                rol_id=rol_admin.id,
                permiso_id=permiso.id
            )
            db.add(rol_permiso)
            permisos_asignados += 1
    
    db.commit()
    print(f"✅ {permisos_asignados} permisos asignados a Administrador")


def crear_usuario_admin(db: Session):
    """Crear usuario administrador por defecto"""
    print("👤 Creando usuario administrador...")
    
    email_admin = "admin@empresa.com"
    existing = db.query(Usuario).filter(Usuario.email == email_admin).first()
    
    if existing:
        print(f"⚠️  Usuario administrador ya existe: {email_admin}")
        return existing
    
    # Crear usuario
    admin = Usuario(
        usuario_codigo="USR-000001",
        nombre_completo="Administrador del Sistema",
        email=email_admin,
        password_hash=hash_password("Admin123!"),
        telefono="987654321",
        estado="activo"
    )
    
    db.add(admin)
    db.flush()
    
    # Asignar rol Administrador
    rol_admin = db.query(Rol).filter(Rol.nombre == "Administrador").first()
    if rol_admin:
        usuario_rol = UsuarioRol(
            usuario_id=admin.id,
            rol_id=rol_admin.id
        )
        db.add(usuario_rol)
    
    db.commit()
    db.refresh(admin)
    
    print(f"✅ Usuario administrador creado:")
    print(f"   Email: {email_admin}")
    print(f"   Password: Admin123!")
    
    return admin


def crear_categorias_producto(db: Session):
    """Crear categorías de productos"""
    print("📦 Creando categorías de productos...")
    
    categorias = [
        {"nombre": "Computadoras", "descripcion": "Equipos de cómputo"},
        {"nombre": "Accesorios", "descripcion": "Accesorios tecnológicos"},
        {"nombre": "Software", "descripcion": "Licencias de software"},
        {"nombre": "Periféricos", "descripcion": "Teclados, mouse, monitores"},
        {"nombre": "Redes", "descripcion": "Equipos de red y conectividad"},
        {"nombre": "Servicios", "descripcion": "Servicios profesionales"}
    ]
    
    for cat_data in categorias:
        existing = db.query(CategoriaProducto).filter(
            CategoriaProducto.nombre == cat_data["nombre"]
        ).first()
        if not existing:
            categoria = CategoriaProducto(**cat_data)
            db.add(categoria)
    
    db.commit()
    print(f"✅ {len(categorias)} categorías creadas")


def crear_unidades_medida(db: Session):
    """Crear unidades de medida"""
    print("📏 Creando unidades de medida...")
    
    unidades = [
        {"codigo": "UND", "nombre": "Unidad", "simbolo": "ud"},
        {"codigo": "KG", "nombre": "Kilogramo", "simbolo": "kg"},
        {"codigo": "LT", "nombre": "Litro", "simbolo": "lt"},
        {"codigo": "M", "nombre": "Metro", "simbolo": "m"},
        {"codigo": "M2", "nombre": "Metro Cuadrado", "simbolo": "m²"},
        {"codigo": "M3", "nombre": "Metro Cúbico", "simbolo": "m³"},
        {"codigo": "PAR", "nombre": "Par", "simbolo": "par"},
        {"codigo": "DOC", "nombre": "Docena", "simbolo": "doc"},
        {"codigo": "CJA", "nombre": "Caja", "simbolo": "cja"},
        {"codigo": "PKT", "nombre": "Paquete", "simbolo": "pkt"}
    ]
    
    for unidad_data in unidades:
        existing = db.query(UnidadMedida).filter(
            UnidadMedida.codigo == unidad_data["codigo"]
        ).first()
        if not existing:
            unidad = UnidadMedida(**unidad_data)
            db.add(unidad)
    
    db.commit()
    print(f"✅ {len(unidades)} unidades de medida creadas")


def crear_almacen_principal(db: Session):
    """Crear almacén principal"""
    print("🏭 Creando almacén principal...")
    
    existing = db.query(Almacen).filter(Almacen.almacen_codigo == "ALM-001").first()
    if not existing:
        almacen = Almacen(
            almacen_codigo="ALM-001",
            nombre="Almacén Principal",
            descripcion="Almacén central de la empresa",
            direccion="Av. Principal 123",
            responsable="Administrador",
            es_principal=True,
            estado="activo"
        )
        db.add(almacen)
        db.commit()
        print("✅ Almacén principal creado")
    else:
        print("⚠️  Almacén principal ya existe")


def crear_categorias_documento(db: Session):
    """Crear categorías de documentos"""
    print("📄 Creando categorías de documentos...")
    
    categorias = [
        {"nombre": "Facturas", "descripcion": "Comprobantes de venta"},
        {"nombre": "Contratos", "descripcion": "Contratos comerciales"},
        {"nombre": "Órdenes de Compra", "descripcion": "Órdenes a proveedores"},
        {"nombre": "Guías de Remisión", "descripcion": "Guías de despacho"},
        {"nombre": "Reportes", "descripcion": "Reportes del sistema"},
        {"nombre": "Otros", "descripcion": "Documentos varios"}
    ]
    
    for cat_data in categorias:
        existing = db.query(CategoriaDocumento).filter(
            CategoriaDocumento.nombre == cat_data["nombre"]
        ).first()
        if not existing:
            categoria = CategoriaDocumento(**cat_data)
            db.add(categoria)
    
    db.commit()
    print(f"✅ {len(categorias)} categorías de documentos creadas")


def crear_empresa(db: Session):
    """Crear datos de la empresa"""
    print("🏢 Creando datos de la empresa...")
    
    existing = db.query(Empresa).first()
    if not existing:
        empresa = Empresa(
            ruc=settings.EMPRESA_RUC,
            razon_social=settings.EMPRESA_RAZON_SOCIAL,
            nombre_comercial=settings.EMPRESA_NOMBRE_COMERCIAL,
            direccion="Av. Tecnología 456, Lima",
            distrito="San Isidro",
            provincia="Lima",
            departamento="Lima",
            telefono="01-1234567",
            email="contacto@empresa.com",
            regimen_tributario="Régimen General"
        )
        db.add(empresa)
        db.commit()
        print("✅ Datos de la empresa creados")
    else:
        print("⚠️  Datos de empresa ya existen")


def crear_parametros_sistema(db: Session):
    """Crear parámetros del sistema"""
    print("⚙️  Creando parámetros del sistema...")
    
    parametros = [
        {
            "codigo": "IGV_PORCENTAJE",
            "nombre": "Porcentaje de IGV",
            "valor": str(settings.IGV_PORCENTAJE),
            "tipo_dato": "number",
            "descripcion": "Porcentaje de IGV aplicable",
            "modulo": "general",
            "es_editable": "si"
        },
        {
            "codigo": "LIMITE_APROBACION_OC",
            "nombre": "Límite para aprobación de OC",
            "valor": str(settings.LIMITE_APROBACION_OC),
            "tipo_dato": "number",
            "descripcion": "Monto a partir del cual una OC requiere aprobación",
            "modulo": "compras",
            "es_editable": "si"
        },
        {
            "codigo": "DIAS_CREDITO_DEFAULT",
            "nombre": "Días de crédito por defecto",
            "valor": str(settings.DIAS_CREDITO_DEFAULT),
            "tipo_dato": "number",
            "descripcion": "Días de crédito para nuevos clientes",
            "modulo": "ventas",
            "es_editable": "si"
        },
        {
            "codigo": "STOCK_MINIMO_DEFAULT",
            "nombre": "Stock mínimo por defecto",
            "valor": str(settings.STOCK_MINIMO_DEFAULT),
            "tipo_dato": "number",
            "descripcion": "Stock mínimo para nuevos productos",
            "modulo": "inventario",
            "es_editable": "si"
        }
    ]
    
    for param_data in parametros:
        existing = db.query(ParametroSistema).filter(
            ParametroSistema.codigo == param_data["codigo"]
        ).first()
        if not existing:
            parametro = ParametroSistema(**param_data)
            db.add(parametro)
    
    db.commit()
    print(f"✅ {len(parametros)} parámetros creados")


def crear_secuencias(db: Session):
    """Crear secuencias para códigos"""
    print("🔢 Creando secuencias...")
    
    secuencias = [
        {"tabla": "usuarios", "prefijo": "USR-", "siguiente_numero": 1, "longitud": 6},
        {"tabla": "clientes", "prefijo": "CLI-", "siguiente_numero": 1, "longitud": 6},
        {"tabla": "proveedores", "prefijo": "PROV-", "siguiente_numero": 1, "longitud": 6},
        {"tabla": "productos", "prefijo": "PROD-", "siguiente_numero": 1, "longitud": 6},
        {"tabla": "cotizaciones", "prefijo": "COT-", "siguiente_numero": 1, "longitud": 8},
        {"tabla": "pedidos", "prefijo": "PED-", "siguiente_numero": 1, "longitud": 8},
        {"tabla": "facturas", "prefijo": "F001-", "siguiente_numero": 1, "longitud": 8},
        {"tabla": "ordenes_compra", "prefijo": "OC-", "siguiente_numero": 1, "longitud": 8},
        {"tabla": "documentos", "prefijo": "DOC-", "siguiente_numero": 1, "longitud": 8}
    ]
    
    for sec_data in secuencias:
        existing = db.query(Secuencia).filter(
            Secuencia.tabla == sec_data["tabla"]
        ).first()
        if not existing:
            secuencia = Secuencia(**sec_data)
            db.add(secuencia)
    
    db.commit()
    print(f"✅ {len(secuencias)} secuencias creadas")


def main():
    """Función principal para ejecutar el seed"""
    print("\n" + "="*60)
    print("🌱 INICIANDO SEED DE BASE DE DATOS")
    print("="*60 + "\n")
    
    # Inicializar base de datos (crear tablas si no existen)
    print("🗄️  Inicializando base de datos...")
    init_db()
    print("✅ Base de datos inicializada\n")
    
    # Crear sesión
    db = SessionLocal()
    
    try:
        # Ejecutar todas las funciones de seed
        crear_roles(db)
        crear_permisos(db)
        asignar_permisos_admin(db)
        crear_usuario_admin(db)
        crear_categorias_producto(db)
        crear_unidades_medida(db)
        crear_almacen_principal(db)
        crear_categorias_documento(db)
        crear_empresa(db)
        crear_parametros_sistema(db)
        crear_secuencias(db)
        
        print("\n" + "="*60)
        print("✅ SEED COMPLETADO EXITOSAMENTE")
        print("="*60)
        print("\n📌 CREDENCIALES DE ACCESO:")
        print(f"   Email: admin@empresa.com")
        print(f"   Password: Admin123!")
        print("\n🚀 Puedes iniciar el servidor ahora:\n   python app/main.py\n")
        
    except Exception as e:
        print(f"\n❌ Error durante el seed: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
