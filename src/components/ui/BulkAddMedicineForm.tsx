'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus, X } from 'lucide-react';
import { medicineService } from '@/services/medicineService';
import { uomService } from '@/services/uomService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import { LoadingSpinner } from './LoadingSpinner';
import type {
  UnitOfMeasure, Category, Manufacturer, CreateMedicineDto, CreateMedicineUnitDto,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkMedicineRow {
  id: string;
  name: string;
  genericName: string;
  manufacturerId: string;
  categoryId: string;
  reorderLevel: string;
  unit1UomId: string;
  unit1Quantity: string;
  unit1PiecesPerUnit: string;
  unit1Mrp: string;
  unit1SellPrice: string;
  unit1PurchasePrice: string;
  unit2Enabled: boolean;
  unit2UomId: string;
  unit2Mrp: string;
  unit2SellPrice: string;
  unit2PurchasePrice: string;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function BulkAddMedicineForm({ onSuccess, onCancel }: Props) {
  // Lookups
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Rows
  const [rows, setRows] = useState<BulkMedicineRow[]>([
    {
      id: '1',
      name: '',
      genericName: '',
      manufacturerId: '',
      categoryId: '',
      reorderLevel: '20',
      unit1UomId: '',
      unit1Quantity: '',
      unit1PiecesPerUnit: '',
      unit1Mrp: '',
      unit1SellPrice: '',
      unit1PurchasePrice: '',
      unit2Enabled: false,
      unit2UomId: '',
      unit2Mrp: '',
      unit2SellPrice: '',
      unit2PurchasePrice: '',
    },
  ]);

  // ── Load lookups ────────────────────────────────────────────────────────────

  useEffect(() => {
    const load = async () => {
      try {
        const [u, c, m] = await Promise.all([
          uomService.getAll(),
          categoryService.getAll(),
          manufacturerService.getAll(),
        ]);
        setUoms(u);
        setCategories(c);
        setManufacturers(m);
      } catch {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const updateRow = (id: string, field: keyof BulkMedicineRow, value: any) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRow = () => {
    const newRow: BulkMedicineRow = {
      id: Date.now().toString(),
      name: '',
      genericName: '',
      manufacturerId: '',
      categoryId: '',
      reorderLevel: '20',
      unit1UomId: '',
      unit1Quantity: '',
      unit1PiecesPerUnit: '',
      unit1Mrp: '',
      unit1SellPrice: '',
      unit1PurchasePrice: '',
      unit2Enabled: false,
      unit2UomId: '',
      unit2Mrp: '',
      unit2SellPrice: '',
      unit2PurchasePrice: '',
    };
    setRows(prev => [...prev, newRow]);
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('You must have at least one row');
      return;
    }
    setRows(prev => prev.filter(r => r.id !== id));
  };

  // ── Validation & Submit ─────────────────────────────────────────────────────

  const validateRow = (row: BulkMedicineRow): string | null => {
    if (!row.name.trim()) return `Row ${row.id}: Medicine name is required`;
    if (!row.unit1UomId) return `Row ${row.id}: Unit 1 type is required`;
    if (!row.unit1Quantity || parseFloat(row.unit1Quantity) <= 0) return `Row ${row.id}: Unit 1 quantity must be > 0`;
    if (!row.unit1PiecesPerUnit || parseFloat(row.unit1PiecesPerUnit) <= 0) return `Row ${row.id}: Conversion factor must be > 0`;
    if (row.unit2Enabled && !row.unit2UomId) return `Row ${row.id}: Unit 2 type is required if enabled`;
    if (row.unit2Enabled && row.unit2UomId === row.unit1UomId) return `Row ${row.id}: Unit 2 must be different from Unit 1`;
    return null;
  };

  const handleSubmit = async () => {
    // Validate all rows
    for (const row of rows) {
      const err = validateRow(row);
      if (err) {
        toast.error(err);
        return;
      }
    }

    setSubmitting(true);
    try {
      const dtos: CreateMedicineDto[] = rows.map(row => {
        const units: CreateMedicineUnitDto[] = [];
        const totalPieces = parseFloat(row.unit1Quantity) * parseFloat(row.unit1PiecesPerUnit);

        // Unit 2 (base unit if enabled)
        if (row.unit2Enabled && row.unit2UomId) {
          units.push({
            unitOfMeasureId: parseInt(row.unit2UomId),
            conversionFactorToBase: 1,
            costPrice: parseFloat(row.unit2SellPrice) || 0,
            unitPrice: parseFloat(row.unit2SellPrice) || 0,
            mrp: parseFloat(row.unit2Mrp) || 0,
            isBaseUnit: true,
            isDefault: false,
            canPurchase: false,
            canSell: true,
          });
        }

        // Unit 1 (packaging unit)
        units.push({
          unitOfMeasureId: parseInt(row.unit1UomId),
          conversionFactorToBase: row.unit2Enabled ? parseFloat(row.unit1PiecesPerUnit) : 1,
          costPrice: parseFloat(row.unit1PurchasePrice) || 0,
          unitPrice: parseFloat(row.unit1SellPrice) || 0,
          mrp: parseFloat(row.unit1Mrp) || 0,
          isBaseUnit: !row.unit2Enabled,
          isDefault: true,
          canPurchase: true,
          canSell: true,
        });

        return {
          name: row.name.trim(),
          genericName: row.genericName.trim() || undefined,
          categoryId: row.categoryId ? parseInt(row.categoryId) : undefined,
          manufacturerId: row.manufacturerId ? parseInt(row.manufacturerId) : undefined,
          reorderLevel: parseInt(row.reorderLevel) || 20,
          requiresPrescription: false,
          isActive: true,
          units,
        };
      });

      const result = await medicineService.bulkCreate(dtos);
      
      const successful = result.results.filter(r => r.success).length;
      const failed = result.results.filter(r => !r.success).length;

      if (failed > 0) {
        toast.error(`${successful} medicines added, ${failed} failed`);
        result.results.forEach((r, idx) => {
          if (!r.success) {
            console.error(`Row ${idx + 1}: ${r.message}`);
          }
        });
      } else {
        toast.success(`All ${successful} medicines added successfully!`);
      }

      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save medicines');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner className="h-6 w-6 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-bold text-gray-900">Bulk Add Medicines</h2>
          <button
            type="button"
            onClick={addRow}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Row
          </button>
        </div>
        <p className="text-sm text-gray-600">
          Add multiple medicines at once with dual units support. Configure pricing and conversion rates for each medicine.
        </p>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-40">Medicine Name *</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Generic</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Category</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-32">Manufacturer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600 w-24">Unit 1</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-20">Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-20">Conv</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 w-20">MRP</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 w-20">Sell</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600 w-20">Cost</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-16">Unit 2</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const availableUnit2Uoms = uoms.filter(u => u.isActive && u.unitOfMeasureId.toString() !== row.unit1UomId);
                const unit1Uom = uoms.find(u => u.unitOfMeasureId.toString() === row.unit1UomId);
                const unit2Uom = uoms.find(u => u.unitOfMeasureId.toString() === row.unit2UomId);
                const totalPieces = (parseFloat(row.unit1Quantity) || 0) * (parseFloat(row.unit1PiecesPerUnit) || 0);

                return (
                  <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
                    {/* Medicine Name */}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Paracetamol 500mg"
                        value={row.name}
                        onChange={e => updateRow(row.id, 'name', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Generic Name */}
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        placeholder="Paracetamol"
                        value={row.genericName}
                        onChange={e => updateRow(row.id, 'genericName', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Category */}
                    <td className="px-4 py-2">
                      <select
                        value={row.categoryId}
                        onChange={e => updateRow(row.id, 'categoryId', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="">None</option>
                        {categories.map(c => (
                          <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
                        ))}
                      </select>
                    </td>

                    {/* Manufacturer */}
                    <td className="px-4 py-2">
                      <select
                        value={row.manufacturerId}
                        onChange={e => updateRow(row.id, 'manufacturerId', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="">None</option>
                        {manufacturers.map(m => (
                          <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Unit 1 UoM */}
                    <td className="px-4 py-2">
                      <select
                        value={row.unit1UomId}
                        onChange={e => updateRow(row.id, 'unit1UomId', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="">Select</option>
                        {uoms.filter(u => u.isActive).map(u => (
                          <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
                        ))}
                      </select>
                    </td>

                    {/* Quantity */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="10"
                        value={row.unit1Quantity}
                        onChange={e => updateRow(row.id, 'unit1Quantity', e.target.value)}
                        className="w-full text-center rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Conversion */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="20"
                        value={row.unit1PiecesPerUnit}
                        onChange={e => updateRow(row.id, 'unit1PiecesPerUnit', e.target.value)}
                        className="w-full text-center rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* MRP */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="500"
                        value={row.unit1Mrp}
                        onChange={e => updateRow(row.id, 'unit1Mrp', e.target.value)}
                        className="w-full text-right rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Sell Price */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="450"
                        value={row.unit1SellPrice}
                        onChange={e => updateRow(row.id, 'unit1SellPrice', e.target.value)}
                        className="w-full text-right rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Cost Price */}
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="400"
                        value={row.unit1PurchasePrice}
                        onChange={e => updateRow(row.id, 'unit1PurchasePrice', e.target.value)}
                        className="w-full text-right rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                    </td>

                    {/* Unit 2 Toggle */}
                    <td className="px-4 py-2 text-center">
                      <label className="flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={row.unit2Enabled}
                          onChange={e => updateRow(row.id, 'unit2Enabled', e.target.checked)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600"
                        />
                      </label>
                    </td>

                    {/* Delete */}
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="inline-flex items-center justify-center rounded-lg p-1 hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Unit 2 Details (if any row has Unit 2 enabled) */}
      {rows.some(r => r.unit2Enabled) && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Unit 2 Configuration</h3>
          <div className="space-y-3">
            {rows.map((row, idx) => (
              row.unit2Enabled && (
                <div key={row.id} className="rounded-lg border border-gray-200 p-3 bg-gray-50">
                  <div className="mb-3 font-medium text-xs text-gray-600">
                    Row {idx + 1}: {row.name || 'Unnamed'} → Unit 2
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {/* Unit 2 UoM */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Unit Type</label>
                      <select
                        value={row.unit2UomId}
                        onChange={e => updateRow(row.id, 'unit2UomId', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      >
                        <option value="">Select</option>
                        {uoms.filter(u => u.isActive && u.unitOfMeasureId.toString() !== row.unit1UomId).map(u => (
                          <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Unit 2 MRP */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">MRP (auto or manual)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={row.unit2Mrp}
                        onChange={e => updateRow(row.id, 'unit2Mrp', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                      {!row.unit2Mrp && parseFloat(row.unit1Mrp) > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Auto: Rs. {(parseFloat(row.unit1Mrp) / (parseFloat(row.unit1Quantity) * parseFloat(row.unit1PiecesPerUnit) || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Unit 2 Sell Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Sell Price (auto or manual)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={row.unit2SellPrice}
                        onChange={e => updateRow(row.id, 'unit2SellPrice', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                      {!row.unit2SellPrice && parseFloat(row.unit1SellPrice) > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Auto: Rs. {(parseFloat(row.unit1SellPrice) / (parseFloat(row.unit1Quantity) * parseFloat(row.unit1PiecesPerUnit) || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>

                    {/* Unit 2 Cost Price */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cost Price (auto or manual)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Auto-calculated"
                        value={row.unit2PurchasePrice}
                        onChange={e => updateRow(row.id, 'unit2PurchasePrice', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                      />
                      {!row.unit2PurchasePrice && parseFloat(row.unit1PurchasePrice) > 0 && (
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Auto: Rs. {(parseFloat(row.unit1PurchasePrice) / (parseFloat(row.unit1Quantity) * parseFloat(row.unit1PiecesPerUnit) || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {rows.length} medicine(s) ready to add
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-6 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
            Add {rows.length} Medicine{rows.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
