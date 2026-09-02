// ─── CSV Comparator Types ──────────────────────────────────────────────────

/** Una fila genérica de un CSV — claves son los encabezados */
export type CsvRow = Record<string, string>;

/** Dataset CSV cargado y persistido */
export interface CsvDataset {
  id: string;
  name: string;           // nombre del archivo o empresa
  uploadedAt: string;     // ISO timestamp
  rowCount: number;
  columns: string[];      // encabezados en orden
  rows: CsvRow[];
  color: string;          // color de la card (asignado al subir)
  categoria?: string;
  rowsLoaded?: boolean;
  // Columnas detectadas automáticamente
  productCol?: string;    // columna que identifica el producto/descripción
  qtyCol?: string;        // columna de cantidad
  priceCol?: string;      // columna de precio unitario
  totalCol?: string;      // columna de total/monto
  dateCol?: string;
  clientCol?: string;
  categoryCol?: string;
}

/** Fila de comparación por producto */
export interface ProductComparisonRow {
  product: string;
  qtyA?: number;
  qtyB?: number;
  priceA?: number;
  priceB?: number;
  totalA?: number;
  totalB?: number;
}

/** Estadísticas de una columna numérica */
export interface ColumnStats {
  column: string;
  min: number;
  max: number;
  avg: number;
  sum: number;
  count: number;        // filas con valor numérico válido
}

/** Resultado de comparar dos datasets */
export interface CsvComparisonResult {
  datasetA: CsvDataset;
  datasetB: CsvDataset;

  // Estructura
  sharedColumns: string[];
  onlyInA: string[];
  onlyInB: string[];

  // Filas
  rowDiff: number;        // datasetA.rowCount - datasetB.rowCount

  // Estadísticas por columna numérica compartida
  statsA: ColumnStats[];
  statsB: ColumnStats[];

  // Comparación por producto (si se detectaron columnas de producto/qty/precio)
  productRows: ProductComparisonRow[];
  productCol?: string;
  qtyCol?: string;
  priceCol?: string;
  totalCol?: string;
}

/** Estado del contexto CSV */
export interface CsvContextType {
  datasets: CsvDataset[];
  addDataset: (file: File) => Promise<void>;
  addDirectDataset?: (dataset: CsvDataset) => void;
  removeDataset: (id: string) => void;
  loadDatasetRows: (id: string) => Promise<void>;
  getComparison: (idA: string, idB: string) => CsvComparisonResult | null;
}
