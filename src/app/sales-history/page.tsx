'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Badge } from '@/components/ui/Badge';
import { PageLoader } from '@/components/ui/LoadingSpinner';
import { saleService } from '@/services/saleService';
import type { SaleResponse } from '@/types';



export default function SalesHistoryPage() {
  const [sales, setSales]     = useState<SaleResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await saleService.getAll();
      setSales(data);
    } catch {
      // endpoint might not exist yet — silently fail
      setSales([]);
    }
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const filtered = sales.filter(s =>
    s.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
    s.customerName.toLowerCase().includes(search.toLowerCase()) ||
    s.pharmacistName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AppLayout title="Sales History"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Sales History">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search invoice, customer, pharmacist…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <p className="text-sm text-gray-500">{filtered.length} sales found</p>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Receipt className="mb-3 h-12 w-12 text-gray-200" />
            <p className="text-sm">No sales found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(sale => (
              <div key={sale.saleId}>
                {/* Sale header row */}
                <button
                  type="button"
                  onClick={() => setExpanded(prev => prev === sale.saleId ? null : sale.saleId)}
                  className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-1 items-center gap-6 min-w-0">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{sale.invoiceNumber}</p>
                      <p className="text-xs text-gray-500">{format(new Date(sale.saleDate), 'dd MMM yyyy, hh:mm a')}</p>
                    </div>
                    <div className="hidden sm:block min-w-0">
                      <p className="text-sm text-gray-700">{sale.customerName}</p>
                      <p className="text-xs text-gray-400">{sale.pharmacistName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pl-4">
                    <Badge variant="blue">{sale.paymentMode}</Badge>
                    <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                      Rs {Number(sale.totalAmount).toFixed(2)}
                    </span>
                    {expanded === sale.saleId
                      ? <ChevronUp className="h-4 w-4 text-gray-400" />
                      : <ChevronDown className="h-4 w-4 text-gray-400" />
                    }
                  </div>
                </button>

                {/* Expanded detail */}
                {expanded === sale.saleId && (
                  <div className="border-t border-gray-50 bg-gray-50 px-6 py-4">
                    {/* Mobile customer info */}
                    <div className="mb-3 flex gap-4 sm:hidden text-sm text-gray-700">
                      <span><span className="font-medium">Customer:</span> {sale.customerName}</span>
                      <span><span className="font-medium">By:</span> {sale.pharmacistName}</span>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[480px]">
                      <thead>
                        <tr className="text-left text-xs font-semibold uppercase text-gray-400">
                          <th className="pb-2">Medicine</th>
                          <th className="pb-2">Qty</th>
                          <th className="pb-2">Unit Price</th>
                          <th className="pb-2">Discount</th>
                          <th className="pb-2 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sale.items.map(item => (
                          <tr key={item.saleItemId}>
                            <td className="py-1.5">
                              <p className="font-medium text-gray-900">{item.medicineName}</p>
                              <p className="text-xs text-gray-400">Batch: {item.batchNumber}</p>
                            </td>
                            <td className="py-1.5 text-gray-600">
                              <p>{item.quantity} <span className="rounded bg-blue-50 px-1 py-0.5 text-xs font-medium text-blue-600">{item.uomName || 'unit'}</span></p>
                              {item.baseQuantityDeducted !== item.quantity && (
                                <p className="text-xs text-gray-400">{item.baseQuantityDeducted} base units</p>
                              )}
                            </td>
                            <td className="py-1.5 text-gray-600">Rs {Number(item.unitPrice).toFixed(2)}</td>
                            <td className="py-1.5 text-gray-600">
                              {Number(item.discountPercent) > 0
                                ? `${Number(item.discountPercent)}%`
                                : '—'}
                            </td>
                            <td className="py-1.5 text-right font-semibold text-gray-900">
                              Rs {Number(item.lineTotal).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    </div>

                    <div className="mt-3 flex justify-end gap-6 text-sm border-t border-gray-200 pt-3">
                      <span className="text-gray-500">Subtotal: Rs {Number(sale.subtotal).toFixed(2)}</span>
                      {Number(sale.discountPercent) > 0 && (
                        <span className="text-green-600">
                          Discount ({Number(sale.discountPercent)}%): -Rs {Number(sale.discountAmount).toFixed(2)}
                        </span>
                      )}
                      <span className="font-bold text-gray-900">
                        Total: Rs {Number(sale.totalAmount).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
