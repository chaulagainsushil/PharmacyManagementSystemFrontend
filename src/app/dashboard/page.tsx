'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Pill, Package, Users, AlertTriangle, Tag, Truck, Building2,
  TrendingUp, ShoppingCart, UserPlus, DollarSign, BarChart3,
  CalendarDays, Receipt, ArrowRight,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { medicineService } from '@/services/medicineService';
import { batchService } from '@/services/batchService';
import { customerService } from '@/services/customerService';
import { categoryService } from '@/services/categoryService';
import { supplierService } from '@/services/supplierService';
import { manufacturerService } from '@/services/manufacturerService';
import { reportService } from '@/services/reportService';
import type { Medicine, MedicineBatch, SalesSummary, MonthlySalesSummary } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [medicines, setMedicines]       = useState<Medicine[]>([]);
  const [batches, setBatches]           = useState<MedicineBatch[]>([]);
  const [custCount, setCustCount]       = useState(0);
  const [catCount, setCatCount]         = useState(0);
  const [supCount, setSupCount]         = useState(0);
  const [mfgCount, setMfgCount]         = useState(0);
  const [todaySales, setTodaySales]     = useState<SalesSummary | null>(null);
  const [monthSales, setMonthSales]     = useState<SalesSummary | null>(null);
  const [monthlySales, setMonthlySales] = useState<MonthlySalesSummary[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      medicineService.getAll(),
      batchService.getAll(),
      customerService.getAll(),
      categoryService.getAll(),
      supplierService.getAll(),
      manufacturerService.getAll(),
      reportService.getToday(),
      reportService.getThisMonth(),
      reportService.getMonthlySales(6),
    ]).then(([meds, bats, custs, cats, sups, mfgs, today, month, monthly]) => {
      setMedicines(meds);
      setBatches(bats);
      setCustCount(custs.length);
      setCatCount(cats.length);
      setSupCount(sups.length);
      setMfgCount(mfgs.length);
      setTodaySales(today);
      setMonthSales(month);
      setMonthlySales(monthly);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock     = medicines.filter(m => m.totalStockInBaseUnit <= m.reorderLevel && m.isActive);
  const expiringSoon = batches.filter(b => {
    const days = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
    return !b.isExpired && days <= 90;
  });
  const expired    = batches.filter(b => b.isExpired);
  const totalStock = medicines.reduce((s, m) => s + m.totalStockInBaseUnit, 0);

  // Bar chart helper — find max revenue for scaling
  const maxRevenue = Math.max(...monthlySales.map(m => m.totalRevenue), 1);

  if (loading) return <AppLayout title="Dashboard"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Dashboard">

      {/* ── Quick Actions ────────────────────────────────────────────────────── */}
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          href="/sales"
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          New Sale
          <ArrowRight className="h-4 w-4 opacity-70" />
        </Link>
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-purple-700 transition-colors"
        >
          <UserPlus className="h-5 w-5" />
          Add Customer
          <ArrowRight className="h-4 w-4 opacity-70" />
        </Link>
        <Link
          href="/medicines"
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-colors"
        >
          <Pill className="h-5 w-5" />
          Add Medicine
          <ArrowRight className="h-4 w-4 opacity-70" />
        </Link>
        <Link
          href="/sales-history"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
        >
          <Receipt className="h-5 w-5" />
          Sales History
        </Link>
      </div>

      {/* ── Sales Stats Row ──────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Today's Revenue"
          value={`Rs ${(todaySales?.totalRevenue ?? 0).toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={DollarSign}
          color="emerald"
          subtitle={`${todaySales?.totalSales ?? 0} sale${todaySales?.totalSales !== 1 ? 's' : ''} today`}
        />
        <StatCard
          title="Today's Items Sold"
          value={(todaySales?.totalItemsSold ?? 0).toLocaleString()}
          icon={ShoppingCart}
          color="blue"
          subtitle="tablets / strips"
        />
        <StatCard
          title="This Month Revenue"
          value={`Rs ${(monthSales?.totalRevenue ?? 0).toLocaleString('en-NP', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
          icon={CalendarDays}
          color="purple"
          subtitle={`${monthSales?.totalSales ?? 0} sales this month`}
        />
        <StatCard
          title="Month Items Sold"
          value={(monthSales?.totalItemsSold ?? 0).toLocaleString()}
          icon={BarChart3}
          color="orange"
          subtitle="tablets / strips"
        />
      </div>

      {/* ── Inventory KPI Row ────────────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Medicines"   value={medicines.length}              icon={Pill}          color="blue"                                          subtitle="active catalogue" />
        <StatCard title="Stock (tablets)"   value={totalStock.toLocaleString()}   icon={Package}       color="emerald"                                       subtitle="across all batches" />
        <StatCard title="Customers"         value={custCount}                     icon={Users}          color="purple"                                        subtitle="registered patients" />
        <StatCard title="Low Stock Alerts"  value={lowStock.length}               icon={AlertTriangle}  color={lowStock.length > 0 ? 'red' : 'emerald'}      subtitle="at or below reorder level" />
      </div>

      {/* ── Secondary Inventory Row ──────────────────────────────────────────── */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Categories"    value={catCount}            icon={Tag}        color="blue" />
        <StatCard title="Suppliers"     value={supCount}            icon={Truck}      color="orange" />
        <StatCard title="Manufacturers" value={mfgCount}            icon={Building2}  color="purple" />
        <StatCard title="Expiring Soon" value={expiringSoon.length} icon={TrendingUp} color={expiringSoon.length > 0 ? 'orange' : 'emerald'} subtitle="within 90 days" />
      </div>

      {/* ── Monthly Sales Breakdown ──────────────────────────────────────────── */}
      <div className="mb-6 rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between bg-blue-50 border-b border-blue-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-blue-900">Monthly Sales Breakdown</h2>
            <span className="text-xs text-blue-500">(last 6 months)</span>
          </div>
          <Link href="/sales-history" className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View All <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        {monthlySales.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">No sales data yet</p>
        ) : (
          <>
            {/* Mini bar chart */}
            <div className="px-6 pt-5 pb-2">
              <div className="flex items-end gap-2 h-28">
                {monthlySales.map((m) => {
                  const pct = maxRevenue > 0 ? (m.totalRevenue / maxRevenue) * 100 : 0;
                  return (
                    <div key={`${m.year}-${m.month}`} className="flex flex-1 flex-col items-center gap-1 min-w-0">
                      <span className="text-xs font-semibold text-slate-600 truncate w-full text-center">
                        Rs {m.totalRevenue >= 1000
                          ? `${(m.totalRevenue / 1000).toFixed(1)}k`
                          : m.totalRevenue.toFixed(0)}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-blue-500 transition-all duration-500"
                        style={{ height: `${Math.max(pct, 4)}%` }}
                        title={`${m.monthLabel}: Rs ${m.totalRevenue.toFixed(2)}`}
                      />
                      <span className="text-xs text-slate-400 truncate w-full text-center">{m.monthLabel.split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-6 py-2 text-left">Month</th>
                    <th className="px-6 py-2 text-right">Sales</th>
                    <th className="px-6 py-2 text-right">Items Sold</th>
                    <th className="px-6 py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {[...monthlySales].reverse().map((m) => (
                    <tr key={`${m.year}-${m.month}`} className="hover:bg-blue-50 transition-colors">
                      <td className="px-6 py-3 font-medium text-slate-800">{m.monthLabel}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{m.totalSales}</td>
                      <td className="px-6 py-3 text-right text-slate-600">{m.totalItemsSold.toLocaleString()}</td>
                      <td className="px-6 py-3 text-right font-bold text-emerald-700">
                        Rs {m.totalRevenue.toLocaleString('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Detail cards ─────────────────────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Low stock */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between bg-red-50 border-b border-red-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <h2 className="font-bold text-red-800">Low Stock Medicines</h2>
            </div>
            <Badge variant={lowStock.length > 0 ? 'red' : 'green'}>{lowStock.length} alerts</Badge>
          </div>
          <div className="divide-y divide-slate-50">
            {lowStock.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                ✅ All medicines are adequately stocked
              </p>
            )}
            {lowStock.slice(0, 8).map(m => (
              <div key={m.medicineId} className="flex items-center justify-between px-6 py-3 hover:bg-red-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                  <p className="text-xs text-slate-400">{m.genericName ?? '—'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{m.totalStockInBaseUnit} units</p>
                  <p className="text-xs text-slate-400">reorder @ {m.reorderLevel}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expiring batches */}
        <div className="rounded-2xl bg-white shadow-sm overflow-hidden border border-slate-200">
          <div className="flex items-center justify-between bg-orange-50 border-b border-orange-100 px-6 py-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-500" />
              <h2 className="font-bold text-orange-800">Expiring Batches</h2>
            </div>
            <Badge variant={expiringSoon.length > 0 ? 'yellow' : 'green'}>{expiringSoon.length} batches</Badge>
          </div>
          <div className="divide-y divide-slate-50">
            {expiringSoon.length === 0 && expired.length === 0 && (
              <p className="px-6 py-10 text-center text-sm text-slate-400">
                ✅ No batches expiring soon
              </p>
            )}
            {expired.slice(0, 4).map(b => (
              <div key={b.batchId} className="flex items-center justify-between px-6 py-3 hover:bg-red-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.medicineName}</p>
                  <p className="text-xs text-slate-400">Batch: {b.batchNumber}</p>
                </div>
                <Badge variant="red">Expired</Badge>
              </div>
            ))}
            {expiringSoon.slice(0, 6).map(b => {
              const days = Math.ceil((new Date(b.expiryDate).getTime() - Date.now()) / 86400000);
              return (
                <div key={b.batchId} className="flex items-center justify-between px-6 py-3 hover:bg-orange-50 transition-colors">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{b.medicineName}</p>
                    <p className="text-xs text-slate-400">
                      Batch: {b.batchNumber} · {format(new Date(b.expiryDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <Badge variant={days <= 30 ? 'red' : 'yellow'}>{days}d left</Badge>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </AppLayout>
  );
}
