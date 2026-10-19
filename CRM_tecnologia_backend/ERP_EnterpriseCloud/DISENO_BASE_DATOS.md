# 🗄️ DISEÑO DE BASE DE DATOS - ERP EnterpriseCloud

## PostgreSQL 14.x en AWS RDS

---

## 📊 MODELO ENTIDAD-RELACIÓN

### Catálogo de Tablas

| Módulo | Tablas | Total |
|--------|--------|-------|
| **Seguridad** | usuarios, roles, permisos, usuario_rol, rol_permiso, sesiones, auditor | 7 |
| **Maestros** | clientes, proveedores, productos, categorias_producto, unidades_medida | 5 |
| **Ventas** | cotizaciones, cotizacion_detalle, pedidos, pedido_detalle, facturas, factura_detalle | 6 |
| **Compras** | solicitudes_compra, ordenes_compra, orden_compra_detalle, recepciones, recepcion_detalle | 5 |
| **Inventario** | almacenes, stock, movimientos_inventario, ajustes_inventario | 4 |
| **Finanzas** | cuentas_por_cobrar, cuentas_por_pagar, movimientos_caja, movimientos_banco, conciliaciones | 5 |
| **Documentos** | documentos_s3, categorias_documento | 2 |
| **Otros** | empresas, parametros_sistema, secuencias | 3 |
| **TOTAL** | - | **37 tablas** |

---

## 🔐 MÓDULO: SEGURIDAD

### Tabla: usuarios

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario_codigo VARCHAR(20) UNIQUE NOT NULL,  -- USR-001
    nombre_completo VARCHAR(200) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    foto_perfil VARCHAR(255),
    estado VARCHAR(20) DEFAULT 'activo',  -- activo, inactivo, bloqueado
    intentos_fallidos INT DEFAULT 0,
    ultimo_acceso TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    modificado_por INT,
    CONSTRAINT chk_estado CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_codigo ON usuarios(usuario_codigo);
```

### Tabla: roles

```sql
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,  -- Administrador, Vendedor, etc.
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT FALSE,  -- Rol del sistema no se puede eliminar
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

INSERT INTO roles (nombre, descripcion, es_sistema) VALUES
('Administrador', 'Acceso completo al sistema', TRUE),
('Gerente General', 'Visualización ejecutiva y aprobaciones', TRUE),
('Contador', 'Gestión financiera completa', TRUE),
('Jefe de Ventas', 'Gestión de ventas y clientes', TRUE),
('Vendedor', 'Registro de ventas', TRUE),
('Jefe de Compras', 'Gestión de compras y proveedores', TRUE),
('Comprador', 'Registro de compras', TRUE),
('Jefe de Almacén', 'Control total de inventario', TRUE),
('Almacenero', 'Entradas y salidas de inventario', TRUE);
```

### Tabla: permisos

```sql
CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    modulo VARCHAR(50) NOT NULL,  -- ventas, compras, inventario, etc.
    accion VARCHAR(50) NOT NULL,  -- crear, leer, actualizar, eliminar, aprobar
    codigo VARCHAR(100) UNIQUE NOT NULL,  -- ventas.crear, ventas.leer, etc.
    descripcion TEXT,
    es_sistema BOOLEAN DEFAULT TRUE
);

-- Permisos de Ventas
INSERT INTO permisos (modulo, accion, codigo, descripcion) VALUES
('ventas', 'crear', 'ventas.crear', 'Crear cotizaciones y ventas'),
('ventas', 'leer', 'ventas.leer', 'Ver listado de ventas'),
('ventas', 'actualizar', 'ventas.actualizar', 'Modificar ventas'),
('ventas', 'eliminar', 'ventas.eliminar', 'Anular ventas'),
('ventas', 'aprobar', 'ventas.aprobar', 'Aprobar descuentos especiales');

-- Más permisos para otros módulos...
```

### Tabla: usuario_rol

```sql
CREATE TABLE usuario_rol (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    asignado_por INT,
    UNIQUE(usuario_id, rol_id)
);
```

### Tabla: rol_permiso

```sql
CREATE TABLE rol_permiso (
    id SERIAL PRIMARY KEY,
    rol_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INT NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, permiso_id)
);
```

### Tabla: sesiones

```sql
CREATE TABLE sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_jwt TEXT NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_sesiones_token ON sesiones(token_jwt);
CREATE INDEX idx_sesiones_usuario ON sesiones(usuario_id);
```

### Tabla: auditoria

```sql
CREATE TABLE auditoria (
    id BIGSERIAL PRIMARY KEY,
    usuario_id INT REFERENCES usuarios(id),
    accion VARCHAR(50) NOT NULL,  -- INSERT, UPDATE, DELETE, LOGIN, LOGOUT
    tabla_afectada VARCHAR(100),
    registro_id INT,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_auditoria_usuario ON auditoria(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_hora);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
```

---

## 👥 MÓDULO: MAESTROS

### Tabla: empresas

```sql
CREATE TABLE empresas (
    id SERIAL PRIMARY KEY,
    ruc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(150),
    logo_url VARCHAR(255),
    representante_legal VARCHAR(200),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: clientes

```sql
CREATE TABLE clientes (
    id SERIAL PRIMARY KEY,
    cliente_codigo VARCHAR(20) UNIQUE NOT NULL,  -- CLI-001
    tipo_documento VARCHAR(10) NOT NULL,  -- DNI, RUC, Pasaporte
    numero_documento VARCHAR(20) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(150),
    contacto_nombre VARCHAR(200),
    contacto_telefono VARCHAR(20),
    contacto_email VARCHAR(150),
    limite_credito DECIMAL(12,2) DEFAULT 0,
    dias_credito INT DEFAULT 0,
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    CONSTRAINT chk_tipo_documento CHECK (tipo_documento IN ('DNI', 'RUC', 'Pasaporte', 'CE'))
);

CREATE INDEX idx_clientes_documento ON clientes(numero_documento);
CREATE INDEX idx_clientes_codigo ON clientes(cliente_codigo);
```

### Tabla: proveedores

```sql
CREATE TABLE proveedores (
    id SERIAL PRIMARY KEY,
    proveedor_codigo VARCHAR(20) UNIQUE NOT NULL,  -- PROV-001
    ruc VARCHAR(11) UNIQUE NOT NULL,
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    direccion TEXT,
    telefono VARCHAR(20),
    email VARCHAR(150),
    contacto_nombre VARCHAR(200),
    contacto_telefono VARCHAR(20),
    contacto_email VARCHAR(150),
    calificacion DECIMAL(3,2) DEFAULT 0,  -- 0.00 a 5.00
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

CREATE INDEX idx_proveedores_ruc ON proveedores(ruc);
CREATE INDEX idx_proveedores_codigo ON proveedores(proveedor_codigo);
```

### Tabla: categorias_producto

```sql
CREATE TABLE categorias_producto (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    categoria_padre_id INT REFERENCES categorias_producto(id),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Tabla: unidades_medida

```sql
CREATE TABLE unidades_medida (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(10) UNIQUE NOT NULL,  -- UND, KG, M, L, etc.
    nombre VARCHAR(50) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activo'
);

INSERT INTO unidades_medida (codigo, nombre, abreviatura) VALUES
('UND', 'Unidad', 'Und.'),
('KG', 'Kilogramo', 'Kg.'),
('M', 'Metro', 'M.'),
('L', 'Litro', 'L.'),
('CJA', 'Caja', 'Cja.'),
('PAQ', 'Paquete', 'Paq.');
```

### Tabla: productos

```sql
CREATE TABLE productos (
    id SERIAL PRIMARY KEY,
    producto_codigo VARCHAR(50) UNIQUE NOT NULL,  -- PROD-001 o SKU
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_id INT REFERENCES categorias_producto(id),
    unidad_medida_id INT REFERENCES unidades_medida(id),
    precio_compra DECIMAL(12,2) DEFAULT 0,
    precio_venta DECIMAL(12,2) NOT NULL,
    stock_minimo INT DEFAULT 0,
    stock_maximo INT DEFAULT 0,
    tiene_igv BOOLEAN DEFAULT TRUE,
    imagen_url VARCHAR(255),
    codigo_barra VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

CREATE INDEX idx_productos_codigo ON productos(producto_codigo);
CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
```

---

## 💼 MÓDULO: VENTAS

### Tabla: cotizaciones

```sql
CREATE TABLE cotizaciones (
    id SERIAL PRIMARY KEY,
    cotizacion_numero VARCHAR(20) UNIQUE NOT NULL,  -- COT-2026-0001
    cliente_id INT NOT NULL REFERENCES clientes(id),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    vendedor_id INT REFERENCES usuarios(id),
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, aprobada, rechazada, convertida
    archivo_pdf_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    CONSTRAINT chk_cotizacion_estado CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'convertida'))
);

CREATE INDEX idx_cotizaciones_cliente ON cotizaciones(cliente_id);
CREATE INDEX idx_cotizaciones_fecha ON cotizaciones(fecha_emision);
```

### Tabla: cotizacion_detalle

```sql
CREATE TABLE cotizacion_detalle (
    id SERIAL PRIMARY KEY,
    cotizacion_id INT NOT NULL REFERENCES cotizaciones(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL,
    CONSTRAINT chk_cantidad_positiva CHECK (cantidad > 0)
);

CREATE INDEX idx_cotizacion_detalle_cotizacion ON cotizacion_detalle(cotizacion_id);
```

### Tabla: pedidos

```sql
CREATE TABLE pedidos (
    id SERIAL PRIMARY KEY,
    pedido_numero VARCHAR(20) UNIQUE NOT NULL,  -- PED-2026-0001
    cotizacion_id INT REFERENCES cotizaciones(id),
    cliente_id INT NOT NULL REFERENCES clientes(id),
    fecha_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega DATE,
    vendedor_id INT REFERENCES usuarios(id),
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'nuevo',  -- nuevo, en_proceso, preparado, facturado, entregado
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
```

### Tabla: pedido_detalle

```sql
CREATE TABLE pedido_detalle (
    id SERIAL PRIMARY KEY,
    pedido_id INT NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL
);
```

### Tabla: facturas

```sql
CREATE TABLE facturas (
    id SERIAL PRIMARY KEY,
    factura_numero VARCHAR(20) UNIQUE NOT NULL,  -- F001-00000001 o B001-00000001
    tipo_comprobante VARCHAR(10) NOT NULL,  -- F (Factura), B (Boleta)
    pedido_id INT REFERENCES pedidos(id),
    cliente_id INT NOT NULL REFERENCES clientes(id),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_vencimiento DATE,
    vendedor_id INT REFERENCES usuarios(id),
    subtotal DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'PEN',  -- PEN, USD
    tipo_pago VARCHAR(20),  -- contado, credito
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'emitida',  -- emitida, anulada, pagada
    sunat_enviada BOOLEAN DEFAULT FALSE,
    sunat_respuesta TEXT,
    archivo_pdf_url VARCHAR(255),
    archivo_xml_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    CONSTRAINT chk_tipo_comprobante CHECK (tipo_comprobante IN ('F', 'B'))
);

CREATE INDEX idx_facturas_cliente ON facturas(cliente_id);
CREATE INDEX idx_facturas_fecha ON facturas(fecha_emision);
CREATE INDEX idx_facturas_estado ON facturas(estado);
```

### Tabla: factura_detalle

```sql
CREATE TABLE factura_detalle (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES facturas(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    descuento DECIMAL(12,2) DEFAULT 0,
    subtotal DECIMAL(12,2) NOT NULL
);
```

---

## 🛒 MÓDULO: COMPRAS

### Tabla: solicitudes_compra

```sql
CREATE TABLE solicitudes_compra (
    id SERIAL PRIMARY KEY,
    solicitud_numero VARCHAR(20) UNIQUE NOT NULL,  -- SC-2026-0001
    solicitante_id INT REFERENCES usuarios(id),
    fecha_solicitud DATE NOT NULL DEFAULT CURRENT_DATE,
    prioridad VARCHAR(20) DEFAULT 'normal',  -- baja, normal, alta, urgente
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, aprobada, rechazada, procesada
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);
```

### Tabla: ordenes_compra

```sql
CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    orden_numero VARCHAR(20) UNIQUE NOT NULL,  -- OC-2026-0001
    solicitud_id INT REFERENCES solicitudes_compra(id),
    proveedor_id INT NOT NULL REFERENCES proveedores(id),
    fecha_emision DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    comprador_id INT REFERENCES usuarios(id),
    subtotal DECIMAL(12,2) NOT NULL,
    igv DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    condiciones_pago TEXT,
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'borrador',  -- borrador, pendiente_aprobacion, aprobada, enviada, recibida, cerrada
    requiere_aprobacion BOOLEAN DEFAULT FALSE,
    aprobada_por INT REFERENCES usuarios(id),
    fecha_aprobacion TIMESTAMP,
    archivo_pdf_url VARCHAR(255),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

CREATE INDEX idx_ordenes_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_estado ON ordenes_compra(estado);
```

### Tabla: orden_compra_detalle

```sql
CREATE TABLE orden_compra_detalle (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad DECIMAL(12,3) NOT NULL,
    precio_unitario DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL
);
```

### Tabla: recepciones

```sql
CREATE TABLE recepciones (
    id SERIAL PRIMARY KEY,
    recepcion_numero VARCHAR(20) UNIQUE NOT NULL,  -- REC-2026-0001
    orden_id INT NOT NULL REFERENCES ordenes_compra(id),
    fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
    recepcionado_por INT REFERENCES usuarios(id),
    observaciones TEXT,
    estado VARCHAR(20) DEFAULT 'completa',  -- completa, parcial, con_diferencias
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);
```

### Tabla: recepcion_detalle

```sql
CREATE TABLE recepcion_detalle (
    id SERIAL PRIMARY KEY,
    recepcion_id INT NOT NULL REFERENCES recepciones(id) ON DELETE CASCADE,
    orden_detalle_id INT NOT NULL REFERENCES orden_compra_detalle(id),
    producto_id INT NOT NULL REFERENCES productos(id),
    cantidad_ordenada DECIMAL(12,3) NOT NULL,
    cantidad_recibida DECIMAL(12,3) NOT NULL,
    diferencia DECIMAL(12,3) GENERATED ALWAYS AS (cantidad_ordenada - cantidad_recibida) STORED,
    observaciones TEXT
);
```

---

## 📦 MÓDULO: INVENTARIO

### Tabla: almacenes

```sql
CREATE TABLE almacenes (
    id SERIAL PRIMARY KEY,
    almacen_codigo VARCHAR(20) UNIQUE NOT NULL,  -- ALM-001
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    responsable_id INT REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'activo',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO almacenes (almacen_codigo, nombre) VALUES
('ALM-001', 'Almacén Principal'),
('ALM-002', 'Almacén Sucursal Norte');
```

### Tabla: stock

```sql
CREATE TABLE stock (
    id SERIAL PRIMARY KEY,
    producto_id INT NOT NULL REFERENCES productos(id),
    almacen_id INT NOT NULL REFERENCES almacenes(id),
    cantidad_actual DECIMAL(12,3) DEFAULT 0,
    cantidad_reservada DECIMAL(12,3) DEFAULT 0,  -- Pedidos pendientes
    cantidad_disponible DECIMAL(12,3) GENERATED ALWAYS AS (cantidad_actual - cantidad_reservada) STORED,
    costo_promedio DECIMAL(12,2) DEFAULT 0,
    fecha_ultimo_movimiento TIMESTAMP,
    UNIQUE(producto_id, almacen_id),
    CONSTRAINT chk_stock_no_negativo CHECK (cantidad_actual >= 0)
);

CREATE INDEX idx_stock_producto ON stock(producto_id);
CREATE INDEX idx_stock_almacen ON stock(almacen_id);
```

### Tabla: movimientos_inventario

```sql
CREATE TABLE movimientos_inventario (
    id BIGSERIAL PRIMARY KEY,
    movimiento_numero VARCHAR(20) UNIQUE NOT NULL,  -- MOV-2026-000001
    tipo_movimiento VARCHAR(20) NOT NULL,  -- entrada, salida, ajuste, transferencia
    producto_id INT NOT NULL REFERENCES productos(id),
    almacen_origen_id INT REFERENCES almacenes(id),
    almacen_destino_id INT REFERENCES almacenes(id),
    cantidad DECIMAL(12,3) NOT NULL,
    costo_unitario DECIMAL(12,2),
    referencia_tipo VARCHAR(50),  -- orden_compra, venta, ajuste
    referencia_id INT,
    observaciones TEXT,
    responsable_id INT REFERENCES usuarios(id),
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    CONSTRAINT chk_cantidad_movimiento CHECK (cantidad > 0)
);

CREATE INDEX idx_movimientos_producto ON movimientos_inventario(producto_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo_movimiento);
```

### Tabla: ajustes_inventario

```sql
CREATE TABLE ajustes_inventario (
    id SERIAL PRIMARY KEY,
    ajuste_numero VARCHAR(20) UNIQUE NOT NULL,  -- AJU-2026-0001
    almacen_id INT NOT NULL REFERENCES almacenes(id),
    fecha_ajuste DATE NOT NULL DEFAULT CURRENT_DATE,
    motivo TEXT NOT NULL,
    aprobado_por INT REFERENCES usuarios(id),
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, aprobado, aplicado
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);
```

---

## 💰 MÓDULO: FINANZAS

### Tabla: cuentas_por_cobrar

```sql
CREATE TABLE cuentas_por_cobrar (
    id SERIAL PRIMARY KEY,
    factura_id INT NOT NULL REFERENCES facturas(id),
    cliente_id INT NOT NULL REFERENCES clientes(id),
    monto_total DECIMAL(12,2) NOT NULL,
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    monto_pendiente DECIMAL(12,2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    dias_vencidos INT GENERATED ALWAYS AS (CURRENT_DATE - fecha_vencimiento) STORED,
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, pagada_parcial, pagada_total, vencida
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cxc_cliente ON cuentas_por_cobrar(cliente_id);
CREATE INDEX idx_cxc_estado ON cuentas_por_cobrar(estado);
CREATE INDEX idx_cxc_vencimiento ON cuentas_por_cobrar(fecha_vencimiento);
```

### Tabla: cuentas_por_pagar

```sql
CREATE TABLE cuentas_por_pagar (
    id SERIAL PRIMARY KEY,
    orden_id INT NOT NULL REFERENCES ordenes_compra(id),
    proveedor_id INT NOT NULL REFERENCES proveedores(id),
    factura_proveedor VARCHAR(50),
    monto_total DECIMAL(12,2) NOT NULL,
    monto_pagado DECIMAL(12,2) DEFAULT 0,
    monto_pendiente DECIMAL(12,2) GENERATED ALWAYS AS (monto_total - monto_pagado) STORED,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    dias_vencidos INT GENERATED ALWAYS AS (CURRENT_DATE - fecha_vencimiento) STORED,
    estado VARCHAR(20) DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cxp_proveedor ON cuentas_por_pagar(proveedor_id);
CREATE INDEX idx_cxp_estado ON cuentas_por_pagar(estado);
```

### Tabla: movimientos_caja

```sql
CREATE TABLE movimientos_caja (
    id BIGSERIAL PRIMARY KEY,
    movimiento_numero VARCHAR(20) UNIQUE NOT NULL,  -- CAJ-2026-000001
    tipo_movimiento VARCHAR(20) NOT NULL,  -- ingreso, egreso
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    referencia_tipo VARCHAR(50),  -- factura, compra, gasto
    referencia_id INT,
    responsable_id INT REFERENCES usuarios(id),
    fecha_movimiento DATE NOT NULL DEFAULT CURRENT_DATE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT,
    CONSTRAINT chk_tipo_movimiento_caja CHECK (tipo_movimiento IN ('ingreso', 'egreso'))
);
```

### Tabla: movimientos_banco

```sql
CREATE TABLE movimientos_banco (
    id BIGSERIAL PRIMARY KEY,
    cuenta_banco VARCHAR(50) NOT NULL,
    tipo_movimiento VARCHAR(20) NOT NULL,  -- deposito, retiro, transferencia
    numero_operacion VARCHAR(50),
    concepto VARCHAR(255) NOT NULL,
    monto DECIMAL(12,2) NOT NULL,
    referencia_tipo VARCHAR(50),
    referencia_id INT,
    fecha_movimiento DATE NOT NULL DEFAULT CURRENT_DATE,
    conciliado BOOLEAN DEFAULT FALSE,
    fecha_conciliacion DATE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    creado_por INT
);

CREATE INDEX idx_movimientos_banco_cuenta ON movimientos_banco(cuenta_banco);
CREATE INDEX idx_movimientos_banco_conciliado ON movimientos_banco(conciliado);
```

### Tabla: conciliaciones

```sql
CREATE TABLE conciliaciones (
    id SERIAL PRIMARY KEY,
    cuenta_banco VARCHAR(50) NOT NULL,
    periodo VARCHAR(7) NOT NULL,  -- 2026-09
    saldo_inicial DECIMAL(12,2) NOT NULL,
    total_depositos DECIMAL(12,2) DEFAULT 0,
    total_retiros DECIMAL(12,2) DEFAULT 0,
    saldo_final DECIMAL(12,2) NOT NULL,
    saldo_extracto DECIMAL(12,2) NOT NULL,
    diferencia DECIMAL(12,2) GENERATED ALWAYS AS (saldo_final - saldo_extracto) STORED,
    estado VARCHAR(20) DEFAULT 'pendiente',  -- pendiente, conciliada
    conciliado_por INT REFERENCES usuarios(id),
    fecha_conciliacion DATE,
    observaciones TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cuenta_banco, periodo)
);
```

---

## 📄 MÓDULO: DOCUMENTOS (S3)

### Tabla: categorias_documento

```sql
CREATE TABLE categorias_documento (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    icono VARCHAR(50),
    estado VARCHAR(20) DEFAULT 'activo'
);

INSERT INTO categorias_documento (nombre, descripcion, icono) VALUES
('Facturas', 'Comprobantes de venta', 'receipt'),
('Cotizaciones', 'Propuestas comerciales', 'file-text'),
('Órdenes de Compra', 'Documentos de compra', 'shopping-cart'),
('Contratos', 'Contratos con clientes y proveedores', 'file-signature'),
('Documentos de Identidad', 'DNI, RUC, etc.', 'id-card'),
('Otros', 'Documentos varios', 'folder');
```

### Tabla: documentos_s3

```sql
CREATE TABLE documentos_s3 (
    id BIGSERIAL PRIMARY KEY,
    documento_nombre VARCHAR(255) NOT NULL,
    documento_original VARCHAR(255) NOT NULL,  -- Nombre original del archivo
    categoria_id INT REFERENCES categorias_documento(id),
    s3_bucket VARCHAR(100) NOT NULL,
    s3_key VARCHAR(500) NOT NULL,  -- Ruta completa en S3
    s3_url TEXT NOT NULL,  -- URL completa del archivo
    mime_type VARCHAR(100),
    tamanio_bytes BIGINT,
    referencia_tipo VARCHAR(50),  -- factura, cotizacion, cliente, proveedor
    referencia_id INT,
    descripcion TEXT,
    etiquetas TEXT[],  -- Array de etiquetas
    subido_por INT REFERENCES usuarios(id),
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version INT DEFAULT 1,
    estado VARCHAR(20) DEFAULT 'activo'  -- activo, archivado, eliminado
);

CREATE INDEX idx_documentos_categoria ON documentos_s3(categoria_id);
CREATE INDEX idx_documentos_referencia ON documentos_s3(referencia_tipo, referencia_id);
CREATE INDEX idx_documentos_fecha ON documentos_s3(fecha_subida);
CREATE INDEX idx_documentos_etiquetas ON documentos_s3 USING GIN(etiquetas);
```

---

## ⚙️ MÓDULO: PARÁMETROS Y CONFIGURACIÓN

### Tabla: parametros_sistema

```sql
CREATE TABLE parametros_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    tipo_dato VARCHAR(20) DEFAULT 'texto',  -- texto, numero, booleano, json
    categoria VARCHAR(50),
    modificable BOOLEAN DEFAULT TRUE,
    fecha_modificacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modificado_por INT REFERENCES usuarios(id)
);

INSERT INTO parametros_sistema (clave, valor, descripcion, categoria) VALUES
('igv_porcentaje', '18', 'Porcentaje de IGV', 'finanzas'),
('stock_minimo_alerta', '10', 'Cantidad mínima para generar alerta', 'inventario'),
('dias_credito_default', '30', 'Días de crédito por defecto', 'ventas'),
('limite_aprobacion_oc', '5000', 'Monto que requiere aprobación en OC', 'compras'),
('empresa_ruc', '20123456789', 'RUC de la empresa', 'empresa'),
('empresa_razon_social', 'Mi Empresa S.A.C.', 'Razón social', 'empresa');
```

### Tabla: secuencias

```sql
CREATE TABLE secuencias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,  -- cotizacion, pedido, factura, etc.
    prefijo VARCHAR(10),
    ultimo_numero INT DEFAULT 0,
    longitud INT DEFAULT 7,
    anio_actual INT,
    reiniciar_anualmente BOOLEAN DEFAULT TRUE
);

INSERT INTO secuencias (nombre, prefijo, ultimo_numero, anio_actual) VALUES
('cotizacion', 'COT', 0, EXTRACT(YEAR FROM CURRENT_DATE)),
('pedido', 'PED', 0, EXTRACT(YEAR FROM CURRENT_DATE)),
('factura', 'F001', 0, EXTRACT(YEAR FROM CURRENT_DATE)),
('boleta', 'B001', 0, EXTRACT(YEAR FROM CURRENT_DATE)),
('orden_compra', 'OC', 0, EXTRACT(YEAR FROM CURRENT_DATE));
```

---

## 🔄 FUNCIONES Y TRIGGERS

### Función: Generar número correlativo

```sql
CREATE OR REPLACE FUNCTION generar_numero_correlativo(
    p_tipo VARCHAR
) RETURNS VARCHAR AS $$
DECLARE
    v_secuencia RECORD;
    v_numero_completo VARCHAR;
BEGIN
    -- Obtener la secuencia
    SELECT * INTO v_secuencia FROM secuencias WHERE nombre = p_tipo FOR UPDATE;
    
    -- Verificar si se debe reiniciar por año
    IF v_secuencia.reiniciar_anualmente AND v_secuencia.anio_actual != EXTRACT(YEAR FROM CURRENT_DATE) THEN
        UPDATE secuencias 
        SET ultimo_numero = 1, 
            anio_actual = EXTRACT(YEAR FROM CURRENT_DATE)
        WHERE nombre = p_tipo;
        v_secuencia.ultimo_numero := 1;
    ELSE
        UPDATE secuencias 
        SET ultimo_numero = ultimo_numero + 1 
        WHERE nombre = p_tipo;
        v_secuencia.ultimo_numero := v_secuencia.ultimo_numero + 1;
    END IF;
    
    -- Generar número completo
    v_numero_completo := v_secuencia.prefijo || '-' || 
                        EXTRACT(YEAR FROM CURRENT_DATE) || '-' ||
                        LPAD(v_secuencia.ultimo_numero::TEXT, v_secuencia.longitud, '0');
    
    RETURN v_numero_completo;
END;
$$ LANGUAGE plpgsql;
```

### Trigger: Auditoría automática

```sql
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (accion, tabla_afectada, registro_id, datos_nuevos)
        VALUES ('INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (accion, tabla_afectada, registro_id, datos_anteriores, datos_nuevos)
        VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (accion, tabla_afectada, registro_id, datos_anteriores)
        VALUES ('DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tablas críticas
CREATE TRIGGER auditoria_usuarios 
AFTER INSERT OR UPDATE OR DELETE ON usuarios
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();

CREATE TRIGGER auditoria_facturas 
AFTER INSERT OR UPDATE OR DELETE ON facturas
FOR EACH ROW EXECUTE FUNCTION registrar_auditoria();
```

### Trigger: Actualizar stock automáticamente

```sql
CREATE OR REPLACE FUNCTION actualizar_stock_venta()
RETURNS TRIGGER AS $$
BEGIN
    -- Descontar stock al crear factura
    IF NEW.estado = 'emitida' THEN
        UPDATE stock s
        SET cantidad_actual = cantidad_actual - fd.cantidad
        FROM factura_detalle fd
        WHERE fd.factura_id = NEW.id
          AND s.producto_id = fd.producto_id
          AND s.almacen_id = 1;  -- Almacén principal por defecto
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON facturas
FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();
```

---

## 📊 VISTAS ÚTILES

### Vista: Resumen de Ventas por Cliente

```sql
CREATE OR REPLACE VIEW vista_ventas_cliente AS
SELECT 
    c.id as cliente_id,
    c.cliente_codigo,
    c.razon_social,
    COUNT(f.id) as total_facturas,
    SUM(f.total) as total_vendido,
    AVG(f.total) as promedio_venta,
    MAX(f.fecha_emision) as ultima_venta
FROM clientes c
LEFT JOIN facturas f ON c.id = f.cliente_id
WHERE f.estado != 'anulada'
GROUP BY c.id, c.cliente_codigo, c.razon_social;
```

### Vista: Stock Crítico

```sql
CREATE OR REPLACE VIEW vista_stock_critico AS
SELECT 
    p.id,
    p.producto_codigo,
    p.nombre,
    a.nombre as almacen,
    s.cantidad_actual,
    p.stock_minimo,
    (p.stock_minimo - s.cantidad_actual) as deficit
FROM productos p
JOIN stock s ON p.id = s.producto_id
JOIN almacenes a ON s.almacen_id = a.id
WHERE s.cantidad_actual < p.stock_minimo
ORDER BY deficit DESC;
```

### Vista: Cuentas Vencidas

```sql
CREATE OR REPLACE VIEW vista_cuentas_vencidas AS
SELECT 
    'CxC' as tipo,
    c.razon_social as cliente_proveedor,
    cxc.monto_pendiente,
    cxc.dias_vencidos,
    cxc.fecha_vencimiento
FROM cuentas_por_cobrar cxc
JOIN clientes c ON cxc.cliente_id = c.id
WHERE cxc.estado != 'pagada_total' 
  AND cxc.dias_vencidos > 0

UNION ALL

SELECT 
    'CxP' as tipo,
    p.razon_social as cliente_proveedor,
    cxp.monto_pendiente,
    cxp.dias_vencidos,
    cxp.fecha_vencimiento
FROM cuentas_por_pagar cxp
JOIN proveedores p ON cxp.proveedor_id = p.id
WHERE cxp.estado != 'pagada_total' 
  AND cxp.dias_vencidos > 0
ORDER BY dias_vencidos DESC;
```

---

## 🔐 SEGURIDAD Y PERMISOS

### Crear usuarios de base de datos

```sql
-- Usuario para el backend (lectura/escritura)
CREATE USER erp_backend WITH PASSWORD 'XXXXXXXX';
GRANT CONNECT ON DATABASE erp_enterprisecloud TO erp_backend;
GRANT USAGE ON SCHEMA public TO erp_backend;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO erp_backend;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO erp_backend;

-- Usuario para reportes (solo lectura)
CREATE USER erp_readonly WITH PASSWORD 'XXXXXXXX';
GRANT CONNECT ON DATABASE erp_enterprisecloud TO erp_readonly;
GRANT USAGE ON SCHEMA public TO erp_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO erp_readonly;
```

---

## 📝 SCRIPT DE INICIALIZACIÓN COMPLETO

El script SQL completo se encuentra en:
`/database/schema.sql`

**Orden de ejecución:**
1. Crear base de datos
2. Crear esquema de seguridad (usuarios, roles, permisos)
3. Crear tablas maestras
4. Crear tablas transaccionales
5. Crear índices
6. Crear funciones y triggers
7. Crear vistas
8. Insertar datos iniciales
9. Configurar permisos

---

**Elaborado por:** Sistema Kiro AI  
**Fecha:** Septiembre 2026  
**Versión:** 1.0  
**Estado:** Listo para implementación

