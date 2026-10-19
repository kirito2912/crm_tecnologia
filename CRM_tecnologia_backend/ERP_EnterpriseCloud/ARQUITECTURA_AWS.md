# ☁️ ARQUITECTURA AWS - ERP EnterpriseCloud

## Semana 07: Implementa Servicios en la Nube

**Servicios AWS Implementados:**
- ✅ EC2 (Cómputo)
- ✅ S3 (Almacenamiento)
- ✅ RDS (Base de Datos)

---

## 🏗️ DIAGRAMA DE ARQUITECTURA

```
                                    INTERNET
                                       ↓
                    ┌──────────────────────────────────┐
                    │     Route 53 (DNS)               │
                    │  erp-enterprisecloud.com         │
                    └───────────────┬──────────────────┘
                                    ↓
                    ┌──────────────────────────────────┐
                    │  CloudFront (CDN - Opcional)     │
                    │  Caché de contenido estático     │
                    └───────────────┬──────────────────┘
                                    ↓
┌────────────────────────────────────────────────────────────────┐
│                        AWS CLOUD                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              VPC (Virtual Private Cloud)                  │  │
│  │           CIDR: 10.0.0.0/16                              │  │
│  │                                                           │  │
│  │  ┌─────────────────────────────────────────────────┐    │  │
│  │  │         Public Subnet (10.0.1.0/24)             │    │  │
│  │  │         Availability Zone: us-east-1a           │    │  │
│  │  │                                                  │    │  │
│  │  │  ┌────────────────────────────────────────┐    │    │  │
│  │  │  │   Application Load Balancer (ALB)      │    │    │  │
│  │  │  │   • SSL/TLS Termination                │    │    │  │
│  │  │  │   • Health Checks                      │    │    │  │
│  │  │  │   • Distribución de Tráfico            │    │    │  │
│  │  │  └─────────────┬────────────┬─────────────┘    │    │  │
│  │  │                │            │                   │    │  │
│  │  │         ┌──────┴────┐  ┌───┴──────┐           │    │  │
│  │  │         │           │  │          │            │    │  │
│  │  │   ┌─────▼──────┐  ┌▼──────────┐  ┌▼───────┐  │    │  │
│  │  │   │  EC2       │  │  EC2      │  │  EC2   │  │    │  │
│  │  │   │  Instance  │  │  Instance │  │ Instance│ │    │  │
│  │  │   │  #1        │  │  #2       │  │  #3    │  │    │  │
│  │  │   │            │  │           │  │        │  │    │  │
│  │  │   │ Backend    │  │ Backend   │  │Backend │  │    │  │
│  │  │   │ FastAPI    │  │ FastAPI   │  │FastAPI │  │    │  │
│  │  │   │ Python     │  │ Python    │  │Python  │  │    │  │
│  │  │   │            │  │           │  │        │  │    │  │
│  │  │   │ t3.medium  │  │ t3.medium │  │t3.medium│ │    │  │
│  │  │   └────────────┘  └───────────┘  └────────┘  │    │  │
│  │  │                                               │    │  │
│  │  └───────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │      Private Subnet (10.0.2.0/24)               │  │  │
│  │  │      Availability Zone: us-east-1a              │  │  │
│  │  │                                                  │  │  │
│  │  │    ┌──────────────────────────────────────┐    │  │  │
│  │  │    │   Amazon RDS (PostgreSQL 14)         │    │  │  │
│  │  │    │   • Multi-AZ para alta disponibilidad│    │  │  │
│  │  │    │   • Automated Backups (7 días)       │    │  │  │
│  │  │    │   • db.t3.medium                     │    │  │  │
│  │  │    │   • 100 GB SSD (gp3)                 │    │  │  │
│  │  │    │                                       │    │  │  │
│  │  │    │   [Master]  [Standby Replica]       │    │  │  │
│  │  │    └──────────────────────────────────────┘    │  │  │
│  │  │                                                  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                                                        │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              AWS S3 (Simple Storage Service)           │  │
│  │                                                         │  │
│  │  Bucket: erp-enterprisecloud-documents                 │  │
│  │  • Versionado habilitado                               │  │
│  │  │  Lifecycle Policies:                                │  │
│  │  │  - 90 días → S3 Intelligent-Tiering                 │  │
│  │  │  - 180 días → S3 Glacier (archivos antiguos)       │  │
│  │  │                                                      │  │
│  │  │  Carpetas:                                          │  │
│  │  │  /facturas/                                         │  │
│  │  │  /cotizaciones/                                     │  │
│  │  │  /ordenes-compra/                                   │  │
│  │  │  /contratos/                                        │  │
│  │  │  /respaldos/                                        │  │
│  │  └─────────────────────────────────────────────────────┘  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Servicios Adicionales AWS                  │  │
│  │                                                         │  │
│  │  • IAM: Roles y Políticas                              │  │
│  │  • CloudWatch: Monitoreo y Logs                        │  │
│  │  • SNS: Notificaciones (alertas)                       │  │
│  │  • AWS Secrets Manager: Credenciales                   │  │
│  │  • Auto Scaling: Escalamiento automático               │  │
│  └────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────┐
                    │     USUARIOS FINALES             │
                    │  • Navegadores Web               │
                    │  • Aplicaciones Móviles          │
                    └──────────────────────────────────┘
```

---

## 🖥️ CONFIGURACIÓN DE EC2

### Instancias Backend

**Tipo de Instancia:** t3.medium
- **vCPU:** 2
- **RAM:** 4 GB
- **Red:** Hasta 5 Gbps
- **Almacenamiento:** 30 GB EBS (gp3)

**Sistema Operativo:** Ubuntu Server 22.04 LTS

**Software Instalado:**
```bash
# Python 3.11
# FastAPI
# Uvicorn (ASGI Server)
# PostgreSQL client
# AWS CLI
# Nginx (Reverse Proxy)
```

**Security Group - Backend:**
```
Inbound Rules:
- Port 22 (SSH) from Bastion Host only
- Port 8000 (HTTP) from ALB only
- Port 443 (HTTPS) from ALB only

Outbound Rules:
- All traffic to Internet
- Port 5432 to RDS Security Group
```

### Auto Scaling Configuration

```json
{
  "AutoScalingGroupName": "erp-backend-asg",
  "MinSize": 2,
  "MaxSize": 5,
  "DesiredCapacity": 2,
  "HealthCheckType": "ELB",
  "HealthCheckGracePeriod": 300,
  "LaunchTemplate": {
    "LaunchTemplateName": "erp-backend-template",
    "Version": "$Latest"
  },
  "TargetGroupARNs": ["arn:aws:elasticloadbalancing:..."],
  "Tags": [
    {"Key": "Environment", "Value": "Production"},
    {"Key": "Project", "Value": "ERP-EnterpriseCloud"}
  ]
}
```

**Scaling Policies:**
- Scale Up: CPU > 70% por 5 minutos → Añadir 1 instancia
- Scale Down: CPU < 30% por 10 minutos → Remover 1 instancia

---

## 🗄️ CONFIGURACIÓN DE RDS (PostgreSQL)

### Especificaciones

**Motor:** PostgreSQL 14.x
**Tipo de Instancia:** db.t3.medium
- **vCPU:** 2
- **RAM:** 4 GB
- **Almacenamiento:** 100 GB SSD (gp3)
- **IOPS:** 3000

**Multi-AZ:** Habilitado (alta disponibilidad)
**Réplica de Lectura:** 1 (opcional, para reportes)

**Configuración de Backups:**
- **Automated Backups:** Habilitado
- **Retention Period:** 7 días
- **Backup Window:** 03:00-04:00 UTC
- **Maintenance Window:** Domingo 04:00-05:00 UTC

**Parameter Group Personalizado:**
```
max_connections = 200
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
work_mem = 10MB
```

**Security Group - RDS:**
```
Inbound Rules:
- Port 5432 (PostgreSQL) from EC2 Security Group only

Outbound Rules:
- None (no outbound traffic needed)
```

---

## 📦 CONFIGURACIÓN DE S3

### Bucket Principal

**Nombre:** erp-enterprisecloud-documents
**Región:** us-east-1
**Versionado:** Habilitado
**Cifrado:** AES-256 (Server-Side Encryption)

**Estructura de Carpetas:**
```
erp-enterprisecloud-documents/
├── facturas/
│   ├── 2026/
│   │   ├── 09/
│   │   └── 10/
│   └── 2027/
├── cotizaciones/
│   ├── 2026/
│   └── 2027/
├── ordenes-compra/
│   ├── 2026/
│   └── 2027/
├── contratos/
│   ├── clientes/
│   └── proveedores/
├── documentos-identidad/
│   ├── dni/
│   └── ruc/
└── respaldos/
    ├── database/
    └── configuracion/
```

**Lifecycle Policy:**
```json
{
  "Rules": [
    {
      "Id": "TransitionToIntelligentTiering",
      "Status": "Enabled",
      "Transitions": [
        {
          "Days": 90,
          "StorageClass": "INTELLIGENT_TIERING"
        }
      ]
    },
    {
      "Id": "ArchiveOldDocuments",
      "Status": "Enabled",
      "Prefix": "facturas/",
      "Transitions": [
        {
          "Days": 365,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

**Bucket Policy (Ejemplo):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::123456789012:role/EC2-S3-Access-Role"
      },
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::erp-enterprisecloud-documents/*",
        "arn:aws:s3:::erp-enterprisecloud-documents"
      ]
    }
  ]
}
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": [
      "https://erp-enterprisecloud.com",
      "http://localhost:5173"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 🔒 CONFIGURACIÓN DE SEGURIDAD

### IAM Roles

#### EC2 Instance Role

**Role Name:** EC2-ERP-Backend-Role

**Políticas Adjuntadas:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::erp-enterprisecloud-documents/*",
        "arn:aws:s3:::erp-enterprisecloud-documents"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue"
      ],
      "Resource": "arn:aws:secretsmanager:us-east-1:*:secret:erp/db/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:*:log-group:/aws/ec2/erp-backend"
    }
  ]
}
```

### AWS Secrets Manager

**Secretos Almacenados:**

1. **Database Credentials**
   - Secret Name: `erp/db/credentials`
   - Content:
     ```json
     {
       "username": "erp_admin",
       "password": "XXXXXXXXXXXXX",
       "host": "erp-db.xxxx.us-east-1.rds.amazonaws.com",
       "port": 5432,
       "database": "erp_enterprisecloud"
     }
     ```

2. **JWT Secret Key**
   - Secret Name: `erp/jwt/secret`
   - Content: `{"secret_key": "XXXXXXXXXXXXX"}`

3. **AWS Access Keys (para S3)**
   - Secret Name: `erp/aws/credentials`
   - Content:
     ```json
     {
       "access_key_id": "AKIA...",
       "secret_access_key": "XXXXXXXXXXXXX"
     }
     ```

---

## 📊 MONITOREO CON CLOUDWATCH

### Métricas Monitoreadas

#### EC2 Instances
- CPU Utilization
- Network In/Out
- Disk Read/Write
- Status Checks

#### RDS Database
- CPU Utilization
- Database Connections
- Read/Write IOPS
- Free Storage Space
- Replica Lag (si aplica)

#### S3 Bucket
- Number of Objects
- Bucket Size
- All Requests
- 4xx/5xx Errors

#### Application Load Balancer
- Active Connection Count
- Request Count
- Target Response Time
- HTTP 2xx/4xx/5xx Count

### Alarmas Configuradas

```json
{
  "AlarmName": "EC2-High-CPU",
  "MetricName": "CPUUtilization",
  "Namespace": "AWS/EC2",
  "Statistic": "Average",
  "Period": 300,
  "EvaluationPeriods": 2,
  "Threshold": 80.0,
  "ComparisonOperator": "GreaterThanThreshold",
  "AlarmActions": ["arn:aws:sns:us-east-1:123456789012:erp-alerts"]
}
```

### CloudWatch Logs

**Log Groups:**
- `/aws/ec2/erp-backend` - Logs de aplicación
- `/aws/rds/instance/erp-db/postgresql` - Logs de base de datos
- `/aws/lambda/erp-functions` - Logs de funciones Lambda (si aplica)

---

## 🌐 CONFIGURACIÓN DE RED

### VPC Configuration

**VPC CIDR:** 10.0.0.0/16

**Subnets:**

| Nombre | Tipo | CIDR | AZ | Uso |
|--------|------|------|----|----|
| Public-1a | Pública | 10.0.1.0/24 | us-east-1a | ALB, NAT Gateway |
| Public-1b | Pública | 10.0.2.0/24 | us-east-1b | Redundancia |
| Private-1a | Privada | 10.0.10.0/24 | us-east-1a | EC2 Backend |
| Private-1b | Privada | 10.0.11.0/24 | us-east-1b | EC2 Backend |
| Database-1a | Privada | 10.0.20.0/24 | us-east-1a | RDS Master |
| Database-1b | Privada | 10.0.21.0/24 | us-east-1b | RDS Standby |

**Route Tables:**

Public Subnet:
```
Destination         Target
10.0.0.0/16        local
0.0.0.0/0          igw-xxxxx (Internet Gateway)
```

Private Subnet:
```
Destination         Target
10.0.0.0/16        local
0.0.0.0/0          nat-xxxxx (NAT Gateway)
```

---

## 💰 ESTIMACIÓN DE COSTOS MENSUAL

| Servicio | Configuración | Costo Aprox. (USD) |
|----------|--------------|-------------------|
| **EC2 (2x t3.medium)** | 730 hrs/mes cada una | $60.74 |
| **Application Load Balancer** | 730 hrs + datos | $25.00 |
| **RDS PostgreSQL (db.t3.medium)** | Multi-AZ, 100GB | $85.00 |
| **S3 Standard** | 50 GB almacenamiento | $1.15 |
| **S3 Requests** | 100,000 PUT/GET/mes | $0.50 |
| **Data Transfer Out** | 10 GB/mes | $0.90 |
| **CloudWatch** | Logs + Métricas | $10.00 |
| **Secrets Manager** | 3 secretos | $1.20 |
| **Route 53** | 1 hosted zone | $0.50 |
| **NAT Gateway** | 730 hrs + datos | $35.00 |
| **Backups y Snapshots** | 50 GB | $2.50 |
| **TOTAL MENSUAL** | | **~$222.49/mes** |

**Nota:** Costos pueden variar según uso real. AWS ofrece créditos educativos.

---

## 🚀 PROCESO DE DESPLIEGUE

### 1. Configuración Inicial

```bash
# 1. Crear VPC y Subnets
aws ec2 create-vpc --cidr-block 10.0.0.0/16 --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=ERP-VPC}]'

# 2. Crear RDS Instance
aws rds create-db-instance \
  --db-instance-identifier erp-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --master-username erp_admin \
  --master-user-password XXXXXXXXXXXXX \
  --allocated-storage 100 \
  --vpc-security-group-ids sg-xxxxx \
  --multi-az

# 3. Crear S3 Bucket
aws s3api create-bucket \
  --bucket erp-enterprisecloud-documents \
  --region us-east-1

aws s3api put-bucket-versioning \
  --bucket erp-enterprisecloud-documents \
  --versioning-configuration Status=Enabled
```

### 2. Despliegue de Backend en EC2

```bash
# Script de User Data para EC2
#!/bin/bash
apt-get update
apt-get install -y python3.11 python3-pip nginx

# Instalar dependencias
pip3 install fastapi uvicorn psycopg2-binary boto3 python-jose

# Clonar repositorio
git clone https://github.com/tu-repo/erp-backend.git /opt/erp

# Configurar servicio systemd
cat > /etc/systemd/system/erp-backend.service <<EOF
[Unit]
Description=ERP Backend Service
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/erp
ExecStart=/usr/local/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl enable erp-backend
systemctl start erp-backend
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] VPC y Subnets creadas
- [ ] Security Groups configurados
- [ ] RDS PostgreSQL desplegado y accesible
- [ ] S3 Bucket creado con políticas
- [ ] IAM Roles y Policies configuradas
- [ ] EC2 Launch Template creado
- [ ] Auto Scaling Group configurado
- [ ] Application Load Balancer desplegado
- [ ] CloudWatch Alarms configuradas
- [ ] Secrets Manager con credenciales
- [ ] Backend desplegado en EC2
- [ ] Conexión Backend → RDS verificada
- [ ] Conexión Backend → S3 verificada
- [ ] DNS (Route 53) configurado
- [ ] SSL/TLS certificado instalado
- [ ] Pruebas de carga realizadas
- [ ] Documentación completa

---

**Elaborado por:** Sistema Kiro AI  
**Fecha:** Septiembre 2026  
**Versión:** 1.0  
**Estado:** Listo para implementación

