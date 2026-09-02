import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  ReporteComparativo,
  ReporteCreatePayload,
  ReporteUpdateEstadoPayload,
  ReportsContextType,
} from '../types/reportes';
import {
  fetchReportesApi,
  createReporteApi,
  updateReporteEstadoApi,
  deleteReporteApi,
} from '../services/reportesApi';

const STORAGE_KEY = 'hardcrm_reports_v2';

const INITIAL_DEFAULT_REPORTS: ReporteComparativo[] = [
  {
    id: 'REP-2026-001',
    titulo: 'Auditoría Comparativa Q3: Empresa Alfa vs Empresa Beta',
    analista_id: 'USR-ANALISTA',
    analista_nombre: 'Carlos Mendoza',
    dataset_a_id: 'dataset-alfa-q3',
    dataset_a_nombre: 'Empresa Alfa - Ventas Q3 2026',
    dataset_b_id: 'dataset-beta-q3',
    dataset_b_nombre: 'Empresa Beta - Ventas Q3 2026',
    resumen_ejecutivo:
      'Se realizó una auditoría comparativa de volumen y precios entre Empresa Alfa y Empresa Beta para el tercer trimestre. Empresa Alfa lidera en facturación de Servidores (+36.4%), pero Empresa Beta tiene una ventaja de volumen (+66.7%) y precio más competitivo en Networking.',
    hallazgos_clave:
      '• Brecha de facturación favorable para Alfa en Servidores Rack ($211.2K vs $154.8K).\n• Beta supera a Alfa en venta de Laptops corporativas ($206.2K vs $173.4K) debido a un precio unitario $140 menor.\n• En switches Cisco, Beta comercializó 30 unidades frente a 18 de Alfa.\n• Margen promedio ponderado: Alfa 30.8% vs Beta 26.5%.',
    metricas_json: {
      totalA: 524950,
      totalB: 533000,
      deltaPercent: -1.5,
      qtyA: 183,
      qtyB: 188,
      topProductA: 'Servidor Dell PowerEdge R740',
      topProductB: 'Lenovo ThinkPad P16 Workstation',
      productosComparados: 6,
    },
    recomendaciones:
      '1. Ajustar levemente el precio de las ThinkPad P16 en Alfa para contrarrestar la oferta de Beta.\n2. Aprovechar el mayor margen en Servidores para ofrecer garantías extendidas sin costo adicional.\n3. Reevaluar estrategia de distribución para switches y equipos de red.',
    estado: 'recibido',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reportes, setReportes] = useState<ReporteComparativo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return INITIAL_DEFAULT_REPORTS;
    } catch {
      return INITIAL_DEFAULT_REPORTS;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const persist = (updated: ReporteComparativo[]) => {
    setReportes(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error al guardar reportes en localStorage', e);
    }
  };

  const fetchReportes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remote = await fetchReportesApi();
      if (remote && remote.length > 0) {
        persist(remote);
      }
    } catch (err: any) {
      console.warn('Usando reportes locales:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportes();
  }, [fetchReportes]);

  const createReporte = async (
    payload: ReporteCreatePayload
  ): Promise<{ success: boolean; reporte?: ReporteComparativo; error?: string }> => {
    try {
      let created: ReporteComparativo;
      try {
        created = await createReporteApi(payload);
      } catch {
        // Fallback local si backend no está accesible
        created = {
          id: `REP-${Date.now().toString(36).toUpperCase()}`,
          ...payload,
          estado: 'recibido',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      const updatedList = [created, ...reportes];
      persist(updatedList);
      return { success: true, reporte: created };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al enviar reporte' };
    }
  };

  const updateReporteEstado = async (
    reporteId: string,
    payload: ReporteUpdateEstadoPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await updateReporteEstadoApi(reporteId, payload);
      } catch (e) {
        console.warn('Actualizando reporte solo localmente:', e);
      }

      const updatedList = reportes.map((r) =>
        r.id === reporteId
          ? {
              ...r,
              estado: payload.estado,
              feedback_admin: payload.feedback_admin ?? r.feedback_admin,
              admin_responsable: payload.admin_responsable ?? r.admin_responsable,
              updated_at: new Date().toISOString(),
            }
          : r
      );
      persist(updatedList);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al actualizar estado' };
    }
  };

  const deleteReporte = async (
    reporteId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      try {
        await deleteReporteApi(reporteId);
      } catch (e) {
        console.warn('Eliminando reporte localmente:', e);
      }
      const updatedList = reportes.filter((r) => r.id !== reporteId);
      persist(updatedList);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al eliminar reporte' };
    }
  };

  return (
    <ReportsContext.Provider
      value={{
        reportes,
        isLoading,
        error,
        fetchReportes,
        createReporte,
        updateReporteEstado,
        deleteReporte,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = (): ReportsContextType => {
  const ctx = useContext(ReportsContext);
  if (!ctx) throw new Error('useReports must be used within ReportsProvider');
  return ctx;
};
