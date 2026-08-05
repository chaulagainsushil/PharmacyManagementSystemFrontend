'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Search, Pill, ListPlus,
  CheckCircle, XCircle, ChevronDown, ChevronUp, X, Settings,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Badge } from '@/components/ui/Badge';
import { FormField, SelectField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { UnitsManager } from '@/components/ui/UnitsManager';
import { medicineService } from '@/services/medicineService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import type {
  Medicine, CreateMedicineDto, Category, Manufacturer,
  BulkCreateMedicineItemResult,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type BulkRow = CreateMedicineDto & { _id: string };

function newRow(): BulkRow {
  return {
    _id: Math.random().toString(36).slice(2),
    name: '', genericName: '',
    categoryId: undefined, manufacturerId: undefined,
    tabletsPerStrip: 1, strapsPerBox: 1, stripPrice: 0, tabletPrice: 0,
    reorderLevel: 10, requiresPrescription: false, isActive: true,
  };
}

// ── Bulk entry form (shown per medicine) ─────────────────────────────────────

interface BulkFormProps {
  categories: Category[];
  manufacturers: Manufacturer[];
  onAdd: (row: BulkRow) => void;
}

function BulkEntryForm({ categories, manufacturers, onAdd }: BulkFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<CreateMedicineDto>({
      defaultValues: { tabletsPerStrip: 1, reorderLevel: 10, isActive: true, requiresPrescription: false },
    });

  const onSubmit = (data: CreateMedicineDto) => {
    onAdd({
      ...data,
      _id: Math.random().toString(36).slice(2),
      categoryId: data.categoryId ? Number(data.categoryId) : undefined,
      manufacturerId: data.manufacturerId ? Number(data.manufacturerId) : undefined,
      tabletsPerStrip: Number(data.tabletsPerStrip),
      stripPrice: Number(data.stripPrice),
      tabletPrice: Number(data.tabletPrice),
      reorderLevel: Number(data.reorderLevel),
    });
    reset({ tabletsPerStrip: 1, reorderLevel: 10, isActive: true, requiresPrescription: false });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">New Medicine</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <FormField
            label="Medicine Name *"
            placeholder="e.g. Paracetamol 500mg"
            error={errors.name?.message}
            {...register('name', { required: 'Required' })}
          />
        </div>
        <FormField label="Generic Name" placeholder="e.g. Acetaminophen" {...register('genericName')} />
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
          <select
            {...register('categoryId')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— None —</option>
            {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Manufacturer</label>
          <select
            {...register('manufacturerId')}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">— None —</option>
            {manufacturers.map(m => <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>)}
          </select>
        </div>
        <FormField
          label="Tablets / Strip *"
          type="number" min={1}
          error={errors.tabletsPerStrip?.message}
          {...register('tabletsPerStrip', { required: true, min: 1 })}
        />
        <FormField
          label="Strip Price (Rs) *"
          type="number" step="0.01" min={0}
          error={errors.stripPrice?.message}
          {...register('stripPrice', { required: true })}
        />
        <FormField
          label="Tablet Price (Rs) *"
          type="number" step="0.01" min={0}
          error={errors.tabletPrice?.message}
          {...register('tabletPrice', { required: true })}
        />
        <FormField
          label="Reorder Level"
          type="number" min={0}
          {...register('reorderLevel')}
        />
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
      </div>
      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" /> Add to List
        </button>
      </div>
    </form>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MedicinesPage() {
  const [medicines, setMedicines]       = useState<Medicine[]>([]);
  const [categories, setCategories]     = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading]           = useState(true);
  const [searching, setSearching]       = useState(false);
  const [search, setSearch]             = useState('');
  const debounceRef                     = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Single add/edit modal
  const [modalOpen, setModalOpen]   = useState(false);
  const [editing, setEditing]       = useState<Medicine | null>(null);
  const [saving, setSaving]         = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Medicine | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Units modal
  const [unitsTarget, setUnitsTarget] = useState<Medicine | null>(null);

  // Bulk modal
  const [bulkOpen, setBulkOpen]         = useState(false);
  const [bulkRows, setBulkRows]         = useState<BulkRow[]>([]);
  const [showForm, setShowForm]         = useState(true);
  const [bulkSaving, setBulkSaving]     = useState(false);
  const [bulkResults, setBulkResults]   = useState<BulkCreateMedicineItemResult[] | null>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateMedicineDto>();

  // Load categories + manufacturers once, and all medicines initially
  const loadMeta = useCallback(async () => {
    const [cats, mfgs] = await Promise.all([
      categoryService.getAll(), manufacturerService.getAll(),
    ]);
    setCategories(cats); setManufacturers(mfgs);
  }, []);

  const loadAll = useCallback(async () => {
    const meds = await medicineService.getAll();
    setMedicines(meds);
  }, []);

  useEffect(() => {
    Promise.all([loadMeta(), loadAll()]).finally(() => setLoading(false));
  }, [loadMeta, loadAll]);

  // ── Debounced server-side search ──────────────────────────────────────────
  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = value.trim()
          ? await medicineService.search(value.trim())
          : await medicineService.getAll();
        setMedicines(results);
      } catch { /* silently retain last results */ }
      finally { setSearching(false); }
    }, 350);
  };

  const clearSearch = () => {
    setSearch('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    medicineService.getAll().then(setMedicines).catch(() => {});
  };

  // Reload (after create/edit/delete) and re-run search if active
  const reload = useCallback(async () => {
    const results = search.trim()
      ? await medicineService.search(search.trim())
      : await medicineService.getAll();
    setMedicines(results);
  }, [search]);

  // ── Single add/edit ───────────────────────────────────────────────────────

  const openCreate = () => {
    reset({ tabletsPerStrip: 1, reorderLevel: 10, isActive: true, requiresPrescription: false });
    setEditing(null); setModalOpen(true);
  };

  const openEdit = async (m: Medicine) => {
    setEditing(m); setModalOpen(true);
    try {
      const full = await medicineService.getById(m.medicineId);
      reset({
        name: full.name, genericName: full.genericName ?? undefined,
        categoryId: full.categoryId ?? undefined, manufacturerId: full.manufacturerId ?? undefined,
        tabletsPerStrip: full.tabletsPerStrip, strapsPerBox: full.strapsPerBox ?? 1,
        stripPrice: full.stripPrice,
        tabletPrice: full.tabletPrice, reorderLevel: full.reorderLevel,
        requiresPrescription: full.requiresPrescription, isActive: full.isActive,
      });
    } catch { toast.error('Failed to load medicine details'); setModalOpen(false); }
  };

  const onSubmit = async (data: CreateMedicineDto) => {
    setSaving(true);
    try {
      const payload = {
        ...data,
        categoryId: data.categoryId || null, manufacturerId: data.manufacturerId || null,
        tabletsPerStrip: Number(data.tabletsPerStrip),
        strapsPerBox: Number((data as any).strapsPerBox) || 1,
        stripPrice: Number(data.stripPrice),
        tabletPrice: Number(data.tabletPrice), reorderLevel: Number(data.reorderLevel),
      };
      if (editing) { await medicineService.update(editing.medicineId, payload); toast.success('Medicine updated'); }
      else         { await medicineService.create(payload); toast.success('Medicine created'); }
      setModalOpen(false); await reload();
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Something went wrong'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await medicineService.delete(deleteTarget.medicineId); toast.success('Medicine deleted'); setDeleteTarget(null); await reload(); }
    catch (e: any) { toast.error(e.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  // ── Bulk helpers ──────────────────────────────────────────────────────────

  const openBulk = () => { setBulkRows([]); setBulkResults(null); setShowForm(true); setBulkOpen(true); };
  const closeBulk = () => { setBulkOpen(false); setBulkResults(null); };

  const handleBulkAdd = (row: BulkRow) => {
    setBulkRows(prev => [...prev, row]);
    setShowForm(false); // collapse form after adding; user can re-open with button
  };

  const removeBulkRow = (id: string) => setBulkRows(prev => prev.filter(r => r._id !== id));

  const submitBulk = async () => {
    if (bulkRows.length === 0) { toast.error('Add at least one medicine'); return; }
    const payload = bulkRows.map(({ _id, ...rest }) => ({
      ...rest,
      categoryId: rest.categoryId || null, manufacturerId: rest.manufacturerId || null,
      tabletsPerStrip: Number(rest.tabletsPerStrip), stripPrice: Number(rest.stripPrice),
      tabletPrice: Number(rest.tabletPrice), reorderLevel: Number(rest.reorderLevel),
    }));
    setBulkSaving(true);
    try {
      const result = await medicineService.bulkCreate(payload);
      setBulkResults(result.results);
      if (result.totalCreated > 0) { toast.success(`${result.totalCreated} medicine(s) created`); await reload(); }
      if (result.totalFailed > 0)  { toast.error(`${result.totalFailed} row(s) failed`); }
    } catch (e: any) { toast.error(e.response?.data?.message ?? 'Bulk create failed'); }
    finally { setBulkSaving(false); }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  // Results are already filtered server-side; `medicines` is the live result set.

  if (loading) return <AppLayout title="Medicines"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Medicines">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder="Search by name, generic, category, manufacturer…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          {searching && (
            <LoadingSpinner className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-500" />
          )}
          {!searching && search && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">{medicines.length} medicines</span>
          <button onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
            <Plus className="h-4 w-4" /> Add Medicine
          </button>
          <button onClick={openBulk}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm">
            <ListPlus className="h-4 w-4" /> Add Multiple
          </button>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {medicines.length === 0 && (
          <div className="rounded-2xl border border-gray-100 bg-white py-12 text-center text-gray-400">
            <Pill className="mx-auto mb-2 h-8 w-8 text-gray-200" />No medicines found
          </div>
        )}
        {medicines.map(m => (
          <div key={m.medicineId} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{m.name}</p>
                <p className="text-xs text-gray-500">{m.genericName ?? '—'}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setUnitsTarget(m)} title="Manage units" className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600"><Settings className="h-4 w-4" /></button>
                <button onClick={() => openEdit(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-4 w-4" /></button>
                <button onClick={() => setDeleteTarget(m)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div><span className="font-medium text-gray-700">Category:</span> {m.categoryName ?? '—'}</div>
              <div>
                <span className="font-medium text-gray-700">Stock: </span>
                <span className={m.totalStockInTablets <= m.reorderLevel ? 'font-bold text-red-600' : ''}>
                  {m.totalStockInTablets.toLocaleString()} tabs
                </span>
              </div>
              <div><span className="font-medium text-gray-700">Strip:</span> Rs {Number(m.stripPrice).toFixed(2)}</div>
              <div><span className="font-medium text-gray-700">Tablet:</span> Rs {Number(m.tabletPrice).toFixed(2)}</div>
            </div>
            <div className="mt-2 flex gap-1.5">
              <Badge variant={m.isActive ? 'green' : 'gray'}>{m.isActive ? 'Active' : 'Inactive'}</Badge>
              {m.requiresPrescription && <Badge variant="purple">Rx</Badge>}
            </div>
          </div>
        ))}
      </div>

      {/* Medicines Table */}
      <div className="hidden sm:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Stock</th>
                <th className="px-6 py-3">Units</th>
                <th className="px-6 py-3">Strip / Tablet</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {medicines.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Pill className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                  No medicines found
                </td></tr>
              )}
              {medicines.map(m => (
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
                  <td className="px-6 py-3">
                    {(m.units?.length ?? 0) > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {m.units.filter(u => u.isActive).map(u => (
                          <span key={u.medicineUnitId}
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${u.isDefault ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600'}`}>
                            {u.uomName}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-red-400">No units</span>
                    )}
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
                      <button onClick={() => setUnitsTarget(m)} title="Manage units"
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"><Settings className="h-4 w-4" /></button>
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

      {/* Single Create/Edit Modal */}
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
          <FormField label="Strips per Box" type="number" min={1} {...register('strapsPerBox' as any)} />
          <FormField label="Strip Price (Rs) *" type="number" step="0.01" min={0} error={errors.stripPrice?.message} {...register('stripPrice', { required: true })} />
          <FormField label="Tablet Price (Rs) *" type="number" step="0.01" min={0} error={errors.tabletPrice?.message} {...register('tabletPrice', { required: true })} />
          <div className="col-span-2 flex gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded text-blue-600" {...register('isActive')} />Active</label>
            <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" className="h-4 w-4 rounded text-purple-600" {...register('requiresPrescription')} />Requires Prescription</label>
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

      <ConfirmDialog open={!!deleteTarget} title="Delete Medicine"
        message={`Delete "${deleteTarget?.name}"? This cannot be undone.`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />

      {/* ── Units Modal ─────────────────────────────────────────────────────── */}
      <Modal open={!!unitsTarget} onClose={() => setUnitsTarget(null)}
        title={`Units — ${unitsTarget?.name ?? ''}`} size="lg">
        {unitsTarget && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              Manage unit types for this medicine. The <span className="font-semibold text-yellow-600">★ Default</span> unit is shown first in the POS selector.
              The <span className="font-semibold text-indigo-600">Base</span> unit is how stock is physically counted.
            </p>
            <UnitsManager medicineId={unitsTarget.medicineId} />
            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button onClick={() => { setUnitsTarget(null); reload(); }}
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">
                Done
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Bulk Add Modal ──────────────────────────────────────────────────── */}
      <Modal open={bulkOpen} onClose={closeBulk} title="Add Multiple Medicines" size="lg">
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
                    : <XCircle    className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-500" />}
                  <div>
                    <p className="font-medium text-slate-800">{r.data?.name ?? bulkRows[i]?.name ?? `Row ${i + 1}`}</p>
                    <p className={`text-xs ${r.success ? 'text-emerald-700' : 'text-red-600'}`}>{r.message}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={closeBulk} className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Done</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Added medicines preview table */}
            {bulkRows.length > 0 && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Added — {bulkRows.length} medicine{bulkRows.length !== 1 ? 's' : ''}
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="px-4 py-2 text-left">#</th>
                      <th className="px-4 py-2 text-left">Name</th>
                      <th className="px-4 py-2 text-left">Generic</th>
                      <th className="px-4 py-2 text-left">Strip Rs</th>
                      <th className="px-4 py-2 text-left">Tab Rs</th>
                      <th className="px-4 py-2 text-left">Tabs/Strip</th>
                      <th className="px-4 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {bulkRows.map((row, idx) => (
                      <tr key={row._id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-slate-400">{idx + 1}</td>
                        <td className="px-4 py-2 font-medium text-slate-800">{row.name}</td>
                        <td className="px-4 py-2 text-slate-500">{row.genericName || '—'}</td>
                        <td className="px-4 py-2 text-slate-600">{Number(row.stripPrice).toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-600">{Number(row.tabletPrice).toFixed(2)}</td>
                        <td className="px-4 py-2 text-slate-600">{row.tabletsPerStrip}</td>
                        <td className="px-4 py-2">
                          <button onClick={() => removeBulkRow(row._id)} className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Toggle entry form */}
            {showForm ? (
              <div className="space-y-3">
                <BulkEntryForm
                  categories={categories}
                  manufacturers={manufacturers}
                  onAdd={handleBulkAdd}
                />
                {bulkRows.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600"
                  >
                    <ChevronUp className="h-3.5 w-3.5" /> Hide form
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add Another Medicine
              </button>
            )}

            {/* Submit */}
            {bulkRows.length > 0 && (
              <div className="flex justify-end gap-3 pt-1 border-t border-slate-100">
                <button onClick={closeBulk} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
                <button onClick={submitBulk} disabled={bulkSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                  {bulkSaving && <LoadingSpinner className="h-4 w-4 text-white" />}
                  Save {bulkRows.length} Medicine{bulkRows.length !== 1 ? 's' : ''}
                </button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
