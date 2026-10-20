# ERP EnterpriseCloud Backend

Sistema ERP completo desarrollado en FastAPI con PostgreSQL/SQLite y integración con AWS S3.

## 🚀 Proyecto en Ejecución

El servidor está corriendo exitosamente en: **http://localhost:8000**

## 📋 Características

- **API REST completa** con 29 endpoints
- **37 modelos SQLAlchemy** para gestión de datos
- **Autenticación JWT** con roles y permisos
- **Integración AWS S3** para almacenamiento de documentos
- **Base de datos**: SQLite (local) o PostgreSQL (producción)
- **Documentación automática**: Swagger UI y ReDoc

## 🛠️ Tecnologías

- **FastAPI 0.146.0** - Framework web moderno
- **SQLAlchemy 2.1.5** - ORM
- **Pydantic 2.14.1** - Validación de datos
- **Python 3.13** - Lenguaje de programación
- **psycopg 3.3.6** - Driver PostgreSQL
- **boto3** - AWS SDK
- **python-jose** - JWT
- **bcrypt** - Hash de contraseñas
- **uvicorn** - Servidor ASGI

## 📁 Estructura del Proyecto

```
erp_enterprisecloud_backend/
├── app/
│   ├── api/v1/
│   │   ├── endpoints/
│   │   │   ├── auth.py          # Autenticación (login, logout, refresh)
│   │   │   ├── usuarios.py      # Gestión de usuarios
│   │   │   ├── clientes.py      # Gestión de clientes
│   │   │   ├── productos.py     # Gestión de productos
│   │   │   ├── documentos.py    # Documentos S3
│   │   │   └── dashboard.py     # Dashboard y reportes
│   │   └── router.py
│   ├── core/
│   │   ├── config.py            # Configuración
│   │   └── security.py          # JWT y bcrypt
│   ├── db/
│   │   └── session.py           # Conexión DB
│   ├── models/                  # 17 archivos de modelos
│   ├── schemas/                 # 4 archivos de schemas Pydantic
│   ├── services/
│   │   ├── s3_service.py        # Servicio AWS S3
│   │   └── auth_service.py      # Servicio de autenticación
│   └── main.py                  # Aplicación principal
├── database/
│   └── seed.py                  # Script de datos iniciales
├── .env                         # Variables de entorno
├── requirements.txt             # Dependencias
└── README.md
```

## 🏃‍♂️ Cómo Ejecutar

### 1. Activar el entorno virtual

```powershell
cd C:\Users\PC\Pictures\crm_tecnologia\erp_enterprisecloud_backend
.\venv\Scripts\activate
```

### 2. Instalar dependencias (si no están instaladas)

```powershell
pip install -r requirements.txt
```

### 3. Poblar la base de datos (primera vez)

```powershell
python database\seed.py
```

### 4. Iniciar el servidor

```powershell
$env:PYTHONIOENCODING="utf-8"
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará disponible en: http://localhost:8000

## 📖 Documentación API

Una vez que el servidor esté ejecutándose:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

## 🔑 Credenciales de Acceso

**Usuario Administrador:**
- Email: `admin@empresa.com`
- Password: `Admin123!`

## 📡 Endpoints Principales

### Autenticación (`/api/v1/auth`)
- `POST /login` - Iniciar sesión
- `POST /logout` - Cerrar sesión
- `POST /refresh` - Renovar token
- `GET /me` - Obtener usuario actual

### Usuarios (`/api/v1/usuarios`)
- `GET /` - Listar usuarios
- `POST /` - Crear usuario
- `GET /{id}` - Obtener usuario
- `PUT /{id}` - Actualizar usuario
- `DELETE /{id}` - Eliminar usuario

### Clientes (`/api/v1/clientes`)
- `GET /` - Listar clientes (con paginación y filtros)
- `POST /` - Crear cliente
- `GET /{id}` - Obtener cliente
- `PUT /{id}` - Actualizar cliente
- `DELETE /{id}` - Eliminar cliente
- `GET /estadisticas` - Estadísticas de clientes

### Productos (`/api/v1/productos`)
- `GET /` - Listar productos (con filtros)
- `POST /` - Crear producto
- `GET /{id}` - Obtener producto
- `PUT /{id}` - Actualizar producto
- `DELETE /{id}` - Cambiar estado
- `GET /estadisticas` - Estadísticas de inventario
- `GET /bajo-stock` - Productos con stock bajo

### Documentos (`/api/v1/documentos`)
- `POST /upload` - Subir documento a S3
- `GET /` - Listar documentos
- `GET /{id}` - Obtener documento
- `GET /{id}/download` - Descargar documento
- `DELETE /{id}` - Eliminar documento

### Dashboard (`/api/v1/dashboard`)
- `GET /resumen` - Resumen general
- `GET /ventas` - Métricas de ventas
- `GET /actividad-reciente` - Actividad reciente

## 🧪 Probar el API

### Login
```powershell
$body = @{email='admin@empresa.com'; password='Admin123!'} | ConvertTo-Json
Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/auth/login' -Method POST -Body $body -ContentType 'application/json' -UseBasicParsing
```

### Listar usuarios (con token)
```powershell
$token = "TU_TOKEN_JWT"
Invoke-WebRequest -Uri 'http://localhost:8000/api/v1/usuarios/' -Method GET -Headers @{Authorization="Bearer $token"} -UseBasicParsing
```

## ⚙️ Configuración

Editar el archivo `.env`:

```env
# Base de Datos
DATABASE_URL=sqlite:///./erp_enterprisecloud.db

# JWT
JWT_SECRET_KEY=erp-enterprisecloud-secret-key-2026-aws-project
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# AWS S3
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_DEFAULT_REGION=us-east-1
AWS_S3_BUCKET=erp-enterprisecloud-documents

# Empresa
EMPRESA_RUC=20123456789
EMPRESA_RAZON_SOCIAL=DataTech Analytics S.A.C.
EMPRESA_NOMBRE_COMERCIAL=DataTech Analytics
```

## 📊 Modelos de Base de Datos (37 tablas)

1. **Seguridad**: usuarios, roles, permisos, usuario_rol, rol_permiso, sesiones, auditoria
2. **Comercial**: clientes, proveedores
3. **Productos**: categorias_producto, unidades_medida, productos
4. **Ventas**: cotizaciones, cotizacion_detalles, pedidos, pedido_detalles, facturas, factura_detalles
5. **Compras**: solicitudes_compra, ordenes_compra, orden_compra_detalles, recepciones, recepcion_detalles
6. **Inventario**: almacenes, stocks, movimientos_inventario, ajustes_inventario
7. **Finanzas**: cuentas_por_cobrar, cuentas_por_pagar
8. **Documentos**: categorias_documento, documentos_s3
9. **Sistema**: empresa, parametros_sistema, secuencias

## 🎯 Datos Iniciales Creados

El script `database/seed.py` crea:

- ✅ 5 roles (Administrador, Gerente, Vendedor, Almacenero, Contador)
- ✅ 48 permisos asignados al rol Administrador
- ✅ 1 usuario administrador
- ✅ 8 categorías de producto
- ✅ 12 unidades de medida
- ✅ 1 almacén principal
- ✅ 5 categorías de documento
- ✅ 1 registro de empresa
- ✅ 4 parámetros del sistema
- ✅ 9 secuencias para códigos automáticos

## 🌐 Despliegue (Opcional)

### Opción 1: Render.com (Recomendado)
1. Crear cuenta en render.com
2. Conectar repositorio GitHub
3. Crear Web Service con:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Agregar PostgreSQL database
5. Configurar variables de entorno

### Opción 2: PostgreSQL Local
1. Instalar PostgreSQL
2. Crear base de datos y usuario
3. Actualizar `DATABASE_URL` en `.env`
4. Ejecutar seed y servidor

## 📝 Notas

- El proyecto usa **SQLite** por defecto para facilitar desarrollo local
- Para producción, cambia a **PostgreSQL** actualizando `DATABASE_URL`
- Los documentos se almacenan en **AWS S3** (requiere credenciales válidas)
- Todos los endpoints protegidos requieren token JWT en header: `Authorization: Bearer TOKEN`

## 👨‍💻 Autor

Proyecto desarrollado para el curso AWS Cloud Technology - Semana 07

## 📄 Licencia

Este proyecto es parte de un trabajo académico.
