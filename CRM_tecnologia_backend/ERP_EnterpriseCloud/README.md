# 🚀 ERP EnterpriseCloud

## Sistema Integrado de Gestión Empresarial en AWS

[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20RDS%20%7C%20S3-orange)](https://aws.amazon.com/)
[![Python](https://img.shields.io/badge/Python-3.11-blue)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-green)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14-blue)](https://www.postgresql.org/)

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Arquitectura](#️-arquitectura)
- [Módulos del Sistema](#-módulos-del-sistema)
- [Tecnologías](#-tecnologías)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración AWS](#️-configuración-aws)
- [Uso](#-uso)
- [Documentación](#-documentación)
- [Equipo](#-equipo)

---

## 📖 Descripción

**ERP EnterpriseCloud** es un sistema integrado de gestión empresarial modular y escalable, diseñado para correr en la nube de AWS. Centraliza en una sola plataforma los procesos empresariales de ventas, compras, inventario, finanzas, documentos y administración.

### Características Principales

✅ **Modular** - Módulos independientes e integrables
✅ **Escalable** - Auto-scaling con múltiples instancias EC2  
✅ **Seguro** - Autenticación JWT, roles y permisos granulares  
✅ **Cloud-Native** - Desplegado completamente en AWS  
✅ **API REST** - Backend con FastAPI documentado con OpenAPI  
✅ **Responsive** - Interfaz React adaptable a cualquier dispositivo  
✅ **Auditable** - Registro completo de operaciones críticas  
✅ **Multiempresa** - Soporte para múltiples empresas

---

## 🏗️ Arquitectura

### Diagrama General

```
┌─────────────────────────────────────────────────────────┐
│                     INTERNET                             │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
          ┌──────────────────────────┐
          │  Application Load        │
          │  Balancer (ALB)          │
          └──────────┬───────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
   ┌────────┐  ┌────────┐  ┌────────┐
   │  EC2   │  │  EC2   │  │  EC2   │
   │Backend │  │Backend │  │Backend │
   └───┬────┘  └───┬────┘  └───┬────┘
       │           │            │
       └───────────┼────────────┘
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
     ┌─────────┐      ┌─────────┐
     │   RDS   │      │   S3    │
     │PostgreSQL│      │Documents│
     └─────────┘      └─────────┘
```

### Stack Tecnológico

**Frontend:**
- React 18.2 + TypeScript
- Vite (Build Tool)
- TailwindCSS (Estilos)
- Axios (HTTP Client)

**Backend:**
- Python 3.11
- FastAPI 0.104.1
- SQLAlchemy 2.0 (ORM)
- Pydantic (Validación)
- Uvicorn (ASGI Server)

**Base de Datos:**
- PostgreSQL 14.x
- AWS RDS Multi-AZ

**Cloud (AWS):**
- EC2: Cómputo (backend)
- S3: Almacenamiento de documentos
- RDS: Base de datos administrada
- ALB: Balanceo de carga
- CloudWatch: Monitoreo
- IAM: Seguridad y permisos
- Secrets Manager: Credenciales

---

## 🎯 Módulos del Sistema

### 1. Dashboard
- KPIs en tiempo real
- Gráficos interactivos
- Alertas visuales
- Widgets personalizables

### 2. Ventas
- Cotizaciones
- Pedidos
- Facturación electrónica
- Control de cobranzas
- Devoluciones

### 3. Compras
- Solicitudes de compra
- Órdenes de compra
- Recepción de mercadería
- Evaluación de proveedores

### 4. Inventario
- Control de stock en tiempo real
- Entradas y salidas
- Ajustes de inventario
- Alertas de stock mínimo
- Transferencias entre almacenes
- Valorización PEPS

### 5. Clientes
- Ficha de cliente completa
- Límite de crédito
- Historial de compras
- Segmentación

### 6. Proveedores
- Registro de proveedores
- Sistema de calificación
- Historial de compras
- Evaluaciones de desempeño

### 7. Finanzas
- Cuentas por cobrar (CxC)
- Cuentas por pagar (CxP)
- Caja y bancos
- Conciliación bancaria
- Reportes financieros

### 8. Documentos
- Almacenamiento en S3
- Organización por categorías
- Búsqueda avanzada
- Versionado de documentos

### 9. Administración
- Gestión de usuarios
- Roles y permisos
- Auditoría de operaciones
- Parámetros del sistema
- Respaldos automáticos

### 10. Reportes
- Reportes operativos
- Reportes financieros
- Reportes de inventario
- Exportación (PDF, Excel)

---

## 🛠️ Tecnologías

### Backend (Python + FastAPI)

```python
# Principales dependencias
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
pydantic==2.5.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
boto3==1.34.0
python-multipart==0.0.6
```

### Frontend (React + TypeScript)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.2.2",
    "axios": "^1.6.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.0",
    "lucide-react": "^0.292.0"
  }
}
```

---

## 💻 Requisitos

### Desarrollo Local

- **Python:** 3.11+
- **Node.js:** 18+
- **PostgreSQL:** 14+
- **Git:** 2.x

### AWS

- Cuenta de AWS (créditos educativos recomendados)
- AWS CLI configurado
- Permisos para EC2, RDS, S3, IAM

---

## 📦 Instalación

### 1. Clonar Repositorio

```bash
git clone https://github.com/tu-repo/erp-enterprisecloud.git
cd erp-enterprisecloud
```

### 2. Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# venv\Scripts\activate  # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# Inicializar base de datos
python scripts/init_db.py

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con la URL del backend

# Ejecutar servidor de desarrollo
npm run dev
```

### 4. Base de Datos

```bash
# Conectar a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE erp_enterprisecloud;

# Ejecutar schema
psql -U postgres -d erp_enterprisecloud -f database/schema.sql

# Ejecutar datos iniciales
psql -U postgres -d erp_enterprisecloud -f database/seed.sql
```

---

## ☁️ Configuración AWS

### 1. Crear VPC y Subnets

```bash
# Crear VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ERP-VPC}]'

# Crear subnets (pública y privada)
# Ver archivo: aws/setup_vpc.sh
```

### 2. Lanzar RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier erp-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 14.10 \
  --master-username erp_admin \
  --master-user-password TU_PASSWORD_SEGURO \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxx \
  --db-subnet-group-name erp-db-subnet \
  --multi-az \
  --backup-retention-period 7 \
  --publicly-accessible false
```

### 3. Crear Bucket S3

```bash
# Crear bucket
aws s3api create-bucket \
  --bucket erp-enterprisecloud-documents \
  --region us-east-1

# Habilitar versionado
aws s3api put-bucket-versioning \
  --bucket erp-enterprisecloud-documents \
  --versioning-configuration Status=Enabled

# Configurar lifecycle
aws s3api put-bucket-lifecycle-configuration \
  --bucket erp-enterprisecloud-documents \
  --lifecycle-configuration file://aws/s3-lifecycle.json
```

### 4. Lanzar Instancias EC2

```bash
# Crear Launch Template
aws ec2 create-launch-template \
  --launch-template-name erp-backend-template \
  --version-description "ERP Backend v1" \
  --launch-template-data file://aws/launch-template.json

# Crear Auto Scaling Group
aws autoscaling create-auto-scaling-group \
  --auto-scaling-group-name erp-backend-asg \
  --launch-template LaunchTemplateName=erp-backend-template,Version='$Latest' \
  --min-size 2 \
  --max-size 5 \
  --desired-capacity 2 \
  --target-group-arns arn:aws:elasticloadbalancing:... \
  --vpc-zone-identifier "subnet-xxx,subnet-yyy"
```

### 5. Configurar Application Load Balancer

```bash
# Crear ALB
aws elbv2 create-load-balancer \
  --name erp-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing

# Crear Target Group
aws elbv2 create-target-group \
  --name erp-backend-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id vpc-xxxxx \
  --health-check-path /api/v1/health

# Crear Listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## 🚀 Uso

### Acceso al Sistema

```
URL: https://erp-enterprisecloud.com
```

### Usuarios por Defecto

| Usuario | Contraseña | Rol |
|---------|------------|-----|
| admin@empresa.com | Admin123! | Administrador |
| gerente@empresa.com | Gerente123! | Gerente General |
| contador@empresa.com | Conta123! | Contador |
| vendedor@empresa.com | Vende123! | Vendedor |

⚠️ **Cambiar contraseñas en producción**

### API REST

**Documentación interactiva:**
```
http://localhost:8000/docs  (Swagger UI)
http://localhost:8000/redoc  (ReDoc)
```

**Ejemplo de uso:**

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@empresa.com", "password": "Admin123!"}'

# Obtener productos (requiere token)
curl -X GET http://localhost:8000/api/v1/inventario/productos \
  -H "Authorization: Bearer TOKEN_JWT"
```

---

## 📚 Documentación

### Documentos del Proyecto

1. [📋 Fase 1: Análisis y Requerimientos](FASE_1_ANALISIS_REQUERIMIENTOS.md)
2. [🗺️ Mapa de Procesos](MAPA_PROCESOS_VISUAL.md)
3. [☁️ Arquitectura AWS](ARQUITECTURA_AWS.md)
4. [🗄️ Diseño de Base de Datos](DISENO_BASE_DATOS.md)
5. [🔐 Guía de Seguridad](GUIA_SEGURIDAD.md)
6. [📖 Manual de Usuario](MANUAL_USUARIO.md)
7. [🔧 Manual Técnico](MANUAL_TECNICO.md)

### Estructura del Proyecto

```
erp-enterprisecloud/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       └── router.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── security.py
│   │   ├── db/
│   │   │   └── session.py
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── tests/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   └── .env.example
├── database/
│   ├── schema.sql
│   ├── seed.sql
│   └── migrations/
├── aws/
│   ├── setup_vpc.sh
│   ├── launch-template.json
│   ├── s3-lifecycle.json
│   └── cloudformation/
├── docs/
│   ├── FASE_1_ANALISIS_REQUERIMIENTOS.md
│   ├── ARQUITECTURA_AWS.md
│   └── ...
└── README.md
```

---

## 👥 Equipo

**Proyecto Académico:** Tecnología Cloud con AWS - Semana 07

**Desarrollado por:** [Tu Nombre/Equipo]

**Institución:** [Tu Universidad/Instituto]

**Año:** 2026

---

## 📄 Licencia

Este proyecto es de código abierto para fines educativos.

---

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📞 Contacto

**Email:** soporte@erp-enterprisecloud.com  
**Website:** https://erp-enterprisecloud.com

---

## 🎉 Agradecimientos

- AWS por los créditos educativos
- FastAPI por el excelente framework
- React team por la increíble biblioteca
- PostgreSQL por el robusto motor de base de datos

---

**⭐ Si te gusta este proyecto, dale una estrella en GitHub!**

