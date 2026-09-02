import React from 'react';
import {
  X,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Building2,
  Calendar,
  UserCheck,
} from 'lucide-react';
import { useReports } from '../../context/ReportsContext';

interface ReportHistoryModalProps {
  onClose: () => void;
}

export const ReportHistoryModal: React.FC<ReportHistoryModalProps> = ({ onClose }) => {
  const { reportes } = useReports();

  const getStatusBadge = (estado: string) => {
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
            <Clock size={12} /> Recibido
          </span>
        );
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div
        className="report-modal-container report-modal-container--wide"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="report-modal-header">
          <div className="report-modal-title-box">
            <div className="report-modal-icon-badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>
              <FileText size={18} />
            </div>
            <div>
              <h3>Historial de Reportes Enviados</h3>
              <p>Consulta los reportes comparativos enviados a la administración y su retroalimentación.</p>
            </div>
          </div>
          <button className="report-modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="report-history-body">
          {reportes.length === 0 ? (
            <div className="report-empty-state">
              <FileText size={42} color="#cbd5e1" />
              <p>Aún no has enviado reportes comparativos.</p>
              <span>Genera una comparativa entre dos datasets y haz clic en "Enviar Reporte al Administrador".</span>
            </div>
          ) : (
            <div className="report-history-list">
              {reportes.map((rep) => (
                <div key={rep.id} className="report-history-card">
                  <div className="report-history-card-header">
                    <div>
                      <div className="report-history-code-row">
                        <span className="report-code-tag">{rep.id}</span>
                        {getStatusBadge(rep.estado)}
                      </div>
                      <h4 className="report-history-title">{rep.titulo}</h4>
                    </div>
                    <div className="report-history-date">
                      <Calendar size={13} />
                      <span>{new Date(rep.created_at).toLocaleDateString('es-PE', { dateStyle: 'medium' })}</span>
                    </div>
                  </div>

                  <div className="report-history-companies">
                    <div className="rep-comp-item">
                      <Building2 size={13} color="#2563eb" />
                      <span>{rep.dataset_a_nombre}</span>
                    </div>
                    <span className="rep-vs">vs</span>
                    <div className="rep-comp-item">
                      <Building2 size={13} color="#7c3aed" />
                      <span>{rep.dataset_b_nombre}</span>
                    </div>
                  </div>

                  <div className="report-history-summary">
                    <p>{rep.resumen_ejecutivo}</p>
                  </div>

                  {rep.feedback_admin && (
                    <div className="report-history-feedback">
                      <div className="rep-feedback-header">
                        <MessageSquare size={14} color="#059669" />
                        <span>Comentario / Feedback del Administrador:</span>
                        {rep.admin_responsable && (
                          <span className="rep-admin-name">({rep.admin_responsable})</span>
                        )}
                      </div>
                      <p className="rep-feedback-text">{rep.feedback_admin}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="report-modal-footer">
          <button className="report-btn report-btn-secondary" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
