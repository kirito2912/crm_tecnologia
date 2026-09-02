# Módulo de Datasets — Integración Supabase

Este documento explica **qué se integró**, **para qué sirve** y **cómo configurarlo** en HardCRM Pro.

---

## Propósito del módulo

El módulo `/dataset` permite:

1. **Almacenamiento masivo** — Subir archivos CSV/JSON (hasta 50 MB) a **Supabase Storage**.
2. **Catálogo persistente** — Guardar metadata en la tabla **`datasets_ml`** (nombre, categoría, filas, columnas, columna objetivo, URL del archivo).
3. **Visualización** — Listar datasets en tarjetas, previsualizar filas y descargar el archivo original.
4. **Comparación A vs B** — Seleccionar dos datasets (ej. *mis ventas* vs *competencia*) y ver diferencias por producto, cantidad, precio y total.
5. **Insights de negocio** — Análisis automático que responde preguntas como:
   - ¿Por qué vendemos menos?
   - ¿La competencia subió precios o tiene productos que nosotros no?
   - ¿Estamos en decadencia o crecimiento?
   - ¿Nuestros precios están por encima del mercado?

Al subir un dataset con columnas de ventas, también se **activan los insights del Dashboard** (`CrmContext.activateInsightsWithDataset`).

---

## Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React + Vite)                   │
├─────────────────────────────────────────────────────────────────┤
│  DatasetView                                                     │
│    ├── Drag & Drop CSV/JSON                                      │
│    ├── DatasetUploadModal (confirmar metadata)                   │
│    ├── CsvCard (lista de datasets)                               │
│    ├── CsvComparisonPanel (gráficos y tablas A vs B)             │
│    └── BusinessInsightsPanel (insights ejecutivos)               │
│                                                                  │
│  CsvContext (estado global)                                      │
│    ├── parsea CSV con PapaParse                                  │
│    ├── sincroniza con Supabase al montar                         │
│    └── suscripción realtime (postgres_changes)                   │
│                                                                  │
│  Services                                                        │
│    ├── supabaseClient.ts  → cliente singleton                    │
│    └── datasetService.ts  → upload, list, delete, fetch          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                 │
├─────────────────────────────────────────────────────────────────┤
│  Storage bucket: datasets                                        │
│    └── archivos .csv / .json                                     │
│                                                                  │
│  Tabla: datasets_ml                                              │
│    id, nombre, descripcion, categoria, archivo_url,              │
│    registros_totales, features_count, columna_objetivo,          │
│    tamanio_archivo, created_at                                   │
│                                                                  │
│  RLS: SELECT / INSERT / DELETE para anon + authenticated         │
└─────────────────────────────────────────────────────────────────┘
```

**Nota:** La conexión es **directa desde el frontend** con la `anon key`. El backend FastAPI (`/api/v1/datasets-ml`) sigue existiendo para predicciones ML, pero este flujo de carga masiva usa Supabase directamente.

---

## Configuración paso a paso

### 1. Instalar dependencias (ya hecho en el proyecto)

```bash
cd CRM_tecnologia_frontend
npm install @supabase/supabase-js papaparse
npm install -D @types/papaparse
```

### 2. Variables de entorno

Copia `.env.example` → `.env.local`:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key
```

Obtén los valores en: **Supabase Dashboard → Project Settings → API**.

### 3. Base de datos y Storage en Supabase

Ejecuta el script SQL en **SQL Editor**:

```
CRM_tecnologia_frontend/supabase/setup_datasets.sql
```

Esto crea:
- Tabla `datasets_ml` con `archivo_url` y `created_at`
- Políticas RLS para lectura/escritura
- Bucket `datasets` (público, 50 MB)
- Políticas de Storage
- Realtime en la tabla (opcional)

### 4. Arrancar el frontend

```bash
npm run dev
```

Ve a **Dashboard → Dataset**. Deberías ver el badge **Supabase** (verde) si las variables están bien.

---

## Flujo de subida de un dataset

```
Usuario arrastra CSV/JSON
        │
        ▼
PapaParse extrae columnas y filas
        │
        ▼
Modal: nombre, descripción, categoría, columna objetivo
        │
        ▼
supabase.storage.from('datasets').upload(path, file)
        │
        ▼
getPublicUrl() → archivo_url
        │
        ▼
supabase.from('datasets_ml').insert({ metadata + archivo_url })
        │
        ▼
Lista se actualiza (realtime + refresh)
        │
        ▼
Si hay columnas Producto/Total → activa insights del Dashboard
```

---

## Comparación de CSVs — Caso de uso

### Ejemplo: ¿Por qué vendemos menos?

1. Sube **`ventas_empresa_q1.csv`** → categoría **ventas**
2. Sube **`ventas_competencia_q1.csv`** → categoría **competencia**
3. Selecciona ambos (A y B) → **Ver comparativa** + **Ver insights**

El panel de insights detectará automáticamente:
- Caída de ingresos > 15%
- Productos que solo vende la competencia
- Productos en fuerte decadencia (>30%)
- Precios por encima/debajo del mercado

### Columnas recomendadas en tus CSV

| Columna sugerida | Detectada como |
|------------------|----------------|
| Producto, Descripcion, Item | `productCol` |
| Cantidad, Qty, Unidades | `qtyCol` |
| Precio, Price | `priceCol` |
| Total, Monto, Importe, Ventas | `totalCol` |

---

## Archivos clave del código

| Archivo | Responsabilidad |
|---------|-----------------|
| `src/services/supabaseClient.ts` | Cliente singleton + `isSupabaseConfigured()` |
| `src/services/datasetService.ts` | Upload, list, delete, fetch, realtime |
| `src/context/CsvContext.tsx` | Estado, parseo, sync Supabase, comparación |
| `src/utils/csvParser.ts` | PapaParse + detección semántica de columnas |
| `src/utils/businessInsights.ts` | Generación de insights A vs B |
| `src/components/dataset/DatasetView.tsx` | Vista principal |
| `src/components/dataset/DatasetUploadModal.tsx` | Modal de confirmación |
| `src/components/dataset/BusinessInsightsPanel.tsx` | Tarjetas de insights |
| `supabase/setup_datasets.sql` | Script de setup en Supabase |

---

## Modo local (sin Supabase)

Si no configuras `.env.local`, el módulo funciona en **modo local**:
- Parseo y comparación siguen funcionando
- Los datos se guardan en `localStorage`
- No hay persistencia en la nube ni descarga desde Storage

El badge mostrará **Local** en lugar de **Supabase**.

---

## Seguridad (producción)

Para demo/desarrollo se usan políticas RLS permisivas (`anon` puede INSERT/SELECT/DELETE).

En producción deberías:
- Restringir INSERT/DELETE a usuarios autenticados
- Usar bucket privado + signed URLs
- Validar tamaño y tipo MIME en Edge Functions

---

## Checklist de integración

- [x] `npm i @supabase/supabase-js`
- [x] Variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
- [x] Cliente singleton en `src/services/supabaseClient.ts`
- [x] Bucket `datasets` + tabla `datasets_ml` (script SQL)
- [x] RLS en tabla y Storage
- [x] PapaParse para CSV/JSON
- [x] Modal drag & drop con metadata
- [x] Flujo: parse → upload Storage → insert BD → listar
- [x] Consulta al montar + realtime
- [x] Tarjetas con preview y descarga
- [x] Comparación multi-CSV + insights de negocio
