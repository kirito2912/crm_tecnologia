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
    border: '#0d3d2c',
    bg: '#0a2e22',
    color: '#00ff88',
  },
  negative: {
    icon: <TrendingDown size={18} />,
    border: '#5a1515',
    bg: '#3d0d0d',
    color: '#ff0055',
  },
  warning: {
    icon: <AlertTriangle size={18} />,
    border: '#5a4510',
    bg: '#2a2208',
    color: '#ffaa00',
  },
  info: {
    icon: <Info size={18} />,
    border: '#bfdbfe',
    bg: '#0d2840',
    color: '#00d4ff',
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
