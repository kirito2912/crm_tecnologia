import React from 'react';
import {
  FileText,
  FileCode,
  Download,
  Eye,
  Trash2,
  Calendar,
  User,
  Tag,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import type { Documento } from '../../types/documento';

interface DocumentCardProps {
  documento: Documento;
  onPreview: (doc: Documento) => void;
  onDownload: (doc: Documento) => void;
  onDelete: (id: string) => void;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  documento,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const isPdf = documento.tipo.toLowerCase().includes('pdf');
  const isWord =
    documento.tipo.toLowerCase().includes('doc') ||
    documento.tipo.toLowerCase().includes('word');
  const isAdminUpload = documento.usuario_rol.toLowerCase().includes('admin');

  const getDocTypeBadge = () => {
    if (isPdf) {
      return (
        <div className="doc-badge-type doc-badge-type--pdf">
          <FileText size={13} />
          <span>PDF DOCUMENT</span>
        </div>
      );
    }
    if (isWord) {
      return (
        <div className="doc-badge-type doc-badge-type--word">
          <FileCode size={13} />
          <span>MICROSOFT WORD</span>
        </div>
      );
    }
    return (
      <div className="doc-badge-type doc-badge-type--generic">
        <FileSpreadsheet size={13} />
        <span>DOCUMENTO</span>
      </div>
    );
  };

  return (
    <div className={`document-card ${isPdf ? 'document-card--pdf' : 'document-card--word'}`}>
      {/* Encabezado de la Tarjeta */}
      <div className="document-card__header">
        <div className="document-card__icon-box">
          {isPdf ? (
            <div className="doc-icon-wrapper doc-icon-wrapper--pdf">
              <FileText size={24} />
            </div>
          ) : (
            <div className="doc-icon-wrapper doc-icon-wrapper--word">
              <FileCode size={24} />
            </div>
          )}
        </div>

        <div className="document-card__top-info">
          {getDocTypeBadge()}
          <span className="doc-category-badge">{documento.categoria}</span>
        </div>
      </div>

      {/* Título y Descripción */}
      <div className="document-card__body">
        <h4 className="document-card__title" title={documento.nombre}>
          {documento.nombre}
        </h4>
        <p className="document-card__description">
          {documento.descripcion || 'Sin descripción adicional registrada.'}
        </p>

        {/* Tags / Etiquetas */}
        {documento.tags_json && documento.tags_json.length > 0 && (
          <div className="doc-tags-list">
            {documento.tags_json.slice(0, 3).map((tag, idx) => (
              <span key={idx} className="doc-tag-pill">
                <Tag size={10} />
                {tag}
              </span>
            ))}
            {documento.tags_json.length > 3 && (
              <span className="doc-tag-more">+{documento.tags_json.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* Metadatos de Carga (Subido por, Rol, Tamaño, Fecha) */}
      <div className="document-card__metadata">
        <div className="doc-meta-row">
          <div className="doc-meta-item">
            <User size={13} color="#64748b" />
            <span className="doc-uploader-name">{documento.subido_por}</span>
          </div>

          <span
            className={`doc-role-badge ${
              isAdminUpload ? 'doc-role-badge--admin' : 'doc-role-badge--analista'
            }`}
          >
            {isAdminUpload ? <Shield size={10} /> : <User size={10} />}
            {isAdminUpload ? 'Administrador' : 'Analista'}
          </span>
        </div>

        <div className="doc-meta-row doc-meta-row--secondary">
          <div className="doc-meta-item">
            <Calendar size={13} color="#94a3b8" />
            <span>
              {new Date(documento.created_at).toLocaleDateString('es-PE', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </span>
          </div>
          <span className="doc-size-badge">{documento.tamanio}</span>
        </div>
      </div>

      {/* Botones de Acción */}
      <div className="document-card__actions">
        <button
          type="button"
          className="doc-action-btn doc-action-btn--preview"
          onClick={() => onPreview(documento)}
          title="Previsualizar archivo y detalles"
        >
          <Eye size={14} />
          <span>Vista Previa</span>
        </button>

        <button
          type="button"
          className="doc-action-btn doc-action-btn--download"
          onClick={() => onDownload(documento)}
          title="Descargar documento completo"
        >
          <Download size={14} />
          <span>Descargar</span>
        </button>

        <button
          type="button"
          className="doc-action-btn doc-action-btn--delete"
          onClick={() => onDelete(documento.id)}
          title="Eliminar documento"
          aria-label="Eliminar documento"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};
