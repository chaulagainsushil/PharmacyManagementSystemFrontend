import api from '@/lib/api';
import type {
  DashboardReport,
  SalesSummary,
  TopMedicine,
  TopManufacturer,
  TopSupplier,
  MonthlySalesSummary,
  LowStockItem,
  StockConsumptionReport,
} from '@/types';

export const reportService = {
  getDashboard: () =>
    api.get<DashboardReport>('/api/report/dashboard').then((r) => r.data),

  getToday: () =>
    api.get<SalesSummary>('/api/report/today').then((r) => r.data),

  getThisMonth: () =>
    api.get<SalesSummary>('/api/report/this-month').then((r) => r.data),

  getMonthlySales: (months = 12) =>
    api.get<MonthlySalesSummary[]>(`/api/report/monthly-sales?months=${months}`).then((r) => r.data),

  getLowStock: () =>
    api.get<LowStockItem[]>('/api/report/low-stock').then((r) => r.data),

  getStockConsumption: (params: {
    from?: string;
    to?: string;
    supplierId?: number;
    manufacturerId?: number;
    sortBy?: 'quantity' | 'revenue';
  }) => {
    const p = new URLSearchParams();
    if (params.from)           p.set('from', params.from);
    if (params.to)             p.set('to', params.to);
    if (params.supplierId)     p.set('supplierId', String(params.supplierId));
    if (params.manufacturerId) p.set('manufacturerId', String(params.manufacturerId));
    if (params.sortBy)         p.set('sortBy', params.sortBy);
    return api.get<StockConsumptionReport>(`/api/report/stock-consumption?${p}`).then((r) => r.data);
  },

  getTopMedicines: (top = 10) =>
    api.get<TopMedicine[]>(`/api/report/top-medicines?top=${top}`).then((r) => r.data),

  getTopManufacturers: (top = 10) =>
    api.get<TopManufacturer[]>(`/api/report/top-manufacturers?top=${top}`).then((r) => r.data),

  getTopSuppliers: (top = 10) =>
    api.get<TopSupplier[]>(`/api/report/top-suppliers?top=${top}`).then((r) => r.data),
};
