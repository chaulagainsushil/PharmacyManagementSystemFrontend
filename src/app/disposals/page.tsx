'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Trash2, Plus, Search, FlaskConical, CheckCircle, X, ChevronDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { LoadingSpinner, PageLoader } from '@/components/ui/LoadingSpinner';
import { batchService } from '@/services/batchService';
import { medicineService } from '@/services/medicineService';
import { disposalService } from '@/services/disposalService';
import { useAuth } from '@/context/AuthContext';
import type {
  MedicineBatch, Medicine, DisposalResponse, CreateDisposalItemDto,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DisposalRow {
  _id: string;
  medicineId: number;
  batchId: number;
  quantityInTablets: number;
  reason: string;
}

function newRow(): DisposalRow {
  return {
    _id: Math.random().toString(36).slice(2),
    medicineId: 0,
    batchId: 0,
    quantityInTablets: 1,
    reason: '',
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DisposalsPage() {
  const { user } = useAuth();

  const [disposals, setDisposals] = useState<DisposalResponse[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [allBatches, setAllBatches] = useState<MedicineBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // New disposal modal
  const [modalOpen, setModalOpen] = useState(false);
  const [rows, setRows] = useState<DisposalRow[]>([newRow()]);
  const [submitting, setSubmitting] = useState(false);

  // View detail modal
  const [viewItem, setViewItem] = useState<DisposalResponse | null>(null);

  const load = useCallback(async () => {
    const [disp, meds, bats] = await Promise.all([
      disposalService.getAll(),
      medicineService.getAll(),
      batchService.getAll(),
    ]);
    setDisposals(disp);
    setMedicines(meds.filter(m => m.isActive));
    setAllBatches(bats);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  // ── Row helpers ───────────────────────────────────────────────────────────

  const addRow = () => setRows(prev => [...prev, newRow()]);

  const updateRow = (id: string, patch: Partial<DisposalRow>) =>
    setRows(prev => prev.map(r => r._id === id ? { ...r, ...patch } : r));

  const removeRow = (id: string) =>
    setRows(prev => prev.length === 1 ? [newRow()] : prev.filter(r => r._id !== id));

  // Batches available for a given medicine (non-expired only for filter; all for disposal)
  const batchesForMedicine = (medicineId: number) =>
    allBatches.filter(b => b.medicineId === medicineId && b.quantityInTablets > 0);

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!user?.userId) { toast.error('Cannot identify pharmacist.'); return; }

    const validRows = rows.filter(r => r.medicineId !== 0 && r.batchId !== 0);
    if (validRows.length === 0) { toast.error('Add at least one item.'); return; }

    const missing = validRows.find(r => !r.reason.trim());
    if (missing) { toast.error('Reason is required for every item.'); return; }

    const items: CreateDisposalItemDto[] = validRows.map(r => ({
      medicineId: r.medicineId,
      batchId: r.batchId,
      quantityInTablets: r.quantityInTablets,
      reason: r.reason.trim(),
    }));

    setSubmitting(true);
    try {
      await disposalService.create({ pharmacistId: user.userId, items });
      toast.success('Disposal recorded successfully.');
      setModalOpen(false);
      setRows([newRow()]);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to record disposal.');
    } finally { setSubmitting(false); }
  };

  const openModal = () => { setRows([newRow()]); setModalOpen(true); };

  // ── Filter ────────────────────────────────────────────────────────────────

  const filtered = disposals.filter(d =>
    d.disposalNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.pharmacistName.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <AppLayout title="Medicine Disposal"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Medicine Disposal">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search disposals…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> Record Disposal
        </button>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Disposal No.</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Pharmacist</th>
                <th className="px-6 py-3">Items</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                    <FlaskConical className="mx-auto mb-2 h-8 w-8 text-gray-200" />
                    No disposal records found
                  </td>
                </tr>
              )}
              {filtered.map(d => (
                <tr key={d.disposalId} className="hover:bg-red-50 transition-colors">
                  <td className="px-6 py-3">
                    <span className="font-mono font-semibold text-red-700">{d.disposalNumber}</span>
                  </td>
                  <td className="px-6 py-3 text-gray-600">
                    {format(new Date(d.disposalDate), 'dd MMM yyyy, hh:mm a')}
                  </td>
                  <td className="px-6 py-3 text-gray-700">{d.pharmacistName}</td>
                  <td className="px-6 py-3">
                    <Badge variant="red">{d.items.length} item{d.items.length !== 1 ? 's' : ''}</Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button
                      onClick={() => setViewItem(d)}
                      className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Disposal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Record Medicine Disposal" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Enter each expired/damaged medicine batch below. A <span className="font-semibold text-red-600">reason is mandatory</span> for every item.
          </p>

          {/* Row entries */}
          <div className="space-y-3">
            {rows.map((row, idx) => {
              const medicineOptions = medicines;
              const batchOptions = row.medicineId ? batchesForMedicine(row.medicineId) : [];
              const selectedBatch = allBatches.find(b => b.batchId === row.batchId);

              return (
                <div key={row._id} className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Item #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeRow(row._id)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Medicine */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Medicine *</label>
                      <select
                        value={row.medicineId || ''}
                        onChange={e => updateRow(row._id, {
                          medicineId: Number(e.target.value),
                          batchId: 0,
                        })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      >
                        <option value="">— Select medicine —</option>
                        {medicineOptions.map(m => (
                          <option key={m.medicineId} value={m.medicineId}>{m.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Batch */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Batch *</label>
                      <select
                        value={row.batchId || ''}
                        onChange={e => updateRow(row._id, { batchId: Number(e.target.value) })}
                        disabled={!row.medicineId}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 disabled:bg-gray-100 disabled:text-gray-400"
                      >
                        <option value="">— Select batch —</option>
                        {batchOptions.map(b => (
                          <option key={b.batchId} value={b.batchId}>
                            {b.batchNumber} ({b.quantityInTablets} tabs, exp {format(new Date(b.expiryDate), 'MMM yyyy')})
                          </option>
                        ))}
                      </select>
                      {selectedBatch && (
                        <p className="mt-0.5 text-xs text-gray-400">
                          Available: {selectedBatch.quantityInTablets.toLocaleString()} tablets
                        </p>
                      )}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">Quantity (tablets) *</label>
                      <input
                        type="number"
                        min={1}
                        max={selectedBatch?.quantityInTablets}
                        value={row.quantityInTablets}
                        onChange={e => updateRow(row._id, { quantityInTablets: Math.max(1, Number(e.target.value)) })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>

                    {/* Reason */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Expired, Damaged, Recall…"
                        value={row.reason}
                        onChange={e => updateRow(row._id, { reason: e.target.value })}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add row */}
          <button
            type="button"
            onClick={addRow}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-500 hover:border-red-400 hover:text-red-600 transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Another Item
          </button>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
              Record Disposal
            </button>
          </div>
        </div>
      </Modal>

      {/* View Detail Modal */}
      <Modal
        open={!!viewItem}
        onClose={() => setViewItem(null)}
        title={`Disposal: ${viewItem?.disposalNumber ?? ''}`}
        size="lg"
      >
        {viewItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Date', value: format(new Date(viewItem.disposalDate), 'dd MMM yyyy, hh:mm a') },
                { label: 'Pharmacist', value: viewItem.pharmacistName },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                    <th className="px-4 py-2">Medicine</th>
                    <th className="px-4 py-2">Batch</th>
                    <th className="px-4 py-2">Qty (tabs)</th>
                    <th className="px-4 py-2">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {viewItem.items.map(item => (
                    <tr key={item.disposalItemId}>
                      <td className="px-4 py-2.5 font-medium text-gray-900">{item.medicineName}</td>
                      <td className="px-4 py-2.5 text-gray-500 font-mono text-xs">{item.batchNumber}</td>
                      <td className="px-4 py-2.5 text-gray-700">{item.quantityInTablets.toLocaleString()}</td>
                      <td className="px-4 py-2.5 text-gray-600">{item.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setViewItem(null)}
                className="rounded-lg bg-gray-100 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  );
}
