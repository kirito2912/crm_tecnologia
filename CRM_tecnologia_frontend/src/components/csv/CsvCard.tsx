import React from 'react';
import { FileSpreadsheet, Trash2, Eye, Columns2, Rows2 } from 'lucide-react';
import type { CsvDataset } from '../../types/csv';

interface CsvCardProps {
  dataset: CsvDataset;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (dataset: CsvDataset) => void;
  selectionLabel?: string; // "A" | "B" cuando está seleccionado para comparar
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(n: number): string {
  return n.toLocaleString('es-PE');
}

export const CsvCard: React.FC<CsvCardProps> = ({
  dataset,
  isSelected,
  onSelect,
  onDelete,
  onPreview,
  selectionLabel,
}) => {
  return (
    <div
      className={`csv-card${isSelected ? ' csv-card--selected' : ''}`}
      style={{ '--card-color': dataset.color } as React.CSSProperties}
      onClick={() => onSelect(dataset.id)}
    >
      {/* Franja de color superior */}
      <div className="csv-card__stripe" />

      {/* Badge de selección (A / B) */}
      {selectionLabel && (
        <div className="csv-card__selection-badge">{selectionLabel}</div>
      )}

      {/* Icono + nombre */}
      <div className="csv-card__header">
        <div className="csv-card__icon">
          <FileSpreadsheet size={22} />
        </div>
        <div className="csv-card__title-block">
          <p className="csv-card__name" title={dataset.name}>
            {dataset.name}
          </p>
          <p className="csv-card__date">{formatDate(dataset.uploadedAt)}</p>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="csv-card__stats">
        <div className="csv-card__stat">
          <Rows2 size={13} />
          <span>{formatNumber(dataset.rowCount)} filas</span>
        </div>
        <div className="csv-card__stat">
          <Columns2 size={13} />
          <span>{dataset.columns.length} columnas</span>
        </div>
      </div>

      {/* Preview de columnas */}
      <div className="csv-card__columns-preview">
        {dataset.columns.slice(0, 4).map((col) => (
          <span key={col} className="csv-card__col-chip">
            {col}
          </span>
        ))}
        {dataset.columns.length > 4 && (
          <span className="csv-card__col-chip csv-card__col-chip--more">
            +{dataset.columns.length - 4}
          </span>
        )}
      </div>

      {/* Acciones */}
      <div className="csv-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          className="csv-card__btn csv-card__btn--preview"
          onClick={() => onPreview(dataset)}
          title="Ver dataset completo"
        >
          <Eye size={14} />
          Ver datos
        </button>
        <button
          className="csv-card__btn csv-card__btn--delete"
          onClick={() => onDelete(dataset.id)}
          title="Eliminar CSV"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

export default CsvCard;
