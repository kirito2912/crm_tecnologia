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
  '#2563eb', // azul
  '#7c3aed', // violeta
  '#059669', // verde
  '#dc2626', // rojo
  '#d97706', // ámbar
  '#0284c7', // celeste
  '#c026d3', // fucsia
  '#475569', // slate
];

const STORAGE_KEY = 'hardcrm_csv_datasets_v2';

// ─── Datasets iniciales de muestra por defecto ──────────────────────────────
const DEFAULT_INITIAL_DATASETS: CsvDataset[] = [
  {
    id: 'dataset-alfa-q3',
    name: 'Empresa Alfa - Ventas Q3 2026',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    rowCount: 6,
    columns: ['Producto', 'Categoria', 'Cantidad', 'Precio_Unitario', 'Total_Ventas', 'Margen'],
    color: '#2563eb',
    categoria: 'Hardware & Servidores',
    rowsLoaded: true,
    productCol: 'Producto',
    qtyCol: 'Cantidad',
    priceCol: 'Precio_Unitario',
    totalCol: 'Total_Ventas',
    rows: [
      { Producto: 'Servidor Dell PowerEdge R740', Categoria: 'Servidores', Cantidad: '25', Precio_Unitario: '8450', Total_Ventas: '211250', Margen: '32%' },
      { Producto: 'Lenovo ThinkPad P16 Workstation', Categoria: 'Laptops', Cantidad: '60', Precio_Unitario: '2890', Total_Ventas: '173400', Margen: '28%' },
      { Producto: 'Dell UltraSharp 32 4K USB-C', Categoria: 'Monitores', Cantidad: '80', Precio_Unitario: '820', Total_Ventas: '65600', Margen: '35%' },
      { Producto: 'Cisco Catalyst 9300 24-Port', Categoria: 'Redes', Cantidad: '18', Precio_Unitario: '4150', Total_Ventas: '74700', Margen: '25%' },
      { Producto: 'Synology Enterprise NAS 96TB', Categoria: 'Storage', Cantidad: '8', Precio_Unitario: '6200', Total_Ventas: '49600', Margen: '30%' },
      { Producto: 'Fortinet FortiGate 100F', Categoria: 'Seguridad', Cantidad: '12', Precio_Unitario: '3100', Total_Ventas: '37200', Margen: '27%' },
    ],
  },
  {
    id: 'dataset-beta-q3',
    name: 'Empresa Beta - Ventas Q3 2026',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    rowCount: 6,
    columns: ['Producto', 'Categoria', 'Cantidad', 'Precio_Unitario', 'Total_Ventas', 'Margen'],
    color: '#7c3aed',
    categoria: 'Hardware & Servidores',
    rowsLoaded: true,
    productCol: 'Producto',
    qtyCol: 'Cantidad',
    priceCol: 'Precio_Unitario',
    totalCol: 'Total_Ventas',
    rows: [
      { Producto: 'Servidor Dell PowerEdge R740', Categoria: 'Servidores', Cantidad: '18', Precio_Unitario: '8600', Total_Ventas: '154800', Margen: '30%' },
      { Producto: 'Lenovo ThinkPad P16 Workstation', Categoria: 'Laptops', Cantidad: '75', Precio_Unitario: '2750', Total_Ventas: '206250', Margen: '24%' },
      { Producto: 'Dell UltraSharp 32 4K USB-C', Categoria: 'Monitores', Cantidad: '65', Precio_Unitario: '850', Total_Ventas: '55250', Margen: '32%' },
      { Producto: 'Cisco Catalyst 9300 24-Port', Categoria: 'Redes', Cantidad: '30', Precio_Unitario: '3890', Total_Ventas: '116700', Margen: '22%' },
      { Producto: 'Synology Enterprise NAS 96TB', Categoria: 'Storage', Cantidad: '5', Precio_Unitario: '6350', Total_Ventas: '31750', Margen: '28%' },
      { Producto: 'Aruba Instant On Switch 48P', Categoria: 'Redes', Cantidad: '20', Precio_Unitario: '1950', Total_Ventas: '39000', Margen: '26%' },
    ],
  },
];

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

// ─── Context ──────────────────────────────────────────────────────────────

const CsvContext = createContext<CsvContextType | undefined>(undefined);

export const CsvProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [datasets, setDatasets] = useState<CsvDataset[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: CsvDataset[] = JSON.parse(saved);
        if (parsed.length > 0) {
          return parsed.map((d) => {
            const semantic = detectSemanticColumns(d.columns || []);
            return {
              ...d,
              rows: d.rows || [],
              columns: d.columns || [],
              rowsLoaded: true,
              productCol: d.productCol || semantic.productCol,
              qtyCol: d.qtyCol || semantic.qtyCol,
              priceCol: d.priceCol || semantic.priceCol,
              totalCol: d.totalCol || semantic.totalCol,
              categoryCol: d.categoryCol || semantic.categoryCol,
            };
          });
        }
      }
      return DEFAULT_INITIAL_DATASETS;
    } catch {
      return DEFAULT_INITIAL_DATASETS;
    }
  });

  const persist = (updated: CsvDataset[]) => {
    setDatasets(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      try {
        const fallbackSlim = updated.map((d) => ({
          ...d,
          rows: (d.rows || []).slice(0, 150),
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fallbackSlim));
      } catch {
        /* ignorar */
      }
    }
  };

  const addDataset = useCallback(
    async (file: File): Promise<void> => {
      const text = await file.text();
      const { columns, rows, missingColumns } = parseCsv(text);
      const semantic = detectSemanticColumns(columns);

      const colorIndex = datasets.length % CARD_COLORS.length;
      const newDataset: CsvDataset = {
        id: `csv-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

      persist([...datasets, newDataset]);
    },
    [datasets]
  );

  const addDirectDataset = useCallback(
    (dataset: CsvDataset) => {
      persist([...datasets, dataset]);
    },
    [datasets]
  );

  const removeDataset = useCallback(
    (id: string) => {
      persist(datasets.filter((d) => d.id !== id));
    },
    [datasets]
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
