import React, { useState, useMemo } from 'react';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  User,
  Search,
  Filter,
  ArrowUpRight,
  TrendingUp,
  MessageSquare,
  Sparkles,
  Inbox,
  RefreshCw,
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';
import { useCsv } from '../../context/CsvContext';
import { useAuth } from '../../context/AuthContext';
import { ReportDetailModal } from './ReportDetailModal';
import type { ReporteComparativo, EstadoReporte } from '../../types/reportes';

interface AdminReportsViewProps {
  searchQuery?: string;
}

export const AdminReportsView: React.FC<AdminReportsViewProps> = ({
  searchQuery = '',
}) => {
  const { user } = useAuth();
  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const { reportes, isLoading, fetchReportes } = useReports();
  const { datasets } = useCsv();


  const [selectedReporte, setSelectedReporte] = useState<ReporteComparativo | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('todos');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Métricas para KPIs del administrador
  const kpiTotal = reportes.length;
  const kpiPendientes = reportes.filter(
    (r) => r.estado === 'recibido' || r.estado === 'en_revision'
  ).length;
  const kpiAprobados = reportes.filter((r) => r.estado === 'aprobado').length;
  const kpiObservaciones = reportes.filter((r) => r.estado === 'con_observaciones').length;

  // Filtrado de reportes
  const filteredReportes = useMemo(() => {
    let result = reportes;

    if (filterStatus !== 'todos') {
      result = result.filter((r) => r.estado === filterStatus);
    }

    const query = (searchQuery || localSearch).toLowerCase().trim();
    if (query) {
      result = result.filter(
        (r) =>
          r.titulo.toLowerCase().includes(query) ||
          r.analista_nombre.toLowerCase().includes(query) ||
          r.dataset_a_nombre.toLowerCase().includes(query) ||
          r.dataset_b_nombre.toLowerCase().includes(query) ||
          r.resumen_ejecutivo.toLowerCase().includes(query)
      );
    }

    return result;
  }, [reportes, filterStatus, searchQuery, localSearch]);

  const getStatusBadge = (estado: EstadoReporte) => {
    switch (estado) {
      case 'aprobado':
        return (
          <span className="rep-status-badge rep-status-approved">
            <CheckCircle2 size={12} /> Aprobado
          </span>
        );
      case 'con_observaciones':
        return (
          <span className="rep-status-badge rep-status-warning">
            <AlertCircle size={12} /> Con Observaciones
          </span>
        );
      case 'en_revision':
        return (
          <span className="rep-status-badge rep-status-review">
            <Clock size={12} /> En Revisión
          </span>
        );
      default:
        return (
          <span className="rep-status-badge rep-status-pending">
            <Inbox size={12} /> Recibido
          </span>
        );
    }
  };

  return (
    <div className="admin-reports-view">
      {/* Encabezado */}
      <div className="admin-reports-header">
        <div>
          <h2>
            {isAdmin ? 'Bandeja de Reportes de Comparativas' : 'Reportes de Comparativas y Auditoría'}
          </h2>
          <p>
            {isAdmin
              ? 'Revisa, audita y retroalimenta los análisis de empresas y catálogos preparados por los analistas.'
              : 'Consulta el historial de análisis comparativos, auditorías de precios y el estado de revisión ejecutiva.'}
          </p>
        </div>

        <button
          className="admin-refresh-btn"
          onClick={() => fetchReportes()}
          title="Actualizar bandeja"
        >
          <RefreshCw size={15} className={isLoading ? 'spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* Tarjetas de KPIs Ejecutivos */}
      <div className="admin-kpi-grid">
        <div className="admin-kpi-card">
          <div className="admin-kpi-icon-box" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <FileText size={20} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Reportes Totales</span>
            <span className="admin-kpi-number">{kpiTotal}</span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon-box" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={20} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Pendientes de Revisión</span>
            <span className="admin-kpi-number" style={{ color: '#d97706' }}>
              {kpiPendientes}
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon-box" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={20} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Reportes Aprobados</span>
            <span className="admin-kpi-number" style={{ color: '#16a34a' }}>
              {kpiAprobados}
            </span>
          </div>
        </div>

        <div className="admin-kpi-card">
          <div className="admin-kpi-icon-box" style={{ background: '#fef2f2', color: '#dc2626' }}>
            <AlertCircle size={20} />
          </div>
          <div className="admin-kpi-info">
            <span className="admin-kpi-label">Con Observaciones</span>
            <span className="admin-kpi-number" style={{ color: '#dc2626' }}>
              {kpiObservaciones}
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="admin-filters-bar">
        <div className="admin-status-tabs">
          {[
            { id: 'todos', label: 'Todos', count: kpiTotal },
            { id: 'recibido', label: 'Recibidos', count: reportes.filter((r) => r.estado === 'recibido').length },
            { id: 'en_revision', label: 'En Revisión', count: reportes.filter((r) => r.estado === 'en_revision').length },
            { id: 'aprobado', label: 'Aprobados', count: kpiAprobados },
            { id: 'con_observaciones', label: 'Con Observaciones', count: kpiObservaciones },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`admin-status-tab ${filterStatus === tab.id ? 'active' : ''}`}
              onClick={() => setFilterStatus(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="admin-tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="admin-search-wrapper">
          <Search size={15} color="#94a3b8" />
          <input
            type="text"
            className="admin-search-input"
            placeholder="Buscar por título, empresa o analista..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Reportes */}
      {filteredReportes.length === 0 ? (
        <div className="admin-empty-inbox">
          <Inbox size={48} color="#cbd5e1" />
          <p>No hay reportes en este criterio de búsqueda.</p>
          <span>Los nuevos informes enviados por los analistas aparecerán automáticamente aquí.</span>
        </div>
      ) : (
        <div className="admin-reports-grid">
          {filteredReportes.map((rep) => {
            const delta = rep.metricas_json?.deltaPercent;
            return (
              <div
                key={rep.id}
                className="admin-report-card"
                onClick={() => setSelectedReporte(rep)}
              >
                <div className="admin-report-card-top">
                  <div className="admin-report-id-row">
                    <span className="report-code-tag">{rep.id}</span>
                    {getStatusBadge(rep.estado)}
                  </div>
                  <div className="admin-report-date">
                    <Calendar size={13} />
                    <span>{new Date(rep.created_at).toLocaleDateString('es-PE', { dateStyle: 'medium' })}</span>
                  </div>
                </div>

                <h3 className="admin-report-title">{rep.titulo}</h3>

                <div className="admin-report-analyst">
                  <User size={14} color="#6366f1" />
                  <span>Preparado por: <strong>{rep.analista_nombre}</strong></span>
                </div>

                {/* Empresas Comparadas */}
                <div className="admin-report-companies-box">
                  <div className="admin-comp-pill" style={{ color: '#2563eb', background: '#eff6ff' }}>
                    <Building2 size={13} />
                    <span title={rep.dataset_a_nombre}>{rep.dataset_a_nombre}</span>
                  </div>
                  <span className="admin-vs-badge">VS</span>
                  <div className="admin-comp-pill" style={{ color: '#7c3aed', background: '#f5f3ff' }}>
                    <Building2 size={13} />
                    <span title={rep.dataset_b_nombre}>{rep.dataset_b_nombre}</span>
                  </div>
                </div>

                {/* Resumen */}
                <p className="admin-report-summary">{rep.resumen_ejecutivo}</p>

                {/* Métricas previas si existen */}
                {rep.metricas_json && (
                  <div className="admin-report-metrics-mini">
                    {rep.metricas_json.totalA !== undefined && (
                      <span className="admin-metric-mini-tag">
                        A: S/ {Number(rep.metricas_json.totalA).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    {rep.metricas_json.totalB !== undefined && (
                      <span className="admin-metric-mini-tag">
                        B: S/ {Number(rep.metricas_json.totalB).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                      </span>
                    )}
                    {delta !== undefined && (
                      <span
                        className="admin-metric-mini-tag"
                        style={{
                          color: delta >= 0 ? '#16a34a' : '#dc2626',
                          background: delta >= 0 ? '#dcfce7' : '#fee2e2',
                        }}
                      >
                        Δ {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}

                {/* Feedback status */}
                <div className="admin-report-card-footer">
                  {rep.feedback_admin ? (
                    <div className="admin-feedback-indicator admin-feedback-indicator--done">
                      <MessageSquare size={13} />
                      <span>Con feedback del administrador</span>
                    </div>
                  ) : (
                    <div className="admin-feedback-indicator admin-feedback-indicator--pending">
                      <Clock size={13} />
                      <span>Sin revisar por administrador</span>
                    </div>
                  )}

                  <button
                    type="button"
                    className="admin-btn-review"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedReporte(rep);
                    }}
                  >
                    Revisar Informe
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Detalle y Decisión del Administrador */}
      {selectedReporte && (
        <ReportDetailModal
          reporte={selectedReporte}
          onClose={() => setSelectedReporte(null)}
        />
      )}
    </div>
  );
};

export default AdminReportsView;
