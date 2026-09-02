import type {
  ReporteComparativo,
  ReporteCreatePayload,
  ReporteUpdateEstadoPayload,
} from '../types/reportes';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export async function fetchReportesApi(): Promise<ReporteComparativo[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/reportes/`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP Error ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('Fallback a almacenamiento local para reportes:', err);
    return [];
  }
}

export async function createReporteApi(
  payload: ReporteCreatePayload
): Promise<ReporteComparativo> {
  const res = await fetch(`${API_BASE_URL}/reportes/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al crear el reporte en backend');
  }
  return await res.json();
}

export async function updateReporteEstadoApi(
  reporteId: string,
  payload: ReporteUpdateEstadoPayload
): Promise<ReporteComparativo> {
  const res = await fetch(`${API_BASE_URL}/reportes/${reporteId}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al actualizar el estado del reporte');
  }
  return await res.json();
}

export async function deleteReporteApi(reporteId: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/reportes/${reporteId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'Error al eliminar el reporte');
  }
}
