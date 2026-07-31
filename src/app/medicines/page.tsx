'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Pill, ListPlus, CheckCircle, XCircle } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FormField, SelectField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { medicineService } from '@/services/medicineService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import type { Medicine, CreateMedicineDto, Category, Manufacturer, BulkCreateMedicineResult, BulkCreateMedicineItemResult } from '@/types';

export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Medicine | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // ── Bulk add state ──────────────────────────────────────────────────────────
  type BulkRow = CreateMedicineDto & { _id: string };
  const newRow = (): BulkRow => ({
    _id: Math.random().toString(36).slice(2),
    name: '', genericName: '', categoryId: undefined, manufacturerId: undefined,
    tabletsPerStrip: 1, stripPrice: 0, tabletPrice: 0,
    reorderLevel: 10, requiresPrescription: false, isActive: true,
  });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([newRow()]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkResults, setBulkResults] = useState<BulkCreateMedicineItemResult[] | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMedicineDto>();

  const load = useCallback(async () => {
    const [meds, cats, mfgs] = await Promise.all([
      medicineService.getAll(), categoryService.getAll(), manufacturerService.getAll()
    ]);
    setMedicines(meds); setCategories(cats); setManufacturers(mfgs);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => { reset({ tabletsPerStrip: 1, reorderLevel: 10, isActive: true, requiresPrescription: false }); setEditing(null); setModalOpen(true); };
  const openEdit = async (m: Medicine) => {
    setEditing(m);
    setModalOpen(true);
    try {
      const full = await medicineService.getById(m.medicineId);
      reset({
        name: full.name,
        genericName: full.genericName ?? undefined,
        categoryId: full.categoryId ?? undefined,
        manufacturerId: full.manufacturerId ?? undefined,
        tabletsPerStrip: full.tabletsPerStrip,
        stripPrice: full.stripPrice,
        tabletPrice: full.tabletPrice,
        reorderLevel: full.reorderLevel,
        requiresPrescription: full.requiresPrescription,
        isActive: full.isActive,
      });
    } catch {
      toast.error('Failed to load medicine details');
      setModalOpen(false);
    }
  };

  const onSubmit = async (data: CreateMedicineDto) => {
    setSaving(true);
    try {
      const payload = { ...data, categoryId: data.categoryId || null, manufacturerId: data.manufacturerId || null, tabletsPerStrip: Number(data.tabletsPerStrip), stripPrice: Number(data.stripPrice), tabletPrice: Number(data.tabletPrice), reorderLevel: Number(data.reorderLevel) };
      if (editing) { await medicineService.update(editing.medicineId, payload); toast.success('Medicine updated'); }
      else          { await medicineService.create(payload); toast.success('Medicine created'); }
      setModalOpen(false); await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await medicineService.delete(deleteTarget.medicineId); toast.success('Medicine deleted'); setDeleteTarget(null); await load(); }
    catch (e: any) { toast.error(e.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const openBulk = () => { setBulkRows([newRow()]); setBulkResults(null); setBulkOpen(true); };
  const closeBulk = () => { setBulkOpen(false); setBulkResults(null); };

  const updateRow = (id: string, field: keyof CreateMedicineDto, value: unknown) =>
    setBulkRows(rows => rows.map(r => r._id === id ? { ...r, [field]: value } : r));

  const addRow = () => setBulkRows(rows => [...rows, newRow()]);
  const removeRow = (id: string) => setBulkRows(rows => rows.filter(r => r._id !== id));

  const submitBulk = async () => {
    const payload = bulkRows.map(({ _id, ...rest }) => ({
      ...rest,
      categoryId: rest.categoryId || null,
      manufacturerId: rest.manufacturerId || null,
      tabletsPerStrip: Number(rest.tabletsPerStrip),
      stripPrice: Number(rest.stripPrice),
      tabletPrice: Number(rest.tabletPrice),
      reorderLevel: Number(rest.reorderLevel),
    }));
    setBulkSaving(true);
    try {
      const result = await medicineService.bulkCreate(payload);
      setBulkResults(result.results);
      if (result.totalCreated > 0) {
        toast.success(`${result.totalCreated} medicine(s) created`);
        await load();
      }
      if (result.totalFailed > 0) {
        toast.error(`${result.totalFailed} row(s) failed`);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Bulk create failed');
    } finally {
      setBulkSaving(false);
    }
  };

  const filtered = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.genericName ?? '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AppLayout title="Medicines"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Medicines">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medicines…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Medicine
          </button>
          <button onClick={openBulk} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
            <ListPlus className="h-4 w-4" /> Add Multiple
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Strip / Tablet</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Pill className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                  No medicines found
                </td></tr>
              )}
              {filtered.map(m => (
                <tr key={m.medicineId} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.genericName ?? '—'}</p>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{m.categoryName ?? '—'}</td>
                  <td className="px-6 py-3">
                    <span className={m.totalStockInTablets <= m.reorderLevel ? 'font-bold text-red-600' : 'text-gray-900'}>
                      {m.totalStockInTablets.toLocaleString()}
                    </span>
                    <span className="text-gray-400"> tabs</span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    Rs {Number(m.stripPrice).toFixed(2)} / Rs {Number(m.tabletPrice).toFixed(2)}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-col gap-1">
                      <Badge variant={m.isActive ? 'green' : 'gray'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
                      {m.requiresPrescription && <Badge variant="purple">Rx</Badge>}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Medicine' : 'Add Medicine'} size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><FormField label="Medicine Name *" placeholder="e.g. Paracetamol 500mg" error={errors.name?.message} {...register('name', { required: 'Required' })} /></div>
          <div className="col-span-2"><FormField label="Generic Name" placeholder="e.g. Acetaminophen" {...register('genericName')} /></div>
          <SelectField label="Category" {...register('categoryId')}>
            <option value="">— None —</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
          </SelectField>
          <SelectField label="Manufacturer" {...register('manufacturerId')}>
            <option value="">— None —</option>
            {manufacturers.map(m => <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>)}
          </SelectField>
          <FormField label="Tablets per Strip *" type="number" min={1} error={errors.tabletsPerStrip?.message} {...register('tabletsPerStrip', { required: true, min: 1 })} />
          <FormField label="Strip Price (Rs) *" type="number" step="0.01" min={0} error={errors.stripPrice?.message} {...register('stripPrice', { required: true })} />
          <FormField label="Tablet Price (Rs) *" type="number" step="0.01" min={0} error={errors.tabletPrice?.message} {...register('tabletPrice', { required: true })} />
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded text-blue-600" {...register('isActive')} />
              Active
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" className="h-4 w-4 rounded text-purple-600" {...register('requiresPrescription')} />
              Requires Prescription
            </label>
          </div>
          <div className="col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              {editing ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Medicine" message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      {/* ── Bulk Add Modal ──────────────────────────────────────────────────── */}
      <Modal open={bulkOpen} onClose={closeBulk} title="Add Multiple Medicines" size="xl">
        {bulkResults ? (
          /* Results view */
          <div className="space-y-3">
            <p className="text-sm text-slate-500">
              <span className="font-semibold text-emerald-600">{bulkResults.filter(r => r.success).length} created</span>
              {' · '}
              <span className="font-semibold text-red-500">{bulkResults.filter(r => !r.success).length} failed</span>
            </p>
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
              {bulkResults.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 text-sm ${r.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  {r.success
                    ? <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                    : <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />}
                  <div>
                    <p className="font-medium text-slate-800">{r.data?.name ?? bulkRows[i]?.name ?? `Row ${i + 1}`}</p>
                    <p className={`text-xs ${r.success ? 'text-emerald-700' : 'text-red-600'}`}>{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={closeBulk} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Done</button>
            </div>
          </div>
        ) : (
          /* Input view */
          <div className="space-y-4">
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Name *</th>
                    <th className="px-3 py-2 text-left">Generic Name</th>
                    <th className="px-3 py-2 text-left">Category</th>
                    <th className="px-3 py-2 text-left">Manufacturer</th>
                    <th className="px-3 py-2 text-left">Tabs/Strip</th>
                    <th className="px-3 py-2 text-left">Strip Price</th>
                    <th className="px-3 py-2 text-left">Tablet Price</th>
                    <th className="px-3 py-2 text-left">Active</th>
                    <th className="px-3 py-2 text-left">Rx</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bulkRows.map((row, idx) => (
                    <tr key={row._id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          value={row.name}
                          onChange={e => updateRow(row._id, 'name', e.target.value)}
                          placeholder="Paracetamol 500mg"
                          className="w-40 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          value={row.genericName ?? ''}
                          onChange={e => updateRow(row._id, 'genericName', e.target.value)}
                          placeholder="Generic"
                          className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.categoryId ?? ''}
                          onChange={e => updateRow(row._id, 'categoryId', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                        >
                          <option value="">— None —</option>
                          {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <select
                          value={row.manufacturerId ?? ''}
                          onChange={e => updateRow(row._id, 'manufacturerId', e.target.value ? Number(e.target.value) : undefined)}
                          className="w-32 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                        >
                          <option value="">— None —</option>
                          {manufacturers.map(m => <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>)}
                        </select>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={1} value={row.tabletsPerStrip}
                          onChange={e => updateRow(row._id, 'tabletsPerStrip', Number(e.target.value))}
                          className="w-16 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} step="0.01" value={row.stripPrice}
                          onChange={e => updateRow(row._id, 'stripPrice', Number(e.target.value))}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number" min={0} step="0.01" value={row.tabletPrice}
                          onChange={e => updateRow(row._id, 'tabletPrice', Number(e.target.value))}
                          className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox" checked={row.isActive}
                          onChange={e => updateRow(row._id, 'isActive', e.target.checked)}
                          className="h-4 w-4 rounded text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox" checked={row.requiresPrescription}
                          onChange={e => updateRow(row._id, 'requiresPrescription', e.target.checked)}
                          className="h-4 w-4 rounded text-purple-600"
                        />
                      </td>
                      <td className="px-3 py-2">
                        {bulkRows.length > 1 && (
                          <button onClick={() => removeRow(row._id)} className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button onClick={addRow} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors">
              <Plus className="h-4 w-4" /> Add Row
            </button>

            <div className="flex justify-end gap-3 pt-1">
              <button onClick={closeBulk} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={submitBulk} disabled={bulkSaving} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                {bulkSaving && <LoadingSpinner className="h-4 w-4 text-white" />}
                Create {bulkRows.length} Medicine{bulkRows.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
