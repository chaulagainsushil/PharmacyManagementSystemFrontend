'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, User, CreditCard,
  Banknote, Smartphone, Receipt, CheckCircle, X, Percent, Search,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { MedicineRow } from '@/components/ui/MedicineRow';
import { BillPrint } from '@/components/ui/BillPrint';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { medicineService } from '@/services/medicineService';
import { customerService } from '@/services/customerService';
import { saleService } from '@/services/saleService';
import { useAuth } from '@/context/AuthContext';
import type {
  Medicine, Customer, CartItem, SaleResponse,
  CreateSaleRequestDto, CreateSaleItemDto, PaymentMode,
} from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────────────────────────

const WALKIN_PHONE = '0000000000';
const WALKIN_NAME  = 'Walk-in Customer';

const PAYMENT_MODES: { value: number; label: string; icon: React.ElementType }[] = [
  { value: 0, label: 'Cash',   icon: Banknote },
  { value: 1, label: 'Card',   icon: CreditCard },
  { value: 2, label: 'Online', icon: Smartphone },
  { value: 3, label: 'Credit', icon: Receipt },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

function emptyRow(): CartItem {
  return {
    id: generateId(),
    medicineId: 0,
    medicineName: '',
    saleUnitType: 1,
    quantity: 1,
    discountPercent: 0,
    unitPrice: 0,
    tabletsPerStrip: 1,
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { user } = useAuth();

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading]     = useState(true);

  const [rows, setRows]           = useState<CartItem[]>([emptyRow()]);

  // Invoice-level
  const [discount, setDiscount]         = useState(0);       // % discount
  const [cashDiscount, setCashDiscount] = useState(0);       // Rs flat cash discount
  const [paymentMode, setPaymentMode]   = useState<number>(0);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch]     = useState('');
  const [customerDropdown, setCustomerDropdown] = useState(false);

  // Invoice
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoice, setInvoice]         = useState<SaleResponse | null>(null);
  const [invoiceCashDiscount, setInvoiceCashDiscount] = useState(0);
  const [submitting, setSubmitting]   = useState(false);

  const load = useCallback(async () => {
    const [meds, custs] = await Promise.all([
      medicineService.getAll(),
      customerService.getAll(),
    ]);
    setMedicines(meds.filter(m => m.isActive));
    setCustomers(custs);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // ── Walk-in customer helper ───────────────────────────────────────────────

  /** Returns existing walk-in customer id or creates one on the fly */
  const ensureWalkInCustomer = async (): Promise<number> => {
    const existing = customers.find(
      c => c.phoneNumber === WALKIN_PHONE || c.fullName === WALKIN_NAME
    );
    if (existing) return existing.customerId;

    const created = await customerService.create({
      fullName: WALKIN_NAME,
      phoneNumber: WALKIN_PHONE,
    });
    // add to local list so next time we find it without an API call
    setCustomers(prev => [...prev, created]);
    return created.customerId;
  };

  // ── Row helpers ───────────────────────────────────────────────────────────

  const addRow = () => setRows(prev => [...prev, emptyRow()]);

  const updateRow = (id: string, updated: Partial<CartItem>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));

  const removeRow = (id: string) =>
    setRows(prev => prev.length === 1 ? [emptyRow()] : prev.filter(r => r.id !== id));

  // ── Calculations ──────────────────────────────────────────────────────────

  const lineTotal = (r: CartItem) =>
    r.medicineId === 0 ? 0 : r.quantity * r.unitPrice * (1 - r.discountPercent / 100);

  const validRows   = rows.filter(r => r.medicineId !== 0);
  const subtotal    = validRows.reduce((s, r) => s + lineTotal(r), 0);
  const discountAmt = subtotal * (discount / 100);
  const afterPct    = subtotal - discountAmt;
  const total       = Math.max(0, afterPct - cashDiscount);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSell = async () => {
    if (validRows.length === 0) { toast.error('Add at least one medicine'); return; }
    if (!user?.userId) {
      toast.error('Cannot identify pharmacist. Please log out and back in.');
      return;
    }

    setSubmitting(true);
    try {
      // Resolve customer — fall back to walk-in
      const customerId = selectedCustomer
        ? selectedCustomer.customerId
        : await ensureWalkInCustomer();

      const items: CreateSaleItemDto[] = validRows.map(r => ({
        medicineId:      r.medicineId,
        saleUnitType:    r.saleUnitType,
        quantity:        r.quantity,
        discountPercent: r.discountPercent,
      }));

      const dto: CreateSaleRequestDto = {
        customerId,
        pharmacistId:    user.userId,
        discountPercent: discount,
        paymentMode:     paymentMode as PaymentMode,
        items,
      };

      const result = await saleService.create(dto);
      setInvoice(result);
      setInvoiceCashDiscount(cashDiscount);
      setInvoiceOpen(true);

      // Reset form
      setRows([emptyRow()]);
      setSelectedCustomer(null);
      setDiscount(0);
      setCashDiscount(0);
      setPaymentMode(0);
      toast.success(`Sale ${result.invoiceNumber} completed!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phoneNumber.includes(customerSearch)
  );

  if (loading) {
    return (
      <AppLayout title="Sell Medicine">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8 text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Sell Medicine">
      <div className="space-y-5">

        {/* ── Customer Picker ─────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="h-4 w-4 text-blue-500" /> Customer
            <span className="ml-1 text-xs font-normal text-gray-400">(leave blank for walk-in)</span>
          </label>
          {selectedCustomer ? (
            <div className="flex items-center justify-between rounded-xl bg-blue-50 px-4 py-2.5">
              <div>
                <p className="font-semibold text-blue-900">{selectedCustomer.fullName}</p>
                <p className="text-xs text-blue-600">{selectedCustomer.phoneNumber}</p>
              </div>
              <button onClick={() => setSelectedCustomer(null)} className="text-blue-400 hover:text-blue-700">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={customerSearch}
                onChange={e => { setCustomerSearch(e.target.value); setCustomerDropdown(true); }}
                onFocus={() => setCustomerDropdown(true)}
                placeholder="Search by name or phone…"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {customerDropdown && customerSearch.length > 0 && (
                <div className="absolute z-10 mt-1 w-full rounded-xl border border-gray-100 bg-white shadow-lg max-h-48 overflow-y-auto">
                  {filteredCustomers.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400">No customers found</p>
                  )}
                  {filteredCustomers.map(c => (
                    <button
                      key={c.customerId}
                      type="button"
                      onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomerDropdown(false); }}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50"
                    >
                      <span className="font-medium text-gray-900">{c.fullName}</span>
                      <span className="text-gray-400">{c.phoneNumber}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Medicine Table ───────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <h2 className="flex items-center gap-2 font-semibold text-gray-800">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              Medicines
              {validRows.length > 0 && (
                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-700">
                  {validRows.length}
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Medicine
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left w-64">Medicine</th>
                  <th className="px-3 py-2 text-left w-32">Unit</th>
                  <th className="px-3 py-2 text-left w-24">Qty</th>
                  <th className="px-3 py-2 text-left w-28">Disc %</th>
                  <th className="px-3 py-2 text-right w-28">Total</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <MedicineRow
                    key={row.id}
                    row={row}
                    medicines={medicines}
                    onChange={updateRow}
                    onRemove={removeRow}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Summary + Payment ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">

          {/* Discounts row */}
          <div className="flex flex-wrap items-center gap-6">
            {/* % invoice discount */}
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm text-gray-600">Invoice Discount</label>
              <input
                type="number" min={0} max={100}
                value={discount}
                onChange={e => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>

            {/* Cash discount (Rs flat) */}
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm text-gray-600">Cash Discount</label>
              <span className="text-sm text-gray-400">Rs</span>
              <input
                type="number" min={0}
                value={cashDiscount}
                onChange={e => setCashDiscount(Math.max(0, Number(e.target.value)))}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment mode */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Payment Mode</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map(pm => (
                <button
                  key={pm.value}
                  type="button"
                  onClick={() => setPaymentMode(pm.value)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                    paymentMode === pm.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  )}
                >
                  <pm.icon className="h-4 w-4" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Totals + Complete */}
          <div className="flex items-end justify-between gap-4 pt-1">
            <div className="flex-1 rounded-xl bg-gray-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>Rs {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Invoice Discount ({discount}%)</span>
                  <span>-Rs {discountAmt.toFixed(2)}</span>
                </div>
              )}
              {cashDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cash Discount</span>
                  <span>-Rs {cashDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-base text-gray-900">
                <span>Total</span><span>Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSell}
              disabled={submitting || validRows.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {submitting
                ? <LoadingSpinner className="h-4 w-4 text-white" />
                : <CheckCircle className="h-4 w-4" />}
              {submitting ? 'Processing…' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Invoice Modal ─────────────────────────────────────────────────── */}
      <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Sale Invoice" size="lg">
        {invoice && (
          <div className="space-y-5">
            {/* Success banner */}
            <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-900">Sale Completed!</p>
                <p className="text-sm text-green-600">Invoice: {invoice.invoiceNumber}</p>
              </div>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Customer',   value: invoice.customerName },
                { label: 'Date',       value: format(new Date(invoice.saleDate), 'dd MMM yyyy, hh:mm a') },
                { label: 'Pharmacist', value: invoice.pharmacistName },
                { label: 'Payment',    value: PAYMENT_MODES.find(p => p.value === invoice.paymentMode)?.label ?? 'Cash' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Items table */}
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Qty</th>
                    <th className="px-4 py-2">Unit Price</th>
                    <th className="px-4 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {invoice.items.map(item => (
                    <tr key={item.saleItemId}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{item.medicineName}</p>
                        <p className="text-xs text-gray-400">Batch: {item.batchNumber}</p>
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {item.quantity} {item.saleUnitType === 1 ? 'strip(s)' : 'tab(s)'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">Rs {Number(item.unitPrice).toFixed(2)}</td>
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                        Rs {Number(item.lineTotal).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span><span>Rs {Number(invoice.subtotal).toFixed(2)}</span>
              </div>
              {Number(invoice.discountPercent) > 0 && (
                <div className="flex justify-between text-orange-600">
                  <span>Invoice Discount ({Number(invoice.discountPercent)}%)</span>
                  <span>-Rs {Number(invoice.discountAmount).toFixed(2)}</span>
                </div>
              )}
              {invoiceCashDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Cash Discount</span>
                  <span>-Rs {invoiceCashDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg text-gray-900">
                <span>Grand Total</span>
                <span>Rs {(Number(invoice.totalAmount) - invoiceCashDiscount).toFixed(2)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <BillPrint invoice={invoice} cashDiscount={invoiceCashDiscount} />
              <button
                onClick={() => setInvoiceOpen(false)}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
