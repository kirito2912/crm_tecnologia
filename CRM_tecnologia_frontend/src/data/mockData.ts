import type {
  KpiMetric,
  InsightItem,
  MonthlySalesData,
  HardwareCategoryData,
  ClientItem,
  ProductItem,
  SaleTransaction,
  CsvRowData,
} from '../types';

export const KPI_METRICS: KpiMetric[] = [
  {
    id: 'kpi-ingresos',
    title: 'Ingresos Totales',
    value: '$1.24M',
    numericValue: 1240000,
    badge: {
      text: '+12.5%',
      isPositive: true,
    },
    comparisonText: 'vs. trimestre anterior',
    iconType: 'trend',
  },
  {
    id: 'kpi-ventas',
    title: 'Ventas del Mes',
    value: '$342K',
    numericValue: 342000,
    badge: {
      text: '+8.2%',
      isPositive: true,
    },
    comparisonText: 'vs. mes anterior',
    iconType: 'sales',
  },
  {
    id: 'kpi-clientes',
    title: 'Nuevos Clientes',
    value: '48',
    numericValue: 48,
    badge: {
      text: '-3.1%',
      isPositive: false,
    },
    comparisonText: 'vs. mes anterior',
    iconType: 'users',
  },
];

export const INSIGHTS_DATA: InsightItem[] = [
  {
    id: 'insight-1',
    type: 'ALERTA DE STOCK',
    description: 'El stock de Servidores Rack R740 caerá bajo el mínimo en 9 días al ritmo actual de ventas.',
    actionText: 'Reponer inventario →',
    actionKey: 'stock',
  },
  {
    id: 'insight-2',
    type: 'VENTA CRUZADA',
    description: 'El 63% de clientes que compran Laptops Pro adquieren Monitores 4K en los 30 días siguientes.',
    actionText: 'Lanzar campaña →',
    actionKey: 'cross-sell',
  },
  {
    id: 'insight-3',
    type: 'OPORTUNIDAD',
    description: 'Sector Fintech creció 24% en ticket promedio. 7 cuentas sin contacto en los últimos 45 días.',
    actionText: 'Priorizar seguimiento →',
    actionKey: 'opportunity',
  },
];

export const MONTHLY_SALES_DATA: MonthlySalesData[] = [
  { month: 'Ene', sales: 210, ingresos: 210, meta: 190, formattedIngresos: '$210K', formattedMeta: '$190K' },
  { month: 'Feb', sales: 245, ingresos: 245, meta: 220, formattedIngresos: '$245K', formattedMeta: '$220K' },
  { month: 'Mar', sales: 290, ingresos: 290, meta: 260, formattedIngresos: '$290K', formattedMeta: '$260K' },
  { month: 'Abr', sales: 270, ingresos: 270, meta: 280, formattedIngresos: '$270K', formattedMeta: '$280K' },
  { month: 'May', sales: 310, ingresos: 310, meta: 300, formattedIngresos: '$310K', formattedMeta: '$300K' },
  { month: 'Jun', sales: 325, ingresos: 325, meta: 310, formattedIngresos: '$325K', formattedMeta: '$310K' },
  { month: 'Jul', sales: 335, ingresos: 335, meta: 330, formattedIngresos: '$335K', formattedMeta: '$330K' },
  { month: 'Ago', sales: 342, ingresos: 342, meta: 340, formattedIngresos: '$342K', formattedMeta: '$340K' },
];

export const HARDWARE_CATEGORIES_DATA: HardwareCategoryData[] = [
  { name: 'Servidores', category: 'Servidores', value: 471200, percentage: 38, color: '#3b66de', revenue: '$471.2K' },
  { name: 'Laptops', category: 'Laptops', value: 334800, percentage: 27, color: '#8b5cf6', revenue: '$334.8K' },
  { name: 'Redes', category: 'Redes', value: 136400, percentage: 11, color: '#0ea5e9', revenue: '$136.4K' },
  { name: 'Almacenamiento', category: 'Almacenamiento', value: 74400, percentage: 6, color: '#0d9488', revenue: '$74.4K' },
  { name: 'Periféricos', category: 'Periféricos', value: 223200, percentage: 18, color: '#c084fc', revenue: '$223.2K' },
];

export const CLIENTS_DATA: ClientItem[] = [
  { id: 'CLI-101', name: 'Carlos Mendoza', company: 'NovaPay Solutions', email: 'c.mendoza@novapay.io', sector: 'Fintech', totalPurchased: '$148,500', status: 'En Riesgo', lastContact: 'Hace 48 días' },
  { id: 'CLI-102', name: 'Valeria Sotomayor', company: 'Banco Atlántico Tech', email: 'v.soto@bancoatlantico.com', sector: 'Fintech', totalPurchased: '$285,000', status: 'Activo', lastContact: 'Hace 3 días' },
  { id: 'CLI-103', name: 'Roberto Díaz', company: 'CloudCore Systems', email: 'rdiaz@cloudcore.tech', sector: 'SaaS / Cloud', totalPurchased: '$94,200', status: 'Activo', lastContact: 'Hace 6 días' },
  { id: 'CLI-104', name: 'Mariana Herrera', company: 'LogiData Global', email: 'mherrera@logidata.net', sector: 'Logística', totalPurchased: '$63,800', status: 'Prospecto', lastContact: 'Hace 12 días' },
  { id: 'CLI-105', name: 'Andrés Gil', company: 'KuboFintech Labs', email: 'andres@kubofin.com', sector: 'Fintech', totalPurchased: '$112,000', status: 'En Riesgo', lastContact: 'Hace 46 días' },
  { id: 'CLI-106', name: 'Lucía Benítez', company: 'BioHealth Analytics', email: 'lucia.b@biohealth.org', sector: 'Salud / Tech', totalPurchased: '$178,000', status: 'Activo', lastContact: 'Ayer' },
];

export const PRODUCTS_DATA: ProductItem[] = [
  { id: 'PRD-01', code: 'SRV-R740', name: 'Servidor Rack Dell PowerEdge R740', category: 'Servidores Rack', stock: 4, minStock: 12, unitPrice: '$8,450', status: 'Bajo Stock' },
  { id: 'PRD-02', code: 'LAP-P16', name: 'Lenovo ThinkPad P16 Workstation', category: 'Laptops Pro Enterprise', stock: 35, minStock: 10, unitPrice: '$2,890', status: 'Disponible' },
  { id: 'PRD-03', code: 'MON-4K32', name: 'Dell UltraSharp 32" 4K USB-C Hub', category: 'Monitores 4K & Display', stock: 42, minStock: 15, unitPrice: '$820', status: 'Disponible' },
  { id: 'PRD-04', code: 'SW-10G24', name: 'Cisco Catalyst 9300 24-Port 10GbE', category: 'Redes y Switches', stock: 14, minStock: 5, unitPrice: '$4,150', status: 'Disponible' },
  { id: 'PRD-05', code: 'SAN-NAS96', name: 'Synology Enterprise RackStation 96TB', category: 'Storage & SAN Backup', stock: 2, minStock: 4, unitPrice: '$6,200', status: 'Bajo Stock' },
];

export const SALES_DATA: SaleTransaction[] = [
  { id: 'TRX-8901', date: '19 Ago 2026', client: 'Banco Atlántico Tech', product: '12x Dell UltraSharp 32" 4K', amount: '$9,840', quantity: 12, status: 'Completada' },
  { id: 'TRX-8900', date: '18 Ago 2026', client: 'CloudCore Systems', product: '4x Servidor Dell PowerEdge R740', amount: '$33,800', quantity: 4, status: 'Completada' },
  { id: 'TRX-8899', date: '17 Ago 2026', client: 'BioHealth Analytics', product: '8x ThinkPad P16 + 8x Monitor 4K', amount: '$29,680', quantity: 16, status: 'Completada' },
  { id: 'TRX-8898', date: '16 Ago 2026', client: 'NovaPay Solutions', product: '2x Cisco Catalyst 9300', amount: '$8,300', quantity: 2, status: 'Pendiente' },
  { id: 'TRX-8897', date: '15 Ago 2026', client: 'LogiData Global', product: '1x Synology Enterprise 96TB', amount: '$6,200', quantity: 1, status: 'Completada' },
];

export const SAMPLE_CSV_DATA: CsvRowData[] = [
  { id: 'DAT-001', fecha: '2026-08-01', cliente: 'Banco Atlántico Tech', sector: 'Fintech', producto: 'Dell PowerEdge R740', categoria: 'Servidores Rack', cantidad: 3, precioUnitario: 8450, totalVenta: 25350 },
  { id: 'DAT-002', fecha: '2026-08-02', cliente: 'NovaPay Solutions', sector: 'Fintech', producto: 'ThinkPad P16', categoria: 'Laptops Pro Enterprise', cantidad: 10, precioUnitario: 2890, totalVenta: 28900 },
  { id: 'DAT-003', fecha: '2026-08-03', cliente: 'NovaPay Solutions', sector: 'Fintech', producto: 'Dell UltraSharp 32" 4K', categoria: 'Monitores 4K & Display', cantidad: 10, precioUnitario: 820, totalVenta: 8200 },
  { id: 'DAT-004', fecha: '2026-08-04', cliente: 'CloudCore Systems', sector: 'SaaS / Cloud', producto: 'Cisco Catalyst 9300', categoria: 'Redes y Switches', cantidad: 2, precioUnitario: 4150, totalVenta: 8300 },
  { id: 'DAT-005', fecha: '2026-08-06', cliente: 'BioHealth Analytics', sector: 'Salud / Tech', producto: 'Synology Enterprise 96TB', categoria: 'Storage & SAN Backup', cantidad: 1, precioUnitario: 6200, totalVenta: 6200 },
  { id: 'DAT-006', fecha: '2026-08-08', cliente: 'KuboFintech Labs', sector: 'Fintech', producto: 'Dell PowerEdge R740', categoria: 'Servidores Rack', cantidad: 2, precioUnitario: 8450, totalVenta: 16900 },
  { id: 'DAT-007', fecha: '2026-08-11', cliente: 'LogiData Global', sector: 'Logística', producto: 'ThinkPad P16', categoria: 'Laptops Pro Enterprise', cantidad: 6, precioUnitario: 2890, totalVenta: 17340 },
  { id: 'DAT-008', fecha: '2026-08-14', cliente: 'Banco Atlántico Tech', sector: 'Fintech', producto: 'Dell UltraSharp 32" 4K', categoria: 'Monitores 4K & Display', cantidad: 12, precioUnitario: 820, totalVenta: 9840 },
  { id: 'DAT-009', fecha: '2026-08-16', cliente: 'Seguros ProtegeTech', sector: 'Fintech', producto: 'Dell PowerEdge R740', categoria: 'Servidores Rack', cantidad: 4, precioUnitario: 8450, totalVenta: 33800 },
  { id: 'DAT-010', fecha: '2026-08-18', cliente: 'DataPulse Corp', sector: 'SaaS / Cloud', producto: 'ThinkPad P16', categoria: 'Laptops Pro Enterprise', cantidad: 8, precioUnitario: 2890, totalVenta: 23120 },
];
