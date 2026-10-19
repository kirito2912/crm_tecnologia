# 🚀 GUÍA DE USO - ERP EnterpriseCloud

## Sistema Integrado de Gestión Empresarial

---

## 📋 REQUISITOS PREVIOS

- **Python**: 3.11 o superior
- **PostgreSQL**: 14 o superior (o cuenta de Supabase)
- **AWS Account**: Para S3 (opcional para desarrollo local)
- **Git**: Para clonar el repositorio

---

## 🔧 INSTALACIÓN PASO A PASO

### 1. Clonar el Repositorio

```bash
cd C:\Users\PC\Pictures\crm_tecnologia
cd erp_enterprisecloud_backend
```

### 2. Crear Entorno Virtual

```powershell
# Crear entorno virtual
python -m venv venv

# Activar entorno virtual (Windows)
venv\Scripts\activate

# Verificar activación (debe aparecer (venv) en el prompt)
```

### 3. Instalar Dependencias

```powershell
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

El archivo `.env` ya está configurado con:
- Base de datos PostgreSQL (Supabase)
- Credenciales AWS S3
- JWT Secret Key

**Archivo `.env` configurado:**
```env
DATABASE_URL=postgresql+psycopg2://usuario:password@host:port/database
JWT_SECRET_KEY=tu-clave-secreta-jwt
AWS_ACCESS_KEY_ID=TU_AWS_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_AWS_SECRET_KEY
AWS_S3_BUCKET=nombre-tu-bucket-s3
```

**Nota:** Las credenciales reales están en el archivo `.env` local (no en el repositorio).

### 5. Inicializar Base de Datos con Datos Iniciales

```powershell
python database/seed.py
```

**Esto creará:**
- ✅ 37 tablas en PostgreSQL
- ✅ 6 roles del sistema
- ✅ 48 permisos
- ✅ Usuario administrador
- ✅ Categorías de productos
- ✅ Unidades de medida
- ✅ Almacén principal
- ✅ Parámetros del sistema

**Salida esperada:**
```
🌱 INICIANDO SEED DE BASE DE DATOS
✅ Base de datos inicializada
📋 Creando roles...
✅ 6 roles creados
🔐 Creando permisos...
✅ 48 permisos creados
👑 Asignando permisos a Administrador...
✅ 48 permisos asignados a Administrador
👤 Creando usuario administrador...
✅ Usuario administrador creado:
   Email: admin@empresa.com
   Password: Admin123!
...
✅ SEED COMPLETADO EXITOSAMENTE
```

### 6. Iniciar el Servidor

```powershell
python app/main.py
```

**Salida esperada:**
```
🚀 Iniciando ERP EnterpriseCloud...
📊 Conectando a base de datos: aws-0-us-west-2.pooler.supabase.com/postgres
✅ Tablas de base de datos verificadas
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

---

## 🌐 ACCEDER AL SISTEMA

### URLs Principales

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **API** | http://localhost:8000 | Endpoint principal |
| **Documentación** | http://localhost:8000/docs | Swagger UI (interfaz interactiva) |
| **ReDoc** | http://localhost:8000/redoc | Documentación alternativa |
| **Health Check** | http://localhost:8000/health | Estado del servidor |

---

## 🔐 CREDENCIALES DE ACCESO

### Usuario Administrador

```
Email: admin@empresa.com
Password: Admin123!
```

---

## 📡 ENDPOINTS DISPONIBLES

### 1. Autenticación

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "Admin123!"
}
```

**Respuesta:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "usuario_codigo": "USR-000001",
    "nombre_completo": "Administrador del Sistema",
    "email": "admin@empresa.com",
    "roles": ["Administrador"]
  }
}
```

#### Usar el Token

En las siguientes peticiones, incluir el header:
```
Authorization: Bearer {access_token}
```

#### Registro
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "nombre_completo": "Juan Pérez",
  "email": "juan@empresa.com",
  "password": "Password123",
  "telefono": "987654321"
}
```

#### Perfil Actual
```http
GET /api/v1/auth/me
Authorization: Bearer {token}
```

---

### 2. Clientes

#### Listar Clientes
```http
GET /api/v1/clientes?pagina=1&por_pagina=10
Authorization: Bearer {token}
```

#### Crear Cliente
```http
POST /api/v1/clientes
Authorization: Bearer {token}
Content-Type: application/json

{
  "tipo_documento": "RUC",
  "numero_documento": "20123456789",
  "razon_social": "Empresa Cliente S.A.C.",
  "nombre_comercial": "Cliente SAC",
  "email": "contacto@cliente.com",
  "telefono": "01-1234567",
  "celular": "987654321",
  "direccion": "Av. Principal 123",
  "distrito": "Miraflores",
  "provincia": "Lima",
  "departamento": "Lima",
  "limite_credito": 50000,
  "dias_credito": 30
}
```

#### Obtener Cliente
```http
GET /api/v1/clientes/{id}
Authorization: Bearer {token}
```

#### Actualizar Cliente
```http
PUT /api/v1/clientes/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "telefono": "999888777",
  "email": "nuevo@cliente.com"
}
```

#### Buscar por Documento
```http
GET /api/v1/clientes/documento/20123456789
Authorization: Bearer {token}
```

---

### 3. Productos

#### Listar Productos
```http
GET /api/v1/productos?pagina=1&por_pagina=10&buscar=laptop
Authorization: Bearer {token}
```

#### Crear Producto
```http
POST /api/v1/productos
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre": "Laptop Dell Latitude 5420",
  "descripcion": "Laptop empresarial i5 11va Gen",
  "categoria_id": 1,
  "unidad_medida_id": 1,
  "tipo": "producto",
  "precio_compra": 3500.00,
  "precio_venta": 4500.00,
  "stock_minimo": 5,
  "afecto_igv": true,
  "codigo_barras": "7501234567890"
}
```

#### Ver Stock
```http
GET /api/v1/productos/{id}/stock
Authorization: Bearer {token}
```

#### Buscar por Código de Barras
```http
GET /api/v1/productos/codigo-barras/7501234567890
Authorization: Bearer {token}
```

---

### 4. Documentos (AWS S3)

#### Subir Documento
```http
POST /api/v1/documentos/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [archivo]
categoria_id: 1
modulo_origen: facturas
registro_id: 123
descripcion: Factura del mes
```

**Con cURL:**
```bash
curl -X POST "http://localhost:8000/api/v1/documentos/upload" \
  -H "Authorization: Bearer {token}" \
  -F "file=@C:\Documents\factura.pdf" \
  -F "categoria_id=1" \
  -F "modulo_origen=facturas" \
  -F "registro_id=123"
```

#### Listar Documentos
```http
GET /api/v1/documentos?modulo_origen=facturas
Authorization: Bearer {token}
```

#### Obtener Documento (con URL de descarga)
```http
GET /api/v1/documentos/{id}
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "id": 1,
  "codigo": "DOC-00000001",
  "nombre_original": "factura.pdf",
  "tamanio_bytes": 245678,
  "tipo_archivo": "pdf",
  "url_descarga": "https://erp-enterprisecloud-documents.s3.amazonaws.com/...",
  "fecha_creacion": "2026-09-15T20:00:00"
}
```

---

### 5. Dashboard

#### Dashboard General
```http
GET /api/v1/dashboard
Authorization: Bearer {token}
```

**Respuesta:**
```json
{
  "kpis": {
    "total_clientes": 15,
    "total_productos": 42,
    "ventas_mes": 125000.50,
    "total_por_cobrar": 45000.00,
    "productos_stock_bajo": 3
  },
  "ultimas_ventas": [...],
  "top_clientes": [...],
  "ventas_por_dia": [...],
  "alertas": {
    "stock_bajo": true,
    "cuentas_vencidas": false
  }
}
```

#### Dashboard de Ventas
```http
GET /api/v1/dashboard/ventas
Authorization: Bearer {token}
```

#### Dashboard de Inventario
```http
GET /api/v1/dashboard/inventario
Authorization: Bearer {token}
```

---

### 6. Usuarios (Requiere rol Administrador)

#### Listar Usuarios
```http
GET /api/v1/usuarios?pagina=1&estado=activo
Authorization: Bearer {token}
```

#### Crear Usuario
```http
POST /api/v1/usuarios
Authorization: Bearer {token}
Content-Type: application/json

{
  "nombre_completo": "María López",
  "email": "maria@empresa.com",
  "password": "Password123",
  "telefono": "987654321",
  "roles": [2]
}
```

---

## 🧪 PRUEBAS CON SWAGGER

1. Abrir http://localhost:8000/docs
2. Click en **POST /api/v1/auth/login**
3. Click en "Try it out"
4. Ingresar credenciales:
   ```json
   {
     "email": "admin@empresa.com",
     "password": "Admin123!"
   }
   ```
5. Click en "Execute"
6. Copiar el `access_token` de la respuesta
7. Click en el botón **"Authorize"** (candado verde arriba)
8. Pegar el token en formato: `Bearer {access_token}`
9. Click en "Authorize"
10. Ahora puedes probar todos los endpoints ✅

---

## 📊 ESTRUCTURA DE LA BASE DE DATOS

### Principales Tablas

| Tabla | Descripción | Registros Iniciales |
|-------|-------------|---------------------|
| `usuarios` | Usuarios del sistema | 1 (admin) |
| `roles` | Roles de acceso | 6 |
| `permisos` | Permisos del sistema | 48 |
| `clientes` | Clientes de la empresa | 0 |
| `proveedores` | Proveedores | 0 |
| `productos` | Catálogo de productos | 0 |
| `categorias_producto` | Categorías | 6 |
| `unidades_medida` | Unidades (UND, KG, etc.) | 10 |
| `almacenes` | Almacenes | 1 (principal) |
| `cotizaciones` | Propuestas comerciales | 0 |
| `pedidos` | Pedidos de venta | 0 |
| `facturas` | Comprobantes | 0 |
| `ordenes_compra` | Órdenes a proveedores | 0 |
| `stock` | Inventario por almacén | 0 |
| `documentos_s3` | Archivos en S3 | 0 |

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### Error: "ModuleNotFoundError"

```powershell
# Asegúrate de tener el entorno virtual activado
venv\Scripts\activate

# Reinstalar dependencias
pip install -r requirements.txt
```

### Error: "Connection refused" (PostgreSQL)

Verificar que las credenciales en `.env` sean correctas.

### Error: AWS S3 "Access Denied"

Verificar que las credenciales AWS en `.env` tengan permisos de S3.

### El servidor no inicia

```powershell
# Verificar que el puerto 8000 esté disponible
netstat -ano | findstr :8000

# Si está ocupado, cerrar el proceso o cambiar el puerto
uvicorn app.main:app --port 8001
```

---

## 📚 RECURSOS ADICIONALES

### Documentación

- **Swagger UI**: http://localhost:8000/docs (interfaz interactiva)
- **ReDoc**: http://localhost:8000/redoc (documentación estática)
- **README.md**: Documentación general del proyecto
- **RESUMEN_IMPLEMENTACION.md**: Estado actual del sistema

### Archivos de Configuración

- `.env`: Variables de entorno
- `requirements.txt`: Dependencias Python
- `app/core/config.py`: Configuración central
- `database/seed.py`: Datos iniciales

---

## 🚀 PRÓXIMOS PASOS

1. ✅ **Probar el sistema** con Swagger UI
2. ✅ **Crear algunos clientes** de prueba
3. ✅ **Crear productos** en el catálogo
4. ✅ **Subir documentos** a S3
5. ✅ **Ver el dashboard** con datos

---

## 📞 SOPORTE

Para dudas o problemas:
- Revisar la documentación en `/docs`
- Ver logs del servidor en la consola
- Verificar configuración en `.env`

---

**¡El sistema está listo para usar! 🎉**

**Inicio rápido:**
```powershell
cd erp_enterprisecloud_backend
venv\Scripts\activate
python app/main.py
```

Luego abrir: http://localhost:8000/docs

