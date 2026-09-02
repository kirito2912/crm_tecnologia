import type {
  DatasetItem,
  PredictionTaskType,
  ModelMetrics,
  ForecastPoint,
  PredictionInterpretation,
} from '../types/prediction';

export const PRESET_DATASETS: DatasetItem[] = [
  {
    id: 'dataset-demand',
    name: 'Ventas Históricas y Demanda de Servidores B2B (2024-2026)',
    category: 'Infraestructura & Servidores',
    recordsCount: 45200,
    featuresCount: 14,
    targetColumn: 'volumen_demanda_mensual',
    fileSize: '8.4 MB',
    description:
      'Registros de compras de servidores rack Dell, HPE, switches Cisco y almacenamiento SAN por sector comercial.',
    sampleRows: [
      { id: 'REC-001', mes: '2026-06', sector: 'Fintech', producto: 'Dell PowerEdge R750', unidades: 28, ticket_usd: 236600 },
      { id: 'REC-002', mes: '2026-06', sector: 'SaaS', producto: 'Cisco Catalyst 9300', unidades: 45, ticket_usd: 128250 },
      { id: 'REC-003', mes: '2026-07', sector: 'Logística', producto: 'Dell PowerVault SAN', unidades: 12, ticket_usd: 154800 },
      { id: 'REC-004', mes: '2026-07', sector: 'Banca', producto: 'Dell PowerEdge R750', unidades: 34, ticket_usd: 287300 },
    ],
  },
  {
    id: 'dataset-churn',
    name: 'Comportamiento y Probabilidad de Fuga de Cuentas B2B',
    category: 'Retención de Clientes',
    recordsCount: 12800,
    featuresCount: 18,
    targetColumn: 'riesgo_churn_score',
    fileSize: '3.1 MB',
    description:
      'Métricas de engagement, días sin contacto, NPS corporativo, tickets de soporte y renovación de contratos.',
    sampleRows: [
      { cuenta: 'NovaPay Tech', sector: 'Fintech', dias_sin_contacto: 48, tickets_abiertos: 3, nps: 6, riesgo_predicho: '72%' },
      { cuenta: 'CloudScale Inc', sector: 'SaaS / Cloud', dias_sin_contacto: 12, tickets_abiertos: 0, nps: 9, riesgo_predicho: '14%' },
      { cuenta: 'LogiGlobal Corp', sector: 'Logística', dias_sin_contacto: 65, tickets_abiertos: 5, nps: 4, riesgo_predicho: '86%' },
      { cuenta: 'HealthPulse Labs', sector: 'Salud / Tech', dias_sin_contacto: 21, tickets_abiertos: 1, nps: 8, riesgo_predicho: '22%' },
    ],
  },
  {
    id: 'dataset-cross-sell',
    name: 'Afinidad de Compra y Venta Cruzada de Equipamiento',
    category: 'Optimización de Catálogo',
    recordsCount: 18500,
    featuresCount: 11,
    targetColumn: 'next_best_offer_probability',
    fileSize: '4.7 MB',
    description:
      'Secuencias temporales de adquisición de Laptops Pro, Monitores 4K, docks Thunderbolt y licencias de nube.',
    sampleRows: [
      { cliente: 'Fintech Hub', producto_base: 'Laptops Pro Enterprise', producto_afinidad: 'Monitores 4K Display', probabilidad: '91%' },
      { cliente: 'DevStudio LATAM', producto_base: 'Servidores Rack', producto_afinidad: 'Storage SAN Backup', probabilidad: '78%' },
      { cliente: 'BankSecure Corp', producto_base: 'Switches Redes', producto_afinidad: 'Módulos SFP+ 10G', probabilidad: '84%' },
    ],
  },
];

export const TASK_METRICS: Record<PredictionTaskType, ModelMetrics> = {
  demand_forecast: {
    algorithm: 'XGBoost Regressor + Prophet Hybrid',
    accuracy: 96.8,
    r2Score: 0.942,
    mae: '1.4%',
    rmse: '$14,250 USD',
    trainingTime: '0.84s',
  },
  churn_risk: {
    algorithm: 'Gradient Boosting Classifier (AUC-ROC 0.96)',
    accuracy: 94.5,
    r2Score: 0.918,
    mae: '2.1%',
    rmse: 'F1: 0.93',
    trainingTime: '0.62s',
  },
  cross_sell: {
    algorithm: 'Collaborative Neural Filtering + Apriori Rules',
    accuracy: 97.2,
    r2Score: 0.955,
    mae: '0.9%',
    rmse: 'Precision: 98.1%',
    trainingTime: '0.75s',
  },
};

export const TASK_FORECAST_DATA: Record<PredictionTaskType, ForecastPoint[]> = {
  demand_forecast: [
    { period: 'Mar 2026', actual: 980000, predicted: 975000, upperBound: 990000, lowerBound: 960000 },
    { period: 'Abr 2026', actual: 1040000, predicted: 1030000, upperBound: 1060000, lowerBound: 1010000 },
    { period: 'May 2026', actual: 1120000, predicted: 1110000, upperBound: 1140000, lowerBound: 1080000 },
    { period: 'Jun 2026', actual: 1180000, predicted: 1175000, upperBound: 1210000, lowerBound: 1140000 },
    { period: 'Jul 2026', actual: 1210000, predicted: 1205000, upperBound: 1250000, lowerBound: 1160000 },
    { period: 'Ago 2026 (Act.)', actual: 1240000, predicted: 1240000, upperBound: 1280000, lowerBound: 1200000 },
    // Projected Periods
    { period: 'Sep 2026', actual: null, predicted: 1360000, upperBound: 1420000, lowerBound: 1300000 },
    { period: 'Oct 2026', actual: null, predicted: 1480000, upperBound: 1560000, lowerBound: 1400000 },
    { period: 'Nov 2026', actual: null, predicted: 1620000, upperBound: 1720000, lowerBound: 1520000 },
    { period: 'Dic 2026', actual: null, predicted: 1790000, upperBound: 1910000, lowerBound: 1670000 },
    { period: 'Ene 2027', actual: null, predicted: 1680000, upperBound: 1820000, lowerBound: 1540000 },
    { period: 'Feb 2027', actual: null, predicted: 1750000, upperBound: 1900000, lowerBound: 1600000 },
  ],
  churn_risk: [
    { period: 'Mayo', actual: 8, predicted: 8, upperBound: 10, lowerBound: 6 },
    { period: 'Junio', actual: 7, predicted: 7, upperBound: 9, lowerBound: 5 },
    { period: 'Julio', actual: 10, predicted: 9, upperBound: 12, lowerBound: 7 },
    { period: 'Agosto (Act.)', actual: 12, predicted: 12, upperBound: 14, lowerBound: 10 },
    // Projected Churn Accounts
    { period: 'Septiembre', actual: null, predicted: 16, upperBound: 19, lowerBound: 13 },
    { period: 'Octubre', actual: null, predicted: 14, upperBound: 18, lowerBound: 11 },
    { period: 'Noviembre', actual: null, predicted: 9, upperBound: 13, lowerBound: 6 },
    { period: 'Diciembre', actual: null, predicted: 5, upperBound: 8, lowerBound: 3 },
  ],
  cross_sell: [
    { period: 'Mayo', actual: 18, predicted: 18, upperBound: 21, lowerBound: 15 },
    { period: 'Junio', actual: 24, predicted: 23, upperBound: 27, lowerBound: 20 },
    { period: 'Julio', actual: 31, predicted: 30, upperBound: 35, lowerBound: 26 },
    { period: 'Agosto (Act.)', actual: 38, predicted: 38, upperBound: 43, lowerBound: 33 },
    // Projected Cross-sell conversion %
    { period: 'Septiembre', actual: null, predicted: 47, upperBound: 53, lowerBound: 41 },
    { period: 'Octubre', actual: null, predicted: 56, upperBound: 63, lowerBound: 49 },
    { period: 'Noviembre', actual: null, predicted: 64, upperBound: 72, lowerBound: 57 },
    { period: 'Diciembre', actual: null, predicted: 75, upperBound: 84, lowerBound: 67 },
  ],
};

export const TASK_INTERPRETATIONS: Record<PredictionTaskType, PredictionInterpretation> = {
  demand_forecast: {
    headline: 'Proyección de Crecimiento Acelerado en Demanda de Servidores (+44.3% al cierre de Q4)',
    executiveSummary:
      'El modelo predictivo proyecta que la facturación mensual alcanzará los $1.79M USD para Diciembre 2026. El crecimiento está impulsado principalmente por la renovación de centros de datos en el sector Fintech y la alta demanda de Servidores Dell PowerEdge R750 y Switches de 100G.',
    businessImpact:
      'Un incremento de facturación estimado en +$550,000 USD respecto al nivel actual, requiriendo un incremento proactivo del inventario de seguridad para evitar quiebres de stock en Noviembre y Diciembre.',
    riskRating: 'Bajo',
    confidenceRating: '95% (Intervalo $1.67M - $1.91M)',
    keyDrivers: [
      {
        name: 'Expansión de Cuentas Fintech',
        impactPercent: 34.2,
        impactType: 'positive',
        featureValue: 'Crecimiento de transacciones +28%',
        description: 'Las empresas de tecnología financiera aumentaron su ticket promedio de servidores en un 34.2%.',
      },
      {
        name: 'Ciclo de Renovación de Racks',
        impactPercent: 28.5,
        impactType: 'positive',
        featureValue: 'Ciclo de 24 meses completado',
        description: '18 clientes corporativos están ingresando en su ventana obligatoria de actualización de hardware.',
      },
      {
        name: 'Volumen Bundle Servidor + Storage',
        impactPercent: 19.8,
        impactType: 'positive',
        featureValue: 'Descuento paquete 12%',
        description: 'La venta combinada de servidores con almacenamiento SAN acelera la aprobación de presupuestos.',
      },
      {
        name: 'Tiempos de Entrega de Proveedor',
        impactPercent: -12.4,
        impactType: 'negative',
        featureValue: 'Lead time: 21 días',
        description: 'Retrasos en la cadena de suministro internacional representan la principal restricción de crecimiento.',
      },
      {
        name: 'Sensibilidad a Precios de Monitores',
        impactPercent: -8.1,
        impactType: 'negative',
        featureValue: 'Margen 18%',
        description: 'Pequeña contracción en presupuestos para periféricos frente a inversiones prioritarias en servidores.',
      },
    ],
    strategicRecommendations: [
      {
        id: 1,
        title: 'Reabastecer Servidores Rack R750 antes del 15 de Septiembre',
        description: 'Elevar el stock mínimo de seguridad de 5 a 25 unidades para absorber el pico proyectado de Q4.',
        priority: 'Alta',
        suggestedAction: 'Emitir orden de compra mayorista a Dell Technologies con 15% de bonificación por volumen.',
      },
      {
        id: 2,
        title: 'Lanzar Campaña Preventiva a Cuentas Fintech',
        description: 'El 80% del crecimiento proviene de 12 cuentas clave en el sector financiero digital.',
        priority: 'Alta',
        suggestedAction: 'Agendar demostraciones de rendimiento y pre-bloquear cupos de entrega anticipada.',
      },
      {
        id: 3,
        title: 'Empaquetar Soluciones de Redes 100G con Racks',
        description: 'Aumenta el ticket promedio un 22% al incluir switches Cisco Catalyst en cada cotización de servidor.',
        priority: 'Media',
        suggestedAction: 'Configurar plantilla de cotización automatizada con switch integrado.',
      },
    ],
  },
  churn_risk: {
    headline: 'Detección Temprana: 7 Cuentas Corporativas en Riesgo Crítico de Fuga',
    executiveSummary:
      'El algoritmo clasificador XGBoost detectó una probabilidad superior al 70% de pérdida de contrato en 7 cuentas B2B durante los próximos 60 días. El factor detonante principal es la inactividad comercial acumulada (>45 días sin contacto) combinada con tickets de soporte pendientes.',
    businessImpact:
      'Riesgo de pérdida de ingresos recurrentes por $184,000 USD anuales si no se interviene antes del término del trimestre fiscal.',
    riskRating: 'Alto',
    confidenceRating: '94.5% de Precisión en Detección',
    keyDrivers: [
      {
        name: 'Días Transcurridos sin Contacto',
        impactPercent: 42.1,
        impactType: 'positive',
        featureValue: 'Promedio: 52 días de silencio',
        description: 'La falta de seguimiento post-venta es el indicador más fuerte de insatisfacción y evaluación de competidores.',
      },
      {
        name: 'Tickets de Soporte Abiertos > 72h',
        impactPercent: 27.6,
        impactType: 'positive',
        featureValue: '3.4 tickets promedio',
        description: 'Demoras en la resolución de incidencias de hardware aceleran la decisión de rescisión contractual.',
      },
      {
        name: 'Nivel de Satisfacción NPS',
        impactPercent: -21.3,
        impactType: 'negative',
        featureValue: 'Score NPS < 6',
        description: 'Las cuentas con promotores activos tienen una probabilidad de churn inferior al 4%.',
      },
      {
        name: 'Antigüedad del Contrato',
        impactPercent: -15.8,
        impactType: 'negative',
        featureValue: '> 2 años de relación',
        description: 'Los clientes con contratos multianuales presentan mayor costo de cambio de proveedor.',
      },
    ],
    strategicRecommendations: [
      {
        id: 1,
        title: 'Asignar Ejecutivo Senior a NovaPay Tech y LogiGlobal',
        description: 'Ambas empresas concentran el 60% del volumen financiero en riesgo de cancelación.',
        priority: 'Alta',
        suggestedAction: 'Agendar reunión ejecutiva de revisión de servicio y SLA dentro de las próximas 48 horas.',
      },
      {
        id: 2,
        title: 'Plan de Compensación y Descuento en Próxima Renovación',
        description: 'Ofrecer 12% de descuento en actualización de memoria RAM o soporte extendido 24/7 sin costo.',
        priority: 'Media',
        suggestedAction: 'Emitir voucher de lealtad corporativa firmado por la dirección comercial.',
      },
      {
        id: 3,
        title: 'Resolución Exprés de Tickets Pendientes',
        description: 'Cerrar todas las incidencias abiertas de infraestructura antes del viernes.',
        priority: 'Alta',
        suggestedAction: 'Escalar tickets directamente al equipo de ingenieros de campo nivel 3.',
      },
    ],
  },
  cross_sell: {
    headline: 'Oportunidad de Venta Cruzada: Conversión del 75% en Paquetes Laptop + Display 4K',
    executiveSummary:
      'El modelo de afinidad neural identificó que el 91% de los clientes que adquieren Laptops Pro Enterprise compran Monitores 4K y docks si reciben la oferta dentro de los primeros 21 días posteriores a la entrega.',
    businessImpact:
      'Potencial de facturación adicional inmediata de +$240,000 USD mediante campañas automáticas dirigidas a 34 empresas que adquirieron portátiles este mes.',
    riskRating: 'Bajo',
    confidenceRating: '97.2% de Precisión Predictiva',
    keyDrivers: [
      {
        name: 'Compra Previa de Laptops Pro',
        impactPercent: 46.8,
        impactType: 'positive',
        featureValue: 'Adquisición en últimos 30 días',
        description: 'Es el predictor número uno de necesidad de equipamiento de estaciones de trabajo y monitores.',
      },
      {
        name: 'Sector SaaS y Desarrollo de Software',
        impactPercent: 29.4,
        impactType: 'positive',
        featureValue: 'Ratio 2 monitores por desarrollador',
        description: 'Las empresas de software tienen el estándar más alto de adopción de monitores 4K multipantalla.',
      },
      {
        name: 'Descuento Bundle por Volumen',
        impactPercent: 18.2,
        impactType: 'positive',
        featureValue: '10% de ahorro en kit',
        description: 'El precio del paquete reduce el ciclo de aprobación financiera de 3 semanas a 4 días.',
      },
    ],
    strategicRecommendations: [
      {
        id: 1,
        title: 'Disparar Flujo Automatizado de Email a Compradores de Laptops',
        description: 'Enviar catálogo interactivo de Monitores 4K en el día 14 post-entrega de laptops.',
        priority: 'Alta',
        suggestedAction: 'Activar plantilla de marketing B2B con botón de compra en 1 clic.',
      },
      {
        id: 2,
        title: 'Crear SKU de Combo "Workstation Ultimate"',
        description: 'Unificar Laptop Pro + 2 Monitores 4K + Dock Thunderbolt en una sola cotización simplificada.',
        priority: 'Alta',
        suggestedAction: 'Registrar nuevo código comercial COMBO-WS4K en el módulo de Productos.',
      },
      {
        id: 3,
        title: 'Incentivo Comercial a Ejecutivos de Ventas',
        description: 'Comisión adicional del 3% por cada venta cruzada cerrada en la misma orden.',
        priority: 'Media',
        suggestedAction: 'Publicar tabla de comisiones en el boletín semanal del equipo.',
      },
    ],
  },
};
