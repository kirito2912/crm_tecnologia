import React, { useState } from 'react';
import {
  X,
  Building2,
  Calendar,
  User,
  CheckCircle2,
  AlertCircle,
  Clock,
  MessageSquare,
  ArrowUpRight,
  Send,
  Save,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportsContext';
import type { ReporteComparativo, EstadoReporte } from '../../types/reportes';

interface ReportDetailModalProps {
  reporte: ReporteComparativo;
  onClose: () => void;
  onOpenComparison?: (idA: string, idB: string) => void;
}

export const ReportDetailModal: React.FC<ReportDetailModalProps> = ({
  reporte,
  onClose,
  onOpenComparison,
}) => {
  const { user } = useAuth();
  const { updateReporteEstado, deleteReporte } = useReports();

  const role = (user?.role || 'analista').toLowerCase();
  const isAdmin = role === 'administrador' || role === 'admin';

  const [estado, setEstado] = useState<EstadoReporte>(reporte.estado);

  const [feedback, setFeedback] = useState<string>(reporte.feedback_admin || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSaveFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);

    const res = await updateReporteEstado(reporte.id, {
      estado,
      feedback_admin: feedback.trim(),
      admin_responsable: user?.name || 'Jane Doe (Administrador)',
    });

    setIsSaving(false);
    if (res.success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setErrorMsg(res.error || 'Error al guardar la retroalimentación.');
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`¿Estás seguro de eliminar el reporte "${reporte.titulo}"?`)) {
      await deleteReporte(reporte.id);
      onClose();
    }
  };

  const delta = reporte.metricas_json?.deltaPercent;

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div
        className="report-modal-container report-modal-container--wide"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-modal-title-box">
            <div className="report-modal-icon-badge" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
              <Building2 size={18} />
            </div>
            <div>
              <div className="report-history-code-row" style={{ marginBottom: 4 }}>
                <span className="report-code-tag">{reporte.id}</span>
                <span className={`rep-status-badge rep-status-${estado}`}>
                  {estado.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <h3>{reporte.titulo}</h3>
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="report-detail-modal-body">
          {/* Metadatos del emisor y empresas */}
          <div className="rep-detail-meta-grid">
            <div className="rep-detail-meta-card">
              <span className="rep-meta-label">Analista Emisor</span>
              <div className="rep-meta-user">
                <User size={15} color="#4f46e5" />
                <strong>{reporte.analista_nombre}</strong>
              </div>
            </div>

            <div className="rep-detail-meta-card">
              <span className="rep-meta-label">Fecha de Envío</span>
              <div className="rep-meta-date">
                <Calendar size={15} color="#64748b" />
                <span>{new Date(reporte.created_at).toLocaleString('es-PE', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </div>
            </div>

            <div className="rep-detail-meta-card rep-detail-meta-card--full">
              <span className="rep-meta-label">Empresas / Datasets Evaluados</span>
              <div className="rep-meta-companies">
                <span className="rep-comp-badge" style={{ color: '#2563eb', background: '#eff6ff' }}>
                  {reporte.dataset_a_nombre}
                </span>
                <span className="rep-vs-circle">VS</span>
                <span className="rep-comp-badge" style={{ color: '#7c3aed', background: '#f5f3ff' }}>
                  {reporte.dataset_b_nombre}
                </span>
                {onOpenComparison && (
                  <button
                    type="button"
                    className="rep-btn-open-comp"
                    onClick={() => {
                      onOpenComparison(reporte.dataset_a_id, reporte.dataset_b_id);
                      onClose();
                    }}
                  >
                    <ArrowUpRight size={14} />
                    Ver Comparativa Interactiva en Vivo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Métricas clave del reporte */}
          {reporte.metricas_json && (
            <div className="report-metrics-strip" style={{ marginBottom: 20 }}>
              {reporte.metricas_json.totalA !== undefined && (
                <div className="report-metric-item">
                  <span className="report-metric-label">Total {reporte.dataset_a_nombre}</span>
                  <span className="report-metric-val" style={{ color: '#2563eb' }}>
                    S/ {reporte.metricas_json.totalA.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {reporte.metricas_json.totalB !== undefined && (
                <div className="report-metric-item">
                  <span className="report-metric-label">Total {reporte.dataset_b_nombre}</span>
                  <span className="report-metric-val" style={{ color: '#7c3aed' }}>
                    S/ {reporte.metricas_json.totalB.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              )}
              {delta !== undefined && (
                <div className="report-metric-item">
                  <span className="report-metric-label">Brecha Relativa</span>
                  <span
                    className="report-metric-val"
                    style={{ color: delta >= 0 ? '#16a34a' : '#dc2626' }}
                  >
                    {delta >= 0 ? '+' : ''}{delta.toFixed(1)}%
                  </span>
                </div>
              )}
              {reporte.metricas_json.productosComparados !== undefined && (
                <div className="report-metric-item">
                  <span className="report-metric-label">Productos Coincidentes</span>
                  <span className="report-metric-val">
                    {reporte.metricas_json.productosComparados}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Resumen Ejecutivo del Analista */}
          <div className="rep-section-block">
            <h4 className="rep-section-title">
              <Sparkles size={16} color="#4f46e5" />
              1. Resumen Ejecutivo del Analista
            </h4>
            <div className="rep-section-content">
              <p>{reporte.resumen_ejecutivo}</p>
            </div>
          </div>

          {/* Hallazgos Clave */}
          {reporte.hallazgos_clave && (
            <div className="rep-section-block">
              <h4 className="rep-section-title">
                <CheckCircle2 size={16} color="#059669" />
                2. Hallazgos Clave y Brechas de Mercado
              </h4>
              <div className="rep-section-content rep-section-content--pre">
                {reporte.hallazgos_clave}
              </div>
            </div>
          )}

          {/* Recomendaciones */}
          {reporte.recomendaciones && (
            <div className="rep-section-block">
              <h4 className="rep-section-title">
                <AlertCircle size={16} color="#d97706" />
                3. Recomendaciones Estratégicas para la Administración
              </h4>
              <div className="rep-section-content rep-section-content--pre">
                {reporte.recomendaciones}
              </div>
            </div>
          )}

          {/* Sección de Decisión y Feedback del Administrador */}
          {isAdmin ? (
            <form onSubmit={handleSaveFeedback} className="rep-admin-feedback-form">
              <div className="rep-admin-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={17} color="#4338ca" />
                  <h4>Decisión Ejecutiva y Feedback del Administrador</h4>
                </div>
                {saveSuccess && (
                  <span className="rep-save-toast">
                    <CheckCircle2 size={14} /> ¡Decisión guardada!
                  </span>
                )}
              </div>

              {errorMsg && (
                <div className="report-error-alert">
                  <AlertCircle size={14} />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="rep-admin-controls-grid">
                <div className="report-form-group">
                  <label>Estado del Reporte</label>
                  <select
                    className="report-select"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value as EstadoReporte)}
                  >
                    <option value="recibido">📥 Recibido (Pendiente)</option>
                    <option value="en_revision">⏳ En Revisión</option>
                    <option value="aprobado">✅ Aprobado</option>
                    <option value="con_observaciones">⚠️ Con Observaciones</option>
                  </select>
                </div>

                <div className="report-form-group rep-form-group--full">
                  <label>Comentario / Retroalimentación al Analista</label>
                  <textarea
                    className="report-textarea"
                    rows={3}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Escribe notas ejecutivas, aprobación de estrategias o solicitud de ajustes al analista..."
                  />
                </div>
              </div>

              <div className="rep-admin-form-actions">
                <button
                  type="button"
                  className="report-btn report-btn-danger"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                  Eliminar Reporte
                </button>

                <button
                  type="submit"
                  className="report-btn report-btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="report-spinner" /> Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={15} />
                      Guardar Decisión y Feedback
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="rep-admin-feedback-form">
              <div className="rep-admin-form-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquare size={17} color="#4338ca" />
                  <h4>Retroalimentación de la Administración</h4>
                </div>
                <span className={`rep-status-badge rep-status-${estado}`}>
                  {estado.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              {reporte.feedback_admin ? (
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 8, border: '1px solid #e2e8f0', marginTop: 10 }}>
                  <p style={{ margin: 0, fontSize: 13, color: '#1e293b', lineHeight: 1.5 }}>
                    {reporte.feedback_admin}
                  </p>
                  {reporte.admin_responsable && (
                    <span style={{ display: 'block', marginTop: 8, fontSize: 11, color: '#64748b', fontWeight: 600 }}>
                      — Revisado por: {reporte.admin_responsable}
                    </span>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a', marginTop: 10, color: '#92400e', fontSize: 12 }}>
                  <Clock size={16} />
                  <span>Este reporte aún está pendiente de revisión por el administrador.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

