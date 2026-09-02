export type PredictionTaskType = 'demand_forecast' | 'churn_risk' | 'cross_sell';

export interface DatasetItem {
  id: string;
  name: string;
  category: string;
  recordsCount: number;
  featuresCount: number;
  targetColumn: string;
  fileSize: string;
  description: string;
  sampleRows: Record<string, string | number>[];
}

export interface ModelMetrics {
  algorithm: string;
  accuracy: number; // e.g. 96.8%
  r2Score: number;  // e.g. 0.942
  mae: string;      // e.g. "1.4%"
  rmse: string;     // e.g. "$12,400"
  trainingTime: string; // e.g. "1.15s"
}

export interface ForecastPoint {
  period: string;
  actual: number | null;
  predicted: number | null;
  upperBound?: number | null;
  lowerBound?: number | null;
  trend?: string;
}

export interface ShapFeature {
  name: string;
  impactPercent: number; // e.g. +34.2 or -18.5
  impactType: 'positive' | 'negative';
  description: string;
  featureValue: string;
}

export interface PredictionInterpretation {
  headline: string;
  executiveSummary: string;
  businessImpact: string;
  riskRating: 'Bajo' | 'Moderado' | 'Alto';
  confidenceRating: string;
  keyDrivers: ShapFeature[];
  strategicRecommendations: {
    id: number;
    title: string;
    description: string;
    priority: 'Alta' | 'Media' | 'Baja';
    suggestedAction: string;
  }[];
}

export interface PredictionConfiguration {
  task: PredictionTaskType;
  datasetId: string;
  horizonMonths: number;
  confidenceLevel: number;
  algorithm: string;
  includeSeasonalDecomposition: boolean;
}
