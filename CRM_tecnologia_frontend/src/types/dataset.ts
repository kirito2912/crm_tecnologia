/** Registro de metadata en Supabase (tabla datasets_ml) */
export interface DatasetMLRecord {
  id: string;
  nombre: string;
  descripcion: string | null;
  categoria: string;
  archivo_url: string | null;
  registros_totales: number;
  features_count: number;
  columna_objetivo: string;
  tamanio_archivo: string | null;
  created_at: string;
}

/** Payload para insertar un dataset en Supabase */
export interface DatasetMLInsert {
  id: string;
  nombre: string;
  descripcion?: string;
  categoria: string;
  archivo_url: string;
  registros_totales: number;
  features_count: number;
  columna_objetivo: string;
  tamanio_archivo?: string;
}

/** Metadatos que el usuario confirma antes de subir */
export interface DatasetUploadMeta {
  nombre: string;
  descripcion: string;
  categoria: string;
  columnaObjetivo: string;
}

export const DATASET_CATEGORIES = [
  'ventas',
  'competencia',
  'inventario',
  'clientes',
  'demanda',
  'general',
] as const;

export type DatasetCategory = (typeof DATASET_CATEGORIES)[number];
