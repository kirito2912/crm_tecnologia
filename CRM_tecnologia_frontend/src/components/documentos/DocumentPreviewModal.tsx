import React from 'react';
import {
  X,
  Download,
  FileText,
  FileCode,
  Calendar,
  User,
  Shield,
  Tag,
  CheckCircle2,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';
import type { Documento } from '../../types/documento';

interface DocumentPreviewModalProps {
  documento: Documento;
  onClose: () => void;
  onDownload: (doc: Documento) => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  documento,
  onClose,
  onDownload,
}) => {
  const isPdf = documento.tipo.toLowerCase().includes('pdf');
  const isWord =
    documento.tipo.toLowerCase().includes('doc') ||
    documento.tipo.toLowerCase().includes('word');
  const isAdminUpload = documento.usuario_rol.toLowerCase().includes('admin');

  return (
    <div className="doc-modal-overlay" onClick={onClose}>
      <div
        className="doc-modal-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header del Modal */}
        <div className="doc-modal-header">
          <div className="doc-modal-title-box">
            <div
              className={`doc-modal-icon-badge ${
                isPdf ? 'doc-modal-icon-badge--pdf' : 'doc-modal-icon-badge--word'
              }`}
            >
              {isPdf ? <FileText size={22} /> : <FileCode size={22} />}
            </div>
            <div>
              <h3 className="doc-modal-title">{documento.nombre}</h3>
              <div className="doc-modal-subtitle-row">
                <span className="doc-modal-category-tag">{documento.categoria}</span>
                <span className="doc-modal-id-tag">ID: {documento.id}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="doc-modal-close-btn"
            onClick={onClose}
            aria-label="Cerrar vista previa"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="doc-modal-body">
          {/* Panel Izquierdo: Visualizador de Archivo */}
          <div className="doc-modal-preview-pane">
            {isPdf && documento.archivo_base64 ? (
              <iframe
                src={documento.archivo_base64}
                title={documento.nombre}
                className="doc-pdf-iframe"
              />
            ) : (
              <div className="doc-virtual-reader">
                <div className="doc-virtual-reader-header">
                  <div className="doc-reader-badge">
                    {isPdf ? <FileText size={16} /> : <FileCode size={16} />}
                    <span>
                      {isPdf ? 'Documento PDF Corporativo' : 'Documento Microsoft Word'}
                    </span>
                  </div>
                  <span className="doc-reader-status">
                    <CheckCircle2 size={14} color="#16a34a" /> Integridad Verificada
                  </span>
                </div>

                <div className="doc-virtual-reader-content">
                  <div className="doc-paper-sheet">
                    <div className="doc-paper-header-brand">
                      <strong>DATATECH ANALYTICS ENTERPRISE</strong>
                      <span>Repositorio Central de Archivos</span>
                    </div>

                    <h2 className="doc-paper-title">{documento.nombre}</h2>

                    <div className="doc-paper-meta-summary">
                      <div>
                        <strong>Categoría:</strong> {documento.categoria}
                      </div>
                      <div>
                        <strong>Preparado por:</strong> {documento.subido_por} (
                        {documento.usuario_rol})
                      </div>
                      <div>
                        <strong>Fecha de Registro:</strong>{' '}
                        {new Date(documento.created_at).toLocaleString('es-PE')}
                      </div>
                    </div>

                    <hr className="doc-paper-divider" />

                    <div className="doc-paper-section">
                      <h4>1. Resumen Ejecutivo del Documento</h4>
                      <p>
                        {documento.descripcion ||
                          'Este archivo forma parte del repositorio compartido de inteligencia comercial de DataTech Analytics. Contiene directrices, especificaciones y registros analíticos sincronizados entre los equipos de analistas y administradores.'}
                      </p>
                    </div>

                    <div className="doc-paper-section">
                      <h4>2. Metadatos de Infraestructura</h4>
                      <p>
                        El archivo ha sido indexado con el identificador criptográfico{' '}
                        <code>{documento.id}</code> con un peso de{' '}
                        <code>{documento.tamanio}</code> y formato{' '}
                        <code>.{documento.tipo}</code>.
                      </p>
                    </div>

                    {documento.tags_json && documento.tags_json.length > 0 && (
                      <div className="doc-paper-section">
                        <h4>3. Etiquetas Asociadas</h4>
                        <div className="doc-paper-tags">
                          {documento.tags_json.map((tag, i) => (
                            <span key={i} className="doc-paper-tag-pill">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="doc-paper-watermark">DATATECH ANALYTICS - CONFIDENCIAL</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel Derecho: Metadatos y Auditoría */}
          <div className="doc-modal-sidebar">
            <div className="doc-info-block">
              <h4 className="doc-info-block-title">
                <Layers size={15} /> Información del Archivo
              </h4>

              <div className="doc-info-list">
                <div className="doc-info-item">
                  <span className="doc-info-item-label">Formato:</span>
                  <span className="doc-info-item-val" style={{ textTransform: 'uppercase' }}>
                    .{documento.tipo}
                  </span>
                </div>

                <div className="doc-info-item">
                  <span className="doc-info-item-label">Tamaño:</span>
                  <span className="doc-info-item-val">{documento.tamanio}</span>
                </div>

                <div className="doc-info-item">
                  <span className="doc-info-item-label">Categoría:</span>
                  <span className="doc-info-item-val">{documento.categoria}</span>
                </div>

                <div className="doc-info-item">
                  <span className="doc-info-item-label">Fecha de Carga:</span>
                  <span className="doc-info-item-val">
                    {new Date(documento.created_at).toLocaleDateString('es-PE', {
                      dateStyle: 'medium',
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Autor y Rol */}
            <div className="doc-info-block">
              <h4 className="doc-info-block-title">
                <User size={15} /> Autor y Permisos
              </h4>

              <div className="doc-author-card">
                <div
                  className="doc-author-avatar"
                  style={{ background: isAdminUpload ? '#4f46e5' : '#059669' }}
                >
                  {isAdminUpload ? 'AD' : 'AN'}
                </div>
                <div className="doc-author-details">
                  <strong>{documento.subido_por}</strong>
                  <span
                    className={`doc-role-badge ${
                      isAdminUpload ? 'doc-role-badge--admin' : 'doc-role-badge--analista'
                    }`}
                  >
                    {isAdminUpload ? <Shield size={11} /> : <User size={11} />}
                    {isAdminUpload ? 'Administrador' : 'Analista'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tags */}
            {documento.tags_json && documento.tags_json.length > 0 && (
              <div className="doc-info-block">
                <h4 className="doc-info-block-title">
                  <Tag size={15} /> Etiquetas Clave
                </h4>
                <div className="doc-tags-cloud">
                  {documento.tags_json.map((t, i) => (
                    <span key={i} className="doc-tag-pill">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Banner de Sincronización */}
            <div className="doc-sync-banner">
              <CheckCircle2 size={16} color="#059669" />
              <span>
                <strong>Sincronizado:</strong> Este documento está disponible en todas las vistas y
                roles de la organización.
              </span>
            </div>

            {/* Acciones */}
            <div className="doc-modal-actions-box">
              <button
                type="button"
                className="doc-modal-btn-download"
                onClick={() => onDownload(documento)}
              >
                <Download size={16} />
                <span>Descargar Archivo</span>
              </button>

              <button type="button" className="doc-modal-btn-close" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
