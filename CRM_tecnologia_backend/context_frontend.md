# HardCRM Pro - Especificación de API & Contexto de Integración Frontend

Documento de referencia técnica completo para la integración entre el frontend React / Vite / TypeScript y el backend FastAPI + PostgreSQL (SQLAlchemy).

---

## 1. Información General de la API

- **Base URL**: `http://localhost:8000/api/v1`
- **Documentación Interactiva Swagger**: `http://localhost:8000/docs`
- **Especificación Redoc**: `http://localhost:8000/redoc`
- **Formato de Comunicación**: `application/json` (UTF-8)
- **Autenticación**: Cabecera HTTP `Authorization: Bearer <TOKEN>` (o sesión directa)
- **CORS Habilitado**: Acepta orígenes locales (`http://localhost:5173`, `http://localhost:3000`, etc.)

---

## 2. Modelos de Datos & Correspondencia Frontend-Backend

| Tabla PostgreSQL (`bdmodelpostgres.md`) | Modelo SQLAlchemy (`app/models/`) | Schema Pydantic (`app/schemas/`) | Tipo Frontend (`src/types/`) |
| :--- | :--- | :--- | :--- |
| `usuarios` | `Usuario` | `UsuarioResponse` | `User` (`auth.ts`) |
| `clientes` | `Cliente` | `ClienteResponse` | `ClientItem` (`index.ts`) |
| `categorias_hardware` | `CategoriaHardware` | `CategoriaHardwareResponse` | `HardwareCategoryData` (`index.ts`) |
| `productos` | `Producto` | `ProductoResponse` | `ProductItem` (`index.ts`) |
| `ventas` | `Venta` | `VentaResponse` | `SaleTransaction` (`index.ts`) |
| `historico_ventas_mensual` | `HistoricoVentasMensual` | `HistoricoVentasMensualResponse` | `MonthlySalesData` (`index.ts`) |
| `datasets_ml` | `DatasetML` | `DatasetMLResponse` | `DatasetItem` (`prediction.ts`) |

---

## 3. Endpoints de la API

### 3.1. Autenticación & Biometría Facial (`/api/v1/auth`)

#### `POST /api/v1/auth/login`
Inicia sesión estándar mediante correo y contraseña.
- **Request Body**:
```json
{
  "email": "carlos.m@hardcrm.tech",
  "password": "mi_password_seguro",
  "remember_me": true
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Bienvenido de nuevo, Carlos Mendoza",
  "token": "hardcrm_jwt_session_USR-002_carlos.m",
  "user": {
    "id": "USR-002",
    "nombre": "Carlos Mendoza",
    "email": "carlos.m@hardcrm.tech",
    "rol": "Senior B2B Sales Executive",
    "empresa": "NovaPay Solutions",
    "avatar": "CM",
    "biometric_verified": true,
    "created_at": "2026-08-22T01:23:45Z"
  }
}
```

#### `POST /api/v1/auth/biometrics`
Verificación y autenticación biométrica facial por distancia euclidiana.
- **Request Body**:
```json
{
  "email": "jane@company.com",
  "distance_tolerance": 0.45,
  "embedding_sample": [0.14, 0.44, 0.79, 0.21, 0.88, 0.35, 0.58, 0.90]
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Acceso biométrico concedido. Coincidencia facial: 90.8% (Distancia: 0.0412)",
  "token": "hardcrm_biometric_jwt_USR-001_91",
  "user": {
    "id": "USR-001",
    "nombre": "Jane Doe",
    "email": "jane@company.com",
    "rol": "Big Data Lead",
    "empresa": "HardCRM Enterprise",
    "avatar": "JD",
    "biometric_verified": true,
    "created_at": "2026-08-22T01:23:45Z"
  }
}
```

#### `POST /api/v1/auth/register`
Registro corporativo de nuevo usuario.
- **Request Body**:
```json
{
  "full_name": "Valeria Sotomayor",
  "company_email": "v.soto@bancoatlantico.com",
  "password": "passwordSeguro123",
  "company": "Banco Atlántico Tech"
}
```
- **Response `201 Created`**: Devuelve `AuthResponse` con el nuevo usuario e ID generado `USR-xxx`.

#### `POST /api/v1/auth/quick-login/{role}`
Acceso de demostración rápido para pruebas. Parámetro `role`: `admin`, `sales` o `hardware`.

#### `GET /api/v1/auth/me?user_id=USR-001`
Obtiene los datos del perfil activo.

---

### 3.2. Clientes B2B (`/api/v1/clientes`)

#### `GET /api/v1/clientes/`
Obtiene la lista de clientes B2B con filtros y búsqueda.
- **Query Params**:
  - `sector` (string, opcional): Ej. `Fintech`, `SaaS / Cloud`, `Logística`, `Salud / Tech`
  - `estado` (string, opcional): `Activo`, `En Riesgo`, `Prospecto`
  - `search` (string, opcional): Búsqueda por nombre, empresa o correo
  - `skip` (int, default: 0), `limit` (int, default: 100)
- **Response `200 OK`**:
```json
[
  {
    "id": "CLI-101",
    "nombre": "Carlos Mendoza",
    "empresa": "NovaPay Solutions",
    "email": "c.mendoza@novapay.io",
    "sector": "Fintech",
    "total_comprado": 148500.00,
    "estado": "En Riesgo",
    "ultimo_contacto": "Hace 48 días"
  },
  {
    "id": "CLI-102",
    "nombre": "Valeria Sotomayor",
    "empresa": "Banco Atlántico Tech",
    "email": "v.soto@bancoatlantico.com",
    "sector": "Fintech",
    "total_comprado": 285000.00,
    "estado": "Activo",
    "ultimo_contacto": "Hace 3 días"
  }
]
```

#### `GET /api/v1/clientes/{id}`
Detalle de un cliente por su identificador.

#### `POST /api/v1/clientes/`
Crea un cliente. Si no se provee `id`, se genera automáticamente `CLI-xxx`.
- **Request Body**:
```json
{
  "nombre": "Mariana Herrera",
  "empresa": "LogiData Global",
  "email": "mherrera@logidata.net",
  "sector": "Logística",
  "total_comprado": 63800.00,
  "estado": "Prospecto",
  "ultimo_contacto": "Hace 12 días"
}
```
- **Response `201 Created`**: Objeto `ClienteResponse`.

#### `PUT /api/v1/clientes/{id}`
Actualiza campos parciales o completos de un cliente.

#### `DELETE /api/v1/clientes/{id}`
Elimina un cliente. Retorna `{"message": "Cliente 'CLI-xxx' eliminado exitosamente"}`.

---

### 3.3. Categorías de Hardware (`/api/v1/categorias-hardware`)

#### `GET /api/v1/categorias-hardware/`
Obtiene las categorías de servidores, laptops y equipamiento con su color de gráfica y porcentaje.
- **Response `200 OK`**:
```json
[
  {
    "id": 1,
    "nombre": "Servidores Rack",
    "porcentaje_participacion": 38,
    "color_hex": "#5b5bd6",
    "facturacion_estimada": 471200.00
  },
  {
    "id": 2,
    "nombre": "Laptops Pro Enterprise",
    "porcentaje_participacion": 27,
    "color_hex": "#6366f1",
    "facturacion_estimada": 334800.00
  }
]
```

#### `POST /api/v1/categorias-hardware/`, `PUT /api/v1/categorias-hardware/{id}`, `DELETE /api/v1/categorias-hardware/{id}`
Operaciones CRUD para administración de categorías.

---

### 3.4. Productos & Inventario de Servidores (`/api/v1/productos`)

#### `GET /api/v1/productos/`
Catálogo de productos con inventario y estado dinámico.
- **Query Params**:
  - `categoria` (string, opcional): Filtrar por categoría
  - `estado` (string, opcional): `Disponible`, `Bajo Stock`, `Agotado`
  - `search` (string, opcional): Código o nombre
- **Response `200 OK`**:
```json
[
  {
    "id": "PRD-01",
    "codigo": "SRV-R740",
    "nombre": "Servidor Rack Dell PowerEdge R740",
    "categoria": "Servidores Rack",
    "stock": 4,
    "stock_minimo": 12,
    "precio_unitario": 8450.00,
    "estado": "Bajo Stock"
  },
  {
    "id": "PRD-02",
    "codigo": "LAP-P16",
    "nombre": "Lenovo ThinkPad P16 Workstation",
    "categoria": "Laptops Pro Enterprise",
    "stock": 35,
    "stock_minimo": 10,
    "precio_unitario": 2890.00,
    "estado": "Disponible"
  }
]
```

#### `POST /api/v1/productos/`
Crea un nuevo producto. El campo `estado` se calcula automáticamente según `stock` y `stock_minimo`.
- **Request Body**:
```json
{
  "codigo": "SW-10G24",
  "nombre": "Cisco Catalyst 9300 24-Port 10GbE",
  "categoria": "Redes y Switches 10GbE",
  "stock": 14,
  "stock_minimo": 5,
  "precio_unitario": 4150.00
}
```

#### `PATCH /api/v1/productos/{id}/stock`
Ajusta directamente el stock (positivo para reabastecimiento, negativo para salidas).
- **Request Body**: `{"delta": 10}` o `{"delta": -3}`
- **Response `200 OK`**: Retorna el producto con el stock actualizado y el nuevo estado calculado.

#### `PUT /api/v1/productos/{id}` & `DELETE /api/v1/productos/{id}`
Actualización y eliminación de productos.

---

### 3.5. Ventas & Transacciones B2B (`/api/v1/ventas`)

#### `GET /api/v1/ventas/`
Lista de transacciones registradas.
- **Query Params**:
  - `estado` (string, opcional): `Completada`, `Pendiente`, `Procesando`
  - `search` (string, opcional): Búsqueda por cliente o producto

#### `POST /api/v1/ventas/`
Registra una venta B2B.
> **Lógica Automática**:
> 1. Descuenta automáticamente la cantidad del stock del producto coincidente.
> 2. Recalcula el estado del producto (`Agotado`, `Bajo Stock` o `Disponible`).
> 3. Suma el `monto_total` al acumulado `total_comprado` del cliente y actualiza su `ultimo_contacto` a "Hoy".
- **Request Body**:
```json
{
  "cliente_nombre": "Banco Atlántico Tech",
  "producto_nombre": "12x Dell UltraSharp 32\" 4K",
  "cantidad": 12,
  "monto_total": 9840.00,
  "estado": "Completada"
}
```
- **Response `201 Created`**: Objeto `VentaResponse` con ID generado `TRX-xxxx`.

---

### 3.6. Histórico Mensual de Ingresos (`/api/v1/historico-ventas`)

#### `GET /api/v1/historico-ventas/`
Serie temporal de facturación para las gráficas de evolución de ventas.
- **Response `200 OK`**:
```json
[
  {
    "mes": "Ene",
    "ingresos": 210000.00,
    "meta": 190000.00,
    "formatted_ingresos": "$210K",
    "formatted_meta": "$190K"
  },
  {
    "mes": "Ago",
    "ingresos": 342000.00,
    "meta": 340000.00,
    "formatted_ingresos": "$342K",
    "formatted_meta": "$340K"
  }
]
```

---

### 3.7. Datasets de Big Data & Inteligencia Predictiva (`/api/v1/datasets-ml`)

#### `GET /api/v1/datasets-ml/`
Lista los datasets disponibles (`dataset-demand`, `dataset-churn`, `dataset-cross-sell`) con sus registros de muestra.

#### `POST /api/v1/datasets-ml/{id}/predict`
Ejecuta la inferencia de Machine Learning con explicabilidad SHAP y recomendaciones de negocio.
- **Request Body**:
```json
{
  "task": "demand_forecast",
  "dataset_id": "dataset-demand",
  "horizon_months": 6,
  "confidence_level": 0.95,
  "algorithm": "Prophet + LightGBM Multi-Variate Ensemble",
  "include_seasonal_decomposition": true
}
```
- **Response `200 OK`**:
```json
{
  "task": "demand_forecast",
  "dataset_id": "dataset-demand",
  "configuration": {
    "task": "demand_forecast",
    "dataset_id": "dataset-demand",
    "horizon_months": 6,
    "confidence_level": 0.95,
    "algorithm": "Prophet + LightGBM Multi-Variate Ensemble",
    "include_seasonal_decomposition": true
  },
  "metrics": {
    "algorithm": "Prophet + LightGBM Multi-Variate Ensemble",
    "accuracy": 96.8,
    "r2_score": 0.942,
    "mae": "1.4%",
    "rmse": "$12,400",
    "training_time": "1.15s"
  },
  "forecast": [
    { "period": "Ene 2026", "actual": 210000.0, "predicted": 208500.0, "upper_bound": 220000.0, "lower_bound": 198000.0, "trend": null },
    { "period": "Sep 2026 (Pred)", "actual": null, "predicted": 368000.0, "upper_bound": 392000.0, "lower_bound": 344000.0, "trend": "+7.6% MoM" }
  ],
  "interpretation": {
    "headline": "Proyección de Demanda: Crecimiento acelerado en Servidores y Redes 10GbE",
    "executive_summary": "La demanda de servidores Dell PowerEdge R740 y switches Cisco superará el stock actual en los próximos 60 días.",
    "business_impact": "Oportunidad de facturación récord de $1.65M durante el segundo semestre.",
    "risk_rating": "Moderado",
    "confidence_rating": "96.8% R² Score",
    "key_drivers": [
      {
        "name": "Expansión de Centros de Datos B2B",
        "impact_percent": 34.2,
        "impact_type": "positive",
        "description": "Inversión en nube híbrida y microservicios",
        "feature_value": "+42% YoY"
      }
    ],
    "strategic_recommendations": [
      {
        "id": 1,
        "title": "Emitir Orden de Compra Anticipada",
        "description": "Adquirir 20 unidades adicionales de Dell PowerEdge R740 para evitar quiebre de stock.",
        "priority": "Alta",
        "suggested_action": "Aprobar PO a mayorista"
      }
    ]
  }
}
```

---

### 3.8. Dashboard, KPIs & Alertas Inteligentes (`/api/v1/dashboard`)

#### `GET /api/v1/dashboard/kpis`
Calcula en tiempo real las tarjetas de métricas del CRM:
1. **Ingresos Totales**: Suma acumulada global + variación porcentual.
2. **Ventas del Mes**: Proyección mensual actual.
3. **Nuevos Clientes**: Conteo dinámico de clientes con badge de rendimiento.

#### `GET /api/v1/dashboard/insights`
Genera alertas dinámicas:
1. **ALERTA DE STOCK**: Detecta el producto crítico con stock < stock_minimo.
2. **VENTA CRUZADA**: Muestra patrones de afinidad (Laptops -> Monitores 4K).
3. **OPORTUNIDAD**: Detecta cuentas en sector Fintech en riesgo sin contacto en >45 días.

#### `GET /api/v1/dashboard/overview`
Retorna en una sola petición todo el payload consolidado para la vista principal: `kpis`, `insights`, `monthly_sales`, `hardware_categories`, `total_clients`, `total_products`, `total_sales`, `total_revenue`.

#### `POST /api/v1/dashboard/reset`
Restaura la base de datos a los valores semilla de fábrica definidos en `bdmodelpostgres.md`.

---

## 4. Lógica de Negocio y Reglas Clave

1. **Gestión de Estados de Producto**:
   - $\text{Stock} = 0 \implies \text{"Agotado"}$
   - $0 < \text{Stock} < \text{Stock Mínimo} \implies \text{"Bajo Stock"}$
   - $\text{Stock} \ge \text{Stock Mínimo} \implies \text{"Disponible"}$

2. **Deducción de Inventario en Ventas**:
   - Al crear una venta mediante `POST /api/v1/ventas/`, el backend localiza el producto referenciado y reduce su stock en la cantidad comprada, actualizando inmediatamente su estado.

3. **Verificación Biométrica Facial (Distancia Euclidiana)**:
   - Sea $V_A = (a_1, a_2, \dots, a_n)$ el embedding facial registrado y $V_B = (b_1, b_2, \dots, b_n)$ la muestra capturada:
   $$d(V_A, V_B) = \sqrt{\sum_{i=1}^n (a_i - b_i)^2}$$
   - Si $d \le 0.45$, se concede el acceso con porcentaje de coincidencia $\text{Confianza} = (1 - d / 0.45) \times 100\%$.

---

## 5. Guía de Integración con el Frontend (React / TypeScript)

### Ejemplo de Servicio API Centralizado (`src/services/api.ts`)

```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1';

export const apiService = {
  // Clientes
  async getClients() {
    const res = await fetch(`${API_BASE_URL}/clientes/`);
    return res.json();
  },
  async createClient(clientData: any) {
    const res = await fetch(`${API_BASE_URL}/clientes/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
    return res.json();
  },
  async updateClient(id: string, clientData: any) {
    const res = await fetch(`${API_BASE_URL}/clientes/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientData),
    });
    return res.json();
  },
  async deleteClient(id: string) {
    const res = await fetch(`${API_BASE_URL}/clientes/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Productos
  async getProducts() {
    const res = await fetch(`${API_BASE_URL}/productos/`);
    return res.json();
  },
  async adjustProductStock(id: string, delta: number) {
    const res = await fetch(`${API_BASE_URL}/productos/${id}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    return res.json();
  },

  // Ventas
  async getSales() {
    const res = await fetch(`${API_BASE_URL}/ventas/`);
    return res.json();
  },
  async createSale(saleData: any) {
    const res = await fetch(`${API_BASE_URL}/ventas/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    return res.json();
  },

  // Dashboard
  async getDashboardOverview() {
    const res = await fetch(`${API_BASE_URL}/dashboard/overview`);
    return res.json();
  },

  // Predicciones ML
  async runPrediction(datasetId: string, config: any) {
    const res = await fetch(`${API_BASE_URL}/datasets-ml/${datasetId}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },
};
```
