import React, { useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Info,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import type { CsvComparisonResult } from '../../types/csv';
import {
  generateBusinessInsights,
  type BusinessInsight,
  type InsightSeverity,
} from '../../utils/businessInsights';

interface Props {
  comparison: CsvComparisonResult;
}

const severityConfig: Record<
  InsightSeverity,
  { icon: React.ReactNode; border: string; bg: string; color: string }
> = {
  positive: {
    icon: <TrendingUp size={18} />,
    border: '#86efac',
    bg: '#f0fdf4',
    color: '#059669',
  },
  negative: {
    icon: <TrendingDown size={18} />,
    border: '#fca5a5',
    bg: '#fef2f2',
    color: '#dc2626',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    border: '#fde68a',
    bg: '#fffbeb',
    color: '#d97706',
  },
  info: {
    icon: <Info size={18} />,
    border: '#bfdbfe',
    bg: '#eff6ff',
    color: '#2563eb',
  },
};

function InsightCard({ insight }: { insight: BusinessInsight }) {
  const cfg = severityConfig[insight.severity];
  return (
    <article
      className="business-insight-card"
      style={{ borderColor: cfg.border, background: cfg.bg }}
    >
      <div className="business-insight-card__icon" style={{ color: cfg.color }}>
        {cfg.icon}
      </div>
      <div className="business-insight-card__body">
        <div className="business-insight-card__title-row">
          <h4 style={{ color: cfg.color }}>{insight.title}</h4>
          {insight.metric && (
            <span className="business-insight-card__metric" style={{ color: cfg.color }}>
              {insight.metric}
            </span>
          )}
        </div>
        <p>{insight.description}</p>
        {insight.recommendation && (
          <div className="business-insight-card__rec">
            <Lightbulb size={13} />
            <span>{insight.recommendation}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export const BusinessInsightsPanel: React.FC<Props> = ({ comparison }) => {
  const insights = useMemo(() => generateBusinessInsights(comparison), [comparison]);

  const negativeCount = insights.filter((i) => i.severity === 'negative').length;
  const positiveCount = insights.filter((i) => i.severity === 'positive').length;

  return (
    <section className="business-insights">
      <div className="business-insights__header">
        <div className="business-insights__header-icon">
          <Sparkles size={20} />
        </div>
        <div>
          <h3>Insights de negocio</h3>
          <p>
            Análisis automático para entender por qué suben o bajan las ventas,
            qué hace la competencia y dónde hay oportunidades.
          </p>
        </div>
        <div className="business-insights__badges">
          {negativeCount > 0 && (
            <span className="business-insights__badge business-insights__badge--neg">
              {negativeCount} alerta{negativeCount !== 1 ? 's' : ''}
            </span>
          )}
          {positiveCount > 0 && (
            <span className="business-insights__badge business-insights__badge--pos">
              {positiveCount} oportunidad{positiveCount !== 1 ? 'es' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="business-insights__grid">
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </div>

      {insights.length === 0 && (
        <p className="business-insights__empty">
          Sube datasets con columnas de producto, cantidad y total para generar insights.
        </p>
      )}
    </section>
  );
};

export default BusinessInsightsPanel;
