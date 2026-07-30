'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Building2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { manufacturerService } from '@/services/manufacturerService';
import type { Manufacturer, CreateManufacturerDto } from '@/types';

export default function ManufacturersPage() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Manufacturer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Manufacturer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateManufacturerDto>();

  const load = useCallback(async () => {
    const data = await manufacturerService.getAll();
    setManufacturers(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => { reset({}); setEditing(null); setModalOpen(true); };
  const openEdit = (m: Manufacturer) => {
    reset({ name: m.name });
    setEditing(m);
    setModalOpen(true);
  };

  const onSubmit = async (data: CreateManufacturerDto) => {
    setSaving(true);
    try {
      if (editing) {
        await manufacturerService.update(editing.manufacturerId, data);
        toast.success('Manufacturer updated');
      } else {
        await manufacturerService.create(data);
        toast.success('Manufacturer created');
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
      await manufacturerService.delete(deleteTarget.manufacturerId);
      toast.success('Manufacturer deleted');
      setDeleteTarget(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Delete failed');
    } finally { setDeleting(false); }
  };

  const filtered = manufacturers.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AppLayout title="Manufacturers"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Manufacturers">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search manufacturers…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Manufacturer
        </button>
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col items-center py-16 text-gray-400">
            <Building2 className="mb-3 h-12 w-12 text-gray-200" />
            <p className="text-sm">No manufacturers found</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(m => (
            <div
              key={m.manufacturerId}
              className="group flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEdit(m)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(m)}
                    className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                {m.medicineCount !== undefined && (
                  <p className="mt-1 text-xs text-gray-500">
                    {m.medicineCount} {m.medicineCount === 1 ? 'medicine' : 'medicines'}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs text-gray-400">
        {filtered.length} of {manufacturers.length} manufacturers
      </p>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Manufacturer' : 'Add Manufacturer'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Manufacturer Name *"
            placeholder="e.g. Sun Pharma"
            error={errors.name?.message}
            {...register('name', { required: 'Manufacturer name is required' })}
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
        title="Delete Manufacturer"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </AppLayout>
  );
}
