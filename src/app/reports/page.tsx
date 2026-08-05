'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  AlertTriangle, BarChart3, Search, RefreshCw, Download,
  ArrowUpDown, TrendingDown, Package,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { reportService } from '@/services/reportService';
import { supplierService } from '@/services/supplierService';
import { manufacturerService } from '@/services/manufacturerService';
import type { LowStockItem, StockConsumptionReport, Supplier, Manufacturer } from '@/types';
import { cn } from '@/lib/utils';

// ── Tab type ─────────────────────────────────────────────────────────────────
type Tab = 'low-stock' | 'stock-consumption';

// ── CSV helpers ───────────────────────────────────────────────────────────────
function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Low Stock Tab ─────────────────────────────────────────────────────────────
function LowStockReport() {
  const [data, setData]       = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await reportService.getLowStock()); }
    catch { setData([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const exportCsv = () => {
    const headers = ['Medicine', 'Generic Name', 'Category', 'Manufacturer', 'Stock (tablets)', 'Reorder Level', 'Shortfall'];
    const rows = data.map(i => [
      i.medicineName, i.genericName ?? '', i.categoryName ?? '', i.manufacturerName ?? '',
      i.totalStockInTablets, i.reorderLevel, i.shortfallInTablets,
    ]);
    downloadCsv('low-stock-report.csv', [headers, ...rows.map(r => r.map(String))]);
  };

  if (loading) return (
    <div className="flex h-40 items-center justify-center">
      <LoadingSpinner className="h-8 w-8 text-blue-500" />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <p className="font-semibold text-slate-800">
            {data.length} medicine{data.length !== 1 ? 's' : ''} at or below reorder level
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          {data.length > 0 && (
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
            >
              <Download className="h-4 w-4" /> Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {data.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-slate-400">
            <Package className="mb-3 h-12 w-12 text-slate-200" />
            <p className="text-sm font-medium">All medicines are adequately stocked ✅</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-red-50 border-b border-red-100 text-xs font-semibold uppercase tracking-wide text-red-700">
                  <th className="px-5 py-3 text-left">Medicine</th>
                  <th className="px-5 py-3 text-left">Category</th>
                  <th className="px-5 py-3 text-left">Manufacturer</th>
                  <th className="px-5 py-3 text-right">Current Stock</th>
                  <th className="px-5 py-3 text-right">Reorder Level</th>
                  <th className="px-5 py-3 text-right">Shortfall</th>
                  <th className="px-5 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.map(item => (
                  <tr key={item.medicineId} className="hover:bg-red-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-900">{item.medicineName}</p>
                      {item.genericName && <p className="text-xs text-slate-400">{item.genericName}</p>}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{item.categoryName ?? '—'}</td>
                    <td className="px-5 py-3 text-slate-600">{item.manufacturerName ?? '—'}</td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn(
                        'font-bold',
                        item.totalStockInTablets === 0 ? 'text-red-700' : 'text-red-500'
                      )}>
                        {item.totalStockInTablets.toLocaleString()}
                      </span>
                      <span className="text-slate-400 text-xs ml-1">tabs</span>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{item.reorderLevel.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right font-bold text-orange-600">
                      {item.shortfallInTablets.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <Badge variant={item.totalStockInTablets === 0 ? 'red' : 'yellow'}>
                        {item.totalStockInTablets === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Stock Consumption Tab ─────────────────────────────────────────────────────
function StockConsumptionTab({
  suppliers,
  manufacturers,
}: {
  suppliers: Supplier[];
  manufacturers: Manufacturer[];
}) {
  const today = new Date().toISOString().split('T')[0];

  const [from, setFrom]           = useState('');
  const [to, setTo]               = useState(today);
  const [supplierId, setSupplierId]       = useState<number | ''>('');
  const [manufacturerId, setManufacturerId] = useState<number | ''>('');
  const [sortBy, setSortBy]       = useState<'quantity' | 'revenue'>('quantity');
  const [report, setReport]       = useState<StockConsumptionReport | null>(null);
  const [loading, setLoading]     = useState(false);
  const [searched, setSearched]   = useState(false);

  const runReport = async () => {
    setLoading(true);
    try {
      const result = await reportService.getStockConsumption({
        from:           from || undefined,
        to:             to || undefined,
        supplierId:     supplierId ? Number(supplierId) : undefined,
        manufacturerId: manufacturerId ? Number(manufacturerId) : undefined,
        sortBy,
      });
      setReport(result);
      setSearched(true);
    } catch {
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    if (!report) return;
    const headers = ['Rank', 'Medicine', 'Generic Name', 'Category', 'Manufacturer', 'Supplier',
      'Total Qty Sold (tabs)', 'Total Sales Count', 'Total Revenue (Rs)'];
    const rows = report.items.map((i, idx) => [
      idx + 1, i.medicineName, i.genericName ?? '', i.categoryName ?? '',
      i.manufacturerName ?? '', i.supplierName ?? '',
      i.totalQuantitySold, i.totalSalesCount,
      i.totalRevenue.toFixed(2),
    ]);
    downloadCsv(`stock-consumption-${from || 'all'}-to-${to || 'today'}.csv`,
      [headers, ...rows.map(r => r.map(String))]);
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <p className="mb-4 text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-500" /> Filter Report
        </p>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {/* From date */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              From Date
            </label>
            <input
              type="date" value={from} onChange={e => setFrom(e.target.value)}
              max={to || today}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            <p className="mt-1 text-xs text-slate-400">Leave blank for all-time</p>
          </div>

          {/* To date */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Up To Date
            </label>
            <input
              type="date" value={to} onChange={e => setTo(e.target.value)}
              min={from || undefined} max={today}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Supplier <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={supplierId}
              onChange={e => setSupplierId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Suppliers</option>
              {suppliers.map(s => (
                <option key={s.supplierId} value={s.supplierId}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Manufacturer */}
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Manufacturer <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <select
              value={manufacturerId}
              onChange={e => setManufacturerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">All Manufacturers</option>
              {manufacturers.map(m => (
                <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Sort + Run */}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-slate-600">Sort by:</span>
            <button
              onClick={() => setSortBy('quantity')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                sortBy === 'quantity'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              Highest Count
            </button>
            <button
              onClick={() => setSortBy('revenue')}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                sortBy === 'revenue'
                  ? 'bg-blue-600 text-white'
                  : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
              )}
            >
              Highest Revenue
            </button>
          </div>

          <button
            onClick={runReport}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {loading ? <LoadingSpinner className="h-4 w-4 text-white" /> : <BarChart3 className="h-4 w-4" />}
            {loading ? 'Generating…' : 'Generate Report'}
          </button>
        </div>
      </div>

      {/* Results */}
      {searched && report && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Medicines</p>
              <p className="mt-1 text-3xl font-bold text-slate-800">{report.items.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Qty Sold</p>
              <p className="mt-1 text-3xl font-bold text-blue-700">{report.totalQuantitySold.toLocaleString()}</p>
              <p className="text-xs text-slate-400">tablets</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Total Revenue</p>
              <p className="mt-1 text-2xl font-bold text-emerald-700">
                Rs {report.totalRevenue.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Table header with export */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Showing {report.items.length} medicine{report.items.length !== 1 ? 's' : ''}
              {report.fromDate ? ` · From ${new Date(report.fromDate).toLocaleDateString()}` : ' · All time'}
              {report.toDate ? ` · Up to ${new Date(report.toDate).toLocaleDateString()}` : ''}
            </p>
            {report.items.length > 0 && (
              <button
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
            )}
          </div>

          {/* Results table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            {report.items.length === 0 ? (
              <div className="flex flex-col items-center py-16 text-slate-400">
                <BarChart3 className="mb-3 h-12 w-12 text-slate-200" />
                <p className="text-sm">No sales data found for the selected filters</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 border-b border-blue-100 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      <th className="px-5 py-3 text-center w-12">#</th>
                      <th className="px-5 py-3 text-left">Medicine</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Manufacturer</th>
                      {supplierId ? <th className="px-5 py-3 text-left">Supplier</th> : null}
                      <th className="px-5 py-3 text-right">
                        {sortBy === 'quantity' ? '▼ ' : ''}Qty Sold (tabs)
                      </th>
                      <th className="px-5 py-3 text-right">Sales Count</th>
                      <th className="px-5 py-3 text-right">
                        {sortBy === 'revenue' ? '▼ ' : ''}Revenue (Rs)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {report.items.map((item, idx) => (
                      <tr key={item.medicineId} className="hover:bg-blue-50/40 transition-colors">
                        <td className="px-5 py-3 text-center">
                          <span className={cn(
                            'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                            idx === 1 ? 'bg-slate-100 text-slate-600' :
                            idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'text-slate-400'
                          )}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-semibold text-slate-900">{item.medicineName}</p>
                          {item.genericName && <p className="text-xs text-slate-400">{item.genericName}</p>}
                        </td>
                        <td className="px-5 py-3 text-slate-600">{item.categoryName ?? '—'}</td>
                        <td className="px-5 py-3 text-slate-600">{item.manufacturerName ?? '—'}</td>
                        {supplierId ? (
                          <td className="px-5 py-3 text-slate-600">{item.supplierName ?? '—'}</td>
                        ) : null}
                        <td className="px-5 py-3 text-right font-bold text-blue-700">
                          {item.totalQuantitySold.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{item.totalSalesCount}</td>
                        <td className="px-5 py-3 text-right font-bold text-emerald-700">
                          {item.totalRevenue.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200 font-bold text-sm">
                      <td colSpan={supplierId ? 5 : 4} className="px-5 py-3 text-slate-700">Total</td>
                      <td className="px-5 py-3 text-right text-blue-800">
                        {report.totalQuantitySold.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">—</td>
                      <td className="px-5 py-3 text-right text-emerald-800">
                        {report.totalRevenue.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {!searched && !loading && (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <BarChart3 className="mb-3 h-12 w-12 text-slate-200" />
          <p className="text-sm">Set your filters above and click "Generate Report"</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [tab, setTab]                   = useState<Tab>('low-stock');
  const [suppliers, setSuppliers]       = useState<Supplier[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [metaLoading, setMetaLoading]   = useState(true);

  useEffect(() => {
    Promise.all([supplierService.getAll(), manufacturerService.getAll()])
      .then(([sups, mfgs]) => { setSuppliers(sups); setManufacturers(mfgs); })
      .catch(console.error)
      .finally(() => setMetaLoading(false));
  }, []);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'low-stock',          label: 'Low Stock Report',         icon: TrendingDown },
    { id: 'stock-consumption',  label: 'Stock Consumption Report', icon: BarChart3 },
  ];

  if (metaLoading) return <AppLayout title="Reports"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Reports">
      {/* Tab bar */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors',
              tab === t.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'low-stock' && <LowStockReport />}
      {tab === 'stock-consumption' && (
        <StockConsumptionTab suppliers={suppliers} manufacturers={manufacturers} />
      )}
    </AppLayout>
  );
}
