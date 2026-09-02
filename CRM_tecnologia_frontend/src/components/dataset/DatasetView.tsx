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
  Zap,
  Database,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useCsv } from '../../context/CsvContext';
import { CsvCard } from '../csv/CsvCard';
import { CsvDetailModal } from '../csv/CsvDetailModal';
import { CsvComparisonPanel } from '../csv/CsvComparisonPanel';
import type { CsvDataset, CsvRow } from '../../types/csv';

interface DatasetViewProps {
  searchQuery?: string;
  onGoToComparativa?: (idA?: string, idB?: string) => void;
}

export const DatasetView: React.FC<DatasetViewProps> = ({ searchQuery = '', onGoToComparativa }) => {
  const { datasets, addDataset, addDirectDataset, removeDataset, getComparison } = useCsv();

  // Estado de la vista
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Modal de detalle
  const [previewDataset, setPreviewDataset] = useState<CsvDataset | null>(null);

  // Selección para comparar (máx 2)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);

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

  // ── Generador Rápido de Datasets Big Data para Demostración ──────────────

  const handleGenerateBigData = () => {
    setIsUploading(true);
    setUploadError(null);
    setTimeout(() => {
      try {
        const PRODUCTS = [
          { name: 'Servidor Dell PowerEdge R750', cat: 'Servidores', priceA: 8450, priceB: 8600 },
          { name: 'Lenovo ThinkPad P16 Workstation', cat: 'Laptops', priceA: 2890, priceB: 2750 },
          { name: 'Dell UltraSharp 32 4K USB-C', cat: 'Monitores', priceA: 820, priceB: 850 },
          { name: 'Cisco Catalyst 9300 24-Port', cat: 'Redes', priceA: 4150, priceB: 3890 },
          { name: 'Synology Enterprise NAS 96TB', cat: 'Storage', priceA: 6200, priceB: 6350 },
          { name: 'Fortinet FortiGate 100F Firewall', cat: 'Seguridad', priceA: 3100, priceB: 3250 },
          { name: 'HPE ProLiant DL380 Gen10 Server', cat: 'Servidores', priceA: 9200, priceB: 9100 },
          { name: 'Apple MacBook Pro 16 M3 Max', cat: 'Laptops', priceA: 3499, priceB: 3450 },
          { name: 'Ubiquiti UniFi Dream Machine Pro', cat: 'Redes', priceA: 1450, priceB: 1520 },
          { name: 'APC Smart-UPS RT 5000VA On-Line', cat: 'Energía', priceA: 2800, priceB: 2900 },
        ];

        const COUNT = 50000;
        const rowsA: CsvRow[] = [];
        const rowsB: CsvRow[] = [];

        for (let i = 0; i < COUNT; i++) {
          const p = PRODUCTS[i % PRODUCTS.length];
          const qtyA = Math.floor(1 + Math.random() * 8);
          const qtyB = Math.floor(1 + Math.random() * 9);
          rowsA.push({
            Producto: p.name,
            Categoria: p.cat,
            Cantidad: String(qtyA),
            Precio_Unitario: String(p.priceA),
            Total_Ventas: String(qtyA * p.priceA),
            Transaccion_ID: `TX-A-${100000 + i}`,
          });
          rowsB.push({
            Producto: p.name,
            Categoria: p.cat,
            Cantidad: String(qtyB),
            Precio_Unitario: String(p.priceB),
            Total_Ventas: String(qtyB * p.priceB),
            Transaccion_ID: `TX-B-${100000 + i}`,
          });
        }

        const dsA: CsvDataset = {
          id: `bigdata-alfa-${Date.now()}`,
          name: 'TechCore Global Enterprise (50,000 transacciones)',
          uploadedAt: new Date().toISOString(),
          rowCount: COUNT,
          columns: ['Producto', 'Categoria', 'Cantidad', 'Precio_Unitario', 'Total_Ventas', 'Transaccion_ID'],
          rows: rowsA,
          color: '#2563eb',
          categoria: 'Big Data & Enterprise',
          rowsLoaded: true,
          productCol: 'Producto',
          qtyCol: 'Cantidad',
          priceCol: 'Precio_Unitario',
          totalCol: 'Total_Ventas',
          categoryCol: 'Categoria',
        };

        const dsB: CsvDataset = {
          id: `bigdata-beta-${Date.now()}`,
          name: 'NovaTech Global Solutions (50,000 transacciones)',
          uploadedAt: new Date().toISOString(),
          rowCount: COUNT,
          columns: ['Producto', 'Categoria', 'Cantidad', 'Precio_Unitario', 'Total_Ventas', 'Transaccion_ID'],
          rows: rowsB,
          color: '#7c3aed',
          categoria: 'Big Data & Enterprise',
          rowsLoaded: true,
          productCol: 'Producto',
          qtyCol: 'Cantidad',
          priceCol: 'Precio_Unitario',
          totalCol: 'Total_Ventas',
          categoryCol: 'Categoria',
        };

        if (addDirectDataset) {
          addDirectDataset(dsA);
          addDirectDataset(dsB);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        setUploadError('Error al generar datasets Big Data: ' + message);
      } finally {
        setIsUploading(false);
      }
    }, 100);
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
          <button
            type="button"
            className="csv-bigdata-btn"
            onClick={handleGenerateBigData}
            disabled={isUploading}
            title="Generar 2 datasets masivos con 50,000 registros cada uno"
          >
            <Zap size={15} color="#eab308" />
            <span>Generar Datasets Big Data (50,000 filas c/u)</span>
          </button>
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
            {selectedIds.length > 0 && (
              <div className="dataset-view__selection-info">
                <span>
                  {selectedIds.length} de 2 seleccionados para comparar
                </span>
                <button
                  type="button"
                  className="dataset-view__clear-sel-btn"
                  onClick={handleClearSelection}
                >
                  Limpiar
                </button>
              </div>
            )}
          </div>

          <div className="csv-grid">
            {filteredDatasets.map((dataset) => (
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
        </section>
      )}

      {/* ── Estado vacío ── */}
      {datasets.length === 0 && !isUploading && (
        <div className="dataset-view__empty">
          <FileSpreadsheet size={48} className="dataset-view__empty-icon" />
          <p className="dataset-view__empty-title">No se encontraron datasets.</p>
          <p className="dataset-view__empty-sub">
            Sube un archivo CSV o haz clic en "Generar Datasets Big Data" para comenzar el análisis comparativo.
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
