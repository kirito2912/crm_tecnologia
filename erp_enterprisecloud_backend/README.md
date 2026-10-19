# 🚀 ERP EnterpriseCloud - Backend

## Sistema Integrado de Gestión Empresarial en AWS

Backend desarrollado con **FastAPI + Python 3.11** para el proyecto de Tecnología Cloud con AWS.

---

## 📋 Requisitos Previos

- **Python**: 3.11 o superior
- **PostgreSQL**: 14 o superior
- **AWS CLI**: Configurado (opcional para desarrollo local)
- **Git**: 2.x

---

## 🔧 Instalación

### 1. Clonar el Repositorio

```bash
cd crm_tecnologia
cd erp_enterprisecloud_backend
```

### 2. Crear Entorno Virtual

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Instalar Dependencias

```bash
pip install -r requirements.txt
```

### 4. Configurar Variables de Entorno

```bash
# Copiar el archivo de ejemplo
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/Mac

# Editar .env con tus credenciales
```

**Configuración mínima en `.env`:**

```env
DATABASE_URL=postgresql+psycopg2://erp_admin:password@localhost:5432/erp_enterprisecloud
JWT_SECRET_KEY=tu-clave-super-secreta-cambiar
AWS_ACCESS_KEY_ID=TU_ACCESS_KEY
AWS_SECRET_ACCESS_KEY=TU_SECRET_KEY
AWS_S3_BUCKET=erp-enterprisecloud-documents
```

### 5. Crear Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE erp_enterprisecloud;

# Crear usuario
CREATE USER erp_admin WITH PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE erp_enterprisecloud TO erp_admin;

# Salir
\q
```

### 6. Inicializar Base de Datos

```bash
# Las tablas se crean automáticamente al iniciar el servidor
python app/main.py
```

---

## 🚀 Ejecutar el Servidor

### Modo Desarrollo

```bash
# Con auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# O directamente con Python
python app/main.py
```

### Modo Producción

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

El servidor estará disponible en:
- **API**: http://localhost:8000
- **Documentación Swagger**: http://localhost:8000/docs
- **Documentación ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

---

## 📚 Estructura del Proyecto

```
erp_enterprisecloud_backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/       # Endpoints de la API
│   │       └── router.py        # Router principal
│   ├── core/
│   │   ├── config.py           # Configuración
│   │   └── security.py         # Autenticación y seguridad
│   ├── db/
│   │   └── session.py          # Sesión de base de datos
│   ├── models/                 # Modelos SQLAlchemy
│   │   ├── usuario.py
│   │   ├── cliente.py
│   │   ├── producto.py
│   │   └── ...
│   ├── schemas/                # Schemas Pydantic
│   │   ├── usuario.py
│   │   └── ...
│   ├── services/               # Lógica de negocio
│   │   ├── auth_service.py
│   │   ├── s3_service.py
│   │   └── ...
│   └── main.py                 # Aplicación principal
├── database/
│   ├── schema.sql              # Schema completo
│   └── seed.sql                # Datos iniciales
├── tests/                      # Tests unitarios
├── .env.example                # Variables de entorno ejemplo
├── requirements.txt            # Dependencias Python
└── README.md                   # Este archivo
```

---

## 🔑 API Endpoints

### Health Check
```
GET /health
```

### Autenticación
```
POST /api/v1/auth/login          # Iniciar sesión
POST /api/v1/auth/register       # Registrar usuario
GET  /api/v1/auth/me             # Obtener perfil actual
```

### Usuarios
```
GET    /api/v1/usuarios          # Listar usuarios
POST   /api/v1/usuarios          # Crear usuario
GET    /api/v1/usuarios/{id}     # Obtener usuario
PUT    /api/v1/usuarios/{id}     # Actualizar usuario
DELETE /api/v1/usuarios/{id}     # Eliminar usuario
```

### Clientes
```
GET    /api/v1/clientes          # Listar clientes
POST   /api/v1/clientes          # Crear cliente
GET    /api/v1/clientes/{id}     # Obtener cliente
PUT    /api/v1/clientes/{id}     # Actualizar cliente
DELETE /api/v1/clientes/{id}     # Eliminar cliente
```

### Productos
```
GET    /api/v1/productos         # Listar productos
POST   /api/v1/productos         # Crear producto
GET    /api/v1/productos/{id}    # Obtener producto
PUT    /api/v1/productos/{id}    # Actualizar producto
DELETE /api/v1/productos/{id}    # Eliminar producto
GET    /api/v1/productos/stock   # Consultar stock
```

### Ventas
```
GET    /api/v1/ventas/cotizaciones      # Listar cotizaciones
POST   /api/v1/ventas/cotizaciones      # Crear cotización
GET    /api/v1/ventas/pedidos           # Listar pedidos
POST   /api/v1/ventas/pedidos           # Crear pedido
GET    /api/v1/ventas/facturas          # Listar facturas
POST   /api/v1/ventas/facturas          # Crear factura
```

### Compras
```
GET    /api/v1/compras/ordenes          # Listar órdenes de compra
POST   /api/v1/compras/ordenes          # Crear orden de compra
GET    /api/v1/compras/recepciones      # Listar recepciones
POST   /api/v1/compras/recepciones      # Registrar recepción
```

### Inventario
```
GET    /api/v1/inventario/stock         # Consultar stock
POST   /api/v1/inventario/movimientos   # Registrar movimiento
GET    /api/v1/inventario/ajustes       # Listar ajustes
POST   /api/v1/inventario/ajustes       # Crear ajuste
```

### Documentos (S3)
```
GET    /api/v1/documentos               # Listar documentos
POST   /api/v1/documentos/upload        # Subir documento
GET    /api/v1/documentos/{id}          # Obtener documento
DELETE /api/v1/documentos/{id}          # Eliminar documento
```

### Reportes
```
GET    /api/v1/reportes/ventas          # Reporte de ventas
GET    /api/v1/reportes/compras         # Reporte de compras
GET    /api/v1/reportes/inventario      # Reporte de inventario
GET    /api/v1/reportes/financiero      # Reporte financiero
```

---

## 🔐 Autenticación

La API usa **JWT (JSON Web Tokens)** para autenticación.

### Flujo de Autenticación

1. **Login**: POST `/api/v1/auth/login`
```json
{
  "email": "admin@empresa.com",
  "password": "Admin123!"
}
```

Respuesta:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "nombre": "Administrador",
    "email": "admin@empresa.com",
    "rol": "Administrador"
  }
}
```

2. **Usar el token** en las siguientes peticiones:
```bash
curl -H "Authorization: Bearer TOKEN_AQUI" http://localhost:8000/api/v1/usuarios
```

---

## 📊 Modelos de Datos

### Principales Entidades

- **Usuario**: Usuarios del sistema con roles y permisos
- **Cliente**: Clientes de la empresa
- **Proveedor**: Proveedores
- **Producto**: Catálogo de productos
- **Cotización**: Propuestas comerciales
- **Pedido**: Pedidos de venta
- **Factura**: Comprobantes de venta
- **Orden de Compra**: Órdenes a proveedores
- **Stock**: Inventario por almacén
- **Documento**: Archivos almacenados en S3

---

## 🧪 Testing

```bash
# Ejecutar tests
pytest

# Con coverage
pytest --cov=app tests/

# Test específico
pytest tests/test_usuarios.py
```

---

## 🐳 Docker (Opcional)

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build
docker build -t erp-backend .

# Run
docker run -p 8000:8000 erp-backend
```

---

## ☁️ Despliegue en AWS

### EC2

1. Lanzar instancia EC2 (Ubuntu 22.04, t3.medium)
2. Conectar por SSH
3. Instalar dependencias:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Python 3.11
sudo apt install python3.11 python3-pip python3-venv -y

# Clonar repositorio
git clone https://github.com/tu-repo/crm_tecnologia.git
cd crm_tecnologia/erp_enterprisecloud_backend

# Instalar dependencias
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configurar .env con credenciales de RDS y S3

# Instalar nginx
sudo apt install nginx -y

# Configurar como servicio systemd
sudo nano /etc/systemd/system/erp-backend.service
```

**Contenido de `erp-backend.service`:**

```ini
[Unit]
Description=ERP EnterpriseCloud Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/crm_tecnologia/erp_enterprisecloud_backend
Environment="PATH=/home/ubuntu/crm_tecnologia/erp_enterprisecloud_backend/venv/bin"
ExecStart=/home/ubuntu/crm_tecnologia/erp_enterprisecloud_backend/venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# Iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable erp-backend
sudo systemctl start erp-backend
sudo systemctl status erp-backend
```

---

## 🛠️ Comandos Útiles

```bash
# Ver logs del servidor
tail -f /var/log/erp-backend.log

# Reiniciar servicio
sudo systemctl restart erp-backend

# Migrar base de datos
alembic upgrade head

# Crear migración
alembic revision --autogenerate -m "descripcion"

# Backup de base de datos
pg_dump erp_enterprisecloud > backup.sql

# Restaurar backup
psql erp_enterprisecloud < backup.sql
```

---

## 📞 Soporte

- **Email**: soporte@erp-enterprisecloud.com
- **Documentación**: Ver `/docs` en el servidor
- **Issues**: GitHub Issues

---

## 📄 Licencia

Proyecto académico - Tecnología Cloud con AWS

---

**Desarrollado con ❤️ usando FastAPI + PostgreSQL + AWS**

