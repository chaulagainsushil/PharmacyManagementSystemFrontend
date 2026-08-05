'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertTriangle, Search, RefreshCw } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { batchService } from '@/services/batchService';
import type { MedicineBatch } from '@/types';

const DAYS = 45;

export default function NearExpiryPage() {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await batchService.getNearExpiry(DAYS);
      setBatches(data);
    } catch (e: any) {
      // 401 is handled by the axios interceptor (redirects to login) — ignore here
      if (e?.response?.status !== 401) {
        console.error('Near-expiry load error:', e?.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch when a token is present — AppLayout handles redirect if unauthenticated
    if (typeof window !== 'undefined' && localStorage.getItem('pms_token')) {
      load();
    } else {
      setLoading(false);
    }
  }, [load]);

  const filtered = batches.filter(b =>
    b.medicineName.toLowerCase().includes(search.toLowerCase()) ||
    b.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const daysLeft = (date: string) => differenceInDays(new Date(date), new Date());

  const urgencyBadge = (days: number) => {
    if (days <= 7)  return <Badge variant="red">Critical — {days}d left</Badge>;
    if (days <= 15) return <Badge variant="red">Urgent — {days}d left</Badge>;
    if (days <= 30) return <Badge variant="yellow">Warning — {days}d left</Badge>;
    return               <Badge variant="yellow">{days}d left</Badge>;
  };

  const rowBg = (days: number) => {
    if (days <= 7)  return 'bg-red-50';
    if (days <= 15) return 'bg-orange-50';
    return '';
  };

  if (loading) return <AppLayout title="Near-Expiry Medicines"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Near-Expiry Medicines">

      {/* Summary banner */}
      <div className="mb-5 flex items-start gap-3 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
        <div>
          <p className="font-semibold text-yellow-900">
            {batches.length} batch{batches.length !== 1 ? 'es' : ''} expiring within {DAYS} days
          </p>
          <p className="text-sm text-yellow-700">
            Review and dispose of expired stock via the{' '}
            <a href="/disposals" className="font-semibold underline hover:text-yellow-900">
              Medicine Disposal
            </a>{' '}
            module.
          </p>
        </div>
      </div>

      {/* Header row */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicine or batch…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {refreshing
            ? <LoadingSpinner className="h-4 w-4 text-gray-500" />
            : <RefreshCw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-gray-400">
            <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-gray-200" />
            No near-expiry batches found
          </div>
        )}
        {filtered.map(b => {
          const days = daysLeft(b.expiryDate);
          return (
            <div key={b.batchId} className={`rounded-2xl border border-gray-100 bg-white p-4 shadow-sm ${rowBg(days)}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-gray-900">{b.medicineName}</p>
                  <p className="text-xs text-gray-500">Batch: {b.batchNumber}</p>
                </div>
                {urgencyBadge(days)}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><span className="font-medium text-gray-700">Supplier:</span> {b.supplierName ?? '—'}</div>
                <div><span className="font-medium text-gray-700">Stock:</span> {b.quantityInTablets.toLocaleString()} tabs</div>
                <div>
                  <span className="font-medium text-gray-700">Expiry:</span>{' '}
                  {format(new Date(b.expiryDate), 'dd MMM yyyy')}
                </div>
                <div><span className="font-medium text-gray-700">Price:</span> Rs {Number(b.purchasePricePerTablet).toFixed(2)}/tab</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Medicine</th>
                <th className="px-6 py-3">Batch No.</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Stock (tabs)</th>
                <th className="px-6 py-3">Expiry Date</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                    <AlertTriangle className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    No near-expiry batches found
                  </td>
                </tr>
              )}
              {filtered.map(b => {
                const days = daysLeft(b.expiryDate);
                return (
                  <tr key={b.batchId} className={`transition-colors hover:brightness-95 ${rowBg(days)}`}>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{b.medicineName}</p>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-gray-600">{b.batchNumber}</td>
                    <td className="px-6 py-3 text-gray-600">{b.supplierName ?? '—'}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">
                      {b.quantityInTablets.toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {format(new Date(b.expiryDate), 'dd MMM yyyy')}
                    </td>
                    <td className="px-6 py-3">{urgencyBadge(days)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </AppLayout>
  );
}
