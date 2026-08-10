'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, ToggleLeft, ToggleRight, Ruler } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { uomService } from '@/services/uomService';
import type { UnitOfMeasure } from '@/types';

// ── Form shape ────────────────────────────────────────────────────────────────

interface UomForm {
  name: string;
  symbol: string;
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function UnitsPage() {
  const [units, setUnits]     = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState<UnitOfMeasure | null>(null);
  const [form, setForm]           = useState<UomForm>({ name: '', symbol: '' });
  const [errors, setErrors]       = useState<Partial<UomForm>>({});

  const load = useCallback(async () => {
    try {
      const data = await uomService.getAll(true); // include inactive
      setUnits(data);
    } catch {
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Partial<UomForm> = {};
    if (!form.name.trim())   e.name   = 'Name is required';
    if (!form.symbol.trim()) e.symbol = 'Symbol is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Open modals ──────────────────────────────────────────────────────────

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', symbol: '' });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (u: UnitOfMeasure) => {
    setEditing(u);
    setForm({ name: u.name, symbol: u.symbol });
    setErrors({});
    setModalOpen(true);
  };

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      if (editing) {
        await uomService.update(editing.unitOfMeasureId, {
          name:      form.name.trim(),
          symbol:    form.symbol.trim(),
          isActive:  editing.isActive,
          updatedAt: editing.updatedAt,
        });
        toast.success('Unit updated');
      } else {
        await uomService.create({ name: form.name.trim(), symbol: form.symbol.trim(), isActive: true });
        toast.success('Unit created');
      }
      setModalOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save unit');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ────────────────────────────────────────────────────────

  const handleToggle = async (u: UnitOfMeasure) => {
    try {
      await uomService.toggleActive(u);
      toast.success(`Unit ${u.isActive ? 'deactivated' : 'activated'}`);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to update unit');
    }
  };

  const active   = units.filter(u => u.isActive);
  const inactive = units.filter(u => !u.isActive);

  if (loading) return <AppLayout title="Units of Measure"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Units of Measure">

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} active unit{active.length !== 1 ? 's' : ''}
            {inactive.length > 0 && ` · ${inactive.length} inactive`}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Unit
        </button>
      </div>

      {/* Empty state */}
      {units.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <Ruler className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-gray-400 font-medium">No units yet</p>
          <p className="text-sm text-gray-300 mt-1">Create units like Tablet, Strip, Box, Bottle…</p>
          <button
            onClick={openCreate}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create First Unit
          </button>
        </div>
      )}

      {/* Units grid */}
      {units.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {units.map(u => (
            <div
              key={u.unitOfMeasureId}
              className={`rounded-2xl border bg-white p-4 shadow-sm transition-all
                ${u.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}
            >
              {/* Symbol badge + name */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold
                    ${u.isActive ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-400'}`}>
                    {u.symbol}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{u.name}</p>
                    <Badge variant={u.isActive ? 'blue' : 'gray'} className="mt-0.5">
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-50 pt-3">
                <button
                  onClick={() => openEdit(u)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-gray-200 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleToggle(u)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-medium transition-colors
                    ${u.isActive
                      ? 'border border-red-200 text-red-500 hover:bg-red-50'
                      : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
                >
                  {u.isActive
                    ? <><ToggleLeft  className="h-3.5 w-3.5" /> Deactivate</>
                    : <><ToggleRight className="h-3.5 w-3.5" /> Activate</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create / Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Unit' : 'New Unit of Measure'}
        size="sm"
      >
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Unit Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Tablet, Strip, Box, Bottle"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Symbol */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Symbol <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. tab, strip, box, btl"
              value={form.symbol}
              onChange={e => setForm(f => ({ ...f, symbol: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {errors.symbol && <p className="text-xs text-red-500">{errors.symbol}</p>}
            <p className="text-xs text-gray-400">Short abbreviation shown in POS and reports</p>
          </div>

          {/* Preview */}
          {(form.name || form.symbol) && (
            <div className="rounded-xl bg-indigo-50 px-4 py-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700">
                {form.symbol || '?'}
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-900">{form.name || 'Unit Name'}</p>
                <p className="text-xs text-indigo-500">Preview</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              {editing ? 'Save Changes' : 'Create Unit'}
            </button>
          </div>
        </div>
      </Modal>

    </AppLayout>
  );
}
