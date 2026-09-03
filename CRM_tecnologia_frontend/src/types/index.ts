export interface KpiMetric {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  badge: {
    text: string;
    isPositive: boolean;
  };
  comparisonText: string;
  iconType: 'trend' | 'sales' | 'users';
}

export interface InsightItem {
  id: string;
  type: 'ALERTA DE STOCK' | 'VENTA CRUZADA' | 'OPORTUNIDAD';
  description: string;
  actionText: string;
  actionKey: 'stock' | 'cross-sell' | 'opportunity';
}

export interface MonthlySalesData {
  month: string;
  sales: number;
  ingresos: number;
  meta: number;
  formattedIngresos: string;
  formattedMeta: string;
}

export interface HardwareCategoryData {
  name: string;
  category: string;
  value: number;
  percentage: number;
  color: string;
  revenue: string;
}

export interface ClientItem {
  id: string;
  name: string;
  company: string;
  email: string;
  sector: string;
  totalPurchased: string;
  status: 'Activo' | 'En Riesgo' | 'Prospecto';
  lastContact: string;
}

export interface ProductItem {
  id: string;
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitPrice: string;
  status: 'Disponible' | 'Bajo Stock' | 'Agotado';
}

export interface SaleTransaction {
  id: string;
  date: string;
  client: string;
  product: string;
  amount: string;
  quantity: number;
  status: 'Completada' | 'Pendiente' | 'Procesando';
}

export interface CsvRowData {
  id: string;
  fecha: string;
  cliente: string;
  sector: string;
  producto: string;
  categoria: string;
  cantidad: number;
  precioUnitario: number;
  totalVenta: number;
}

export * from './documento';

