import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import type { CsvDataset } from '../../types/csv';

interface CsvDetailModalProps {
  dataset: CsvDataset;
  onClose: () => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export const CsvDetailModal: React.FC<CsvDetailModalProps> = ({ dataset, onClose }) => {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filtrar filas por búsqueda global
  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return dataset.rows;
    return dataset.rows.filter((row) =>
      Object.values(row).some((v) => v.toLowerCase().includes(q))
    );
  }, [dataset.rows, search]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  const paginatedRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, safePage, pageSize]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  // Exportar vista filtrada como CSV
  const handleExport = () => {
    const header = dataset.columns.join(',');
    const body = filteredRows
      .map((row) =>
        dataset.columns
          .map((col) => `"${(row[col] ?? '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export_${dataset.name}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="csv-detail-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="csv-detail-modal__header"
          style={{ borderTop: `4px solid ${dataset.color}` }}
        >
          <div className="csv-detail-modal__title">
            <FileSpreadsheet size={20} color={dataset.color} />
            <div>
              <h2>{dataset.name}</h2>
              <p>
                {dataset.rows.length.toLocaleString('es-PE')} filas ·{' '}
                {dataset.columns.length} columnas
              </p>
            </div>
          </div>
          <div className="csv-detail-modal__header-actions">
            <button
              className="csv-detail-modal__export-btn"
              onClick={handleExport}
              title="Exportar vista filtrada"
            >
              <Download size={15} />
              Exportar
            </button>
            <button className="modal-close-btn" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="csv-detail-modal__controls">
          <div className="csv-detail-modal__search-wrap">
            <Search size={15} />
            <input
              type="text"
              placeholder="Buscar en todas las columnas..."
              value={search}
              onChange={handleSearchChange}
              className="csv-detail-modal__search"
            />
          </div>
          <div className="csv-detail-modal__pagination-info">
            <span>
              {filteredRows.length.toLocaleString('es-PE')} resultado
              {filteredRows.length !== 1 ? 's' : ''}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="csv-detail-modal__page-size"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s} / pág
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="csv-detail-modal__table-wrap">
          {dataset.columns.length === 0 ? (
            <div className="csv-detail-modal__empty">
              No se encontraron columnas en este archivo.
            </div>
          ) : (
            <table className="csv-detail-modal__table">
              <thead>
                <tr>
                  <th className="csv-detail-modal__row-num">#</th>
                  {dataset.columns.map((col) => (
                    <th key={col} title={col}>
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={dataset.columns.length + 1}
                      style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}
                    >
                      Sin resultados para "{search}"
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map((row, idx) => (
                    <tr key={idx}>
                      <td className="csv-detail-modal__row-num">
                        {(safePage - 1) * pageSize + idx + 1}
                      </td>
                      {dataset.columns.map((col) => (
                        <td key={col} title={row[col] ?? ''}>
                          {row[col] ?? '—'}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="csv-detail-modal__footer">
          <span className="csv-detail-modal__page-label">
            Página {safePage} de {totalPages}
          </span>
          <div className="csv-detail-modal__pager">
            <button
              onClick={() => setPage(1)}
              disabled={safePage === 1}
              title="Primera página"
            >
              <ChevronsLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              title="Anterior"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              title="Siguiente"
            >
              <ChevronRight size={15} />
            </button>
            <button
              onClick={() => setPage(totalPages)}
              disabled={safePage === totalPages}
              title="Última página"
            >
              <ChevronsRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CsvDetailModal;
