import React, { useState, useEffect } from 'react';
import { X, Upload, FileSpreadsheet, Tag, Target, AlignLeft } from 'lucide-react';
import { DATASET_CATEGORIES, type DatasetUploadMeta } from '../../types/dataset';
import { detectTargetColumn } from '../../utils/csvParser';
import type { ParsedCsv } from '../../utils/csvParser';

interface DatasetUploadModalProps {
  file: File;
  parsed: ParsedCsv;
  onConfirm: (meta: DatasetUploadMeta) => Promise<void>;
  onCancel: () => void;
  isUploading: boolean;
}

export const DatasetUploadModal: React.FC<DatasetUploadModalProps> = ({
  file,
  parsed,
  onConfirm,
  onCancel,
  isUploading,
}) => {
  const defaultTarget = detectTargetColumn(parsed.columns, parsed.rows);

  const [meta, setMeta] = useState<DatasetUploadMeta>({
    nombre: file.name.replace(/\.(csv|json)$/i, ''),
    descripcion: '',
    categoria: 'ventas',
    columnaObjetivo: defaultTarget,
  });

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isUploading) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onCancel, isUploading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onConfirm(meta);
  };

  return (
    <div className="dataset-modal-overlay" onClick={() => !isUploading && onCancel()}>
      <div className="dataset-modal" onClick={(e) => e.stopPropagation()}>
        <div className="dataset-modal__header">
          <div className="dataset-modal__header-icon">
            <Upload size={20} />
          </div>
          <div>
            <h3>Confirmar carga de dataset</h3>
            <p>Se guardará localmente en tu navegador (modo local)</p>
          </div>
          <button type="button" className="dataset-modal__close" onClick={onCancel} disabled={isUploading}>
            <X size={18} />
          </button>
        </div>

        <div className="dataset-modal__preview">
          <FileSpreadsheet size={16} />
          <span>{file.name}</span>
          <span className="dataset-modal__preview-meta">
            {parsed.rows.length.toLocaleString('es-PE')} filas · {parsed.columns.length} columnas
          </span>
        </div>

        <form onSubmit={handleSubmit} className="dataset-modal__form">
          <label>
            <Tag size={14} />
            Nombre
            <input
              type="text"
              value={meta.nombre}
              onChange={(e) => setMeta((m) => ({ ...m, nombre: e.target.value }))}
              required
              maxLength={200}
            />
          </label>

          <label>
            <AlignLeft size={14} />
            Descripción
            <textarea
              value={meta.descripcion}
              onChange={(e) => setMeta((m) => ({ ...m, descripcion: e.target.value }))}
              rows={2}
              placeholder="Ej: Ventas Q1 2025 vs competencia regional"
            />
          </label>

          <label>
            Categoría
            <select
              value={meta.categoria}
              onChange={(e) => setMeta((m) => ({ ...m, categoria: e.target.value }))}
            >
              {DATASET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            <Target size={14} />
            Columna objetivo (ML)
            <select
              value={meta.columnaObjetivo}
              onChange={(e) => setMeta((m) => ({ ...m, columnaObjetivo: e.target.value }))}
            >
              {parsed.columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </label>

          <div className="dataset-modal__columns">
            <span>Columnas detectadas:</span>
            <div className="dataset-modal__chips">
              {parsed.columns.slice(0, 8).map((c) => (
                <span key={c} className="dataset-modal__chip">{c}</span>
              ))}
              {parsed.columns.length > 8 && (
                <span className="dataset-modal__chip">+{parsed.columns.length - 8}</span>
              )}
            </div>
          </div>

          <div className="dataset-modal__actions">
            <button type="button" className="dataset-modal__btn dataset-modal__btn--cancel" onClick={onCancel} disabled={isUploading}>
              Cancelar
            </button>
            <button type="submit" className="dataset-modal__btn dataset-modal__btn--submit" disabled={isUploading}>
              {isUploading ? 'Guardando...' : 'Guardar dataset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DatasetUploadModal;
