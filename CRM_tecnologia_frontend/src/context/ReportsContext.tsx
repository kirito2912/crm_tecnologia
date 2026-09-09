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

const ReportsContext = createContext<ReportsContextType | undefined>(undefined);

export const ReportsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reportes, setReportes] = useState<ReporteComparativo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReportes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const remote = await fetchReportesApi();
      setReportes(Array.isArray(remote) ? remote : []);
    } catch (err: any) {
      setError('No se pudo conectar al servidor. Verifica que el backend esté activo.');
      setReportes([]);
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
      const created = await createReporteApi(payload);
      setReportes((prev) => [created, ...prev]);
      return { success: true, reporte: created };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al enviar reporte al servidor' };
    }
  };

  const updateReporteEstado = async (
    reporteId: string,
    payload: ReporteUpdateEstadoPayload
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await updateReporteEstadoApi(reporteId, payload);
      // Refrescar desde backend para tener el estado real
      await fetchReportes();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al actualizar estado' };
    }
  };

  const deleteReporte = async (
    reporteId: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      await deleteReporteApi(reporteId);
      // Remover del estado local solo si el backend confirmó la eliminación
      setReportes((prev) => prev.filter((r) => r.id !== reporteId));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Error al eliminar reporte del servidor' };
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
