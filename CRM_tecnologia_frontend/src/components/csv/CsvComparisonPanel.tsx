import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Minus, ArrowRight,
  Package, DollarSign, ShoppingCart, BarChart2,
  CheckCircle, AlertCircle, Info,
} from 'lucide-react';
import type { CsvComparisonResult } from '../../types/csv';

interface Props {
  comparison: CsvComparisonResult;
  onClose?: () => void;
}

// ─── Formateadores ────────────────────────────────────────────────────────

const fmtMoney = (n?: number) => {
  if (n === undefined || isNaN(n)) return '—';
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const fmtQty = (n?: number) =>
  n === undefined || isNaN(n) ? '—' : n.toLocaleString('es-PE', { maximumFractionDigits: 0 });

const fmtPct = (a?: number, b?: number): { label: string; dir: 'up' | 'down' | 'eq' | 'none' } => {
  if (a === undefined || b === undefined || isNaN(a) || isNaN(b)) return { label: '—', dir: 'none' };
  if (b === 0 && a === 0) return { label: '0%', dir: 'eq' };
  if (b === 0) return { label: 'Nuevo', dir: 'up' };
  const d = ((a - b) / Math.abs(b)) * 100;
  if (Math.abs(d) < 0.05) return { label: '0%', dir: 'eq' };
  return { label: `${d > 0 ? '+' : ''}${d.toFixed(1)}%`, dir: d > 0 ? 'up' : 'down' };
};

// ─── DiffCell ─────────────────────────────────────────────────────────────

const DiffCell: React.FC<{ a?: number; b?: number; money?: boolean }> = ({ a, b, money }) => {
  const { label, dir } = fmtPct(a, b);
  const diff = a !== undefined && b !== undefined ? a - b : undefined;

  const colors = { up: '#059669', down: '#dc2626', eq: '#94a3b8', none: '#94a3b8' };
  const bg = { up: '#f0fdf4', down: '#fef2f2', eq: '#f8fafc', none: 'transparent' };
  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        color: colors[dir], background: bg[dir],
        padding: '2px 7px', borderRadius: 20,
        fontSize: 11, fontWeight: 700,
      }}>
        <Icon size={11} />
        {label}
      </span>
      {diff !== undefined && Math.abs(diff) > 0 && (
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          {diff > 0 ? '+' : ''}{money ? fmtMoney(Math.abs(diff)) : fmtQty(Math.abs(diff))}
        </span>
      )}
    </div>
  );
};

// ─── StatusBadge de fila (solo en A / solo en B / en ambos) ───────────────

const RowBadge: React.FC<{ hasA: boolean; hasB: boolean; colorA: string; colorB: string }> = ({
  hasA, hasB, colorA, colorB,
}) => {
  if (hasA && hasB) return (
    <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>
      <CheckCircle size={10} style={{ verticalAlign: 'middle', marginRight: 2 }} />
      Ambos
    </span>
  );
  if (hasA) return (
    <span style={{ fontSize: 10, color: colorA, fontWeight: 700 }}>Solo A</span>
  );
  return (
    <span style={{ fontSize: 10, color: colorB, fontWeight: 700 }}>Solo B</span>
  );
};

// ─── Tooltip del gráfico ──────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label, colorA, colorB, nameA, nameB }: {
  active?: boolean; payload?: { dataKey: string; value: number }[];
  label?: string; colorA: string; colorB: string; nameA: string; nameB: string;
}) => {
  if (!active || !payload?.length) return null;
  const vA = payload.find(p => p.dataKey === 'valA')?.value;
  const vB = payload.find(p => p.dataKey === 'valB')?.value;
  const { label: pct, dir } = fmtPct(vA, vB);
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,.1)', fontSize: 12, minWidth: 200,
    }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 8, fontSize: 13 }}>{label}</p>
      {vA !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: colorA, fontWeight: 600 }}>{nameA}</span>
          <span style={{ fontWeight: 700 }}>{fmtMoney(vA)}</span>
        </div>
      )}
      {vB !== undefined && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: colorB, fontWeight: 600 }}>{nameB}</span>
          <span style={{ fontWeight: 700 }}>{fmtMoney(vB)}</span>
        </div>
      )}
      {pct !== '—' && (
        <div style={{
          borderTop: '1px solid #f1f5f9', marginTop: 6, paddingTop: 6,
          display: 'flex', justifyContent: 'space-between',
        }}>
          <span style={{ color: '#64748b' }}>Diferencia A vs B</span>
          <span style={{
            fontWeight: 700,
            color: dir === 'up' ? '#059669' : dir === 'down' ? '#dc2626' : '#94a3b8',
          }}>{pct}</span>
        </div>
      )}
    </div>
  );
};

// ─── Panel principal ──────────────────────────────────────────────────────

type Tab = 'resumen' | 'productos' | 'grafico';

export const CsvComparisonPanel: React.FC<Props> = ({ comparison }) => {
  const {
    datasetA, datasetB,
    productRows, productCol, qtyCol, priceCol, totalCol,
    statsA, statsB, sharedColumns,
  } = comparison;

  const colorA = datasetA.color;
  const colorB = datasetB.color;
  const [tab, setTab] = useState<Tab>('resumen');
  const [chartMode, setChartMode] = useState<'total' | 'qty'>('total');

  // Totales globales
  const grandTotalA = productRows.reduce((s, r) => s + (r.totalA ?? 0), 0);
  const grandTotalB = productRows.reduce((s, r) => s + (r.totalB ?? 0), 0);
  const grandQtyA = productRows.reduce((s, r) => s + (r.qtyA ?? 0), 0);
  const grandQtyB = productRows.reduce((s, r) => s + (r.qtyB ?? 0), 0);
  const moneyDiff = grandTotalA - grandTotalB;
  const { label: pctTotal, dir: dirTotal } = fmtPct(grandTotalA, grandTotalB);

  // Productos que aparecen en ambos / solo A / solo B
  const inBoth = productRows.filter(r => r.totalA !== undefined && r.totalB !== undefined);
  const onlyInA = productRows.filter(r => r.totalA !== undefined && r.totalB === undefined);
  const onlyInB = productRows.filter(r => r.totalA === undefined && r.totalB !== undefined);

  // Datos gráfico top-10 productos en ambos
  const chartData = useMemo(() => {
    const source = inBoth.length > 0 ? inBoth : productRows;
    return source.slice(0, 10).map(r => ({
      name: r.product.length > 16 ? r.product.slice(0, 16) + '…' : r.product,
      full: r.product,
      valA: chartMode === 'total' ? (r.totalA ?? 0) : (r.qtyA ?? 0),
      valB: chartMode === 'total' ? (r.totalB ?? 0) : (r.qtyB ?? 0),
    }));
  }, [inBoth, productRows, chartMode]);

  // Fallback sin columna producto: stats numéricas compartidas
  const numericFallback = statsA
    .filter(sA => statsB.some(sB => sB.column === sA.column))
    .map(sA => ({ col: sA, colB: statsB.find(s => s.column === sA.column)! }));

  const hasProducts = productRows.length > 0;

  return (
    <div className="csv-cmp">

      {/* ══ HEADER ══ */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={18} color="#2563eb" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#0f172a' }}>
              Comparativa de Datasets
            </h3>
            <p style={{ margin: 0, fontSize: 12, color: '#94a3b8' }}>
              <span style={{ color: colorA, fontWeight: 700 }}>A: {datasetA.name}</span>
              {' '}<ArrowRight size={11} style={{ verticalAlign: 'middle' }} />{' '}
              <span style={{ color: colorB, fontWeight: 700 }}>B: {datasetB.name}</span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: 4, borderRadius: 10 }}>
          {(['resumen', 'productos', 'grafico'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, transition: 'all .15s',
                background: tab === t ? '#ffffff' : 'transparent',
                color: tab === t ? '#1e293b' : '#64748b',
                boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,.08)' : 'none',
              }}
            >
              {t === 'resumen' ? ' Resumen' : t === 'productos' ? ' Productos' : ' Gráfico'}
            </button>
          ))}
        </div>
      </div>

      {/* ══ TAB: RESUMEN ══ */}
      {tab === 'resumen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* 3 cards grandes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>

            {/* Card A */}
            <div style={{
              border: `2px solid ${colorA}`, borderRadius: 14, padding: '18px 20px',
              background: `color-mix(in srgb, ${colorA} 5%, #ffffff)`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: colorA, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                Dataset A
              </div>
              <div style={{
                fontSize: 12, color: '#475569', marginBottom: 10, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {datasetA.name}
              </div>
              {grandTotalA > 0 && (
                <div style={{ fontSize: 22, fontWeight: 900, color: colorA }}>{fmtMoney(grandTotalA)}</div>
              )}
              {grandQtyA > 0 && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  <ShoppingCart size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {fmtQty(grandQtyA)} unidades
                </div>
              )}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                {datasetA.rowCount.toLocaleString('es-PE')} filas · {datasetA.columns.length} columnas
              </div>
            </div>

            {/* Card diferencia central */}
            <div style={{
              borderRadius: 14, padding: '18px 20px', textAlign: 'center',
              background: dirTotal === 'up' ? '#f0fdf4' : dirTotal === 'down' ? '#fef2f2' : '#f8fafc',
              border: `2px solid ${dirTotal === 'up' ? '#86efac' : dirTotal === 'down' ? '#fca5a5' : '#e2e8f0'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Diferencia A vs B
              </div>
              <div style={{
                fontSize: 28, fontWeight: 900,
                color: dirTotal === 'up' ? '#059669' : dirTotal === 'down' ? '#dc2626' : '#94a3b8',
              }}>
                {pctTotal}
              </div>
              {grandTotalA > 0 && grandTotalB > 0 && (
                <div style={{ fontSize: 13, fontWeight: 700, color: '#475569' }}>
                  {moneyDiff >= 0 ? '+' : ''}{fmtMoney(Math.abs(moneyDiff))}
                </div>
              )}
              <div style={{ fontSize: 11, color: '#94a3b8' }}>
                {dirTotal === 'up' ? 'A facturó más que B' : dirTotal === 'down' ? 'B facturó más que A' : 'Montos iguales'}
              </div>
            </div>

            {/* Card B */}
            <div style={{
              border: `2px solid ${colorB}`, borderRadius: 14, padding: '18px 20px',
              background: `color-mix(in srgb, ${colorB} 5%, #ffffff)`,
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: colorB, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 6 }}>
                Dataset B
              </div>
              <div style={{
                fontSize: 12, color: '#475569', marginBottom: 10, fontWeight: 600,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
              }}>
                {datasetB.name}
              </div>
              {grandTotalB > 0 && (
                <div style={{ fontSize: 22, fontWeight: 900, color: colorB }}>{fmtMoney(grandTotalB)}</div>
              )}
              {grandQtyB > 0 && (
                <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                  <ShoppingCart size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                  {fmtQty(grandQtyB)} unidades
                </div>
              )}
              <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
                {datasetB.rowCount.toLocaleString('es-PE')} filas · {datasetB.columns.length} columnas
              </div>
            </div>
          </div>

          {/* Resumen de productos */}
          {hasProducts && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: '#059669' }}>{inBoth.length}</div>
                <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Productos en ambos CSVs</div>
              </div>
              <div style={{ background: `color-mix(in srgb, ${colorA} 8%, #ffffff)`, border: `1px solid ${colorA}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: colorA }}>{onlyInA.length}</div>
                <div style={{ fontSize: 12, color: colorA, fontWeight: 600 }}>Solo en CSV A</div>
              </div>
              <div style={{ background: `color-mix(in srgb, ${colorB} 8%, #ffffff)`, border: `1px solid ${colorB}`, borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: colorB }}>{onlyInB.length}</div>
                <div style={{ fontSize: 12, color: colorB, fontWeight: 600 }}>Solo en CSV B</div>
              </div>
            </div>
          )}

          {/* Columnas detectadas */}
          {(productCol || qtyCol || priceCol || totalCol) && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: '10px 14px',
              display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center'
            }}>
              <Info size={14} color="#d97706" />
              <span style={{ fontSize: 12, color: '#92400e', fontWeight: 600 }}>Columnas detectadas:</span>
              {productCol && <span style={{ fontSize: 11, background: '#fef3c7', padding: '2px 8px', borderRadius: 6, color: '#92400e' }}> Producto: <b>{productCol}</b></span>}
              {qtyCol && <span style={{ fontSize: 11, background: '#fef3c7', padding: '2px 8px', borderRadius: 6, color: '#92400e' }}> Cantidad: <b>{qtyCol}</b></span>}
              {priceCol && <span style={{ fontSize: 11, background: '#fef3c7', padding: '2px 8px', borderRadius: 6, color: '#92400e' }}> Precio: <b>{priceCol}</b></span>}
              {totalCol && <span style={{ fontSize: 11, background: '#fef3c7', padding: '2px 8px', borderRadius: 6, color: '#92400e' }}> Total: <b>{totalCol}</b></span>}
            </div>
          )}

          {/* Columnas compartidas */}
          {sharedColumns.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>Columnas compartidas:</span>
              {sharedColumns.map(c => (
                <span key={c} style={{
                  fontSize: 11, background: '#f0fdf4', color: '#059669',
                  border: '1px solid #86efac', padding: '2px 8px', borderRadius: 5, fontWeight: 600,
                }}>{c}</span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: PRODUCTOS ══ */}
      {tab === 'productos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {!hasProducts && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12,
              padding: '20px 24px', display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ margin: '0 0 4px', fontWeight: 700, color: '#92400e', fontSize: 14 }}>
                  No se detectó una columna de productos
                </p>
                <p style={{ margin: 0, fontSize: 12, color: '#b45309' }}>
                  Para ver la comparativa por producto, tu CSV debe tener una columna con nombre
                  como <b>Producto</b>, <b>Descripcion</b>, <b>Item</b>, <b>Articulo</b> o <b>Nombre</b>.
                  Ve a la pestaña <b>Resumen</b> para ver las estadísticas numéricas globales.
                </p>
              </div>
            </div>
          )}

          {hasProducts && (
            <>
              {/* Leyenda de colores */}
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: colorA, display: 'inline-block' }} />
                  <b style={{ color: colorA }}>A</b> = {datasetA.name}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: colorB, display: 'inline-block' }} />
                  <b style={{ color: colorB }}>B</b> = {datasetB.name}
                </span>
                <span style={{ color: '#94a3b8' }}>
                  La columna <b>Δ Monto</b> muestra qué tanto más (+) o menos (-) facturó A respecto a B
                </span>
              </div>

              {/* Tabla */}
              <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 520 }}>
                  <thead>
                    <tr style={{ background: '#f8fafc' }}>
                      <th style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px solid #e2e8f0' }}>
                        Producto
                      </th>
                      {qtyCol && <>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorA, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Cant. A</th>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorB, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Cant. B</th>
                      </>}
                      {priceCol && <>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorA, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Precio A</th>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorB, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Precio B</th>
                      </>}
                      {totalCol && <>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorA, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Total A</th>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorB, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Total B</th>
                        <th style={{ padding: '11px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>Δ Monto</th>
                      </>}
                    </tr>
                  </thead>
                  <tbody>
                    {productRows.map((r, i) => {
                      const hasA = r.totalA !== undefined;
                      const hasB = r.totalB !== undefined;
                      return (
                        <tr key={i} style={{
                          background: i % 2 === 0 ? '#ffffff' : '#fafbfc',
                          borderBottom: '1px solid #f1f5f9'
                        }}>
                          <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                            <div style={{
                              fontWeight: 700, color: '#1e293b', fontSize: 13,
                              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                            }}
                              title={r.product}>
                              {r.product}
                            </div>
                            <RowBadge hasA={hasA} hasB={hasB} colorA={colorA} colorB={colorB} />
                          </td>
                          {qtyCol && <>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: hasA ? colorA : '#e2e8f0' }}>{fmtQty(r.qtyA)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: hasB ? colorB : '#e2e8f0' }}>{fmtQty(r.qtyB)}</td>
                          </>}
                          {priceCol && <>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: hasA ? colorA : '#e2e8f0' }}>{fmtMoney(r.priceA)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', color: hasB ? colorB : '#e2e8f0' }}>{fmtMoney(r.priceB)}</td>
                          </>}
                          {totalCol && <>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: hasA ? colorA : '#e2e8f0', fontSize: 13 }}>{fmtMoney(r.totalA)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: hasB ? colorB : '#e2e8f0', fontSize: 13 }}>{fmtMoney(r.totalB)}</td>
                            <td style={{ padding: '10px 12px', textAlign: 'right' }}>
                              {hasA && hasB
                                ? <DiffCell a={r.totalA} b={r.totalB} money />
                                : <span style={{ fontSize: 11, color: '#94a3b8' }}>—</span>}
                            </td>
                          </>}
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Fila de totales */}
                  {(grandTotalA > 0 || grandTotalB > 0) && (
                    <tfoot>
                      <tr style={{ background: '#f8fafc', borderTop: '2px solid #e2e8f0' }}>
                        <td style={{ padding: '12px 14px', fontWeight: 800, color: '#1e293b', fontSize: 13 }}>
                          TOTAL GENERAL
                        </td>
                        {qtyCol && <>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: colorA }}>{fmtQty(grandQtyA)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 800, color: colorB }}>{fmtQty(grandQtyB)}</td>
                        </>}
                        {priceCol && <><td /><td /></>}
                        {totalCol && <>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: colorA, fontSize: 14 }}>{fmtMoney(grandTotalA)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right', fontWeight: 900, color: colorB, fontSize: 14 }}>{fmtMoney(grandTotalB)}</td>
                          <td style={{ padding: '12px 12px', textAlign: 'right' }}>
                            <DiffCell a={grandTotalA} b={grandTotalB} money />
                          </td>
                        </>}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            </>
          )}

          {/* Fallback numérico si no hay producto */}
          {!hasProducts && numericFallback.length > 0 && (
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#64748b', borderBottom: '1px solid #e2e8f0' }}>Columna</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorA, borderBottom: '1px solid #e2e8f0' }}>Total A</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: colorB, borderBottom: '1px solid #e2e8f0' }}>Total B</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#1e293b', borderBottom: '1px solid #e2e8f0' }}>Diferencia</th>
                  </tr>
                </thead>
                <tbody>
                  {numericFallback.map(({ col, colB }, i) => (
                    <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafbfc', borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#1e293b' }}>{col.column}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: colorA }}>{fmtMoney(col.sum)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700, color: colorB }}>{fmtMoney(colB.sum)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}><DiffCell a={col.sum} b={colB.sum} money /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ══ TAB: GRÁFICO ══ */}
      {tab === 'grafico' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tabs de modo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
              Top {Math.min(chartData.length, 10)} productos — comparando <b>{chartMode === 'total' ? 'monto total' : 'cantidad vendida'}</b>
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {totalCol && (
                <button onClick={() => setChartMode('total')} style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: chartMode === 'total' ? '#2563eb' : '#f1f5f9',
                  color: chartMode === 'total' ? '#fff' : '#64748b',
                }}>
                  <DollarSign size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Monto
                </button>
              )}
              {qtyCol && (
                <button onClick={() => setChartMode('qty')} style={{
                  padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  background: chartMode === 'qty' ? '#2563eb' : '#f1f5f9',
                  color: chartMode === 'qty' ? '#fff' : '#64748b',
                }}>
                  <ShoppingCart size={11} style={{ verticalAlign: 'middle', marginRight: 3 }} />
                  Cantidad
                </button>
              )}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div style={{ padding: '40px 24px', textAlign: 'center', color: '#94a3b8', background: '#f8fafc', borderRadius: 12 }}>
              No hay datos para graficar. Sube CSVs con columnas de producto y monto.
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 12, padding: '16px 8px', border: '1px solid #f1f5f9' }}>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} margin={{ top: 8, right: 20, left: 8, bottom: 70 }} barCategoryGap="28%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }}
                    angle={-35} textAnchor="end" interval={0} height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#64748b' }}
                    tickFormatter={(v: number) => chartMode === 'total' ? fmtMoney(v) : fmtQty(v)}
                    width={80}
                  />
                  <Tooltip content={<ChartTooltip colorA={colorA} colorB={colorB} nameA={`A: ${datasetA.name}`} nameB={`B: ${datasetB.name}`} />} />
                  <Legend
                    wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                    formatter={(v) => v === 'valA' ? `A: ${datasetA.name}` : `B: ${datasetB.name}`}
                  />
                  <Bar dataKey="valA" name="valA" radius={[5, 5, 0, 0]} maxBarSize={38}>
                    {chartData.map((_, i) => <Cell key={i} fill={colorA} />)}
                  </Bar>
                  <Bar dataKey="valB" name="valB" radius={[5, 5, 0, 0]} maxBarSize={38}>
                    {chartData.map((_, i) => <Cell key={i} fill={colorB} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mini resumen bajo el gráfico */}
          {(grandTotalA > 0 || grandTotalB > 0) && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div style={{
                flex: 1, minWidth: 120, background: `color-mix(in srgb, ${colorA} 8%, #fff)`,
                border: `1px solid ${colorA}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: colorA, fontWeight: 700 }}>Total A</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: colorA }}>{fmtMoney(grandTotalA)}</div>
              </div>
              <div style={{
                flex: 1, minWidth: 120, background: '#f8fafc',
                border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Diferencia</div>
                <div style={{
                  fontSize: 16, fontWeight: 900,
                  color: dirTotal === 'up' ? '#059669' : dirTotal === 'down' ? '#dc2626' : '#94a3b8',
                }}>{pctTotal}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{fmtMoney(Math.abs(moneyDiff))}</div>
              </div>
              <div style={{
                flex: 1, minWidth: 120, background: `color-mix(in srgb, ${colorB} 8%, #fff)`,
                border: `1px solid ${colorB}`, borderRadius: 10, padding: '10px 14px', textAlign: 'center'
              }}>
                <div style={{ fontSize: 11, color: colorB, fontWeight: 700 }}>Total B</div>
                <div style={{ fontSize: 16, fontWeight: 900, color: colorB }}>{fmtMoney(grandTotalB)}</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CsvComparisonPanel;
