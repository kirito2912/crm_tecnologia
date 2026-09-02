-- ==========================================================
-- HARDCRM PRO - ESQUEMA DE BASE DE DATOS B2B & BIG DATA
-- MODELO REMODELADO: AUTENTICACIÓN OTP & ACCESO POR CORREO
-- ==========================================================

-- 1. TABLA DE USUARIOS (users)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 1.1 TABLA DE CÓDIGOS OTP (otp_codes)
CREATE TABLE IF NOT EXISTS otp_codes (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    code VARCHAR(6) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE NOT NULL,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. TABLA DE CLIENTES B2B
CREATE TABLE IF NOT EXISTS clientes (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    empresa VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL,
    sector VARCHAR(80) NOT NULL,
    total_comprado DECIMAL(12, 2) DEFAULT 0.00,
    estado VARCHAR(30) CHECK (estado IN ('Activo', 'En Riesgo', 'Prospecto')),
    ultimo_contacto VARCHAR(50)
);

-- 3. TABLA DE CATEGORÍAS DE HARDWARE
CREATE TABLE IF NOT EXISTS categorias_hardware (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    porcentaje_participacion INT,
    color_hex VARCHAR(20),
    facturacion_estimada DECIMAL(12, 2)
);

-- 4. TABLA DE PRODUCTOS & INVENTARIO DE SERVIDORES
CREATE TABLE IF NOT EXISTS productos (
    id VARCHAR(50) PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    categoria_id INT REFERENCES categorias_hardware(id),
    stock INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(30) CHECK (estado IN ('Disponible', 'Bajo Stock', 'Agotado'))
);

-- 5. TABLA DE TRANSACCIONES / VENTAS
CREATE TABLE IF NOT EXISTS ventas (
    id VARCHAR(50) PRIMARY KEY,
    fecha VARCHAR(50) NOT NULL,
    cliente_nombre VARCHAR(150) NOT NULL,
    cliente_id VARCHAR(50) REFERENCES clientes(id),
    producto_nombre VARCHAR(200) NOT NULL,
    producto_id VARCHAR(50) REFERENCES productos(id),
    cantidad INT NOT NULL,
    monto_total DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(30) CHECK (estado IN ('Completada', 'Pendiente', 'Procesando'))
);

-- 6. TABLA DE HISTÓRICO MENSUAL DE INGRESOS
CREATE TABLE IF NOT EXISTS historico_ventas_mensual (
    mes VARCHAR(20) PRIMARY KEY,
    ingresos DECIMAL(12, 2) NOT NULL,
    meta DECIMAL(12, 2) NOT NULL
);

-- 7. TABLA DE DATASETS DE MACHINE LEARNING & BIG DATA
CREATE TABLE IF NOT EXISTS datasets_ml (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    categoria VARCHAR(100) NOT NULL,
    registros_totales INT NOT NULL,
    features_count INT NOT NULL,
    columna_objetivo VARCHAR(100) NOT NULL,
    tamanio_archivo VARCHAR(30),
    descripcion TEXT
);

-- 7.1 TABLA DE PREDICCIONES (relación: datasets_ml ||--o{ predicciones)
CREATE TABLE IF NOT EXISTS predicciones (
    id VARCHAR(50) PRIMARY KEY,
    dataset_id VARCHAR(50) NOT NULL REFERENCES datasets_ml(id),
    entidad_referencia_id VARCHAR(50),
    valor_predicho DECIMAL(12, 4),
    probabilidad DECIMAL(5, 4),
    fecha_prediccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7.2 TABLA DE FACTORES SHAP (relación: predicciones ||--o{ factores_shap)
CREATE TABLE IF NOT EXISTS factores_shap (
    id VARCHAR(50) PRIMARY KEY,
    prediccion_id VARCHAR(50) NOT NULL REFERENCES predicciones(id),
    feature_nombre VARCHAR(150) NOT NULL,
    shap_value DECIMAL(12, 6) NOT NULL,
    impacto VARCHAR(20) CHECK (impacto IN ('Positivo', 'Negativo', 'Neutro'))
);

-- 7.3 TABLA DE RECOMENDACIONES (relación: predicciones ||--o{ recomendaciones)
CREATE TABLE IF NOT EXISTS recomendaciones (
    id VARCHAR(50) PRIMARY KEY,
    prediccion_id VARCHAR(50) NOT NULL REFERENCES predicciones(id),
    tipo_accion VARCHAR(100) NOT NULL,
    descripcion TEXT,
    prioridad VARCHAR(20) CHECK (prioridad IN ('Alta', 'Media', 'Baja')),
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================================
-- ÍNDICES RECOMENDADOS
-- ==========================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email);
CREATE INDEX IF NOT EXISTS idx_otp_codes_user_id ON otp_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_cliente_id ON ventas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_ventas_producto_id ON ventas(producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_predicciones_dataset_id ON predicciones(dataset_id);
CREATE INDEX IF NOT EXISTS idx_factores_shap_prediccion_id ON factores_shap(prediccion_id);
CREATE INDEX IF NOT EXISTS idx_recomendaciones_prediccion_id ON recomendaciones(prediccion_id);

-- ==========================================================
-- INSERTANDO LOS DATOS SEMILLA (MOCK DATA COMPLETO)
-- ==========================================================

-- Usuarios (users)
INSERT INTO users (email, full_name, is_active, is_verified) VALUES
('jane@company.com', 'Jane Doe', TRUE, TRUE),
('carlos.m@hardcrm.tech', 'Carlos Mendoza', TRUE, TRUE),
('elena@datacore.io', 'Elena Rostova', TRUE, TRUE),
('carlosluna.enrique@gmail.com', 'Carlos Enrique Luna', TRUE, TRUE);

-- Categorías
INSERT INTO categorias_hardware (nombre, porcentaje_participacion, color_hex, facturacion_estimada) VALUES
('Servidores Rack', 38, '#5b5bd6', 471200.00),
('Laptops Pro Enterprise', 27, '#6366f1', 334800.00),
('Monitores 4K & Display', 18, '#818cf8', 223200.00),
('Redes y Switches 10GbE', 11, '#a5b4fc', 136400.00),
('Storage & SAN Backup', 6, '#c7d2fe', 74400.00);

-- Clientes
INSERT INTO clientes (id, nombre, empresa, email, sector, total_comprado, estado, ultimo_contacto) VALUES
('CLI-101', 'Carlos Mendoza', 'NovaPay Solutions', 'c.mendoza@novapay.io', 'Fintech', 148500.00, 'En Riesgo', 'Hace 48 días'),
('CLI-102', 'Valeria Sotomayor', 'Banco Atlántico Tech', 'v.soto@bancoatlantico.com', 'Fintech', 285000.00, 'Activo', 'Hace 3 días'),
('CLI-103', 'Roberto Díaz', 'CloudCore Systems', 'rdiaz@cloudcore.tech', 'SaaS / Cloud', 94200.00, 'Activo', 'Hace 6 días'),
('CLI-104', 'Mariana Herrera', 'LogiData Global', 'mherrera@logidata.net', 'Logística', 63800.00, 'Prospecto', 'Hace 12 días'),
('CLI-105', 'Andrés Gil', 'KuboFintech Labs', 'andres@kubofin.com', 'Fintech', 112000.00, 'En Riesgo', 'Hace 46 días'),
('CLI-106', 'Lucía Benítez', 'BioHealth Analytics', 'lucia.b@biohealth.org', 'Salud / Tech', 178000.00, 'Activo', 'Ayer');

-- Productos
INSERT INTO productos (id, codigo, nombre, categoria, stock, stock_minimo, precio_unitario, estado) VALUES
('PRD-01', 'SRV-R740', 'Servidor Rack Dell PowerEdge R740', 'Servidores Rack', 4, 12, 8450.00, 'Bajo Stock'),
('PRD-02', 'LAP-P16', 'Lenovo ThinkPad P16 Workstation', 'Laptops Pro Enterprise', 35, 10, 2890.00, 'Disponible'),
('PRD-03', 'MON-4K32', 'Dell UltraSharp 32" 4K USB-C Hub', 'Monitores 4K & Display', 42, 15, 820.00, 'Disponible'),
('PRD-04', 'SW-10G24', 'Cisco Catalyst 9300 24-Port 10GbE', 'Redes y Switches 10GbE', 14, 5, 4150.00, 'Disponible'),
('PRD-05', 'SAN-NAS96', 'Synology Enterprise RackStation 96TB', 'Storage & SAN Backup', 2, 4, 6200.00, 'Bajo Stock');

UPDATE productos p SET categoria_id = c.id
FROM categorias_hardware c
WHERE p.categoria = c.nombre;

-- Ventas
INSERT INTO ventas (id, fecha, cliente_nombre, producto_nombre, cantidad, monto_total, estado) VALUES
('TRX-8901', '19 Ago 2026', 'Banco Atlántico Tech', '12x Dell UltraSharp 32" 4K', 12, 9840.00, 'Completada'),
('TRX-8900', '18 Ago 2026', 'CloudCore Systems', '4x Servidor Dell PowerEdge R740', 4, 33800.00, 'Completada'),
('TRX-8899', '17 Ago 2026', 'BioHealth Analytics', '8x ThinkPad P16 + 8x Monitor 4K', 16, 29680.00, 'Completada'),
('TRX-8898', '16 Ago 2026', 'NovaPay Solutions', '2x Cisco Catalyst 9300', 2, 8300.00, 'Pendiente'),
('TRX-8897', '15 Ago 2026', 'LogiData Global', '1x Synology Enterprise 96TB', 1, 6200.00, 'Completada');

UPDATE ventas v SET cliente_id = c.id
FROM clientes c
WHERE v.cliente_nombre = c.empresa;

UPDATE ventas SET producto_id = 'PRD-03' WHERE id = 'TRX-8901';
UPDATE ventas SET producto_id = 'PRD-01' WHERE id = 'TRX-8900';
UPDATE ventas SET producto_id = 'PRD-02' WHERE id = 'TRX-8899';
UPDATE ventas SET producto_id = 'PRD-04' WHERE id = 'TRX-8898';
UPDATE ventas SET producto_id = 'PRD-05' WHERE id = 'TRX-8897';

-- Histórico de Facturación
INSERT INTO historico_ventas_mensual (mes, ingresos, meta) VALUES
('Ene', 210000.00, 190000.00),
('Feb', 245000.00, 220000.00),
('Mar', 290000.00, 260000.00),
('Abr', 270000.00, 280000.00),
('May', 310000.00, 300000.00),
('Jun', 325000.00, 310000.00),
('Jul', 335000.00, 330000.00),
('Ago', 342000.00, 340000.00);

-- Datasets de Big Data / ML
INSERT INTO datasets_ml (id, nombre, categoria, registros_totales, features_count, columna_objetivo, tamanio_archivo, descripcion) VALUES
('dataset-demand', 'Ventas Históricas y Demanda de Servidores B2B (2024-2026)', 'Infraestructura & Servidores', 45200, 14, 'volumen_demanda_mensual', '8.4 MB', 'Registros de compras de servidores rack Dell, HPE, switches Cisco y almacenamiento SAN por sector comercial.'),
('dataset-churn', 'Comportamiento y Probabilidad de Fuga de Cuentas B2B', 'Retención de Clientes', 12800, 18, 'riesgo_churn_score', '3.1 MB', 'Métricas de engagement, días sin contacto, NPS corporativo, tickets de soporte y renovación de contratos.'),
('dataset-cross-sell', 'Afinidad de Compra y Venta Cruzada de Equipamiento', 'Optimización de Catálogo', 18500, 11, 'next_best_offer_probability', '4.7 MB', 'Secuencias temporales de adquisición de Laptops Pro, Monitores 4K, docks Thunderbolt y licencias de nube.');