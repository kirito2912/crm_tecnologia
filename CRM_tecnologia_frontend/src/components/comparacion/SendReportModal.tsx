import React, { useState } from 'react';
import {
  Send,
  X,
  FileText,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  DollarSign,
  Package,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportsContext';
import type { CsvComparisonResult } from '../../types/csv';

interface SendReportModalProps {
  comparison: CsvComparisonResult;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SendReportModal: React.FC<SendReportModalProps> = ({
  comparison,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { createReporte } = useReports();

  const datasetA = comparison.datasetA;
  const datasetB = comparison.datasetB;

  const grandTotalA =
    comparison.productRows.reduce((s, r) => s + (r.totalA ?? 0), 0) || 0;
  const grandTotalB =
    comparison.productRows.reduce((s, r) => s + (r.totalB ?? 0), 0) || 0;
  const deltaVal =
    grandTotalB > 0 ? ((grandTotalA - grandTotalB) / grandTotalB) * 100 : 0;

  const inBoth = comparison.productRows.filter(
    (r) => r.totalA !== undefined && r.totalB !== undefined
  );

  const defaultTitle = `Auditoría Comparativa: ${datasetA.name} vs ${datasetB.name}`;

  const defaultSummary = `Se completó el análisis cruzado entre ${datasetA.name} y ${datasetB.name}. ${
    grandTotalA >= grandTotalB
      ? `${datasetA.name} presenta mayor volumen de facturación total (${deltaVal >= 0 ? '+' : ''}${deltaVal.toFixed(1)}% de diferencia).`
      : `${datasetB.name} lidera en ventas consolidadas frente a ${datasetA.name} (${Math.abs(deltaVal).toFixed(1)}% superior).`
  } Se identificaron ${inBoth.length} productos con competencia directa en catálogo.`;

  const defaultFindings = `• Facturación acumulada: ${datasetA.name} (S/ ${grandTotalA.toLocaleString('es-PE', { maximumFractionDigits: 0 })}) vs ${datasetB.name} (S/ ${grandTotalB.toLocaleString('es-PE', { maximumFractionDigits: 0 })}).
• Productos coincidentes en catálogo: ${inBoth.length} productos analizados.
• Solapamiento comercial detectado en categorías principales.`;

  const defaultRecommendations = `1. Evaluar ajuste de precios en productos con desventaja respecto a ${datasetB.name}.
2. Enfocar campañas en líneas de mayor rentabilidad identificadas en la comparativa.
3. Monitorear disponibilidad de inventario para productos con alta demanda.`;

  const [titulo, setTitulo] = useState(defaultTitle);
  const [resumen, setResumen] = useState(defaultSummary);
  const [hallazgos, setHallazgos] = useState(defaultFindings);
  const [recomendaciones, setRecomendaciones] = useState(defaultRecommendations);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !resumen.trim()) {
      setErrorMsg('Por favor completa el título y el resumen ejecutivo.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);

    const payload = {
      titulo: titulo.trim(),
      analista_id: user?.id || 'USR-ANALISTA',
      analista_nombre: user?.name || 'Carlos Mendoza (Analista)',
      dataset_a_id: datasetA.id,
      dataset_a_nombre: datasetA.name,
      dataset_b_id: datasetB.id,
      dataset_b_nombre: datasetB.name,
      resumen_ejecutivo: resumen.trim(),
      hallazgos_clave: hallazgos.trim(),
      recomendaciones: recomendaciones.trim(),
      metricas_json: {
        totalA: grandTotalA,
        totalB: grandTotalB,
        deltaPercent: deltaVal,
        productosComparados: inBoth.length,
        nombreA: datasetA.name,
        nombreB: datasetB.name,
      },
    };

    const res = await createReporte(payload);
    setIsSending(false);

    if (res.success) {
      setSentSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } else {
      setErrorMsg(res.error || 'Ocurrió un error al enviar el reporte.');
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div
        className="report-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-header">
          <div className="report-modal-title-box">
            <div className="report-modal-icon-badge">
              <Send size={18} color="#4f46e5" />
            </div>
            <div>
              <h3>Enviar Reporte al Administrador</h3>
              <p>
                Genera un informe con los hallazgos observados en esta comparativa de empresas.
              </p>
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {sentSuccess ? (
          <div className="report-modal-success">
            <CheckCircle2 size={54} color="#10b981" />
            <h4>¡Reporte enviado exitosamente!</h4>
            <p>
              El Administrador ya tiene este informe disponible en su bandeja ejecutiva para revisión.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="report-modal-form">
            {/* Metadatos de la comparativa */}
            <div className="report-companies-summary">
              <div className="report-company-chip" style={{ borderColor: '#2563eb' }}>
                <Building2 size={14} color="#2563eb" />
                <span>Empresa A: <strong>{datasetA.name}</strong></span>
              </div>
              <span className="report-vs-tag">VS</span>
              <div className="report-company-chip" style={{ borderColor: '#7c3aed' }}>
                <Building2 size={14} color="#7c3aed" />
                <span>Empresa B: <strong>{datasetB.name}</strong></span>
              </div>
            </div>

            {/* Métricas rápidas */}
            <div className="report-metrics-strip">
              <div className="report-metric-item">
                <span className="report-metric-label">Total Empresa A</span>
                <span className="report-metric-val" style={{ color: '#2563eb' }}>
                  S/ {grandTotalA.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="report-metric-item">
                <span className="report-metric-label">Total Empresa B</span>
                <span className="report-metric-val" style={{ color: '#7c3aed' }}>
                  S/ {grandTotalB.toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div className="report-metric-item">
                <span className="report-metric-label">Diferencia Relativa</span>
                <span
                  className="report-metric-val"
                  style={{ color: deltaVal >= 0 ? '#16a34a' : '#dc2626' }}
                >
                  {deltaVal >= 0 ? '+' : ''}{deltaVal.toFixed(1)}%
                </span>
              </div>
              <div className="report-metric-item">
                <span className="report-metric-label">Productos Coincidentes</span>
                <span className="report-metric-val">{inBoth.length}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="report-error-alert">
                <AlertCircle size={15} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Campo Título */}
            <div className="report-form-group">
              <label>Título del Reporte *</label>
              <input
                type="text"
                className="report-input"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ej. Comparativa Competitiva Q3: Empresa A vs Empresa B"
                required
              />
            </div>

            {/* Campo Resumen Ejecutivo */}
            <div className="report-form-group">
              <label>
                Resumen Ejecutivo del Analista *
                <span className="report-label-hint">Lo que observaste en la comparativa</span>
              </label>
              <textarea
                className="report-textarea"
                rows={4}
                value={resumen}
                onChange={(e) => setResumen(e.target.value)}
                placeholder="Escribe el resumen de las diferencias de ventas, volumen y comportamiento..."
                required
              />
            </div>

            {/* Campo Hallazgos */}
            <div className="report-form-group">
              <label>Hallazgos Clave y Brechas de Mercado</label>
              <textarea
                className="report-textarea"
                rows={3}
                value={hallazgos}
                onChange={(e) => setHallazgos(e.target.value)}
                placeholder="Puntos específicos sobre precios, productos ganadores/perdedores..."
              />
            </div>

            {/* Campo Recomendaciones */}
            <div className="report-form-group">
              <label>Recomendaciones para la Administración</label>
              <textarea
                className="report-textarea"
                rows={3}
                value={recomendaciones}
                onChange={(e) => setRecomendaciones(e.target.value)}
                placeholder="Acciones comerciales o estratégicas sugeridas al Administrador..."
              />
            </div>

            <div className="report-modal-footer">
              <button
                type="button"
                className="report-btn report-btn-secondary"
                onClick={onClose}
                disabled={isSending}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="report-btn report-btn-primary"
                disabled={isSending}
              >
                {isSending ? (
                  <>
                    <div className="report-spinner" />
                    Enviando reporte...
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    Enviar Reporte al Administrador
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
