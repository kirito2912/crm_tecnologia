# Documentación Técnica — DataTech Analytics CRM
**Versión:** 2.0.0  
**Fecha:** Septiembre 2026  
**Repositorio:** https://github.com/kirito2912/crm_tecnologia

---

## 1. Descripción General

DataTech Analytics CRM es una plataforma empresarial B2B para análisis comparativo de datasets, gestión de reportes de auditoría, control de documentos corporativos y administración de usuarios con autenticación de doble factor (2FA/OTP).

El sistema está diseñado con una arquitectura cliente-servidor desacoplada:
- **Frontend** → React + TypeScript, desplegado en Vercel
- **Backend** → FastAPI (Python), desplegado en Render
- **Base de datos** → PostgreSQL en Supabase

---

## 2. Arquitectura General

```
┌─────────────────────┐        HTTPS/REST        ┌─────────────────────┐
│                     │ ──────────────────────→  │                     │
│   Frontend (Vercel) │                           │  Backend (Render)   │
│   React + Vite      │ ←──────────────────────  │  FastAPI + Python   │
│                     │        JSON API           │                     │
└─────────────────────┘                           └──────────┬──────────┘
                                                             │
                                                    PostgreSQL (SSL)
                                                             │
                                                  ┌──────────▼──────────┐
                                                  │   Supabase          │
                                                  │   (us-west-2)       │
                                                  └─────────────────────┘
```

---

## 3. Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|---|---|---|
| Python | 3.11.9 | Lenguaje base |
| FastAPI | 0.141.1 | Framework API REST |
| SQLAlchemy | 2.0.52 | ORM para base de datos |
| Pydantic | 2.13.4 | Validación de esquemas |
| psycopg2-binary | 2.9.12 | Driver PostgreSQL |
| uvicorn | 0.52.4 | Servidor ASGI |
| python-multipart | 0.0.32 | Subida de archivos |
| python-dotenv | 1.2.3 | Variables de entorno |

### Frontend
| Tecnología | Versión | Uso |
|---|---|---|
| React | 19.2.8 | Framework UI |
| TypeScript | 6.0.2 | Tipado estático |
| Vite | 8.2.0 | Bundler y dev server |
| Recharts | 3.10.1 | Gráficos y visualizaciones |
| PapaParse | 5.7.0 | Parseo de archivos CSV |
| Lucide React | 1.33.0 | Iconografía |
| @supabase/supabase-js | 2.112.4 | Cliente Supabase (autenticación futura) |

### Infraestructura
| Servicio | Uso |
|---|---|
| Supabase | Base de datos PostgreSQL + almacenamiento |
| Render | Hosting del backend FastAPI |
| Vercel | Hosting del frontend React |
| Gmail SMTP | Envío de emails OTP e invitaciones |

---

## 4. Estructura del Proyecto

```
crm_tecnologia/
├── CRM_tecnologia_backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── login/              # Router legacy OTP
│   │   │   └── v1/
│   │   │       ├── api.py          # Agrupador de routers
│   │   │       └── endpoints/
│   │   │           ├── auth.py         # Autenticación
│   │   │           ├── usuarios.py     # CRUD usuarios
│   │   │           ├── datasets_ml.py  # CRUD datasets
│   │   │           ├── reportes.py     # CRUD reportes
│   │   │           ├── documentos.py   # CRUD documentos
│   │   │           └── invitaciones.py # Sistema de invitaciones
│   │   ├── core/
│   │   │   ├── config.py           # Settings y variables de entorno
│   │   │   └── security.py         # Hash PBKDF2 y JWT manual
│   │   ├── db/
│   │   │   ├── conexion.py         # Engine SQLAlchemy + fallback SQLite
│   │   │   └── seed_data.py        # Datos iniciales
│   │   ├── models/                 # Modelos SQLAlchemy
│   │   ├── schemas/                # Schemas Pydantic
│   │   ├── services/
│   │   │   ├── auth_service.py     # Lógica OTP
│   │   │   ├── email_service.py    # Envío de emails
│   │   │   └── otp_service.py      # Generación de códigos
│   │   └── main.py                 # App FastAPI + CORS + lifespan
│   ├── supabase_setup.sql          # DDL completo de tablas
│   ├── supabase_seed.sql           # Datos iniciales para Supabase
│   ├── requirements.txt
│   ├── Procfile                    # Comando de inicio para Render
│   └── runtime.txt                 # Versión de Python para Render
│
└── CRM_tecnologia_frontend/
    ├── src/
    │   ├── components/
    │   │   ├── auth/               # Login, OTP, pantalla de espera
    │   │   ├── admin/              # Vistas de administrador
    │   │   ├── documentos/         # Gestión de documentos
    │   │   └── layout/             # Header, Sidebar, navegación
    │   ├── context/                # State management (React Context)
    │   ├── services/               # Llamadas HTTP al backend
    │   ├── types/                  # Tipos TypeScript
    │   └── App.tsx                 # Árbol de providers y routing
    ├── vercel.json                 # Configuración SPA routing
    └── vite.config.ts
```

---

## 5. Base de Datos

### Conexión
- **Host:** `aws-0-us-west-2.pooler.supabase.com`
- **Puerto:** `6543` (Transaction Pooler — compatible con IPv4)
- **Base de datos:** `postgres`
- **SSL:** requerido (`sslmode=require`)
- **Fallback local:** SQLite (`crm.db`) si PostgreSQL no responde

### Tablas

#### `users` — Sistema OTP/JWT
| Campo | Tipo | Descripción |
|---|---|---|
| id | SERIAL PK | ID autoincremental |
| email | VARCHAR(255) UNIQUE | Correo único |
| full_name | VARCHAR(255) | Nombre completo |
| password_hash | VARCHAR(255) | Hash PBKDF2-SHA256 |
| role | VARCHAR(50) | `analista` \| `administrador` |
| is_active | BOOLEAN | Cuenta activa |
| is_verified | BOOLEAN | Email verificado |
| created_at / updated_at | TIMESTAMP | Auditoría |

#### `usuarios` — Gestión CRM principal
| Campo | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(50) PK | ID manual (ej: `USR-ADMIN`) |
| nombre | VARCHAR(150) | Nombre completo |
| email | VARCHAR(150) UNIQUE | Correo corporativo |
| password_hash | VARCHAR(255) | Hash PBKDF2-SHA256 |
| rol | VARCHAR(80) | `analista` \| `administrador` \| `programador` \| `auditor` |
| empresa | VARCHAR(150) | Empresa del usuario |
| avatar | VARCHAR(10) | Iniciales (ej: `EC`) |
| habilitado | BOOLEAN | Acceso permitido |
| estado | VARCHAR(50) | `activo` \| `deshabilitado` \| `pendiente_aprobacion` |
| invitado_por | VARCHAR(150) | Quién invitó al usuario |

#### `otp_codes` — Códigos de verificación
| Campo | Tipo | Descripción |
|---|---|---|
| id | SERIAL PK | |
| email | VARCHAR(255) | Email del solicitante |
| code | VARCHAR(6) | Código de 6 dígitos |
| expires_at | TIMESTAMP | Expiración (10 min) |
| is_used | BOOLEAN | Si ya fue consumido |
| user_id | FK → users.id | Usuario relacionado |

#### `invitaciones` — Invitaciones de acceso
| Campo | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(50) PK | ID manual (ej: `INV-001`) |
| email | VARCHAR(150) | Email del invitado |
| rol_asignado | VARCHAR(80) | Rol que tendrá al registrarse |
| token | VARCHAR(100) UNIQUE | Token de validación del enlace |
| estado | VARCHAR(50) | `pendiente` \| `registrado` \| `cancelado` \| `expirado` |
| expires_at | TIMESTAMP | Expiración (7 días) |

#### `datasets_ml` — Datasets de análisis
| Campo | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(100) PK | ID único del dataset |
| nombre | VARCHAR(200) | Nombre descriptivo |
| categoria | VARCHAR(100) | Categoría empresarial |
| registros_totales | INTEGER | Total de filas |
| features_count | INTEGER | Número de columnas |
| columnas_json | JSONB | Array de nombres de columnas |
| muestra_filas_json | JSONB | Primeras 50 filas como muestra |

#### `reportes_comparativos` — Auditorías
| Campo | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(50) PK | ID (ej: `REP-2026-001`) |
| analista_id | VARCHAR(50) | ID del analista autor |
| dataset_a_id / b_id | VARCHAR(100) | Datasets comparados |
| estado | VARCHAR(50) | `recibido` \| `en_revision` \| `aprobado` \| `con_observaciones` |
| metricas_json | JSONB | Métricas calculadas |
| feedback_admin | TEXT | Retroalimentación del admin |

#### `documentos` — Repositorio de archivos
| Campo | Tipo | Descripción |
|---|---|---|
| id | VARCHAR(50) PK | ID único |
| nombre | VARCHAR(255) | Nombre del archivo |
| tipo | VARCHAR(20) | `pdf` \| `docx` \| `doc` |
| archivo_base64 | TEXT | Contenido binario en base64 |
| archivo_url | VARCHAR(500) | Ruta en disco (local) |
| destinatarios_roles | JSONB | Roles que pueden ver el doc |

#### Tablas de datos de negocio
- `clientes` — Cartera de clientes B2B
- `productos` — Inventario de hardware
- `ventas` — Transacciones y órdenes
- `categorias_hardware` — Categorías con métricas de facturación
- `historico_ventas_mensual` — Histórico mensual de ingresos vs meta

---

## 6. API REST — Endpoints

**Base URL:** `https://crm-backend.onrender.com/api/v1`  
**Documentación interactiva:** `/docs` (Swagger UI)

### Autenticación — `/auth`
| Método | Endpoint | Descripción |
|---|---|---|
| POST | `/auth/login` | Login con email + contraseña |
| POST | `/auth/register` | Registro de nueva cuenta |
| POST | `/auth/request-otp` | Solicitar código OTP por email |
| POST | `/auth/verify-otp` | Verificar código OTP → retorna JWT |
| POST | `/auth/biometrics` | Login biométrico (simulado) |

### Usuarios — `/usuarios`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/usuarios/` | Listar todos los usuarios |
| GET | `/usuarios/{id}` | Obtener usuario por ID |
| POST | `/usuarios/` | Crear usuario |
| PATCH | `/usuarios/{id}` | Actualizar usuario |
| DELETE | `/usuarios/{id}` | Eliminar usuario |

### Datasets — `/datasets`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/datasets/` | Listar datasets |
| GET | `/datasets/{id}` | Obtener dataset con muestra de filas |
| POST | `/datasets/` | Crear/registrar dataset |
| PUT | `/datasets/{id}` | Actualizar metadatos |
| DELETE | `/datasets/{id}` | Eliminar dataset |

### Reportes — `/reportes`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/reportes/` | Listar reportes (filtro por estado/analista) |
| GET | `/reportes/{id}` | Obtener reporte completo |
| POST | `/reportes/` | Crear reporte comparativo |
| PATCH | `/reportes/{id}/estado` | Actualizar estado + feedback |
| DELETE | `/reportes/{id}` | Eliminar reporte |

### Documentos — `/documentos`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/documentos/` | Listar documentos (filtros por tipo/categoría) |
| GET | `/documentos/{id}` | Obtener documento |
| POST | `/documentos/` | Crear documento (JSON + base64) |
| POST | `/documentos/upload` | Subir archivo real (multipart) |
| GET | `/documentos/{id}/download` | Descargar archivo binario |
| PATCH | `/documentos/{id}` | Actualizar metadatos |
| DELETE | `/documentos/{id}` | Eliminar documento |

### Invitaciones — `/invitaciones`
| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/invitaciones/` | Listar invitaciones |
| POST | `/invitaciones/` | Crear invitación + enviar email |
| GET | `/invitaciones/validar/{token}` | Validar token de invitación |
| POST | `/invitaciones/completar-registro` | Registrar usuario invitado |
| GET | `/invitaciones/dashboard` | Dashboard de usuarios e invitaciones |
| PATCH | `/invitaciones/usuarios/{id}/toggle-status` | Habilitar/deshabilitar usuario |
| DELETE | `/invitaciones/{id}` | Cancelar invitación |

---

## 7. Flujo de Autenticación

```
Usuario ingresa email + contraseña
          │
          ▼
POST /auth/request-otp
  → Valida credenciales en BD
  → Genera código OTP de 6 dígitos
  → Guarda en tabla otp_codes (expira en 10 min)
  → Envía email via Gmail SMTP
          │
          ▼
Usuario ingresa código OTP
          │
          ▼
POST /auth/verify-otp
  → Valida código en BD
  → Marca OTP como usado
  → Genera JWT firmado con HMAC-SHA256
  → Retorna token + datos del usuario
          │
          ▼
Frontend guarda sesión en localStorage
```

---

## 8. Flujo de Invitaciones

```
Admin crea invitación (POST /invitaciones/)
          │
  Genera token único + enlace
  Envía email al invitado
          │
          ▼
Invitado abre enlace (?invite_token=xxx)
          │
  GET /invitaciones/validar/{token}
  Muestra formulario de registro
          │
          ▼
Invitado completa nombre + contraseña
          │
  POST /auth/request-otp (modo invite)
  POST /invitaciones/completar-registro
  → Crea cuenta con estado: pendiente_aprobacion
          │
          ▼
Admin ve solicitud en dashboard
          │
  PATCH /invitaciones/usuarios/{id}/toggle-status
  → habilitado: true → estado: activo
          │
          ▼
Usuario puede iniciar sesión
```

---

## 9. Seguridad

### Hashing de contraseñas
- Algoritmo: **PBKDF2-HMAC-SHA256**
- Iteraciones: 100,000
- Salt: aleatorio de 32 caracteres hex
- Formato: `pbkdf2:sha256:{iteraciones}${salt}${hash}`

### JWT
- Firmado con **HMAC-SHA256**
- Payload: `sub` (user id), `email`, `exp` (expiración)
- Expiración configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 60 min)

### CORS
- Desarrollo: acepta cualquier `localhost:*` via regex
- Producción: acepta dominios `*.vercel.app` + `FRONTEND_URL` definido en env

### OTP
- 6 dígitos numéricos
- Expiración: 10 minutos
- Un solo uso — se marca `is_used=true` al verificar
- OTPs anteriores del mismo email se invalidan automáticamente

---

## 10. Variables de Entorno

### Backend (Render)
```env
DATABASE_URL       # URL PostgreSQL Supabase con pooler
JWT_SECRET_KEY     # Clave secreta para firmar JWT
ACCESS_TOKEN_EXPIRE_MINUTES  # Default: 60
OTP_EXPIRATION_MINUTES       # Default: 10
SMTP_HOST          # smtp.gmail.com
SMTP_PORT          # 465
SMTP_USE_SSL       # true
EMAIL_USER         # correo@gmail.com
EMAIL_PASSWORD     # App Password de Gmail (16 chars)
EMAIL_FROM         # Mismo que EMAIL_USER
FRONTEND_URL       # https://tu-proyecto.vercel.app
```

### Frontend (Vercel)
```env
VITE_API_URL       # https://crm-backend.onrender.com/api/v1
VITE_BACKEND_URL   # https://crm-backend.onrender.com
```

---

## 11. Despliegue

### Backend en Render
1. Nuevo Web Service → conectar repo GitHub
2. Root Directory: `CRM_tecnologia_backend`
3. Runtime: Python 3
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Agregar variables de entorno del apartado 10

### Frontend en Vercel
1. Nuevo proyecto → conectar repo GitHub
2. Root Directory: `CRM_tecnologia_frontend`
3. Framework Preset: Vite
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Agregar variables de entorno del apartado 10

### Base de datos en Supabase
1. Ejecutar `supabase_setup.sql` en SQL Editor → crea las 12 tablas
2. Ejecutar `supabase_seed.sql` en SQL Editor → inserta datos iniciales

---

## 12. Usuarios del Sistema

### Credenciales iniciales
| Rol | Email | Contraseña |
|---|---|---|
| Administrador | `eduardocaballero392@gmail.com` | `4n6yFksPaxQwzNMI` |
| Analista | `Carlosluna.enrique@gmail.com` | `analista123` |

### Roles y permisos
| Rol | Acceso |
|---|---|
| `administrador` | Dashboard completo, gestión de usuarios, invitaciones, revisión de reportes, documentos |
| `analista` | Carga de datasets, análisis comparativo, envío de reportes, documentos |
| `programador` | Acceso a documentos y datasets (requiere invitación) |
| `auditor` | Acceso de solo lectura a reportes y documentos (requiere invitación) |

---

## 13. Módulos del Frontend

### Contextos (State Management)
| Contexto | Responsabilidad |
|---|---|
| `AuthContext` | Sesión de usuario, login, logout, OTP |
| `InvitacionesContext` | Dashboard de usuarios e invitaciones, polling cada 10s |
| `ReportsContext` | CRUD de reportes comparativos |
| `CsvContext` | Carga y análisis de archivos CSV/datasets |
| `DocumentosContext` | CRUD de documentos corporativos |

### Servicios HTTP
| Servicio | Endpoints que consume |
|---|---|
| `authApi.ts` | `/auth/*` |
| `invitacionesApi.ts` | `/invitaciones/*` |
| `reportesApi.ts` | `/reportes/*` |
| `documentosApi.ts` | `/documentos/*` |
| `CsvContext.tsx` | `/datasets/*` |

---

## 14. Comandos de Desarrollo Local

### Backend
```powershell
# Instalar dependencias
py -m pip install -r requirements.txt

# Iniciar servidor de desarrollo
py -m uvicorn app.main:app --reload

# URL: http://localhost:8000
# Swagger: http://localhost:8000/docs
```

### Frontend
```powershell
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Build de producción
npm run build

# URL: http://localhost:5173
```

---

*Documentación generada para DataTech Analytics CRM v2.0.0*
