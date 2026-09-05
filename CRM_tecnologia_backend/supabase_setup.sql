-- ==============================================================
-- HARDCRM PRO — ESQUEMA COMPLETO PARA SUPABASE (PostgreSQL)
-- ==============================================================
-- Instrucciones: Ejecuta este script COMPLETO en el SQL Editor
-- de Supabase. Ir a: https://supabase.com → Tu proyecto → SQL Editor
-- Pega todo el contenido y presiona "Run".
-- ==============================================================


-- ==============================================================
-- PASO 1: EXTENSIONES NECESARIAS
-- ==============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ==============================================================
-- PASO 2: ELIMINAR TABLAS PREVIAS (si las hay, para empezar limpio)
-- Corre esto solo la primera vez o si quieres resetear todo.
-- ==============================================================
DROP TABLE IF EXISTS otp_codes         CASCADE;
DROP TABLE IF EXISTS invitaciones       CASCADE;
DROP TABLE IF EXISTS documentos         CASCADE;
DROP TABLE IF EXISTS reportes_comparativos CASCADE;
DROP TABLE IF EXISTS datasets_ml        CASCADE;
DROP TABLE IF EXISTS ventas             CASCADE;
DROP TABLE IF EXISTS productos          CASCADE;
DROP TABLE IF EXISTS clientes           CASCADE;
DROP TABLE IF EXISTS categorias_hardware CASCADE;
DROP TABLE IF EXISTS historico_ventas_mensual CASCADE;
DROP TABLE IF EXISTS usuarios           CASCADE;
DROP TABLE IF EXISTS users              CASCADE;


-- ==============================================================
-- PASO 3: CREAR TODAS LAS TABLAS
-- ==============================================================

-- ---------------------------------------------------------------
-- TABLA: users
-- Sistema de autenticación OTP / JWT
-- ---------------------------------------------------------------
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) UNIQUE NOT NULL,
    full_name       VARCHAR(255),
    password_hash   VARCHAR(255),
    role            VARCHAR(50)  NOT NULL DEFAULT 'analista',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_verified     BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);

COMMENT ON TABLE users IS 'Sistema OTP/JWT — espejo del sistema principal de usuarios';


-- ---------------------------------------------------------------
-- TABLA: usuarios
-- Sistema principal de gestión del CRM
-- ---------------------------------------------------------------
CREATE TABLE usuarios (
    id                  VARCHAR(50)  PRIMARY KEY,
    nombre              VARCHAR(150) NOT NULL,
    email               VARCHAR(150) UNIQUE NOT NULL,
    password_hash       VARCHAR(255),
    rol                 VARCHAR(80)  NOT NULL DEFAULT 'analista',
    empresa             VARCHAR(150),
    avatar              VARCHAR(10),
    biometric_verified  BOOLEAN      NOT NULL DEFAULT FALSE,
    habilitado          BOOLEAN      NOT NULL DEFAULT TRUE,
    estado              VARCHAR(50)  NOT NULL DEFAULT 'activo',
    invitado_por        VARCHAR(150),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_usuarios_rol    CHECK (rol    IN ('analista','administrador','programador','auditor')),
    CONSTRAINT ck_usuarios_estado CHECK (estado IN ('activo','deshabilitado','pendiente_aprobacion'))
);

CREATE INDEX idx_usuarios_email  ON usuarios(email);
CREATE INDEX idx_usuarios_rol    ON usuarios(rol);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);

COMMENT ON TABLE usuarios IS 'Tabla principal de usuarios del CRM — roles y control de acceso';


-- ---------------------------------------------------------------
-- TABLA: otp_codes
-- Códigos de un solo uso para verificación de email
-- ---------------------------------------------------------------
CREATE TABLE otp_codes (
    id          SERIAL      PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    code        VARCHAR(6)   NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    is_used     BOOLEAN      NOT NULL DEFAULT FALSE,
    user_id     INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_otp_email ON otp_codes(email);

COMMENT ON TABLE otp_codes IS 'Códigos OTP de 6 dígitos para verificación de correo electrónico';


-- ---------------------------------------------------------------
-- TABLA: invitaciones
-- Invitaciones que el admin envía a nuevos usuarios
-- ---------------------------------------------------------------
CREATE TABLE invitaciones (
    id                  VARCHAR(50)  PRIMARY KEY,
    email               VARCHAR(150) NOT NULL,
    nombre_referencial  VARCHAR(150),
    rol_asignado        VARCHAR(80)  NOT NULL DEFAULT 'analista',
    token               VARCHAR(100) UNIQUE NOT NULL,
    estado              VARCHAR(50)  NOT NULL DEFAULT 'pendiente',
    creado_por          VARCHAR(150) NOT NULL DEFAULT 'Administrador',
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMP    NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),

    CONSTRAINT ck_invitaciones_estado CHECK (estado IN ('pendiente','registrado','cancelado','expirado'))
);

CREATE INDEX idx_invitaciones_email  ON invitaciones(email);
CREATE INDEX idx_invitaciones_token  ON invitaciones(token);
CREATE INDEX idx_invitaciones_estado ON invitaciones(estado);

COMMENT ON TABLE invitaciones IS 'Invitaciones de registro enviadas por el administrador';


-- ---------------------------------------------------------------
-- TABLA: datasets_ml
-- Datasets de análisis comparativo y machine learning
-- ---------------------------------------------------------------
CREATE TABLE datasets_ml (
    id                  VARCHAR(100) PRIMARY KEY,
    nombre              VARCHAR(200) NOT NULL,
    categoria           VARCHAR(100) NOT NULL DEFAULT 'Empresarial',
    registros_totales   INTEGER      NOT NULL DEFAULT 0,
    features_count      INTEGER      NOT NULL DEFAULT 0,
    columna_objetivo    VARCHAR(100),
    tamanio_archivo     VARCHAR(30),
    descripcion         TEXT,
    columnas_json       JSONB,
    muestra_filas_json  JSONB,
    creado_por          VARCHAR(100),
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_datasets_categoria ON datasets_ml(categoria);

COMMENT ON TABLE datasets_ml IS 'Datasets de ML/Big Data cargados por analistas para análisis comparativo';


-- ---------------------------------------------------------------
-- TABLA: reportes_comparativos
-- Reportes de auditoría comparativa entre dos datasets
-- ---------------------------------------------------------------
CREATE TABLE reportes_comparativos (
    id                  VARCHAR(50)  PRIMARY KEY,
    titulo              VARCHAR(200) NOT NULL,
    analista_id         VARCHAR(50)  NOT NULL,
    analista_nombre     VARCHAR(150) NOT NULL,
    dataset_a_id        VARCHAR(100) NOT NULL,
    dataset_a_nombre    VARCHAR(150) NOT NULL,
    dataset_b_id        VARCHAR(100) NOT NULL,
    dataset_b_nombre    VARCHAR(150) NOT NULL,
    resumen_ejecutivo   TEXT         NOT NULL,
    hallazgos_clave     TEXT,
    metricas_json       JSONB,
    recomendaciones     TEXT,
    estado              VARCHAR(50)  NOT NULL DEFAULT 'recibido',
    feedback_admin      TEXT,
    admin_responsable   VARCHAR(150),
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_reportes_estado CHECK (estado IN ('recibido','en_revision','aprobado','con_observaciones'))
);

CREATE INDEX idx_reportes_analista_id ON reportes_comparativos(analista_id);
CREATE INDEX idx_reportes_estado      ON reportes_comparativos(estado);

COMMENT ON TABLE reportes_comparativos IS 'Reportes de auditoría comparativa entre dos datasets enviados por analistas';


-- ---------------------------------------------------------------
-- TABLA: documentos
-- Documentos PDF/Word subidos por usuarios del CRM
-- ---------------------------------------------------------------
CREATE TABLE documentos (
    id                  VARCHAR(50)  PRIMARY KEY,
    nombre              VARCHAR(255) NOT NULL,
    tipo                VARCHAR(20)  NOT NULL,
    tamanio             VARCHAR(50)  NOT NULL,
    tamanio_bytes       INTEGER      NOT NULL DEFAULT 0,
    categoria           VARCHAR(100) NOT NULL DEFAULT 'General',
    descripcion         TEXT,
    archivo_url         VARCHAR(500),
    archivo_base64      TEXT,
    subido_por          VARCHAR(150) NOT NULL,
    usuario_id          VARCHAR(50),
    usuario_rol         VARCHAR(50)  NOT NULL DEFAULT 'analista',
    tags_json           JSONB,
    destinatarios_roles JSONB        DEFAULT '["todos"]'::jsonb,
    created_at          TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP    NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_documentos_tipo CHECK (tipo IN ('pdf','word','docx','doc'))
);

CREATE INDEX idx_documentos_nombre     ON documentos(nombre);
CREATE INDEX idx_documentos_tipo       ON documentos(tipo);
CREATE INDEX idx_documentos_categoria  ON documentos(categoria);
CREATE INDEX idx_documentos_usuario_id ON documentos(usuario_id);

COMMENT ON TABLE documentos IS 'Documentos PDF/Word compartidos entre usuarios del CRM';


-- ---------------------------------------------------------------
-- TABLA: clientes
-- Base de clientes B2B del CRM
-- ---------------------------------------------------------------
CREATE TABLE clientes (
    id              VARCHAR(50)     PRIMARY KEY,
    nombre          VARCHAR(150)    NOT NULL,
    empresa         VARCHAR(150)    NOT NULL,
    email           VARCHAR(150)    NOT NULL,
    sector          VARCHAR(80)     NOT NULL,
    total_comprado  DECIMAL(12,2)   NOT NULL DEFAULT 0.00,
    estado          VARCHAR(30)     NOT NULL DEFAULT 'Activo',
    ultimo_contacto VARCHAR(50),
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_clientes_estado CHECK (estado IN ('Activo','En Riesgo','Prospecto'))
);

CREATE INDEX idx_clientes_email  ON clientes(email);
CREATE INDEX idx_clientes_estado ON clientes(estado);

COMMENT ON TABLE clientes IS 'Clientes corporativos B2B — cartera activa del CRM';


-- ---------------------------------------------------------------
-- TABLA: categorias_hardware
-- Categorías de productos de hardware con métricas de facturación
-- ---------------------------------------------------------------
CREATE TABLE categorias_hardware (
    id                      SERIAL          PRIMARY KEY,
    nombre                  VARCHAR(100)    NOT NULL,
    porcentaje_participacion INTEGER,
    color_hex               VARCHAR(20),
    facturacion_estimada    DECIMAL(12,2)
);

COMMENT ON TABLE categorias_hardware IS 'Categorías de hardware con datos de participación de mercado y facturación';


-- ---------------------------------------------------------------
-- TABLA: productos
-- Inventario de productos/equipos de hardware
-- ---------------------------------------------------------------
CREATE TABLE productos (
    id              VARCHAR(50)     PRIMARY KEY,
    codigo          VARCHAR(50)     UNIQUE NOT NULL,
    nombre          VARCHAR(200)    NOT NULL,
    categoria       VARCHAR(100)    NOT NULL,
    stock           INTEGER         NOT NULL DEFAULT 0,
    stock_minimo    INTEGER         NOT NULL DEFAULT 5,
    precio_unitario DECIMAL(10,2)   NOT NULL,
    estado          VARCHAR(30)     NOT NULL DEFAULT 'Disponible',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_productos_estado CHECK (estado IN ('Disponible','Bajo Stock','Agotado'))
);

CREATE INDEX idx_productos_codigo    ON productos(codigo);
CREATE INDEX idx_productos_categoria ON productos(categoria);

COMMENT ON TABLE productos IS 'Catálogo de productos de hardware: servidores, laptops, monitores, redes, storage';


-- ---------------------------------------------------------------
-- TABLA: ventas
-- Transacciones y órdenes de venta
-- ---------------------------------------------------------------
CREATE TABLE ventas (
    id              VARCHAR(50)     PRIMARY KEY,
    fecha           VARCHAR(50)     NOT NULL,
    cliente_nombre  VARCHAR(150)    NOT NULL,
    producto_nombre VARCHAR(200)    NOT NULL,
    cantidad        INTEGER         NOT NULL,
    monto_total     DECIMAL(12,2)   NOT NULL,
    estado          VARCHAR(30)     NOT NULL DEFAULT 'Completada',
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT ck_ventas_estado CHECK (estado IN ('Completada','Pendiente','Procesando'))
);

CREATE INDEX idx_ventas_estado ON ventas(estado);

COMMENT ON TABLE ventas IS 'Registro de transacciones y ventas B2B';


-- ---------------------------------------------------------------
-- TABLA: historico_ventas_mensual
-- Histórico mensual de ingresos vs meta
-- ---------------------------------------------------------------
CREATE TABLE historico_ventas_mensual (
    mes      VARCHAR(20)   PRIMARY KEY,
    ingresos DECIMAL(12,2) NOT NULL,
    meta     DECIMAL(12,2) NOT NULL
);

COMMENT ON TABLE historico_ventas_mensual IS 'Histórico mensual de ingresos reales vs meta — usado para gráficos de rendimiento';


-- ==============================================================
-- PASO 4: FUNCIÓN AUTOMÁTICA updated_at
-- Actualiza el campo updated_at automáticamente en cada UPDATE
-- ==============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a las tablas que tienen updated_at
CREATE TRIGGER set_updated_at_reportes
    BEFORE UPDATE ON reportes_comparativos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_documentos
    BEFORE UPDATE ON documentos
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_users
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ==============================================================
-- PASO 5: ROW LEVEL SECURITY (RLS)
-- Habilitado pero permisivo — el control real lo hace FastAPI.
-- Ajusta según necesites reglas más estrictas en el futuro.
-- ==============================================================
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios                ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_codes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitaciones            ENABLE ROW LEVEL SECURITY;
ALTER TABLE datasets_ml             ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes_comparativos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE documentos              ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias_hardware     ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos               ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_ventas_mensual ENABLE ROW LEVEL SECURITY;

-- Política abierta para el rol de servicio (service_role) que usa el backend
-- service_role bypasea RLS por defecto en Supabase, estas políticas aplican
-- al anon key si alguna vez lo usas directamente desde el frontend.
CREATE POLICY "backend_full_access_users"                ON users                    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_usuarios"             ON usuarios                 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_otp"                  ON otp_codes                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_invitaciones"         ON invitaciones             FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_datasets"             ON datasets_ml              FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_reportes"             ON reportes_comparativos    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_documentos"           ON documentos               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_clientes"             ON clientes                 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_categorias"           ON categorias_hardware      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_productos"            ON productos                FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_ventas"               ON ventas                   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "backend_full_access_historico"            ON historico_ventas_mensual FOR ALL USING (true) WITH CHECK (true);
