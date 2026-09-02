export type EstadoReporte = 'recibido' | 'en_revision' | 'aprobado' | 'con_observaciones';

export interface ReporteComparativo {
  id: string;
  titulo: string;
  analista_id: string;
  analista_nombre: string;
  dataset_a_id: string;
  dataset_a_nombre: string;
  dataset_b_id: string;
  dataset_b_nombre: string;
  resumen_ejecutivo: string;
  hallazgos_clave?: string;
  metricas_json?: {
    totalA?: number;
    totalB?: number;
    deltaPercent?: number;
    qtyA?: number;
    qtyB?: number;
    topProductA?: string;
    topProductB?: string;
    productosComparados?: number;
    [key: string]: any;
  };
  recomendaciones?: string;
  estado: EstadoReporte;
  feedback_admin?: string;
  admin_responsable?: string;
  created_at: string;
  updated_at: string;
}

export interface ReporteCreatePayload {
  titulo: string;
  analista_id: string;
  analista_nombre: string;
  dataset_a_id: string;
  dataset_a_nombre: string;
  dataset_b_id: string;
  dataset_b_nombre: string;
  resumen_ejecutivo: string;
  hallazgos_clave?: string;
  metricas_json?: Record<string, any>;
  recomendaciones?: string;
}

export interface ReporteUpdateEstadoPayload {
  estado: EstadoReporte;
  feedback_admin?: string;
  admin_responsable?: string;
}

export interface ReportsContextType {
  reportes: ReporteComparativo[];
  isLoading: boolean;
  error: string | null;
  fetchReportes: () => Promise<void>;
  createReporte: (payload: ReporteCreatePayload) => Promise<{ success: boolean; reporte?: ReporteComparativo; error?: string }>;
  updateReporteEstado: (reporteId: string, payload: ReporteUpdateEstadoPayload) => Promise<{ success: boolean; error?: string }>;
  deleteReporte: (reporteId: string) => Promise<{ success: boolean; error?: string }>;
}
