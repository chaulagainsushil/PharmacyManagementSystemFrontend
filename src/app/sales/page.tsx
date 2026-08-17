'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  ShoppingCart, Plus, User, CreditCard, Banknote,
  Smartphone, Receipt, CheckCircle, X, Percent, Search,
  FileImage, Upload, Trash2,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { MedicineRow } from '@/components/ui/MedicineRow';
import { BillPrint } from '@/components/ui/BillPrint';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { DualUnitSalesGuide } from '@/components/ui/DualUnitSalesGuide';
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

// ── Constants ──────────────────────────────────────────────────────────────────

const WALKIN_PHONE = '0000000000';
const WALKIN_NAME  = 'Walk-in Customer';

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: React.ElementType }[] = [
  { value: 'Cash',   label: 'Cash',   icon: Banknote    },
  { value: 'Card',   label: 'Card',   icon: CreditCard  },
  { value: 'Online', label: 'Online', icon: Smartphone  },
  { value: 'Credit', label: 'Credit', icon: Receipt     },
];

function generateId() { return Math.random().toString(36).slice(2); }

function emptyRow(): CartItem {
  return {
    id:             generateId(),
    itemType:       'Medicine',
    medicineId:     0,
    medicineName:   '',
    medicineUnitId: 0,
    uomName:        '',
    quantity:       1,
    discountPercent: 0,
    unitPrice:      0,
    availableUnits: [],
  };
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SalesPage() {
  const { user } = useAuth();

  const [pickedMedicines, setPickedMedicines] = useState<Medicine[]>([]);
  const [customers, setCustomers]             = useState<Customer[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [rows, setRows]                       = useState<CartItem[]>([emptyRow()]);

  // Invoice-level
  const [discount, setDiscount]         = useState(0);
  const [cashDiscount, setCashDiscount] = useState(0);
  const [paymentMode, setPaymentMode]   = useState<PaymentMode>('Cash');

  // Customer
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch]     = useState('');
  const [customerDropdown, setCustomerDropdown] = useState(false);
  const [customerLoading, setCustomerLoading]   = useState(false);

  // Medicine quick select
  const [medicineSearch, setMedicineSearch]     = useState('');
  const [medicineList, setMedicineList]         = useState<Medicine[]>([]);
  const [medicineDropdown, setMedicineDropdown] = useState(false);
  const [medicineLoading, setMedicineLoading]   = useState(false);
  const medicineInputRef = useRef<HTMLInputElement>(null);
  const medicineDropdownRef = useRef<HTMLDivElement>(null);

  // Prescription upload
  const [prescriptionFile, setPrescriptionFile]       = useState<File | null>(null);
  const [prescriptionPreview, setPrescriptionPreview] = useState<string | null>(null);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice modal
  const [invoiceOpen, setInvoiceOpen]             = useState(false);
  const [invoice, setInvoice]                     = useState<SaleResponse | null>(null);
  const [invoiceCashDiscount, setInvoiceCashDiscount] = useState(0);
  const [submitting, setSubmitting]               = useState(false);

  const load = useCallback(async () => {
    const custs = await customerService.getAll();
    setCustomers(custs);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // Close medicine dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (medicineDropdownRef.current && !medicineDropdownRef.current.contains(e.target as Node) &&
          medicineInputRef.current && !medicineInputRef.current.contains(e.target as Node)) {
        setMedicineDropdown(false);
      }
    };
    if (medicineDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [medicineDropdown]);

  // Medicine search handler
  const handleMedicineSearch = useCallback(async (query: string) => {
    setMedicineSearch(query);
    if (!query.trim()) {
      setMedicineList([]);
      setMedicineDropdown(false);
      return;
    }
    setMedicineLoading(true);
    try {
      const results = await medicineService.search(query.trim());
      setMedicineList(results.filter(m => m.isActive));
      setMedicineDropdown(true);
    } catch (e) {
      setMedicineList([]);
    } finally {
      setMedicineLoading(false);
    }
  }, []);

  // Handle medicine selection from dropdown
  const handleMedicineSelect = (medicine: Medicine) => {
    registerMedicine(medicine);
    // Add a new row with the selected medicine
    const newRow = emptyRow();
    newRow.medicineId = medicine.medicineId;
    newRow.medicineName = medicine.name;
    setRows((prev) => [...prev, newRow]);
    setMedicineSearch('');
    setMedicineDropdown(false);
    setMedicineList([]);
    // Focus back on input
    medicineInputRef.current?.focus();
  };

  const registerMedicine = useCallback((med: Medicine) => {
    setPickedMedicines((prev) => {
      if (prev.some((m) => m.medicineId === med.medicineId)) return prev;
      return [...prev, med];
    });
  }, []);

  // ── Prescription helpers ───────────────────────────────────────────────────

  const validRows = rows.filter((r) => r.medicineId !== 0 && r.medicineUnitId !== 0);
  const requiresPrescription = validRows.some((r) => {
    const med = pickedMedicines.find((m) => m.medicineId === r.medicineId);
    return med?.requiresPrescription;
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(file.type)) { toast.error('Only JPG, PNG, WebP, or PDF files are accepted.'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('File size must not exceed 10 MB.'); return; }
    setPrescriptionFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setPrescriptionPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPrescriptionPreview(null);
    }
  };

  const clearPrescription = () => {
    setPrescriptionFile(null);
    setPrescriptionPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Walk-in customer ───────────────────────────────────────────────────────

  const ensureWalkInCustomer = async (): Promise<number> => {
    const existing = customers.find(
      (c) => c.phoneNumber === WALKIN_PHONE || c.fullName === WALKIN_NAME
    );
    if (existing) return existing.customerId;
    const created = await customerService.create({ fullName: WALKIN_NAME, phoneNumber: WALKIN_PHONE });
    setCustomers((prev) => [...prev, created]);
    return created.customerId;
  };

  // ── Row helpers ────────────────────────────────────────────────────────────

  const addRow    = () => setRows((prev) => [...prev, emptyRow()]);
  const updateRow = (id: string, updated: Partial<CartItem>) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
  const removeRow = (id: string) =>
    setRows((prev) => (prev.length === 1 ? [emptyRow()] : prev.filter((r) => r.id !== id)));

  // ── Calculations ───────────────────────────────────────────────────────────

  const lineTotal   = (r: CartItem) =>
    r.medicineId === 0 || r.medicineUnitId === 0
      ? 0
      : r.quantity * r.unitPrice * (1 - r.discountPercent / 100);
  const subtotal    = validRows.reduce((s, r) => s + lineTotal(r), 0);
  const discountAmt = subtotal * (discount / 100);
  const afterPct    = subtotal - discountAmt;
  const total       = Math.max(0, afterPct - cashDiscount);

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSell = async () => {
    if (validRows.length === 0) { toast.error('Add at least one medicine'); return; }
    if (!user?.userId) { toast.error('Cannot identify pharmacist. Please log out and back in.'); return; }
    if (requiresPrescription && !prescriptionFile) {
      toast.error('Please upload a prescription — one or more medicines require it.');
      return;
    }

    setSubmitting(true);
    try {
      if (requiresPrescription && prescriptionFile) {
        setUploadingPrescription(true);
        try { await medicineService.uploadPrescription(prescriptionFile); }
        finally { setUploadingPrescription(false); }
      }

      const customerId = selectedCustomer
        ? selectedCustomer.customerId
        : await ensureWalkInCustomer();

      const items: CreateSaleItemDto[] = validRows.map((r) => ({
        medicineId:      r.medicineId,
        medicineUnitId:  r.medicineUnitId,
        quantity:        r.quantity,
        discountPercent: r.discountPercent,
      }));

      const dto: CreateSaleRequestDto = {
        customerId,
        pharmacistId:    user.userId,
        discountPercent: discount,
        paymentMode,
        items,
      };

      const result = await saleService.create(dto);
      setInvoice(result);
      setInvoiceCashDiscount(cashDiscount);
      setInvoiceOpen(true);

      // Reset
      setRows([emptyRow()]);
      setSelectedCustomer(null);
      setDiscount(0);
      setCashDiscount(0);
      setPaymentMode('Cash');
      clearPrescription();
      setPickedMedicines([]);
      toast.success(`Sale ${result.invoiceNumber} completed!`);
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Sale failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
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

        {/* ── Quick Medicine Select Dropdown ───────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            Quick Add Medicine
            <span className="ml-1 text-xs font-normal text-gray-400">(search & select to add to cart)</span>
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              ref={medicineInputRef}
              type="text"
              value={medicineSearch}
              onChange={(e) => handleMedicineSearch(e.target.value)}
              onFocus={() => setMedicineDropdown(medicineSearch.length > 0)}
              placeholder="Search medicine by name (e.g., Paracetamol)…"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
            {medicineLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <LoadingSpinner className="h-4 w-4 text-blue-500" />
              </div>
            )}
            {medicineDropdown && medicineSearch.length > 0 && (
              <div 
                ref={medicineDropdownRef}
                className="absolute z-20 mt-1 w-full max-h-64 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg"
              >
                {medicineList.length === 0 && !medicineLoading && (
                  <p className="px-4 py-3 text-sm text-gray-400">No medicines found. Try another search.</p>
                )}
                {medicineList.map((medicine) => (
                  <button
                    key={medicine.medicineId}
                    type="button"
                    onClick={() => handleMedicineSelect(medicine)}
                    className="flex w-full items-center justify-between px-4 py-2.5 text-sm hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-b-0"
                  >
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">{medicine.name}</p>
                      {medicine.genericName && (
                        <p className="text-xs text-gray-500">Generic: {medicine.genericName}</p>
                      )}
                    </div>
                    <Plus className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Customer Picker ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
          <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <User className="h-4 w-4 text-blue-500" />
            Customer
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
                onChange={(e) => { setCustomerSearch(e.target.value); setCustomerDropdown(true); }}
                onFocus={() => setCustomerDropdown(true)}
                placeholder="Search by name or phone…"
                className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {customerDropdown && customerSearch.length > 0 && (
                <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-gray-100 bg-white shadow-lg">
                  {filteredCustomers.length === 0 && (
                    <p className="px-4 py-3 text-sm text-gray-400">No customers found</p>
                  )}
                  {filteredCustomers.map((c) => (
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
          {/* Dual Unit Sales Guide */}
          <div className="border-b border-gray-100 px-5 py-3 bg-blue-50">
            <DualUnitSalesGuide />
          </div>

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
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-3 py-2 text-left w-64">Medicine</th>
                  <th className="px-3 py-2 text-left w-36">Unit Type</th>
                  <th className="px-3 py-2 text-left w-32">Qty</th>
                  <th className="px-3 py-2 text-left w-28">Disc %</th>
                  <th className="px-3 py-2 text-right w-28">Total</th>
                  <th className="px-3 py-2 w-10" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <MedicineRow
                    key={row.id}
                    row={row}
                    medicines={pickedMedicines}
                    onChange={updateRow}
                    onRemove={removeRow}
                    onMedicineSelect={registerMedicine}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Prescription Upload ──────────────────────────────────────────── */}
        {requiresPrescription && (
          <div className="rounded-2xl border-2 border-purple-200 bg-purple-50 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <FileImage className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Prescription Required</h3>
              <span className="rounded bg-purple-100 px-2 py-0.5 text-xs font-bold text-purple-700">Rx</span>
              <span className="ml-1 text-xs text-purple-500">
                One or more medicines require a valid prescription.
              </span>
            </div>
            {prescriptionFile ? (
              <div className="flex items-center gap-4">
                {prescriptionPreview ? (
                  <img src={prescriptionPreview} alt="Prescription preview"
                    className="h-24 w-24 rounded-xl object-cover border border-purple-200" />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-purple-100 border border-purple-200">
                    <FileImage className="h-8 w-8 text-purple-400" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">{prescriptionFile.name}</p>
                  <p className="text-xs text-gray-400">{(prescriptionFile.size / 1024).toFixed(1)} KB</p>
                  <button type="button" onClick={clearPrescription}
                    className="mt-2 inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
                  className="hidden" onChange={handleFileSelect} />
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-dashed border-purple-300 bg-white px-6 py-4 text-sm font-medium text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-colors">
                  <Upload className="h-5 w-5" />
                  Click to upload prescription (JPG, PNG, WebP, PDF — max 10 MB)
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Summary + Payment ────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
          {/* Discounts */}
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm text-gray-600">Invoice Discount</label>
              <input
                type="number" min={0} max={100} value={discount}
                onChange={(e) => setDiscount(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
              />
              <span className="text-sm text-gray-400">%</span>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <label className="text-sm text-gray-600">Cash Discount</label>
              <span className="text-sm text-gray-400">Rs</span>
              <input
                type="number" min={0} value={cashDiscount}
                onChange={(e) => setCashDiscount(Math.max(0, Number(e.target.value)))}
                className="w-24 rounded-lg border border-gray-200 px-2 py-1 text-center text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Payment mode */}
          <div>
            <p className="mb-2 text-sm font-medium text-gray-600">Payment Mode</p>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_MODES.map((pm) => (
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

          {/* Totals + Complete button */}
          <div className="flex items-end justify-between gap-4 pt-1">
            <div className="flex-1 rounded-xl bg-gray-50 p-4 space-y-1 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>Rs {subtotal.toFixed(2)}</span>
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
                <span>Total</span>
                <span>Rs {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleSell}
              disabled={
                submitting ||
                validRows.length === 0 ||
                (requiresPrescription && !prescriptionFile)
              }
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-8 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {submitting ? (
                <LoadingSpinner className="h-4 w-4 text-white" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              {submitting
                ? uploadingPrescription ? 'Uploading…' : 'Processing…'
                : 'Complete Sale'}
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
                { label: 'Payment',    value: invoice.paymentMode },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Items */}
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
                  {invoice.items.map((item) => (
                    <tr key={item.saleItemId}>
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-gray-900">{item.medicineName}</p>
                        <p className="text-xs text-gray-400">
                          Batch: {item.batchNumber}
                          {item.uomName && (
                            <span className="ml-2 rounded bg-blue-50 px-1.5 py-0.5 text-blue-600 font-medium">
                              {item.uomName}
                            </span>
                          )}
                        </p>
                        {item.baseQuantityDeducted !== item.quantity && (
                          <p className="text-xs text-gray-400">
                            ({item.baseQuantityDeducted} base units deducted)
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        {item.quantity} {item.uomName || 'unit(s)'}
                      </td>
                      <td className="px-4 py-2.5 text-gray-600">
                        Rs {Number(item.unitPrice).toFixed(2)}
                      </td>
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
