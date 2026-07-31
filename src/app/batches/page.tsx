'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FormField, SelectField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { batchService } from '@/services/batchService';
import { medicineService } from '@/services/medicineService';
import { supplierService } from '@/services/supplierService';
import type { MedicineBatch, CreateMedicineBatchDto, Medicine, Supplier } from '@/types';

type FormValues = {
  medicineId: number;
  batchNumber: string;
  supplierId?: number;
  manufactureDate?: string;
  expiryDate: string;
  quantityInTablets: number;
  purchasePricePerTablet: number;
  receivedDate: string;
};

export default function BatchesPage() {
  const [batches, setBatches] = useState<MedicineBatch[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MedicineBatch | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MedicineBatch | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>();

  const toDateInput = (d?: string | null) => d ? d.split('T')[0] : '';

  const load = useCallback(async () => {
    const [bats, meds, sups] = await Promise.all([
      batchService.getAll(), medicineService.getAll(), supplierService.getAll()
    ]);
    setBatches(bats); setMedicines(meds); setSuppliers(sups);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => {
    reset({ receivedDate: new Date().toISOString().split('T')[0] });
    setEditing(null); setModalOpen(true);
  };
  const openEdit = (b: MedicineBatch) => {
    reset({ ...b, supplierId: b.supplierId ?? undefined, manufactureDate: toDateInput(b.manufactureDate), expiryDate: toDateInput(b.expiryDate), receivedDate: toDateInput(b.receivedDate) });
    setEditing(b); setModalOpen(true);
  };

  const onSubmit = async (data: FormValues) => {
    setSaving(true);
    try {
      const payload: CreateMedicineBatchDto = {
        ...data,
        medicineId: Number(data.medicineId),
        supplierId: data.supplierId ? Number(data.supplierId) : null,
        quantityInTablets: Number(data.quantityInTablets),
        purchasePricePerTablet: Number(data.purchasePricePerTablet),
        expiryDate: new Date(data.expiryDate).toISOString(),
        receivedDate: new Date(data.receivedDate).toISOString(),
        manufactureDate: data.manufactureDate ? new Date(data.manufactureDate).toISOString() : null,
      };
      if (editing) {
        const { medicineId, receivedDate, ...rest } = payload;
        await batchService.update(editing.batchId, rest);
        toast.success('Batch updated');
      } else {
        await batchService.create(payload);
        toast.success('Batch created');
      }
      setModalOpen(false); await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await batchService.delete(deleteTarget.batchId); toast.success('Batch deleted'); setDeleteTarget(null); await load(); }
    catch (e: any) { toast.error(e.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const filtered = batches.filter(b =>
    b.medicineName.toLowerCase().includes(search.toLowerCase()) ||
    b.batchNumber.toLowerCase().includes(search.toLowerCase())
  );

  const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  if (loading) return <AppLayout title="Medicine Batches"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Medicine Batches">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Batch
        </button>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-gray-400">
            <Package className="mx-auto mb-2 h-8 w-8 text-gray-200" />No batches found
          </div>
        )}
        {filtered.map(b => {
          const days = daysUntil(b.expiryDate);
          return (
            <div key={b.batchId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{b.medicineName}</p>
                  <p className="text-xs text-gray-500">Batch: {b.batchNumber}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><span className="font-medium text-gray-700">Supplier:</span> {b.supplierName ?? '—'}</div>
                <div><span className="font-medium text-gray-700">Qty:</span> {b.quantityInTablets.toLocaleString()} tabs</div>
                <div><span className="font-medium text-gray-700">Price:</span> Rs {Number(b.purchasePricePerTablet).toFixed(2)}/tab</div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-700">Expiry:</span>
                  {format(new Date(b.expiryDate), 'dd MMM yyyy')}
                </div>
              </div>
              <div className="mt-2">
                {b.isExpired ? <Badge variant="red">Expired</Badge>
                  : days <= 30 ? <Badge variant="red">{days}d left</Badge>
                  : days <= 90 ? <Badge variant="yellow">{days}d left</Badge>
                  : <Badge variant="green">Valid</Badge>}
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
                <th className="px-6 py-3">Medicine / Batch</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Qty (Tabs)</th>
                <th className="px-6 py-3">Purchase Price</th>
                <th className="px-6 py-3">Expiry</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Package className="mx-auto mb-2 h-8 w-8 text-gray-200" />No batches found
                </td></tr>
              )}
              {filtered.map(b => {
                const days = daysUntil(b.expiryDate);
                return (
                  <tr key={b.batchId} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-900">{b.medicineName}</p>
                      <p className="text-xs text-gray-500">Batch: {b.batchNumber}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-600">{b.supplierName ?? '—'}</td>
                    <td className="px-6 py-3 font-semibold text-gray-900">{b.quantityInTablets.toLocaleString()}</td>
                    <td className="px-6 py-3 text-gray-600">Rs {Number(b.purchasePricePerTablet).toFixed(2)}/tab</td>
                    <td className="px-6 py-3">
                      <p className="text-gray-700">{format(new Date(b.expiryDate), 'dd MMM yyyy')}</p>
                      {b.isExpired ? <Badge variant="red">Expired</Badge>
                        : days <= 30 ? <Badge variant="red">{days}d left</Badge>
                        : days <= 90 ? <Badge variant="yellow">{days}d left</Badge>
                        : <Badge variant="green">Valid</Badge>}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => openEdit(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => setDeleteTarget(b)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Batch' : 'Add Batch'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          {!editing && (
            <div className="col-span-2">
              <SelectField label="Medicine *" error={errors.medicineId?.message} {...register('medicineId', { required: 'Required' })}>
                <option value="">— Select —</option>
                {medicines.map(m => <option key={m.medicineId} value={m.medicineId}>{m.name}</option>)}
              </SelectField>
            </div>
          )}
          <div className="col-span-2"><FormField label="Batch Number *" placeholder="e.g. AMX-2026-001" error={errors.batchNumber?.message} {...register('batchNumber', { required: 'Required' })} /></div>
          <SelectField label="Supplier" {...register('supplierId')}>
            <option value="">— None —</option>
            {suppliers.map(s => <option key={s.supplierId} value={s.supplierId}>{s.name}</option>)}
          </SelectField>
          <FormField label="Received Date *" type="date" error={errors.receivedDate?.message} {...register('receivedDate', { required: 'Required' })} />
          <FormField label="Manufacture Date" type="date" {...register('manufactureDate')} />
          <FormField label="Expiry Date *" type="date" error={errors.expiryDate?.message} {...register('expiryDate', { required: 'Required' })} />
          <FormField label="Quantity (Tablets) *" type="number" min={1} error={errors.quantityInTablets?.message} {...register('quantityInTablets', { required: true, min: 1 })} />
          <FormField label="Purchase Price / Tablet *" type="number" step="0.0001" min={0} error={errors.purchasePricePerTablet?.message} {...register('purchasePricePerTablet', { required: true })} />
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              {editing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Batch" message={`Delete batch "${deleteTarget?.batchNumber}"?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </AppLayout>
  );
}
