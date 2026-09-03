import React, { useState, useRef, useMemo } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  GitCompare,
  X,
  Info,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCsv } from '../../context/CsvContext';
import { CsvCard } from '../csv/CsvCard';
import { CsvDetailModal } from '../csv/CsvDetailModal';
import { CsvComparisonPanel } from '../csv/CsvComparisonPanel';
import type { CsvDataset } from '../../types/csv';

const PAGE_SIZE = 12;

interface DatasetViewProps {
  searchQuery?: string;
  onGoToComparativa?: (idA?: string, idB?: string) => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({ searchQuery = '', onGoToComparativa }) => {
  const { datasets, addDataset, removeDataset, getComparison } = useCsv();

  // Estado de la vista
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal de detalle
  const [previewDataset, setPreviewDataset] = useState<CsvDataset | null>(null);

  // Selección para comparar (máx 2)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

  // Vista y paginación
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Subida de archivo (Soporte Big Data hasta 1 GB) ──────────────────────

  const processFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setUploadError('Solo se aceptan archivos en formato .csv');
      return;
    }
    if (file.size > 1024 * 1024 * 1024) {
      setUploadError('El archivo supera el límite máximo de 1 GB');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      await addDataset(file);
    } catch {
      setUploadError('Error al procesar el archivo. Verifica que sea un CSV con datos estructurados.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };


  // ── Selección para comparar ──────────────────────────────────────────────

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 2) {
        setShowComparison(true);
        return [prev[1], id];
      }
      const next = [...prev, id];
      if (next.length === 2) {
        setShowComparison(true);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
    setShowComparison(false);
  };

  // ── Filtrado por búsqueda ────────────────────────────────────────────────

  const filteredDatasets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return datasets;
    return datasets.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.categoria && d.categoria.toLowerCase().includes(q)) ||
        d.columns.some((c) => c.toLowerCase().includes(q))
    );
  }, [datasets, searchQuery]);

  // ── Paginación ───────────────────────────────────────────────────────────

  const totalPages = Math.max(1, Math.ceil(filteredDatasets.length / PAGE_SIZE));
  const safePage   = Math.min(Math.max(1, currentPage), totalPages);
  const pagedDatasets = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDatasets.slice(start, start + PAGE_SIZE);
  }, [filteredDatasets, safePage]);

  // Resetear página al buscar
  const handlePageChange = (p: number) => setCurrentPage(Math.min(Math.max(1, p), totalPages));

  // ── Comparación de los dos seleccionados ─────────────────────────────────

  const canCompare = selectedIds.length === 2;
  const comparisonResult = useMemo(
    () => (canCompare ? getComparison(selectedIds[0], selectedIds[1]) : null),
    [canCompare, selectedIds, datasets, getComparison]
  );

  return (
    <div className="dataset-view">
      {/* ── Header ── */}
      <div className="dataset-view__header">
        <div>
          <h2>Datasets de Empresas</h2>
          <p>
            Almacena, visualiza y gestiona los catálogos y reportes comerciales de diferentes
            empresas con arquitectura optimizada para Big Data.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {datasets.length > 0 && (
            <div className="dataset-view__header-stats">
              <span>
                {datasets.length} dataset{datasets.length !== 1 ? 's' : ''} registrado{datasets.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Zona de carga ── */}
      <div
        className={`csv-dropzone${isDragging ? ' csv-dropzone--active' : ''}${isUploading ? ' csv-dropzone--loading' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
        {isUploading ? (
          <div className="csv-dropzone__uploading">
            <div className="csv-dropzone__spinner" />
            <span>Procesando dataset masivo con motor Big Data...</span>
          </div>
        ) : (
          <>
            <UploadCloud size={36} className="csv-dropzone__icon" />
            <p className="csv-dropzone__main">
              {isDragging ? 'Suelta el archivo CSV aquí' : 'Arrastra un archivo CSV o haz clic para subirlo'}
            </p>
            <p className="csv-dropzone__sub">
              Soporta delimitadores por coma o punto y coma · <strong>Optimizado para Big Data (hasta 1 GB / millones de filas)</strong>
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="csv-error-banner">
          <X size={14} />
          {uploadError}
        </div>
      )}

      {/* ── Cards de datasets ── */}
      {filteredDatasets.length > 0 && (
        <section className="dataset-view__section">
          <div className="dataset-view__section-header">
            <h3>
              Catálogos y Datasets Disponibles
              <span className="dataset-view__count-badge">{filteredDatasets.length}</span>
            </h3>
            <div className="dataset-view__section-controls">
              {selectedIds.length > 0 && (
                <div className="dataset-view__selection-info">
                  <span>{selectedIds.length} de 2 seleccionados</span>
                  <button type="button" className="dataset-view__clear-sel-btn" onClick={handleClearSelection}>
                    Limpiar
                  </button>
                </div>
              )}
              {/* Toggle vista */}
              <div className="dataset-view__view-toggle">
                <button
                  className={`dataset-view__view-btn${viewMode === 'grid' ? ' dataset-view__view-btn--active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Vista grilla"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  className={`dataset-view__view-btn${viewMode === 'list' ? ' dataset-view__view-btn--active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="Vista lista"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>

          <div className={viewMode === 'grid' ? 'csv-grid csv-grid--compact' : 'csv-grid csv-grid--list'}>
            {pagedDatasets.map((dataset) => (
              <CsvCard
                key={dataset.id}
                dataset={dataset}
                isSelected={selectedIds.includes(dataset.id)}
                selectionLabel={
                  selectedIds.indexOf(dataset.id) === 0
                    ? 'A'
                    : selectedIds.indexOf(dataset.id) === 1
                    ? 'B'
                    : undefined
                }
                onSelect={(id) => handleSelect(id)}
                onPreview={(ds) => setPreviewDataset(ds)}
                onDelete={(id) => {
                  removeDataset(id);
                  setSelectedIds((prev) => prev.filter((x) => x !== id));
                }}
              />
            ))}
          </div>

          {/* ── Paginación ── */}
          {totalPages > 1 && (
            <div className="dataset-view__pagination">
              <span className="dataset-view__pagination-info">
                Página {safePage} de {totalPages} &middot; {filteredDatasets.length} datasets
              </span>
              <div className="dataset-view__pagination-controls">
                <button
                  className="dataset-view__page-btn"
                  onClick={() => handlePageChange(safePage - 1)}
                  disabled={safePage === 1}
                  title="Anterior"
                >
                  <ChevronLeft size={15} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
                  .reduce<(number | '…')[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('…');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '…' ? (
                      <span key={`dots-${i}`} className="dataset-view__page-dots">…</span>
                    ) : (
                      <button
                        key={p}
                        className={`dataset-view__page-btn${p === safePage ? ' dataset-view__page-btn--active' : ''}`}
                        onClick={() => handlePageChange(p as number)}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  className="dataset-view__page-btn"
                  onClick={() => handlePageChange(safePage + 1)}
                  disabled={safePage === totalPages}
                  title="Siguiente"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Estado vacío ── */}
      {datasets.length === 0 && !isUploading && (
        <div className="dataset-view__empty">
          <FileSpreadsheet size={48} className="dataset-view__empty-icon" />
          <p className="dataset-view__empty-title">No se encontraron datasets.</p>
          <p className="dataset-view__empty-sub">
            Sube un archivo CSV para comenzar el análisis comparativo.
          </p>
        </div>
      )}

      {/* ── Panel flotante de comparativa rápida ── */}
      {selectedIds.length > 0 && (
        <div className="dataset-view__compare-bar">
          <div className="dataset-view__compare-bar-content">
            <div className="dataset-view__compare-bar-info">
              <GitCompare size={20} />
              <span>
                {selectedIds.length === 1
                  ? 'Selecciona un 2° dataset para ver la comparativa'
                  : '¡2 datasets seleccionados! Listos para comparar'}
              </span>
            </div>

            <div className="dataset-view__compare-bar-actions">
              {canCompare && (
                <>
                  <button
                    type="button"
                    className="dataset-view__btn-full-compare"
                    onClick={() => {
                      if (onGoToComparativa) {
                        onGoToComparativa(selectedIds[0], selectedIds[1]);
                      }
                    }}
                  >
                    Abrir Módulo de Comparativa Completa
                    <ArrowRight size={15} />
                  </button>

                  <button
                    type="button"
                    className="dataset-view__btn-compare"
                    onClick={() => setShowComparison(!showComparison)}
                  >
                    <span>{showComparison ? 'Ocultar Resumen Rápido' : 'Ver Resumen Rápido'}</span>
                    {showComparison ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                  </button>
                </>
              )}

              <button
                type="button"
                className="dataset-view__btn-cancel"
                onClick={handleClearSelection}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Comparativa rápida colapsable */}
          {showComparison && canCompare && comparisonResult && (
            <div className="dataset-view__compare-panel-wrapper">
              <CsvComparisonPanel
                comparison={comparisonResult}
                onClose={() => setShowComparison(false)}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Modal de detalle / preview del dataset ── */}
      {previewDataset && (
        <CsvDetailModal
          dataset={previewDataset}
          onClose={() => setPreviewDataset(null)}
        />
      )}
    </div>
  );
};

export default DatasetView;
