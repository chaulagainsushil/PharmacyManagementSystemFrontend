'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Star, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { medicineUnitService } from '@/services/medicineUnitService';
import { uomService } from '@/services/uomService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { MedicineUnit, UnitOfMeasure } from '@/types';

interface Props {
  medicineId: number;
}

export function UnitsManager({ medicineId }: Props) {
  const [units, setUnits]     = useState<MedicineUnit[]>([]);
  const [uoms, setUoms]       = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  // Add form state
  const [addOpen, setAddOpen]             = useState(false);
  const [selUomId, setSelUomId]           = useState<number>(0);
  const [conversion, setConversion]       = useState<number>(1);
  const [unitPrice, setUnitPrice]         = useState<number>(0);
  const [isBase, setIsBase]               = useState(false);
  const [isDefault, setIsDefault]         = useState(false);

  // Edit price state
  const [editingPrice, setEditingPrice]   = useState<number | null>(null);
  const [newPrice, setNewPrice]           = useState<number>(0);

  const load = async () => {
    setLoading(true);
    try {
      const [u, allUoms] = await Promise.all([
        medicineUnitService.getByMedicine(medicineId),
        uomService.getAll(),
      ]);
      setUnits(u);
      setUoms(allUoms);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [medicineId]);

  // UoMs not yet attached to this medicine
  const availableUoms = uoms.filter(
    (u) => !units.some((mu) => mu.unitOfMeasureId === u.unitOfMeasureId)
  );

  const handleAdd = async () => {
    if (!selUomId) { toast.error('Select a unit of measure'); return; }
    if (isBase && conversion !== 1) { toast.error('Base unit must have conversion = 1'); return; }
    setSaving(true);
    try {
      await medicineUnitService.addUnit({
        medicineId,
        unitOfMeasureId: selUomId,
        conversionFactorToBase: isBase ? 1 : conversion,
        unitPrice,
        isBaseUnit: isBase,
        isDefault,
      });
      toast.success('Unit added');
      setAddOpen(false);
      setSelUomId(0); setConversion(1); setUnitPrice(0);
      setIsBase(false); setIsDefault(false);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to add unit');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (mu: MedicineUnit) => {
    if (mu.isDefault) return;
    try {
      await medicineUnitService.setDefault({ medicineId, medicineUnitId: mu.medicineUnitId });
      toast.success(`"${mu.uomName}" set as default`);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed');
    }
  };

  const handleSavePrice = async (mu: MedicineUnit) => {
    setSaving(true);
    try {
      await medicineUnitService.updatePrice(mu.medicineUnitId, { unitPrice: newPrice });
      toast.success('Price updated');
      setEditingPrice(null);
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (mu: MedicineUnit) => {
    if (mu.isBaseUnit) { toast.error('Cannot deactivate the base unit'); return; }
    try {
      await medicineUnitService.deactivate(mu.medicineUnitId);
      toast.success('Unit deactivated');
      await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed');
    }
  };

  if (loading) return <div className="flex justify-center py-6"><LoadingSpinner className="h-5 w-5 text-blue-500" /></div>;

  return (
    <div className="space-y-3">
      {/* Units table */}
      {units.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-4">No units attached yet.</p>
      ) : (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold uppercase text-gray-400">
                <th className="px-3 py-2 text-left">Unit</th>
                <th className="px-3 py-2 text-left">Factor</th>
                <th className="px-3 py-2 text-left">Price</th>
                <th className="px-3 py-2 text-left">Flags</th>
                <th className="px-3 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {units.map((mu) => (
                <tr key={mu.medicineUnitId} className={mu.isActive ? '' : 'opacity-40'}>
                  <td className="px-3 py-2 font-medium text-gray-800">
                    {mu.uomName}
                    <span className="ml-1 text-xs text-gray-400">({mu.uomSymbol})</span>
                  </td>
                  <td className="px-3 py-2 text-gray-600">×{mu.conversionFactorToBase}</td>
                  <td className="px-3 py-2">
                    {editingPrice === mu.medicineUnitId ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number" min={0} step="0.01"
                          value={newPrice}
                          onChange={(e) => setNewPrice(Number(e.target.value))}
                          className="w-20 rounded border border-blue-300 px-1 py-0.5 text-sm outline-none"
                          autoFocus
                        />
                        <button onClick={() => handleSavePrice(mu)} disabled={saving}
                          className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50">
                          {saving ? '…' : 'Save'}
                        </button>
                        <button onClick={() => setEditingPrice(null)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
                      </div>
                    ) : (
                      <span className="text-gray-700">
                        Rs {Number(mu.unitPrice).toFixed(2)}
                        <button
                          onClick={() => { setEditingPrice(mu.medicineUnitId); setNewPrice(mu.unitPrice); }}
                          className="ml-1.5 text-gray-300 hover:text-blue-500"
                          title="Edit price"
                        >
                          <Pencil className="inline h-3 w-3" />
                        </button>
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {mu.isBaseUnit && (
                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">Base</span>
                      )}
                      {mu.isDefault && (
                        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-700">★ Default</span>
                      )}
                      {!mu.isActive && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">Inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1">
                      {!mu.isDefault && mu.isActive && (
                        <button onClick={() => handleSetDefault(mu)}
                          title="Set as default POS unit"
                          className="rounded p-1 text-gray-300 hover:bg-yellow-50 hover:text-yellow-500 transition-colors">
                          <Star className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!mu.isBaseUnit && mu.isActive && (
                        <button onClick={() => handleDeactivate(mu)}
                          title="Deactivate unit"
                          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add unit form */}
      {addOpen ? (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 space-y-3">
          <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Attach New Unit</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="col-span-2">
              <label className="text-xs text-gray-600 mb-1 block">Unit of Measure *</label>
              <select
                value={selUomId}
                onChange={(e) => setSelUomId(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              >
                <option value={0}>— Select —</option>
                {availableUoms.map((u) => (
                  <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name} ({u.symbol})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Conversion to base *</label>
              <input type="number" min={0.000001} step="0.01" value={conversion}
                onChange={(e) => setConversion(Number(e.target.value))}
                disabled={isBase}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Unit Price (Rs) *</label>
              <input type="number" min={0} step="0.01" value={unitPrice}
                onChange={(e) => setUnitPrice(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-sm outline-none focus:border-blue-500"
              />
            </div>
            <div className="col-span-2 flex gap-4">
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={isBase} onChange={(e) => { setIsBase(e.target.checked); if (e.target.checked) setConversion(1); }}
                  className="h-4 w-4 rounded text-indigo-600" />
                Base unit
              </label>
              <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)}
                  className="h-4 w-4 rounded text-yellow-500" />
                Default (POS)
              </label>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setAddOpen(false)}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs hover:bg-gray-50">Cancel</button>
            <button onClick={handleAdd} disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving ? <LoadingSpinner className="h-3 w-3 text-white" /> : <Plus className="h-3 w-3" />}
              Add Unit
            </button>
          </div>
        </div>
      ) : (
        availableUoms.length > 0 && (
          <button onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
            <Plus className="h-3.5 w-3.5" /> Attach Unit
          </button>
        )
      )}
    </div>
  );
}
