import type { CsvComparisonResult } from '../types/csv';
import { parseNumeric } from './csvParser';

export type InsightSeverity = 'positive' | 'negative' | 'warning' | 'info';

export interface BusinessInsight {
  id: string;
  title: string;
  description: string;
  severity: InsightSeverity;
  metric?: string;
  recommendation?: string;
}

function pctChange(a: number, b: number): number {
  if (b === 0) return a > 0 ? 100 : 0;
  return ((a - b) / Math.abs(b)) * 100;
}

/** Genera insights ejecutivos a partir de la comparación A vs B */
export function generateBusinessInsights(comparison: CsvComparisonResult): BusinessInsight[] {
  const insights: BusinessInsight[] = [];
  const { datasetA, datasetB, productRows, totalCol, productCol } = comparison;

  const grandTotalA = productRows.reduce((s, r) => s + (r.totalA ?? 0), 0);
  const grandTotalB = productRows.reduce((s, r) => s + (r.totalB ?? 0), 0);
  const grandQtyA = productRows.reduce((s, r) => s + (r.qtyA ?? 0), 0);
  const grandQtyB = productRows.reduce((s, r) => s + (r.qtyB ?? 0), 0);

  const labelA = datasetA.categoria === 'competencia' ? 'Competencia' : datasetA.name;
  const labelB = datasetB.categoria === 'competencia' ? 'Competencia' : datasetB.name;
  const isCompetitorCompare =
    datasetA.categoria === 'competencia' ||
    datasetB.categoria === 'competencia' ||
    /compet/i.test(datasetA.name) ||
    /compet/i.test(datasetB.name);

  // ── Insight 1: Tendencia global de ventas ──────────────────────────────
  if (grandTotalA > 0 && grandTotalB > 0) {
    const change = pctChange(grandTotalA, grandTotalB);
    if (change <= -15) {
      insights.push({
        id: 'decline-revenue',
        title: 'Decadencia en ingresos detectada',
        description: `${labelA} facturó ${Math.abs(change).toFixed(1)}% menos que ${labelB}. Esto puede indicar pérdida de mercado, precios desalineados o menor demanda.`,
        severity: 'negative',
        metric: `${change.toFixed(1)}%`,
        recommendation:
          'Revisa precios vs competencia, campañas comerciales recientes y rotación de inventario en productos clave.',
      });
    } else if (change >= 15) {
      insights.push({
        id: 'growth-revenue',
        title: 'Crecimiento de ingresos',
        description: `${labelA} supera a ${labelB} en un ${change.toFixed(1)}%. La estrategia comercial actual está generando más valor.`,
        severity: 'positive',
        metric: `+${change.toFixed(1)}%`,
        recommendation: 'Identifica qué productos impulsan el crecimiento y refuerza stock y promociones en esas líneas.',
      });
    } else {
      insights.push({
        id: 'stable-revenue',
        title: 'Ingresos estables entre periodos',
        description: `La diferencia de facturación entre ambos datasets es del ${change.toFixed(1)}%, dentro de un rango normal.`,
        severity: 'info',
        metric: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
      });
    }
  }

  // ── Insight 2: Volumen de unidades ─────────────────────────────────────
  if (grandQtyA > 0 && grandQtyB > 0) {
    const qtyChange = pctChange(grandQtyA, grandQtyB);
    if (qtyChange <= -20) {
      insights.push({
        id: 'decline-units',
        title: 'Caída en volumen de ventas',
        description: `Se vendieron ${Math.abs(qtyChange).toFixed(1)}% menos unidades en ${labelA} vs ${labelB}. Puede deberse a stock insuficiente, competencia agresiva o estacionalidad.`,
        severity: 'warning',
        metric: `${qtyChange.toFixed(1)}%`,
        recommendation: 'Cruza con datos de inventario y revisa si la competencia lanzó promociones en el mismo periodo.',
      });
    }
  }

  // ── Insight 3: Productos exclusivos de competencia ─────────────────────
  const onlyInB = productRows.filter((r) =>
    (r.totalA === undefined && r.qtyA === undefined && r.priceA === undefined) &&
    (r.totalB !== undefined || r.qtyB !== undefined || r.priceB !== undefined)
  );
  if (onlyInB.length > 0 && isCompetitorCompare) {
    const topCompetitor = onlyInB.sort((a, b) => (b.totalB ?? 0) - (a.totalB ?? 0))[0];
    insights.push({
      id: 'competitor-exclusive',
      title: `${onlyInB.length} producto(s) solo en competencia`,
      description: `La competencia vende productos que no aparecen en tus datos. El más relevante: "${topCompetitor?.product}". Esto puede explicar por qué pierdes cuota de mercado.`,
      severity: 'negative',
      recommendation: 'Evalúa ampliar catálogo o crear bundles alternativos para cubrir esas necesidades.',
    });
  }

  // ── Insight 4: Productos exclusivos propios ────────────────────────────
  const onlyInA = productRows.filter((r) =>
    (r.totalA !== undefined || r.qtyA !== undefined || r.priceA !== undefined) &&
    (r.totalB === undefined && r.qtyB === undefined && r.priceB === undefined)
  );
  if (onlyInA.length > 0) {
    insights.push({
      id: 'own-exclusive',
      title: `${onlyInA.length} producto(s) exclusivos tuyos`,
      description: `Tienes ${onlyInA.length} producto(s) que la competencia no registra. Son una ventaja diferencial para retención de clientes.`,
      severity: 'positive',
      recommendation: 'Potencia marketing en estos productos como propuesta de valor única.',
    });
  }

  // ── Insight 5: Productos con caída fuerte (>30%) ───────────────────────
  const declining = productRows.filter((r) => {
    if (r.totalA === undefined || r.totalB === undefined || r.totalB === 0) return false;
    return pctChange(r.totalA, r.totalB) <= -30;
  });
  if (declining.length > 0) {
    const worst = declining.sort((a, b) => pctChange(a.totalA!, b.totalB!) - pctChange(b.totalA!, b.totalB!))[0];
    insights.push({
      id: 'product-decline',
      title: `${declining.length} producto(s) en fuerte caída`,
      description: `"${worst.product}" cayó ${Math.abs(pctChange(worst.totalA!, worst.totalB!)).toFixed(0)}% vs el periodo de referencia. Revisa precio, disponibilidad y acciones de la competencia.`,
      severity: 'negative',
      recommendation: 'Compara precio unitario y considera ajuste comercial o reposición de stock.',
    });
  }

  // ── Insight 6: Diferencia de precios en productos compartidos ──────────
  const sharedWithPrice = productRows.filter(
    (r) => r.priceA !== undefined && r.priceB !== undefined && r.totalA !== undefined && r.totalB !== undefined
  );
  if (sharedWithPrice.length >= 3) {
    const avgPriceDiff =
      sharedWithPrice.reduce((s, r) => s + pctChange(r.priceA!, r.priceB!), 0) / sharedWithPrice.length;
    if (avgPriceDiff >= 10) {
      insights.push({
        id: 'price-above-market',
        title: 'Precios por encima del mercado',
        description: `En promedio tus precios son ${avgPriceDiff.toFixed(1)}% más altos que la referencia. Esto puede explicar menor volumen de ventas.`,
        severity: 'warning',
        metric: `+${avgPriceDiff.toFixed(1)}%`,
        recommendation: 'Revisa márgenes y considera promociones en productos con elasticidad de demanda alta.',
      });
    } else if (avgPriceDiff <= -10) {
      insights.push({
        id: 'price-below-market',
        title: 'Precios competitivos o por debajo del mercado',
        description: `Tus precios promedio son ${Math.abs(avgPriceDiff).toFixed(1)}% menores. Bueno para volumen, pero verifica que los márgenes sigan siendo sostenibles.`,
        severity: 'info',
        metric: `${avgPriceDiff.toFixed(1)}%`,
      });
    }
  }

  // ── Insight 7: Sin columna producto ────────────────────────────────────
  if (!productCol && comparison.statsA.length > 0) {
    const col = comparison.statsA[0].column;
    const sumA = comparison.statsA.find((s) => s.column === col)?.sum ?? 0;
    const sumB = comparison.statsB.find((s) => s.column === col)?.sum ?? 0;
    if (sumA > 0 && sumB > 0) {
      const ch = pctChange(sumA, sumB);
      insights.push({
        id: 'numeric-fallback',
        title: `Comparativa numérica: ${col}`,
        description: `Sin columna de producto detectada. La métrica "${col}" varió ${ch.toFixed(1)}% entre datasets.`,
        severity: ch < -10 ? 'warning' : 'info',
        metric: `${ch > 0 ? '+' : ''}${ch.toFixed(1)}%`,
        recommendation: 'Renombra columnas a Producto, Cantidad, Precio y Total para insights más detallados.',
      });
    }
  }

  // ── Insight 8: Diferencia de filas ─────────────────────────────────────
  if (Math.abs(comparison.rowDiff) > 0) {
    insights.push({
      id: 'row-count',
      title: 'Diferencia en volumen de registros',
      description: `${datasetA.name} tiene ${Math.abs(comparison.rowDiff)} filas ${comparison.rowDiff > 0 ? 'más' : 'menos'} que ${datasetB.name}. Verifica que ambos cubran el mismo periodo temporal.`,
      severity: 'info',
    });
  }

  return insights;
}

/** Convierte filas CSV detectadas a ventas para activar insights del dashboard */
export function csvRowsToSales(
  rows: Record<string, string>[],
  semantic: { productCol?: string; qtyCol?: string; totalCol?: string; priceCol?: string }
): Omit<import('../types').SaleTransaction, 'id'>[] {
  const { productCol, qtyCol, totalCol, priceCol } = semantic;
  if (!productCol) return [];

  return rows.slice(0, 500).map((row, i) => {
    const product = row[productCol] ?? 'Producto';
    const qty = qtyCol ? parseNumeric(row[qtyCol] ?? '1') : 1;
    const amountNum = totalCol
      ? parseNumeric(row[totalCol] ?? '0')
      : priceCol
        ? parseNumeric(row[priceCol] ?? '0') * qty
        : 0;

    return {
      date: new Date().toISOString().split('T')[0],
      client: 'Importado CSV',
      product,
      amount: `$${amountNum.toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
      quantity: isNaN(qty) ? 1 : Math.round(qty),
      status: 'Completada' as const,
    };
  }).filter((s) => parseFloat(s.amount.replace(/[$,]/g, '')) > 0 || s.quantity > 0);
}
