'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, Trash2, Search, User, CreditCard,
  Banknote, Smartphone, Receipt, CheckCircle, X, Percent,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { FormField, SelectField } from '@/components/ui/FormField';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { medicineService } from '@/services/medicineService';
import { customerService } from '@/services/customerService';
import { saleService } from '@/services/saleService';
import { useAuth } from '@/context/AuthContext';
import type {
  Medicine, Customer, CartItem, SaleResponse,
  CreateSaleRequestDto, CreateSaleItemDto,
  SaleUnitType, PaymentMode,
} from '@/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const PAYMENT_MODES: { value: number; label: string; icon: React.ElementType }[] = [
  { value: 0, label: 'Cash',   icon: Banknote },
  { value: 1, label: 'Card',   icon: CreditCard },
  { value: 2, label: 'Online', icon: Smartphone },
  { value: 3, label: 'Credit', icon: Receipt },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

export default function SalesPage() {
  const { user } = useAuth();

  // Data
  const [medicines, setMedicines]   = useState<Medicine[]>([]);
  const [customers, setCustomers]   = useState<Customer[]>([]);
  const [loading, setLoading]       = useState(true);

  // Cart
  const [cart, setCart]             = useState<CartItem[]>([]);
  const [discount, setDiscount]     = useState(0);
  const [paymentMode, setPaymentMode] = useState<number>(0);

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch]     = useState('');
  const [customerDropdown, setCustomerDropdown] = useState(false);

  // Medicine search
  const [medSearch, setMedSearch] = useState('');

  // Add-to-cart modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedMed, setSelectedMed]   = useState<Medicine | null>(null);

  // Invoice modal
  const [invoiceOpen, setInvoiceOpen]   = useState(false);
  const [invoice, setInvoice]           = useState<SaleResponse | null>(null);
  const [submitting, setSubmitting]     = useState(false);

  const { register, handleSubmit, reset } = useForm<{ quantity: number; saleUnitType: number; discountPercent: number }>();

  const load = useCallback(async () => {
    const [meds, custs] = await Promise.all([medicineService.getAll(), customerService.getAll()]);
    setMedicines(meds.filter(m => m.isActive));
    setCustomers(custs);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // ── Cart helpers ────────────────────────────────────────────────────────────

  const openAddModal = (m: Medicine) => {
    setSelectedMed(m);
    reset({ quantity: 1, saleUnitType: 1, discountPercent: 0 }); // default: 1 strip
    setAddModalOpen(true);
  };

  const addToCart = (data: { quantity: number; saleUnitType: number; discountPercent: number }) => {
    if (!selectedMed) return;
    const unitType = Number(data.saleUnitType) as SaleUnitType;
    const unitPrice = unitType === 1 ? selectedMed.stripPrice : selectedMed.tabletPrice;
    const item: CartItem = {
      id: generateId(),
      medicineId: selectedMed.medicineId,
      medicineName: selectedMed.name,
      saleUnitType: unitType,
      quantity: Number(data.quantity),
      discountPercent: Number(data.discountPercent),
      unitPrice,
      tabletsPerStrip: selectedMed.tabletsPerStrip,
    };
    setCart(prev => [...prev, item]);
    setAddModalOpen(false);
    toast.success(`${selectedMed.name} added to cart`);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  // ── Calculations ────────────────────────────────────────────────────────────

  const lineTotal = (item: CartItem) => {
    const gross = item.quantity * item.unitPrice;
    return gross - gross * (item.discountPercent / 100);
  };

  const subtotal  = cart.reduce((s, i) => s + lineTotal(i), 0);
  const discountAmt = subtotal * (discount / 100);
  const total     = subtotal - discountAmt;

  // ── Submit sale ──────────────────────────────────────────────────────────────

  const handleSell = async () => {
    if (!selectedCustomer) { toast.error('Please select a customer'); return; }
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    if (!user?.userId) {
      toast.error('Could not identify pharmacist. Please log out and log back in.');
      return;
    }

    setSubmitting(true);
    try {
      const items: CreateSaleItemDto[] = cart.map(i => ({
        medicineId:     i.medicineId,
        saleUnitType:   i.saleUnitType,
        quantity:       i.quantity,
        discountPercent: i.discountPercent,
      }));

      const dto: CreateSaleRequestDto = {
        customerId:     selectedCustomer.customerId,
        pharmacistId:   user.userId,
        discountPercent: discount,
        paymentMode:    paymentMode as PaymentMode,
        items,
      };

      const result = await saleService.create(dto);
      setInvoice(result);
      setInvoiceOpen(true);
      setCart([]);
      setSelectedCustomer(null);
      setDiscount(0);
      setPaymentMode(0);
      toast.success(`Sale ${result.invoiceNumber} completed!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Sale failed');
    } finally { setSubmitting(false); }
  };

  // ── Filtered lists ──────────────────────────────────────────────────────────

  const filteredMeds = medicines.filter(m =>
    m.name.toLowerCase().includes(medSearch.toLowerCase()) ||
    (m.genericName ?? '').toLowerCase().includes(medSearch.toLowerCase())
  );

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
      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── Left: Medicine Search ──────────────────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Customer Picker */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <label className="mb-2 block text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="h-4 w-4 text-blue-500" /> Customer
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
              <div className="relative">
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

          {/* Medicine catalogue */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={medSearch}
                  onChange={e => setMedSearch(e.target.value)}
                  placeholder="Search medicines to add…"
                  className="w-full rounded-xl border border-gray-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="max-h-[420px] overflow-y-auto divide-y divide-gray-50">
              {filteredMeds.length === 0 && (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No medicines found</p>
              )}
              {filteredMeds.map(m => (
                <div key={m.medicineId} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">
                      {m.genericName ?? '—'} · {m.totalStockInTablets.toLocaleString()} tabs in stock
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Strip: Rs {Number(m.stripPrice).toFixed(2)} · Tablet: Rs {Number(m.tabletPrice).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.totalStockInTablets <= m.reorderLevel && (
                      <Badge variant="red">Low</Badge>
                    )}
                    <button
                      onClick={() => openAddModal(m)}
                      disabled={m.totalStockInTablets === 0}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Cart ────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-5 py-4 flex items-center justify-between">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-blue-500" />
                Cart
              </h2>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700">
                {cart.length}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
              {cart.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-gray-400">Cart is empty</p>
              )}
              {cart.map(item => (
                <div key={item.id} className="flex items-start justify-between px-4 py-3">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.medicineName}</p>
                    <p className="text-xs text-gray-500">
                      {item.quantity} × {item.saleUnitType === 1 ? 'strip' : 'tab'} @ Rs {Number(item.unitPrice).toFixed(2)}
                      {item.discountPercent > 0 && ` (${item.discountPercent}% off)`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      Rs {lineTotal(item).toFixed(2)}
                    </span>
                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals + Options */}
            <div className="border-t border-gray-100 p-4 space-y-3">
              {/* Discount */}
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <label className="text-sm text-gray-600 w-28">Invoice Discount</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
                />
                <span className="text-sm text-gray-400">%</span>
              </div>

              {/* Payment mode */}
              <div>
                <p className="mb-1.5 text-sm text-gray-600">Payment Mode</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {PAYMENT_MODES.map(pm => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMode(pm.value)}
                      className={cn(
                        'flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium transition-colors',
                        paymentMode === pm.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300'
                      )}
                    >
                      <pm.icon className="h-3.5 w-3.5" />
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="rounded-xl bg-gray-50 p-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>Rs {subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-Rs {discountAmt.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-gray-200 pt-1.5 font-bold text-gray-900">
                  <span>Total</span>
                  <span>Rs {total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSell}
                disabled={submitting || cart.length === 0 || !selectedCustomer}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {submitting ? <LoadingSpinner className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4" />}
                {submitting ? 'Processing…' : 'Complete Sale'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Cart Modal */}
      <Modal open={addModalOpen} onClose={() => setAddModalOpen(false)} title={`Add ${selectedMed?.name ?? ''} to Cart`}>
        <form onSubmit={handleSubmit(addToCart)} className="space-y-4">
          <div className="rounded-xl bg-blue-50 p-3 text-sm">
            <p className="font-medium text-blue-900">{selectedMed?.name}</p>
            <p className="text-blue-600 text-xs mt-0.5">
              Stock: {selectedMed?.totalStockInTablets.toLocaleString()} tabs ·
              {selectedMed?.tabletsPerStrip} tabs/strip
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Unit Type</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={1} {...register('saleUnitType')} defaultChecked className="text-blue-600" />
                Strip (Rs {Number(selectedMed?.stripPrice ?? 0).toFixed(2)})
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="radio" value={0} {...register('saleUnitType')} className="text-blue-600" />
                Tablet (Rs {Number(selectedMed?.tabletPrice ?? 0).toFixed(2)})
              </label>
            </div>
          </div>

          <FormField
            label="Quantity *"
            type="number"
            min={1}
            {...register('quantity', { required: true, min: 1, valueAsNumber: true })}
          />
          <FormField
            label="Discount (%)"
            type="number"
            min={0}
            max={100}
            {...register('discountPercent', { valueAsNumber: true })}
          />

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setAddModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
              <Plus className="h-4 w-4" /> Add to Cart
            </button>
          </div>
        </form>
      </Modal>

      {/* Invoice Modal */}
      <Modal open={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Sale Invoice" size="lg">
        {invoice && (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-xl bg-green-50 p-4">
              <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-bold text-green-900">Sale Completed!</p>
                <p className="text-sm text-green-600">Invoice: {invoice.invoiceNumber}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Customer</p>
                <p className="font-semibold text-gray-900">{invoice.customerName}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Date</p>
                <p className="font-semibold text-gray-900">{format(new Date(invoice.saleDate), 'dd MMM yyyy, hh:mm a')}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Pharmacist</p>
                <p className="font-semibold text-gray-900">{invoice.pharmacistName}</p>
              </div>
              <div className="rounded-xl border border-gray-100 p-3">
                <p className="text-xs text-gray-400 mb-1">Payment</p>
                <p className="font-semibold text-gray-900">{PAYMENT_MODES.find(p => p.value === invoice.paymentMode)?.label ?? 'Cash'}</p>
              </div>
            </div>

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
                      <td className="px-4 py-2.5 text-right font-semibold text-gray-900">Rs {Number(item.lineTotal).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="rounded-xl bg-gray-50 p-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>Rs {Number(invoice.subtotal).toFixed(2)}</span></div>
              {invoice.discountPercent > 0 && (
                <div className="flex justify-between text-green-600"><span>Discount ({Number(invoice.discountPercent)}%)</span><span>-Rs {Number(invoice.discountAmount).toFixed(2)}</span></div>
              )}
              <div className="flex justify-between border-t border-gray-200 pt-2 font-bold text-lg text-gray-900">
                <span>Total</span><span>Rs {Number(invoice.totalAmount).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setInvoiceOpen(false)}
              className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
