-- ==============================================================
-- HARDCRM PRO — DATOS INICIALES (SEED) PARA SUPABASE
-- ==============================================================
-- Ejecuta este script DESPUÉS de supabase_setup.sql.
-- En Supabase: SQL Editor → pega y presiona "Run".
--
-- CONTRASEÑAS de los usuarios de prueba:
--   eduardocaballero392@gmail.com → 4n6yFksPaxQwzNMI
--   analista@empresa.com          → analista123
-- ==============================================================


-- ==============================================================
-- 1. USUARIOS PRINCIPALES (tabla: users — sistema OTP/JWT)
-- ==============================================================
INSERT INTO users (email, full_name, password_hash, role, is_active, is_verified, created_at, updated_at)
VALUES
    (
        'eduardocaballero392@gmail.com',
        'Eduardo Caballero',
        'pbkdf2:sha256:100000$a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6$8ecac717596bfd1d04ce57535e6b6a6b7eb044194e91019bf35366e0eb64232d',
        'administrador',
        TRUE, TRUE,
        NOW(), NOW()
    ),
    (
        'Carlosluna.enrique@gmail.com',
        'Carlos Mendoza',
        'pbkdf2:sha256:100000$a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6$ade226df75d4fbb50c90504b60165da20c4a4f8d0eb9ed4973f0f4acaf99c198',
        'analista',
        TRUE, TRUE,
        NOW(), NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    role        = EXCLUDED.role,
    full_name   = EXCLUDED.full_name,
    password_hash = EXCLUDED.password_hash,
    is_active   = EXCLUDED.is_active,
    is_verified = EXCLUDED.is_verified,
    updated_at  = NOW();


-- ==============================================================
-- 2. USUARIOS PRINCIPALES (tabla: usuarios — sistema gestión CRM)
-- ==============================================================
INSERT INTO usuarios (id, nombre, email, password_hash, rol, empresa, avatar, biometric_verified, habilitado, estado, invitado_por, created_at)
VALUES
    (
        'USR-ADMIN',
        'Eduardo Caballero',
        'eduardocaballero392@gmail.com',
        'pbkdf2:sha256:100000$a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6$8ecac717596bfd1d04ce57535e6b6a6b7eb044194e91019bf35366e0eb64232d',
        'administrador',
        'DataTech Analytics',
        'EC',
        TRUE, TRUE,
        'activo',
        'Sistema Principal',
        NOW()
    ),
    (
        'USR-ANALISTA',
        'Carlos Mendoza',
        'Carlosluna.enrique@gmail.com',
        'pbkdf2:sha256:100000$a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6$ade226df75d4fbb50c90504b60165da20c4a4f8d0eb9ed4973f0f4acaf99c198',
        'analista',
        'DataTech Analytics',
        'CM',
        TRUE, TRUE,
        'activo',
        'Sistema Principal',
        NOW()
    )
ON CONFLICT (email) DO UPDATE SET
    rol        = EXCLUDED.rol,
    habilitado = EXCLUDED.habilitado,
    estado     = EXCLUDED.estado,
    nombre     = EXCLUDED.nombre;


-- ==============================================================
-- 3. DATASETS DE MACHINE LEARNING / BIG DATA
-- ==============================================================
INSERT INTO datasets_ml (id, nombre, categoria, registros_totales, features_count, columna_objetivo, tamanio_archivo, descripcion, columnas_json, muestra_filas_json, creado_por, created_at)
VALUES
    (
        'dataset-alfa-q3',
        'Empresa Alfa - Ventas y Catálogo Q3 2026',
        'Hardware & Servidores',
        120,
        6,
        'total_ventas',
        '1.4 MB',
        'Catálogo comercial y ventas registradas de Empresa Alfa: servidores rack, laptops workstation y switches.',
        '["Producto","Categoria","Cantidad","Precio_Unitario","Total_Ventas","Margen"]'::jsonb,
        '[
            {"Producto":"Servidor Dell PowerEdge R740","Categoria":"Servidores","Cantidad":"25","Precio_Unitario":"8450","Total_Ventas":"211250","Margen":"32%"},
            {"Producto":"Lenovo ThinkPad P16","Categoria":"Laptops","Cantidad":"60","Precio_Unitario":"2890","Total_Ventas":"173400","Margen":"28%"},
            {"Producto":"Dell UltraSharp 32 4K","Categoria":"Monitores","Cantidad":"80","Precio_Unitario":"820","Total_Ventas":"65600","Margen":"35%"},
            {"Producto":"Cisco Catalyst 9300 24P","Categoria":"Redes","Cantidad":"18","Precio_Unitario":"4150","Total_Ventas":"74700","Margen":"25%"}
        ]'::jsonb,
        'Carlos Mendoza (Analista)',
        NOW()
    ),
    (
        'dataset-beta-q3',
        'Empresa Beta - Ventas y Catálogo Q3 2026',
        'Hardware & Servidores',
        105,
        6,
        'total_ventas',
        '1.2 MB',
        'Catálogo comercial y ventas de Empresa Beta competidora en sector corporativo.',
        '["Producto","Categoria","Cantidad","Precio_Unitario","Total_Ventas","Margen"]'::jsonb,
        '[
            {"Producto":"Servidor Dell PowerEdge R740","Categoria":"Servidores","Cantidad":"18","Precio_Unitario":"8600","Total_Ventas":"154800","Margen":"30%"},
            {"Producto":"Lenovo ThinkPad P16","Categoria":"Laptops","Cantidad":"75","Precio_Unitario":"2750","Total_Ventas":"206250","Margen":"24%"},
            {"Producto":"Dell UltraSharp 32 4K","Categoria":"Monitores","Cantidad":"65","Precio_Unitario":"850","Total_Ventas":"55250","Margen":"32%"},
            {"Producto":"Cisco Catalyst 9300 24P","Categoria":"Redes","Cantidad":"30","Precio_Unitario":"3890","Total_Ventas":"116700","Margen":"22%"}
        ]'::jsonb,
        'Carlos Mendoza (Analista)',
        NOW()
    ),
    -- Datasets del modelo original (bdmodel.md)
    (
        'dataset-demand',
        'Ventas Históricas y Demanda de Servidores B2B (2024-2026)',
        'Infraestructura & Servidores',
        45200,
        14,
        'volumen_demanda_mensual',
        '8.4 MB',
        'Registros de compras de servidores rack Dell, HPE, switches Cisco y almacenamiento SAN por sector comercial.',
        '["Mes","Producto","Sector","Cantidad","Precio","Total","Demanda"]'::jsonb,
        NULL,
        'Sistema',
        NOW()
    ),
    (
        'dataset-churn',
        'Comportamiento y Probabilidad de Fuga de Cuentas B2B',
        'Retención de Clientes',
        12800,
        18,
        'riesgo_churn_score',
        '3.1 MB',
        'Métricas de engagement, días sin contacto, NPS corporativo, tickets de soporte y renovación de contratos.',
        '["Cliente","Sector","Dias_Sin_Contacto","NPS","Tickets","Renovacion","Churn_Score"]'::jsonb,
        NULL,
        'Sistema',
        NOW()
    ),
    (
        'dataset-cross-sell',
        'Afinidad de Compra y Venta Cruzada de Equipamiento',
        'Optimización de Catálogo',
        18500,
        11,
        'next_best_offer_probability',
        '4.7 MB',
        'Secuencias temporales de adquisición de Laptops Pro, Monitores 4K, docks Thunderbolt y licencias de nube.',
        '["Cliente","Producto_A","Producto_B","Probabilidad","Margen","Segmento"]'::jsonb,
        NULL,
        'Sistema',
        NOW()
    )
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 4. REPORTE COMPARATIVO DE AUDITORÍA
-- ==============================================================
INSERT INTO reportes_comparativos (
    id, titulo, analista_id, analista_nombre,
    dataset_a_id, dataset_a_nombre,
    dataset_b_id, dataset_b_nombre,
    resumen_ejecutivo, hallazgos_clave,
    metricas_json, recomendaciones,
    estado, created_at, updated_at
)
VALUES
    (
        'REP-2026-001',
        'Auditoría Comparativa Q3: Empresa Alfa vs Empresa Beta',
        'USR-ANALISTA',
        'Carlos Mendoza',
        'dataset-alfa-q3',
        'Empresa Alfa Q3 2026',
        'dataset-beta-q3',
        'Empresa Beta Q3 2026',
        'Se realizó una auditoría comparativa de volumen y precios entre Empresa Alfa y Empresa Beta para el tercer trimestre. Empresa Alfa lidera en ingresos de Servidores (+36.4%), pero Empresa Beta tiene una ventaja de volumen (+66.7%) y precio más competitivo en Networking.',
        '- Brecha de facturación favorable para Alfa en Servidores Rack ($211.2K vs $154.8K).\n- Beta supera a Alfa en venta de Laptops corporativas ($206.2K vs $173.4K) debido a un precio $140 menor por unidad.\n- En switches Cisco, Beta comercializó 30 unidades frente a 18 de Alfa.\n- Margen promedio ponderado: Alfa 30.8% vs Beta 26.5%.',
        '{
            "totalA": 524950,
            "totalB": 533000,
            "deltaPercent": -1.5,
            "topProductA": "Servidor Dell PowerEdge R740",
            "topProductB": "Lenovo ThinkPad P16",
            "qtyA": 183,
            "qtyB": 188
        }'::jsonb,
        '1. Ajustar levemente el precio de las ThinkPad P16 en Alfa para contrarrestar la oferta de Beta.\n2. Aprovechar el mayor margen en Servidores para ofrecer garantías extendidas sin costo adicional.\n3. Reevaluar estrategia de distribución para switches y equipos de red.',
        'recibido',
        NOW(), NOW()
    )
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 5. DOCUMENTOS COMPARTIDOS
-- ==============================================================
INSERT INTO documentos (id, nombre, tipo, tamanio, tamanio_bytes, categoria, descripcion, subido_por, usuario_id, usuario_rol, tags_json, destinatarios_roles, created_at, updated_at)
VALUES
    (
        'DOC-2026-001',
        'Contrato Marco de Suministro Tecnológico 2026 - Alfa Corp.pdf',
        'pdf',
        '2.84 MB',
        2977955,
        'Contratos',
        'Acuerdo legal de provisión mayorista de hardware Dell PowerEdge y switches Cisco con condiciones de pago a 60 días.',
        'Jane Doe',
        'USR-ADMIN',
        'administrador',
        '["contrato","legal","alfa corp","hardware"]'::jsonb,
        '["todos"]'::jsonb,
        NOW(), NOW()
    ),
    (
        'DOC-2026-002',
        'Especificaciones Técnicas y SLA de Servidores Enterprise.docx',
        'docx',
        '1.45 MB',
        1520435,
        'Especificaciones Técnicas',
        'Requisitos de arquitectura, memoria ECC, redundancia de fuentes y soporte 24/7 para despliegue de infraestructura.',
        'Carlos Mendoza',
        'USR-ANALISTA',
        'analista',
        '["hardware","sla","servidores","datacenter"]'::jsonb,
        '["todos"]'::jsonb,
        NOW(), NOW()
    ),
    (
        'DOC-2026-003',
        'Informe Ejecutivo de Auditoría y Precios Competitivos Q3.pdf',
        'pdf',
        '3.12 MB',
        3271557,
        'Reportes Ejecutivos',
        'Dossier con gráficos de dispersión de precios de mercado, márgenes brutos por línea de producto y comparativa con competidores.',
        'Carlos Mendoza',
        'USR-ANALISTA',
        'analista',
        '["auditoria","q3","precios","competencia"]'::jsonb,
        '["todos"]'::jsonb,
        NOW(), NOW()
    ),
    (
        'DOC-2026-004',
        'Propuesta Comercial y Cotización Licitación Hardware.docx',
        'docx',
        '980 KB',
        1003520,
        'Propuestas Comerciales',
        'Pliego de cotización para licitación pública corporativa de 80 Workstations Lenovo ThinkPad y 20 Monitores 4K.',
        'Jane Doe',
        'USR-ADMIN',
        'administrador',
        '["licitacion","propuesta","ventas","b2b"]'::jsonb,
        '["todos"]'::jsonb,
        NOW(), NOW()
    )
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 6. INVITACIONES PENDIENTES
-- ==============================================================
INSERT INTO invitaciones (id, email, nombre_referencial, rol_asignado, token, estado, creado_por, created_at, expires_at)
VALUES
    (
        'INV-DEV01',
        'dev.frontend@empresa.com',
        'Lucía Ramos',
        'programador',
        'inv_tok_lucia_ramosp982',
        'pendiente',
        'Jane Doe (Administrador)',
        NOW(),
        NOW() + INTERVAL '7 days'
    ),
    (
        'INV-AUD02',
        'auditor.it@empresa.com',
        'Roberto Silva',
        'auditor',
        'inv_tok_roberto_silva841',
        'pendiente',
        'Jane Doe (Administrador)',
        NOW(),
        NOW() + INTERVAL '7 days'
    )
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 7. CLIENTES B2B
-- ==============================================================
INSERT INTO clientes (id, nombre, empresa, email, sector, total_comprado, estado, ultimo_contacto)
VALUES
    ('CLI-101', 'Carlos Mendoza',    'NovaPay Solutions',    'c.mendoza@novapay.io',       'Fintech',        148500.00, 'En Riesgo', 'Hace 48 días'),
    ('CLI-102', 'Valeria Sotomayor', 'Banco Atlántico Tech', 'v.soto@bancoatlantico.com',  'Fintech',        285000.00, 'Activo',    'Hace 3 días'),
    ('CLI-103', 'Roberto Díaz',      'CloudCore Systems',    'rdiaz@cloudcore.tech',       'SaaS / Cloud',    94200.00, 'Activo',    'Hace 6 días'),
    ('CLI-104', 'Mariana Herrera',   'LogiData Global',      'mherrera@logidata.net',      'Logística',       63800.00, 'Prospecto', 'Hace 12 días'),
    ('CLI-105', 'Andrés Gil',        'KuboFintech Labs',     'andres@kubofin.com',         'Fintech',        112000.00, 'En Riesgo', 'Hace 46 días'),
    ('CLI-106', 'Lucía Benítez',     'BioHealth Analytics',  'lucia.b@biohealth.org',      'Salud / Tech',   178000.00, 'Activo',    'Ayer')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 8. CATEGORÍAS DE HARDWARE
-- ==============================================================
INSERT INTO categorias_hardware (nombre, porcentaje_participacion, color_hex, facturacion_estimada)
VALUES
    ('Servidores Rack',          38, '#5b5bd6', 471200.00),
    ('Laptops Pro Enterprise',   27, '#6366f1', 334800.00),
    ('Monitores 4K & Display',   18, '#818cf8', 223200.00),
    ('Redes y Switches 10GbE',   11, '#a5b4fc', 136400.00),
    ('Storage & SAN Backup',      6, '#c7d2fe',  74400.00);


-- ==============================================================
-- 9. PRODUCTOS / INVENTARIO
-- ==============================================================
INSERT INTO productos (id, codigo, nombre, categoria, stock, stock_minimo, precio_unitario, estado)
VALUES
    ('PRD-01', 'SRV-R740',  'Servidor Rack Dell PowerEdge R740',       'Servidores Rack',         4,  12, 8450.00, 'Bajo Stock'),
    ('PRD-02', 'LAP-P16',   'Lenovo ThinkPad P16 Workstation',          'Laptops Pro Enterprise',  35, 10, 2890.00, 'Disponible'),
    ('PRD-03', 'MON-4K32',  'Dell UltraSharp 32" 4K USB-C Hub',         'Monitores 4K & Display',  42, 15,  820.00, 'Disponible'),
    ('PRD-04', 'SW-10G24',  'Cisco Catalyst 9300 24-Port 10GbE',        'Redes y Switches 10GbE',  14,  5, 4150.00, 'Disponible'),
    ('PRD-05', 'SAN-NAS96', 'Synology Enterprise RackStation 96TB',     'Storage & SAN Backup',     2,  4, 6200.00, 'Bajo Stock')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 10. VENTAS / TRANSACCIONES
-- ==============================================================
INSERT INTO ventas (id, fecha, cliente_nombre, producto_nombre, cantidad, monto_total, estado)
VALUES
    ('TRX-8901', '19 Ago 2026', 'Banco Atlántico Tech',  '12x Dell UltraSharp 32" 4K',          12,  9840.00, 'Completada'),
    ('TRX-8900', '18 Ago 2026', 'CloudCore Systems',     '4x Servidor Dell PowerEdge R740',       4, 33800.00, 'Completada'),
    ('TRX-8899', '17 Ago 2026', 'BioHealth Analytics',   '8x ThinkPad P16 + 8x Monitor 4K',      16, 29680.00, 'Completada'),
    ('TRX-8898', '16 Ago 2026', 'NovaPay Solutions',     '2x Cisco Catalyst 9300',                2,  8300.00, 'Pendiente'),
    ('TRX-8897', '15 Ago 2026', 'LogiData Global',       '1x Synology Enterprise 96TB',           1,  6200.00, 'Completada')
ON CONFLICT (id) DO NOTHING;


-- ==============================================================
-- 11. HISTÓRICO DE VENTAS MENSUAL
-- ==============================================================
INSERT INTO historico_ventas_mensual (mes, ingresos, meta)
VALUES
    ('Ene', 210000.00, 190000.00),
    ('Feb', 245000.00, 220000.00),
    ('Mar', 290000.00, 260000.00),
    ('Abr', 270000.00, 280000.00),
    ('May', 310000.00, 300000.00),
    ('Jun', 325000.00, 310000.00),
    ('Jul', 335000.00, 330000.00),
    ('Ago', 342000.00, 340000.00)
ON CONFLICT (mes) DO NOTHING;


-- ==============================================================
-- VERIFICACIÓN FINAL — Cuenta los registros insertados
-- ==============================================================
SELECT 'users'                   AS tabla, COUNT(*) AS registros FROM users
UNION ALL
SELECT 'usuarios',                           COUNT(*)            FROM usuarios
UNION ALL
SELECT 'datasets_ml',                        COUNT(*)            FROM datasets_ml
UNION ALL
SELECT 'reportes_comparativos',              COUNT(*)            FROM reportes_comparativos
UNION ALL
SELECT 'documentos',                         COUNT(*)            FROM documentos
UNION ALL
SELECT 'invitaciones',                       COUNT(*)            FROM invitaciones
UNION ALL
SELECT 'clientes',                           COUNT(*)            FROM clientes
UNION ALL
SELECT 'categorias_hardware',                COUNT(*)            FROM categorias_hardware
UNION ALL
SELECT 'productos',                          COUNT(*)            FROM productos
UNION ALL
SELECT 'ventas',                             COUNT(*)            FROM ventas
UNION ALL
SELECT 'historico_ventas_mensual',           COUNT(*)            FROM historico_ventas_mensual
ORDER BY tabla;
