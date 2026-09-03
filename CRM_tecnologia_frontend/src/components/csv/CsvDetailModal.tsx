import React, { useState, useMemo } from 'react';
import {
  X, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  FileSpreadsheet, Download, BarChart2, TrendingUp, Table2,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
  LineChart, Line, Area, AreaChart,
  Tooltip as RTooltip, ResponsiveContainer,
} from 'recharts';
import type { CsvDataset } from '../../types/csv';
import { parseNumeric } from '../../utils/csvParser';

interface CsvDetailModalProps {
  dataset: CsvDataset;
  onClose: () => void;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PALETTE = [
  '#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
  '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#ec4899',
];

function isNumericCol(col: string, rows: CsvDataset['rows']): boolean {
  const sample = rows.slice(0, 30);
  const hits = sample.filter((r) => {
    const v = r[col]?.trim() ?? '';
    if (!v) return false;
    if (/^\d{4}-\d{2}-\d{2}/.test(v)) return false;
    if (/^\d{1,2}[/\-]\d{1,2}[/\-]\d{2,4}/.test(v)) return false;
    const c = v.replace(/[$€S/\s%,]/g, '').replace(/[^0-9.-]/g, '');
    return c.length > 0 && !isNaN(parseFloat(c));
  });
  return hits.length / Math.max(sample.length, 1) >= 0.5;
}

function isDateCol(col: string): boolean {
  return /^(fecha|date|año|year|mes|month|dia|day|hora|time|timestamp)/i.test(col);
}

function isTextCatCol(col: string): boolean {
  return /^(categoria|category|rubro|sector|tipo|type|familia|producto|product|descripcion|description|item|nombre|name)/i.test(col);
}

const fmtNum = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
  : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K`
  : n.toLocaleString('es-PE', { maximumFractionDigits: 2 });

// ─── componente ──────────────────────────────────────────────────────────────

type Tab = 'tabla' | 'barras' | 'linea';

export const CsvDetailModal: React.FC<CsvDetailModalProps> = ({ dataset, onClose }) => {
  const [tab, setTab] = useState<Tab>('tabla');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // ── columnas numéricas / texto ─────────────────────────────────────────────
  const numericCols = useMemo(
    () => dataset.columns.filter((c) => !isDateCol(c) && isNumericCol(c, dataset.rows)),
    [dataset]
  );
  const textCatCols = useMemo(
    () => dataset.columns.filter((c) => isTextCatCol(c) || (!isNumericCol(c, dataset.rows) && !isDateCol(c))),
    [dataset]
  );

  const [selectedNumCol, setSelectedNumCol] = useState<string>(() => numericCols[0] ?? '');
  const [selectedCatCol, setSelectedCatCol] = useState<string>(() => textCatCols[0] ?? '');

  // ── datos gráfico de barras (top 15 por columna de producto/categoría) ──────
  const barData = useMemo(() => {
    if (!selectedCatCol || !selectedNumCol) return [];
    const agg: Record<string, number> = {};
    for (const row of dataset.rows) {
      const cat = row[selectedCatCol]?.trim() || 'Sin categoría';
      const val = parseNumeric(row[selectedNumCol] ?? '');
      agg[cat] = (agg[cat] ?? 0) + (isNaN(val) ? 0 : val);
    }
    return Object.entries(agg)
      .map(([name, value]) => ({ name: name.length > 18 ? name.slice(0, 16) + '…' : name, value, fullName: name }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [dataset, selectedCatCol, selectedNumCol]);

  // ── datos gráfico de línea (evolución por posición de fila / agrupado si hay fechas) ──
  const lineData = useMemo(() => {
    if (!selectedNumCol) return [];
    // Tomar cada N filas como punto de la línea (máximo 60 puntos)
    const rows = dataset.rows;
    const step = Math.max(1, Math.floor(rows.length / 60));
    const points: { idx: string; value: number; avg: number }[] = [];
    let runSum = 0; let runCount = 0;
    for (let i = 0; i < rows.length; i += step) {
      const chunk = rows.slice(i, i + step);
      const vals = chunk.map((r) => parseNumeric(r[selectedNumCol] ?? '')).filter((v) => !isNaN(v));
      const chunkSum = vals.reduce((a, b) => a + b, 0);
      runSum += chunkSum; runCount += vals.length;
      if (vals.length) {
        points.push({
          idx: `${i + 1}`,
          value: chunkSum / vals.length,
          avg: runCount ? runSum / runCount : 0,
        });
      }
    }
    return points;
  }, [dataset, selectedNumCol]);

  // ── tabla filtrada ─────────────────────────────────────────────────────────
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

  const handleExport = () => {
    const header = dataset.columns.join(',');
    const body = filteredRows
      .map((row) => dataset.columns.map((col) => `"${(row[col] ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `export_${dataset.name}.csv`;
    a.click();
  };

  // ─── tabs config ────────────────────────────────────────────────────────────
  const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'tabla',  label: 'Tabla',  icon: <Table2 size={14} /> },
    { id: 'barras', label: 'Barras', icon: <BarChart2 size={14} /> },
    { id: 'linea',  label: 'Línea',  icon: <TrendingUp size={14} /> },
  ];

  const accentColor = dataset.color ?? '#6366f1';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="csv-dm" onClick={(e) => e.stopPropagation()} style={{ borderTop: `4px solid ${accentColor}` }}>

        {/* ══ HEADER ═══════════════════════════════════════════════════════════ */}
        <div className="csv-dm__header">
          <div className="csv-dm__header-left">
            <span className="csv-dm__icon" style={{ background: `${accentColor}18`, color: accentColor }}>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 className="csv-dm__title">{dataset.name}</h2>
              <p className="csv-dm__subtitle">
                {dataset.rows.length.toLocaleString('es-PE')} filas &middot; {dataset.columns.length} columnas
                {dataset.categoria && <> &middot; <span style={{ color: accentColor }}>{dataset.categoria}</span></>}
              </p>
            </div>
          </div>
          <div className="csv-dm__header-right">
            <button className="csv-dm__export-btn" onClick={handleExport} title="Exportar CSV">
              <Download size={14} /> Exportar
            </button>
            <button className="csv-dm__close-btn" onClick={onClose} title="Cerrar">
              <X size={17} />
            </button>
          </div>
        </div>

        {/* ══ TABS ══════════════════════════════════════════════════════════════ */}
        <div className="csv-dm__tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`csv-dm__tab${tab === t.id ? ' csv-dm__tab--active' : ''}`}
              style={tab === t.id ? { borderBottomColor: accentColor, color: accentColor } : {}}
              onClick={() => setTab(t.id)}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ══ CUERPO ════════════════════════════════════════════════════════════ */}
        <div className="csv-dm__body">

          {/* ── TAB: TABLA ────────────────────────────────────────────────────── */}
          {tab === 'tabla' && (
            <>
              <div className="csv-dm__controls">
                <div className="csv-dm__search-wrap">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Buscar en todas las columnas…"
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="csv-dm__search"
                  />
                </div>
                <div className="csv-dm__ctrl-right">
                  <span className="csv-dm__count">
                    {filteredRows.length.toLocaleString('es-PE')} resultado{filteredRows.length !== 1 ? 's' : ''}
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    className="csv-dm__page-size"
                  >
                    {PAGE_SIZE_OPTIONS.map((s) => <option key={s} value={s}>{s} / pág</option>)}
                  </select>
                </div>
              </div>

              <div className="csv-dm__table-wrap">
                <table className="csv-dm__table">
                  <thead>
                    <tr>
                      <th className="csv-dm__row-num">#</th>
                      {dataset.columns.map((col) => (
                        <th key={col} title={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={dataset.columns.length + 1} className="csv-dm__no-results">
                          Sin resultados para "{search}"
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, idx) => (
                        <tr key={idx}>
                          <td className="csv-dm__row-num">{(safePage - 1) * pageSize + idx + 1}</td>
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
              </div>

              <div className="csv-dm__footer">
                <span className="csv-dm__page-label">Página {safePage} de {totalPages}</span>
                <div className="csv-dm__pager">
                  <button onClick={() => setPage(1)} disabled={safePage === 1}><ChevronsLeft size={14} /></button>
                  <button onClick={() => setPage((p) => p - 1)} disabled={safePage === 1}><ChevronLeft size={14} /></button>
                  <button onClick={() => setPage((p) => p + 1)} disabled={safePage === totalPages}><ChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={safePage === totalPages}><ChevronsRight size={14} /></button>
                </div>
              </div>
            </>
          )}

          {/* ── SELECTOR COLUMNAS (barras / línea) ──────────────────────────── */}
          {(tab === 'barras' || tab === 'linea') && (
            <div className="csv-dm__chart-controls">
              {tab === 'barras' && (
                <>
                  <label className="csv-dm__ctrl-label">
                    Agrupar por
                    <select
                      value={selectedCatCol}
                      onChange={(e) => setSelectedCatCol(e.target.value)}
                      className="csv-dm__ctrl-select"
                    >
                      {[...textCatCols, ...numericCols].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="csv-dm__ctrl-label">
                    Valor a medir
                    <select
                      value={selectedNumCol}
                      onChange={(e) => setSelectedNumCol(e.target.value)}
                      className="csv-dm__ctrl-select"
                    >
                      {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                </>
              )}
              {tab === 'linea' && (
                <label className="csv-dm__ctrl-label">
                  Columna numérica
                  <select
                    value={selectedNumCol}
                    onChange={(e) => setSelectedNumCol(e.target.value)}
                    className="csv-dm__ctrl-select"
                  >
                    {numericCols.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
              )}
            </div>
          )}

          {/* ── TAB: BARRAS ───────────────────────────────────────────────────── */}
          {tab === 'barras' && (
            <div className="csv-dm__chart-area">
              {barData.length === 0 ? (
                <div className="csv-dm__chart-empty">Selecciona columnas válidas para generar el gráfico.</div>
              ) : (
                <>
                  <p className="csv-dm__chart-caption">
                    Top 15 — <b>{selectedNumCol}</b> por <b>{selectedCatCol}</b>
                  </p>
                  <ResponsiveContainer width="100%" height={340}>
                    <BarChart data={barData} margin={{ top: 10, right: 20, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: '#64748b' }}
                        angle={-35}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtNum} />
                      <RTooltip
                        formatter={(v, _name, item) =>
                          [fmtNum(Number(v ?? 0)), (item as { payload?: { fullName?: string } })?.payload?.fullName ?? String(_name)]}
                        contentStyle={{ borderRadius: 10, fontSize: 12 }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {barData.map((_, i) => (
                          <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          )}

          {/* ── TAB: LÍNEA ────────────────────────────────────────────────────── */}
          {tab === 'linea' && (
            <div className="csv-dm__chart-area">
              {lineData.length < 2 ? (
                <div className="csv-dm__chart-empty">No hay suficientes filas para trazar la evolución.</div>
              ) : (
                <>
                  <p className="csv-dm__chart-caption">
                    Evolución de <b>{selectedNumCol}</b> a lo largo de los registros
                    <span style={{ color: '#94a3b8', marginLeft: 8, fontSize: 11 }}>
                      (promedio por bloque · línea punteada = promedio acumulado)
                    </span>
                  </p>
                  <ResponsiveContainer width="100%" height={340}>
                    <AreaChart data={lineData} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor={accentColor} stopOpacity={0.18} />
                          <stop offset="95%" stopColor={accentColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="idx" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={fmtNum} />
                      <RTooltip
                        formatter={(v, key) => [fmtNum(Number(v ?? 0)), key === 'value' ? selectedNumCol : 'Promedio acum.']}
                        contentStyle={{ borderRadius: 10, fontSize: 12 }}
                        labelFormatter={(l) => `Fila ~${l}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke={accentColor}
                        strokeWidth={2}
                        fill="url(#areaGrad)"
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="avg"
                        stroke="#94a3b8"
                        strokeWidth={1.5}
                        strokeDasharray="5 4"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CsvDetailModal;
