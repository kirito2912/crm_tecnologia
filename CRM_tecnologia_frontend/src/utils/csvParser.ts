import Papa from 'papaparse';
import type { CsvRow, ColumnStats } from '../types/csv';

export interface ParsedCsv {
  columns: string[];
  rows: CsvRow[];
  /** Columnas esperadas que no existían en el archivo y se rellenaron con valores por defecto */
  missingColumns: MissingColumnInfo[];
}

/** Descripción de una columna ausente y el valor por defecto aplicado */
export interface MissingColumnInfo {
  /** Nombre canónico de la columna (ej: "Categoría") */
  label: string;
  /** Tipo semántico de la columna */
  type: 'numeric' | 'text' | 'date';
  /** Valor por defecto asignado en string para mostrar al usuario */
  defaultValue: string;
}

// ─── Columnas semánticas esperadas ────────────────────────────────────────
// Define qué columnas "conoce" el sistema, cómo detectarlas y qué valor
// por defecto asignar cuando faltan o tienen valores vacíos.

interface SemanticColumnDef {
  /** Nombre legible para mostrar al usuario */
  label: string;
  /** Regex para detectar la columna en el CSV */
  pattern: RegExp;
  /** Tipo de dato que determina la regla de default */
  type: 'numeric' | 'text' | 'date';
  /** Valor por defecto cuando la columna no existe o está vacía */
  default: string;
}

const SEMANTIC_COLUMN_DEFS: SemanticColumnDef[] = [
  {
    label: 'Producto',
    pattern: /^(producto|product|descripcion|description|item|articulo|nombre|name|modelo|model|servicio)/i,
    type: 'text',
    default: 'Sin nombre',
  },
  {
    label: 'Categoría',
    pattern: /^(categoria|category|rubro|sector|tipo|type|familia)/i,
    type: 'text',
    default: 'Sin categoría',
  },
  {
    label: 'Cantidad',
    pattern: /^(cantidad|qty|quantity|cant|units|unidades|piezas|pieces|volumen)/i,
    type: 'numeric',
    default: '0',
  },
  {
    label: 'Precio',
    pattern: /^(precio|price|p\.unit|p_unit|precio_unit|precio_unitario|unit_price|costo|cost|valor_unit)/i,
    type: 'numeric',
    default: '0',
  },
  {
    label: 'Total',
    pattern: /^(total|total_ventas|total_sales|monto|importe|subtotal|amount|valor_total|total_usd|total_s|ventas|revenue|ingreso)/i,
    type: 'numeric',
    default: '0',
  },
  {
    label: 'Fecha',
    pattern: /^(fecha|date|año|year|mes|month|dia|day|hora|time|timestamp)/i,
    type: 'date',
    default: '',
  },
];

/**
 * Analiza qué columnas semánticas esperadas están ausentes en el CSV.
 * Retorna solo las que realmente faltan (no tienen ninguna columna que las matchee).
 */
export function detectMissingColumns(columns: string[]): MissingColumnInfo[] {
  const missing: MissingColumnInfo[] = [];
  for (const def of SEMANTIC_COLUMN_DEFS) {
    const found = columns.some((c) => def.pattern.test(c.trim()));
    if (!found) {
      missing.push({
        label: def.label,
        type: def.type,
        defaultValue: def.type === 'date' ? 'null (omitido)' : def.default,
      });
    }
  }
  return missing;
}

/**
 * Normaliza una fila del CSV aplicando valores por defecto inteligentes:
 * - Columna NUMÉRICA ausente o vacía → "0"
 * - Columna de TEXTO ausente o vacía → "Sin nombre" / "Sin categoría"
 * - Columna de FECHA ausente o vacía → "" (null en procesamiento)
 *
 * Modifica la fila in-place y devuelve la misma referencia.
 */
export function normalizeRow(row: CsvRow, columns: string[]): CsvRow {
  for (const def of SEMANTIC_COLUMN_DEFS) {
    // Buscar si existe alguna columna del CSV que matchee esta definición semántica
    const matchingCol = columns.find((c) => def.pattern.test(c.trim()));

    if (!matchingCol) {
      // La columna no existe en el CSV — no la insertamos, los valores por
      // defecto se aplican al leer en getComparison/productRows via getSemanticDefault()
      continue;
    }

    const currentValue = row[matchingCol]?.trim() ?? '';
    if (currentValue === '') {
      // La columna existe pero está vacía — aplicar el valor por defecto
      row[matchingCol] = def.type === 'date' ? '' : def.default;
    }
  }
  return row;
}

/**
 * Devuelve el valor por defecto para una columna semántica dado su tipo.
 * Útil cuando la columna directamente no existe en el dataset.
 */
export function getSemanticDefault(type: 'numeric' | 'text' | 'date', label?: string): string {
  if (type === 'numeric') return '0';
  if (type === 'date') return '';
  // text: diferenciar producto de categoría
  if (label === 'Categoría') return 'Sin categoría';
  return 'Sin nombre';
}

const SKIP_COLUMN_PATTERNS = [
  /^id$/i,
  /^_id$/i,
  /\bid\b/i,
  /^(fecha|date|año|year|mes|month|dia|day|hora|time|timestamp)/i,
  /^(codigo|code|cod|sku|ref|referencia|nro|num|numero|folio|orden|order)/i,
  /^(telefono|phone|zip|postal|ruc|dni|nit|rfc|cedula)/i,
];

export function parseCsvText(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    throw new Error(result.errors[0]?.message ?? 'CSV inválido');
  }

  const columns = result.meta.fields?.filter(Boolean) ?? [];
  const rows: CsvRow[] = (result.data ?? []).map((row) => {
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

export function parseJsonText(text: string): ParsedCsv {
  const data = JSON.parse(text) as unknown;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('El JSON debe ser un array con al menos un objeto');
  }
  const first = data[0];
  if (typeof first !== 'object' || first === null) {
    throw new Error('Cada elemento del JSON debe ser un objeto');
  }
  const columns = Object.keys(first as Record<string, unknown>);
  const rows: CsvRow[] = data.map((item) => {
    const row: CsvRow = {};
    columns.forEach((col) => {
      row[col] = String((item as Record<string, unknown>)[col] ?? '');
    });
    // Rellenar valores vacíos con defaults inteligentes
    return normalizeRow(row, columns);
  });
  const missingColumns = detectMissingColumns(columns);
  return { columns, rows, missingColumns };
}

export function parseDatasetFile(text: string, fileName: string): ParsedCsv {
  if (fileName.endsWith('.json')) return parseJsonText(text);
  return parseCsvText(text);
}

function isSkippedColumn(col: string): boolean {
  return SKIP_COLUMN_PATTERNS.some((re) => re.test(col.trim()));
}

export function parseNumeric(val: string): number {
  const cleaned = val.trim().replace(/[$€S\/\s]/g, '').replace(/,/g, '');
  return parseFloat(cleaned);
}

function isNumericColumn(col: string, rows: CsvRow[]): boolean {
  if (isSkippedColumn(col)) return false;
  const sample = rows.slice(0, 20);
  const numeric = sample.filter((r) => {
    const v = r[col]?.trim() ?? '';
    if (!v) return false;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return false;
    if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(v)) return false;
    const cleaned = v.replace(/[$€S\/,. ]/g, '').replace(/[^0-9.-]/g, '');
    return cleaned.length > 0 && !isNaN(parseFloat(cleaned));
  });
  return numeric.length / Math.max(sample.length, 1) >= 0.6;
}

/** Detecta columnas semánticas: producto, cantidad, precio, total */
export function detectSemanticColumns(columns: string[]): {
  productCol?: string;
  qtyCol?: string;
  priceCol?: string;
  totalCol?: string;
} {
  const find = (patterns: RegExp[]): string | undefined =>
    columns.find((c) => patterns.some((p) => p.test(c)));

  return {
    productCol: find([
      /^(producto|product|descripcion|description|item|articulo|nombre|name|modelo|model|servicio)/i,
    ]),
    qtyCol: find([
      /^(cantidad|qty|quantity|cant|units|unidades|piezas|pieces|volumen)/i,
    ]),
    priceCol: find([
      /^(precio|price|p\.unit|p_unit|precio_unit|unit_price|costo|cost|valor_unit)/i,
    ]),
    totalCol: find([
      /^(total|monto|importe|subtotal|amount|valor_total|total_usd|total_s|ventas|revenue|ingreso)/i,
    ]),
  };
}

/** Sugiere columna objetivo para ML (primera numérica relevante o total) */
export function detectTargetColumn(columns: string[], rows: CsvRow[]): string {
  const semantic = detectSemanticColumns(columns);
  if (semantic.totalCol) return semantic.totalCol;
  if (semantic.qtyCol) return semantic.qtyCol;

  const numeric = columns.filter((col) => isNumericColumn(col, rows));
  return numeric[0] ?? columns[columns.length - 1] ?? 'unknown';
}

export function computeColumnStats(dataset: {
  columns: string[];
  rows: CsvRow[];
}): ColumnStats[] {
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

export function formatFileSize(bytes: number): string {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
