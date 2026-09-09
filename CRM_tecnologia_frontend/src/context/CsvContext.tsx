import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  CsvDataset,
  CsvRow,
  CsvContextType,
  CsvComparisonResult,
  ColumnStats,
} from '../types/csv';

// ─── Colores asignados en orden a cada CSV subido ─────────────────────────
const CARD_COLORS = [
  '#2563eb',
  '#7c3aed',
  '#059669',
  '#dc2626',
  '#d97706',
  '#0284c7',
  '#c026d3',
  '#475569',
];

const API_DATASETS_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/datasets`;

import Papa from 'papaparse';
import { normalizeRow, detectMissingColumns } from '../utils/csvParser';

// ─── Helpers ──────────────────────────────────────────────────────────────

/** Parsea texto CSV a array de CsvRow con PapaParse de alto rendimiento para Big Data */
function parseCsv(text: string): { columns: string[]; rows: CsvRow[]; missingColumns: import('../types/csv').MissingColumnInfo[] } {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && (!result.data || result.data.length === 0)) {
    throw new Error(result.errors[0]?.message ?? 'Error al procesar el archivo CSV.');
  }

  const columns = (result.meta.fields || []).filter(Boolean);
  const rows: CsvRow[] = (result.data || []).map((row) => {
    const clean: CsvRow = {};
    columns.forEach((col) => {
      clean[col] = String(row[col] ?? '').trim();
    });
    // Rellenar valores vacíos con defaults inteligentes
    return normalizeRow(clean, columns);
  });

  const missingColumns = detectMissingColumns(columns);
  return { columns, rows, missingColumns };
}

const SKIP_COLUMN_PATTERNS = [
  /^id$/i,
  /^_id$/i,
  /\bid\b/i,
  /^(fecha|date|año|year|mes|month|dia|day|hora|time|timestamp)/i,
  /^(codigo|code|cod|sku|ref|referencia|nro|num|numero|folio|orden|order)/i,
  /^(telefono|phone|zip|postal|ruc|dni|nit|rfc|cedula)/i,
];

function isSkippedColumn(col: string): boolean {
  return SKIP_COLUMN_PATTERNS.some((re) => re.test(col.trim()));
}

function isNumericColumn(col: string, rows: CsvRow[]): boolean {
  if (isSkippedColumn(col)) return false;
  const sample = rows.slice(0, 20);
  const numeric = sample.filter((r) => {
    const v = r[col]?.trim() ?? '';
    if (!v) return false;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return false;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(v)) return false;
    const cleaned = v.replace(/[$€S\/,. %]/g, '').replace(/[^0-9.-]/g, '');
    return cleaned.length > 0 && !isNaN(parseFloat(cleaned));
  });
  return numeric.length / Math.max(sample.length, 1) >= 0.5;
}

function parseNumeric(val: string): number {
  if (!val) return NaN;
  const cleaned = val.trim().replace(/[$€S\/\s%]/g, '').replace(/,/g, '');
  return parseFloat(cleaned);
}

function detectSemanticColumns(columns: string[]): {
  productCol?: string;
  qtyCol?: string;
  priceCol?: string;
  totalCol?: string;
  categoryCol?: string;
} {
  const find = (patterns: RegExp[]): string | undefined =>
    columns.find((c) => patterns.some((p) => p.test(c)));

  return {
    productCol: find([
      /^(producto|product|descripcion|description|item|articulo|nombre|name|modelo|model|servicio)/i,
    ]),
    qtyCol: find([
      /^(cantidad|qty|quantity|cant|units|unidades|piezas|pieces)/i,
    ]),
    priceCol: find([
      /^(precio|price|p\.unit|p_unit|precio_unit|precio_unitario|unit_price|costo|cost|valor_unit)/i,
    ]),
    totalCol: find([
      /^(total|total_ventas|total_sales|monto|importe|subtotal|amount|valor_total|total_usd|total_s)/i,
    ]),
    categoryCol: find([
      /^(categoria|category|rubro|sector|tipo|type|familia)/i,
    ]),
  };
}

function computeStats(dataset: CsvDataset): ColumnStats[] {
  return dataset.columns
    .filter((col) => isNumericColumn(col, dataset.rows))
    .map((col) => {
      const numericValues = dataset.rows
        .map((r) => parseNumeric(r[col] ?? ''))
        .filter((v) => !isNaN(v));

      if (numericValues.length === 0) return null;

      const sum = numericValues.reduce((a, b) => a + b, 0);
      return {
        column: col,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        avg: sum / numericValues.length,
        sum,
        count: numericValues.length,
      } satisfies ColumnStats;
    })
    .filter((s): s is ColumnStats => s !== null);
}

const CsvContext = createContext<CsvContextType | undefined>(undefined);

export const CsvProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<CsvDataset[]>([]);

  // Carga datasets desde el backend al montar
  useEffect(() => {
    fetch(`${API_DATASETS_URL}/`)
      .then((r) => r.json())
      .then((data: any[]) => {
        if (!Array.isArray(data) || data.length === 0) return;
        const mapped: CsvDataset[] = data.map((d, i) => {
          const cols: string[] = Array.isArray(d.columnas_json) ? d.columnas_json : [];
          const rows: CsvRow[] = Array.isArray(d.muestra_filas_json) ? d.muestra_filas_json : [];
          const semantic = detectSemanticColumns(cols);
          return {
            id: d.id,
            name: d.nombre,
            uploadedAt: d.created_at || new Date().toISOString(),
            rowCount: d.registros_totales || rows.length,
            columns: cols,
            rows,
            color: CARD_COLORS[i % CARD_COLORS.length],
            categoria: d.categoria || 'Empresarial',
            rowsLoaded: true,
            ...semantic,
          };
        });
        setDatasets(mapped);
      })
      .catch(() => {
        // Si el backend no responde, iniciar con array vacío
        setDatasets([]);
      });
  }, []);

  const addDataset = useCallback(
    async (file: File): Promise<void> => {
      const text = await file.text();
      const { columns, rows, missingColumns } = parseCsv(text);
      const semantic = detectSemanticColumns(columns);
      const colorIndex = datasets.length % CARD_COLORS.length;
      const datasetId = `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const newDataset: CsvDataset = {
        id: datasetId,
        name: file.name.replace(/\.[^/.]+$/, ''),
        uploadedAt: new Date().toISOString(),
        rowCount: rows.length,
        columns,
        rows,
        color: CARD_COLORS[colorIndex],
        categoria: 'Empresarial',
        rowsLoaded: true,
        missingColumns: missingColumns.length > 0 ? missingColumns : undefined,
        ...semantic,
      };

      // Guardar en backend
      try {
        await fetch(`${API_DATASETS_URL}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: datasetId,
            nombre: newDataset.name,
            categoria: newDataset.categoria,
            registros_totales: rows.length,
            features_count: columns.length,
            columna_objetivo: semantic.totalCol || null,
            tamanio_archivo: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            descripcion: `Dataset cargado desde archivo: ${file.name}`,
            columnas_json: columns,
            muestra_filas_json: rows.slice(0, 50), // primeras 50 filas como muestra
            creado_por: 'Analista',
          }),
        });
      } catch {
        // Si el backend falla, igual se agrega en memoria para esta sesión
      }

      setDatasets((prev) => [...prev, newDataset]);
    },
    [datasets]
  );

  const addDirectDataset = useCallback(
    async (dataset: CsvDataset) => {
      // Guardar en backend
      try {
        await fetch(`${API_DATASETS_URL}/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: dataset.id,
            nombre: dataset.name,
            categoria: dataset.categoria || 'Empresarial',
            registros_totales: dataset.rowCount,
            features_count: dataset.columns.length,
            columna_objetivo: dataset.totalCol || null,
            tamanio_archivo: '1.0 MB',
            descripcion: `Dataset: ${dataset.name}`,
            columnas_json: dataset.columns,
            muestra_filas_json: (dataset.rows || []).slice(0, 50),
            creado_por: 'Analista',
          }),
        });
      } catch {
        // Si el backend falla, igual se agrega en memoria
      }
      setDatasets((prev) => [...prev, dataset]);
    },
    [datasets]
  );

  const removeDataset = useCallback(
    async (id: string) => {
      // Eliminar en backend primero
      try {
        const res = await fetch(`${API_DATASETS_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) {
          const err = await res.json();
          console.error('Error al eliminar dataset:', err.detail);
          return; // No remover del estado si el backend falló
        }
      } catch (e) {
        console.error('No se pudo eliminar el dataset del servidor:', e);
        return;
      }
      // Solo actualiza UI si el backend confirmó la eliminación
      setDatasets((prev) => prev.filter((d) => d.id !== id));
    },
    []
  );

  const loadDatasetRows = useCallback(
    async (id: string): Promise<void> => {
      // Si ya están en memoria, asegurar flag
      setDatasets((prev) =>
        prev.map((d) => (d.id === id ? { ...d, rowsLoaded: true } : d))
      );
    },
    []
  );

  const getComparison = useCallback(
    (idA: string, idB: string): CsvComparisonResult | null => {
      const datasetA = datasets.find((d) => d.id === idA);
      const datasetB = datasets.find((d) => d.id === idB);
      if (!datasetA || !datasetB) return null;

      const semanticA = detectSemanticColumns(datasetA.columns || []);
      const semanticB = detectSemanticColumns(datasetB.columns || []);

      const setA = new Set(datasetA.columns || []);
      const setB = new Set(datasetB.columns || []);

      const sharedColumns = (datasetA.columns || []).filter((c) => setB.has(c));
      const onlyInA = (datasetA.columns || []).filter((c) => !setB.has(c));
      const onlyInB = (datasetB.columns || []).filter((c) => !setA.has(c));

      const statsA = computeStats(datasetA).filter((s) =>
        sharedColumns.includes(s.column)
      );
      const statsB = computeStats(datasetB).filter((s) =>
        sharedColumns.includes(s.column)
      );

      const productCol =
        datasetA.productCol ??
        datasetB.productCol ??
        semanticA.productCol ??
        semanticB.productCol;
      const qtyCol =
        datasetA.qtyCol ??
        datasetB.qtyCol ??
        semanticA.qtyCol ??
        semanticB.qtyCol;
      const priceCol =
        datasetA.priceCol ??
        datasetB.priceCol ??
        semanticA.priceCol ??
        semanticB.priceCol;
      const totalCol =
        datasetA.totalCol ??
        datasetB.totalCol ??
        semanticA.totalCol ??
        semanticB.totalCol;

      const normalizeProduct = (name: string): string =>
        name
          .trim()
          // Elimina prefijos de cantidad: "2x ", "10X ", "3x"
          .replace(/^\d+x\s*/i, '')
          // Elimina sufijos entre paréntesis con unidades/cantidades:
          // "(8ud)", "(x8)", "(x 8)", "(8 uds)", "(pack 6)", "(6pack)", "(250ml)", etc.
          // También elimina paréntesis solo con número: "(8)"
          .replace(/\s*\(\s*(?:x\s*)?\d+\s*(?:ud[s]?|uni[t]?[s]?|pack|ml|cl|gr?|kg|lt?|pzas?|pcs?)?\s*\)/gi, '')
          // Elimina guiones y puntos al final que puedan quedar
          .replace(/[\s\-–_]+$/, '')
          .replace(/\s+/g, ' ')
          .trim()
          .toLowerCase();

      const productRows: import('../types/csv').ProductComparisonRow[] = [];
      if (productCol) {
        const mapA = new Map<string, { display: string; rows: CsvRow[] }>();
        const mapB = new Map<string, { display: string; rows: CsvRow[] }>();

        datasetA.rows.forEach((r) => {
          const raw = r[productCol]?.trim() ?? '(sin nombre)';
          const key = normalizeProduct(raw);
          if (!mapA.has(key))
            mapA.set(key, {
              display: raw.replace(/^\d+x\s*/i, '').replace(/\s*\(\s*(?:x\s*)?\d+\s*(?:ud[s]?|uni[t]?[s]?|pack|ml|cl|gr?|kg|lt?|pzas?|pcs?)?\s*\)/gi, '').trim(),
              rows: [],
            });
          mapA.get(key)!.rows.push(r);
        });

        datasetB.rows.forEach((r) => {
          const raw = r[productCol]?.trim() ?? '(sin nombre)';
          const key = normalizeProduct(raw);
          if (!mapB.has(key))
            mapB.set(key, {
              display: raw.replace(/^\d+x\s*/i, '').replace(/\s*\(\s*(?:x\s*)?\d+\s*(?:ud[s]?|uni[t]?[s]?|pack|ml|cl|gr?|kg|lt?|pzas?|pcs?)?\s*\)/gi, '').trim(),
              rows: [],
            });
          mapB.get(key)!.rows.push(r);
        });

        const allKeys = new Set([...mapA.keys(), ...mapB.keys()]);

        // col: nombre de la columna a sumar; si col no existe en el esquema → undefined.
        // rows vacías (producto ausente en este dataset) → undefined para indicar ausencia.
        // rows no vacías pero sin valores numéricos → 0 (columna existe, datos vacíos).
        const sumCol = (rows: CsvRow[], col?: string, hasEntry?: boolean): number | undefined => {
          if (!col) return undefined;
          if (!hasEntry) return undefined;          // producto no existe en este dataset
          const vals = rows
            .map((r) => parseNumeric(r[col] ?? ''))
            .filter((v) => !isNaN(v));
          return vals.length ? vals.reduce((a, b) => a + b, 0) : 0;
        };
        // Para precio: si el producto existe en el dataset pero no tiene valor → 0.
        const avgCol = (rows: CsvRow[], col?: string, hasEntry?: boolean): number | undefined => {
          if (!col) return undefined;
          if (!hasEntry) return undefined;          // producto no existe en este dataset
          const vals = rows
            .map((r) => parseNumeric(r[col] ?? ''))
            .filter((v) => !isNaN(v));
          return vals.length
            ? vals.reduce((a, b) => a + b, 0) / vals.length
            : 0;
        };

        allKeys.forEach((key) => {
          const entryA = mapA.get(key);
          const entryB = mapB.get(key);
          const displayName = entryA?.display ?? entryB?.display ?? key;
          const rowsA = entryA?.rows ?? [];
          const rowsB = entryB?.rows ?? [];
          const inA = entryA !== undefined;  // el producto existe en dataset A
          const inB = entryB !== undefined;  // el producto existe en dataset B

          productRows.push({
            product: displayName,
            qtyA:    sumCol(rowsA, qtyCol,   inA),
            qtyB:    sumCol(rowsB, qtyCol,   inB),
            priceA:  avgCol(rowsA, priceCol, inA),
            priceB:  avgCol(rowsB, priceCol, inB),
            totalA:  sumCol(rowsA, totalCol, inA),
            totalB:  sumCol(rowsB, totalCol, inB),
          });
        });

        productRows.sort((a, b) => {
          const aHasBoth = a.totalA !== undefined && a.totalB !== undefined;
          const bHasBoth = b.totalA !== undefined && b.totalB !== undefined;
          if (aHasBoth && !bHasBoth) return -1;
          if (!aHasBoth && bHasBoth) return 1;
          const aTotal = Math.max(a.totalA ?? 0, a.totalB ?? 0);
          const bTotal = Math.max(b.totalA ?? 0, b.totalB ?? 0);
          return bTotal - aTotal;
        });
      }

      return {
        datasetA,
        datasetB,
        sharedColumns,
        onlyInA,
        onlyInB,
        rowDiff: datasetA.rowCount - datasetB.rowCount,
        statsA,
        statsB,
        productRows,
        productCol,
        qtyCol,
        priceCol,
        totalCol,
      };
    },
    [datasets]
  );

  return (
    <CsvContext.Provider
      value={{
        datasets,
        addDataset,
        addDirectDataset,
        removeDataset,
        loadDatasetRows,
        getComparison,
      }}
    >
      {children}
    </CsvContext.Provider>
  );
};

export const useCsv = (): CsvContextType => {
  const ctx = useContext(CsvContext);
  if (!ctx) throw new Error('useCsv must be used within CsvProvider');
  return ctx;
};
