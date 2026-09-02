-- ==========================================================
-- HARDCRM PRO - ESQUEMA DE BASE DE DATOS B2B & BIG DATA
-- ==========================================================

-- 1. TABLA DE USUARIOS & ACCESO
CREATE TABLE IF NOT EXISTS usuarios (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    rol VARCHAR(80) DEFAULT 'Senior B2B Sales Executive',
    empresa VARCHAR(150),
    avatar VARCHAR(10),
    biometric_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    producto_nombre VARCHAR(200) NOT NULL,
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

-- ==========================================================
-- INSERTANDO LOS DATOS SEMILLA (MOCK DATA COMPLETO)
-- ==========================================================

-- Usuarios
INSERT INTO usuarios (id, nombre, email, rol, empresa, avatar, biometric_verified) VALUES
('USR-001', 'Jane Doe', 'jane@company.com', 'Big Data Lead', 'HardCRM Enterprise', 'JD', TRUE),
('USR-002', 'Carlos Mendoza', 'carlos.m@hardcrm.tech', 'Senior B2B Sales Executive', 'NovaPay Solutions', 'CM', TRUE),
('USR-003', 'Elena Rostova', 'elena@datacore.io', 'Hardware Infrastructure Architect', 'Dell & Cisco Partner Labs', 'ER', TRUE);

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
('PRD-04', 'SW-10G24', 'Cisco Catalyst 9300 24-Port 10GbE', 'Redes y Switches', 14, 5, 4150.00, 'Disponible'),
('PRD-05', 'SAN-NAS96', 'Synology Enterprise RackStation 96TB', 'Storage & SAN Backup', 2, 4, 6200.00, 'Bajo Stock');

-- Ventas
INSERT INTO ventas (id, fecha, cliente_nombre, producto_nombre, cantidad, monto_total, estado) VALUES
('TRX-8901', '19 Ago 2026', 'Banco Atlántico Tech', '12x Dell UltraSharp 32" 4K', 12, 9840.00, 'Completada'),
('TRX-8900', '18 Ago 2026', 'CloudCore Systems', '4x Servidor Dell PowerEdge R740', 4, 33800.00, 'Completada'),
('TRX-8899', '17 Ago 2026', 'BioHealth Analytics', '8x ThinkPad P16 + 8x Monitor 4K', 16, 29680.00, 'Completada'),
('TRX-8898', '16 Ago 2026', 'NovaPay Solutions', '2x Cisco Catalyst 9300', 2, 8300.00, 'Pendiente'),
('TRX-8897', '15 Ago 2026', 'LogiData Global', '1x Synology Enterprise 96TB', 1, 6200.00, 'Completada');

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
