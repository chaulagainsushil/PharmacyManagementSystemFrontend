'use client';

import { useEffect, useState } from 'react';
import { Pill, Package, Users, AlertTriangle, Tag, Truck, Building2, TrendingUp } from 'lucide-react';
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
import type { Medicine, MedicineBatch } from '@/types';
import { format } from 'date-fns';

export default function DashboardPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [custCount, setCustCount] = useState(0);
  const [catCount, setCatCount] = useState(0);
  const [supCount, setSupCount] = useState(0);
  const [mfgCount, setMfgCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      medicineService.getAll(),
      batchService.getAll(),
      customerService.getAll(),
      categoryService.getAll(),
      supplierService.getAll(),
      manufacturerService.getAll(),
    ]).then(([meds, bats, custs, cats, sups, mfgs]) => {
      setMedicines(meds);
      setBatches(bats);
      setCustCount(custs.length);
      setCatCount(cats.length);
      setSupCount(sups.length);
      setMfgCount(mfgs.length);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStock     = medicines.filter(m => m.totalStockInTablets <= m.reorderLevel && m.isActive);
  const expiringSoon = batches.filter(b => {
    const days = (new Date(b.expiryDate).getTime() - Date.now()) / 86400000;
    return !b.isExpired && days <= 90;
  });
  const expired    = batches.filter(b => b.isExpired);
  const totalStock = medicines.reduce((s, m) => s + m.totalStockInTablets, 0);

  if (loading) return <AppLayout title="Dashboard"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Dashboard">

      {/* ── Primary KPI row ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Medicines"   value={medicines.length}          icon={Pill}          color="blue"                                        subtitle="active catalogue" />
        <StatCard title="Stock (tablets)"   value={totalStock.toLocaleString()} icon={Package}     color="emerald"                                     subtitle="across all batches" />
        <StatCard title="Customers"         value={custCount}                 icon={Users}          color="purple"                                      subtitle="registered patients" />
        <StatCard title="Low Stock Alerts"  value={lowStock.length}           icon={AlertTriangle}  color={lowStock.length > 0 ? 'red' : 'emerald'}    subtitle="at or below reorder level" />
      </div>

      {/* ── Secondary KPI row ───────────────────────────────────────────────── */}
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Categories"    value={catCount}            icon={Tag}      color="blue" />
        <StatCard title="Suppliers"     value={supCount}            icon={Truck}    color="orange" />
        <StatCard title="Manufacturers" value={mfgCount}            icon={Building2} color="purple" />
        <StatCard title="Expiring Soon" value={expiringSoon.length} icon={TrendingUp} color={expiringSoon.length > 0 ? 'orange' : 'emerald'} subtitle="within 90 days" />
      </div>

      {/* ── Detail cards ────────────────────────────────────────────────────── */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">

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
                  <p className="text-sm font-bold text-red-600">{m.totalStockInTablets} tabs</p>
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
