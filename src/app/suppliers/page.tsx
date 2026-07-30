'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Truck, Phone, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { supplierService } from '@/services/supplierService';
import type { Supplier, CreateSupplierDto } from '@/types';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSupplierDto>();

  const load = useCallback(async () => {
    const data = await supplierService.getAll();
    setSuppliers(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => { reset({}); setEditing(null); setModalOpen(true); };
  const openEdit = (s: Supplier) => {
    reset({ name: s.name, phone: s.phone ?? '', address: s.address ?? '' });
    setEditing(s);
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateSupplierDto) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        phone: data.phone || undefined,
        address: data.address || undefined,
      };
      if (editing) {
        await supplierService.update(editing.supplierId, payload);
        toast.success('Supplier updated');
      } else {
        await supplierService.create(payload);
        toast.success('Supplier created');
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supplierService.delete(deleteTarget.supplierId);
      toast.success('Supplier deleted');
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Delete failed');
    } finally { setDeleting(false); }
  };

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.phone ?? '').includes(search)
  );

  if (loading) return <AppLayout title="Suppliers"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Suppliers">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Supplier
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Batches</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <Truck className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    No suppliers found
                  </td>
                </tr>
              )}
              {filtered.map(s => (
                <tr key={s.supplierId} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 flex-shrink-0">
                        <Truck className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="font-medium text-gray-900">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    {s.phone ? (
                      <span className="flex items-center gap-1.5 text-gray-600">
                        <Phone className="h-3.5 w-3.5 text-gray-400" />
                        {s.phone}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    {s.address ? (
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                        {s.address}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{s.batchCount ?? '—'}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(s)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Supplier Name *"
            placeholder="e.g. Nepal Medical Traders"
            error={errors.name?.message}
            {...register('name', { required: 'Supplier name is required' })}
          />
          <FormField
            label="Phone"
            placeholder="e.g. 01-4201234"
            {...register('phone')}
          />
          <FormField
            label="Address"
            placeholder="e.g. New Road, Kathmandu"
            {...register('address')}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              {editing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Supplier"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </AppLayout>
  );
}
