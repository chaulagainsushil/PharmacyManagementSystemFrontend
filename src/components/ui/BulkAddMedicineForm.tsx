'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Trash2, Plus } from 'lucide-react';
import { medicineService } from '@/services/medicineService';
import { uomService } from '@/services/uomService';
import { categoryService } from '@/services/categoryService';
import { manufacturerService } from '@/services/manufacturerService';
import { LoadingSpinner } from './LoadingSpinner';
import type {
  UnitOfMeasure, Category, Manufacturer, CreateMedicineDto, CreateMedicineUnitDto,
} from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BulkMedicineRow extends CreateMedicineDto {
  _id: string;
}

interface Unit1State {
  uomId: string;
  quantity: string;
  piecesPerUnit: string;
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
}

interface Unit2State {
  uomId: string;
  primaryStockQty: string;
  mrp: string;
  sellPrice: string;
  purchasePrice: string;
  mrpManual: boolean;
  sellManual: boolean;
  purchaseManual: boolean;
}

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

// ── Single Medicine Form Component ────────────────────────────────────────────

function SingleMedicineAddForm({
  onAdd,
  onCancel,
  uoms,
  categories,
  manufacturers,
}: {
  onAdd: (dto: CreateMedicineDto) => void;
  onCancel: () => void;
  uoms: UnitOfMeasure[];
  categories: Category[];
  manufacturers: Manufacturer[];
}) {
  const [medicineName, setMedicineName] = useState('');
  const [genericName, setGenericName] = useState('');
  const [manufacturerId, setManufacturerId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [reorderLevel, setReorderLevel] = useState('20');
  const [submitting, setSubmitting] = useState(false);

  // Unit 1 (Base Unit / Strip)
  const [unit1, setUnit1] = useState<Unit1State>({
    uomId: '',
    quantity: '',
    piecesPerUnit: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
  });

  // Unit 2 (Sub Unit / Tablet)
  const [unit2, setUnit2] = useState<Unit2State>({
    uomId: '',
    primaryStockQty: '',
    mrp: '',
    sellPrice: '',
    purchasePrice: '',
    mrpManual: false,
    sellManual: false,
    purchaseManual: false,
  });

  const [showUnit2, setShowUnit2] = useState(true);

  // Auto-calculations
  const totalPieces = (() => {
    const qty = parseFloat(unit1.quantity) || 0;
    const pieces = parseFloat(unit1.piecesPerUnit) || 0;
    return qty * pieces;
  })();

  const unit2AutoQty = totalPieces > 0 ? String(totalPieces) : '';

  useEffect(() => {
    setUnit2(prev => ({ ...prev, primaryStockQty: unit2AutoQty }));
  }, [unit2AutoQty]);

  useEffect(() => {
    if (totalPieces <= 0) return;

    setUnit2(prev => ({
      ...prev,
      mrp: prev.mrpManual ? prev.mrp : (parseFloat(unit1.mrp) / totalPieces).toFixed(2),
      sellPrice: prev.sellManual ? prev.sellPrice : (parseFloat(unit1.sellPrice) / totalPieces).toFixed(2),
      purchasePrice: prev.purchaseManual ? prev.purchasePrice : (parseFloat(unit1.purchasePrice) / totalPieces).toFixed(2),
    }));
  }, [unit1.mrp, unit1.sellPrice, unit1.purchasePrice, totalPieces]);

  // Helpers
  const u1 = (field: keyof Unit1State, value: string) =>
    setUnit1(prev => ({ ...prev, [field]: value }));

  const u2 = (field: keyof Unit2State, value: string | boolean) =>
    setUnit2(prev => ({ ...prev, [field]: value }));

  const unit1UomName = uoms.find(u => u.unitOfMeasureId.toString() === unit1.uomId)?.name ?? 'Unit 1';
  const unit2UomName = uoms.find(u => u.unitOfMeasureId.toString() === unit2.uomId)?.name ?? 'Unit 2';
  const availableUnit2Uoms = uoms.filter(u => u.isActive && u.unitOfMeasureId.toString() !== unit1.uomId);

  // Validation
  const validate = (): string | null => {
    if (!medicineName.trim()) return 'Medicine name is required';
    if (!unit1.uomId) return 'Select a base unit type';
    if (!unit1.quantity || parseFloat(unit1.quantity) <= 0) return 'Unit 1 quantity must be > 0';
    if (!unit1.piecesPerUnit || parseFloat(unit1.piecesPerUnit) <= 0) return 'Conversion factor must be > 0';
    if (showUnit2) {
      if (!unit2.uomId) return 'Select Unit 2 type';
      if (unit2.uomId === unit1.uomId) return 'Unit 2 must be different from Unit 1';
    }
    return null;
  };

  // Submit
  const handleSubmit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }

    setSubmitting(true);
    try {
      const units: CreateMedicineUnitDto[] = [];

      if (showUnit2 && unit2.uomId) {
        units.push({
          unitOfMeasureId: parseInt(unit2.uomId),
          conversionFactorToBase: 1,
          costPrice: parseFloat(unit2.purchasePrice) || 0,
          unitPrice: parseFloat(unit2.sellPrice) || 0,
          mrp: parseFloat(unit2.mrp) || 0,
          isBaseUnit: true,
          isDefault: false,
          canPurchase: false,
          canSell: true,
        });
      }

      units.push({
        unitOfMeasureId: parseInt(unit1.uomId),
        conversionFactorToBase: showUnit2 ? (parseFloat(unit1.piecesPerUnit) || 1) : 1,
        costPrice: parseFloat(unit1.purchasePrice) || 0,
        unitPrice: parseFloat(unit1.sellPrice) || 0,
        mrp: parseFloat(unit1.mrp) || 0,
        isBaseUnit: !showUnit2,
        isDefault: true,
        canPurchase: true,
        canSell: true,
      });

      const dto: CreateMedicineDto = {
        name: medicineName.trim(),
        genericName: genericName.trim() || undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        manufacturerId: manufacturerId ? parseInt(manufacturerId) : undefined,
        reorderLevel: parseInt(reorderLevel) || 20,
        requiresPrescription: false,
        isActive: true,
        units,
      };

      onAdd(dto);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
      {/* Medicine Name, Generic, Category, Manufacturer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Medicine Name *</label>
          <input
            type="text"
            placeholder="e.g. Paracetamol 500mg"
            value={medicineName}
            onChange={e => setMedicineName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Generic Name</label>
          <input
            type="text"
            placeholder="e.g. Paracetamol"
            value={genericName}
            onChange={e => setGenericName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={e => setCategoryId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          >
            <option value="">None</option>
            {categories.map(c => (
              <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Manufacturer</label>
          <select
            value={manufacturerId}
            onChange={e => setManufacturerId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm appearance-none outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
          >
            <option value="">None</option>
            {manufacturers.map(m => (
              <option key={m.manufacturerId} value={m.manufacturerId}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Unit 1 Configuration */}
      <div className="rounded-lg border border-blue-300 bg-blue-50 p-3">
        <h4 className="text-xs font-semibold text-blue-900 mb-2">Unit 1 - Packaging Unit</h4>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Unit Type *</label>
            <select
              value={unit1.uomId}
              onChange={e => u1('uomId', e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs appearance-none outline-none focus:border-blue-400"
            >
              <option value="">Select</option>
              {uoms.filter(u => u.isActive).map(u => (
                <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Quantity *</label>
            <input
              type="number"
              min="1"
              placeholder="10"
              value={unit1.quantity}
              onChange={e => u1('quantity', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Conversion *</label>
            <input
              type="number"
              min="1"
              placeholder="20"
              value={unit1.piecesPerUnit}
              onChange={e => u1('piecesPerUnit', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">MRP</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={unit1.mrp}
              onChange={e => u1('mrp', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Sell Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="450"
              value={unit1.sellPrice}
              onChange={e => u1('sellPrice', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-0.5">Cost Price</label>
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="400"
              value={unit1.purchasePrice}
              onChange={e => u1('purchasePrice', e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
            />
          </div>
        </div>
      </div>

      {/* Unit 2 Toggle & Configuration */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showUnit2}
            onChange={e => setShowUnit2(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600"
          />
          <span className="text-xs font-medium text-gray-700">Add Unit 2 (Atomic/Tablet)</span>
        </label>
      </div>

      {showUnit2 && (
        <div className="rounded-lg border border-gray-300 bg-gray-50 p-3">
          <h4 className="text-xs font-semibold text-gray-900 mb-2">Unit 2 - Atomic Unit (Auto-calculated)</h4>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Unit Type *</label>
              <select
                value={unit2.uomId}
                onChange={e => u2('uomId', e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs appearance-none outline-none focus:border-blue-400"
              >
                <option value="">Select</option>
                {availableUnit2Uoms.map(u => (
                  <option key={u.unitOfMeasureId} value={u.unitOfMeasureId}>{u.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Qty (Auto)</label>
              <input
                type="number"
                value={unit2.primaryStockQty}
                disabled
                placeholder="100"
                className="w-full rounded-lg border border-gray-200 bg-gray-100 px-2 py-1.5 text-xs outline-none"
              />
            </div>
            <div></div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">MRP</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto"
                value={unit2.mrp}
                onChange={e => { u2('mrp', e.target.value); u2('mrpManual', true); }}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Sell Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto"
                value={unit2.sellPrice}
                onChange={e => { u2('sellPrice', e.target.value); u2('sellManual', true); }}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-0.5">Cost Price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Auto"
                value={unit2.purchasePrice}
                onChange={e => { u2('purchasePrice', e.target.value); u2('purchaseManual', true); }}
                className="w-full rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Reorder Level */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Minimum/Reorder Level</label>
        <input
          type="number"
          min="0"
          value={reorderLevel}
          onChange={e => setReorderLevel(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {submitting && <LoadingSpinner className="h-3.5 w-3.5 text-white" />}
          Add to List
        </button>
      </div>
    </div>
  );
}

// ── Main Bulk Add Component ───────────────────────────────────────────────────

export function BulkAddMedicineForm({ onSuccess, onCancel }: Props) {
  // Collected medicines
  const [medicines, setMedicines] = useState<BulkMedicineRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Lookups
  const [uoms, setUoms] = useState<UnitOfMeasure[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);

  // Load lookups
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

  // Handlers
  const handleAddMedicine = (medicineDto: CreateMedicineDto) => {
    const newMedicine: BulkMedicineRow = {
      ...medicineDto,
      _id: Date.now().toString(),
    };
    setMedicines(prev => [...prev, newMedicine]);
    toast.success(`"${medicineDto.name}" added to bulk list`);
    setShowAddForm(false);
  };

  const handleRemoveMedicine = (id: string) => {
    const medicine = medicines.find(m => m._id === id);
    setMedicines(prev => prev.filter(m => m._id !== id));
    if (medicine) {
      toast.success(`"${medicine.name}" removed`);
    }
  };

  const handleSubmit = async () => {
    if (medicines.length === 0) {
      toast.error('Please add at least one medicine');
      return;
    }

    setSubmitting(true);
    try {
      const dtos = medicines.map(({ _id, ...dto }) => dto);
      const result = await medicineService.bulkCreate(dtos);

      const successful = result.results.filter(r => r.success).length;
      const failed = result.results.filter(r => !r.success).length;

      if (failed > 0) {
        toast.error(`${successful} medicines added, ${failed} failed`);
      } else {
        toast.success(`All ${successful} medicines created successfully!`);
      }

      onSuccess();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to save medicines');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner className="h-6 w-6 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Bulk Add Medicines</h2>
            <p className="text-sm text-gray-600 mt-1">
              Add multiple medicines using the single medicine form. Each medicine supports dual units.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
          >
            <Plus className="h-5 w-5" />
            Add Medicine
          </button>
        </div>
      </div>

      {/* Medicines List */}
      {medicines.length > 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {medicines.length} Medicine{medicines.length !== 1 ? 's' : ''} Ready to Create
              </h3>
              <p className="text-xs text-gray-500 mt-1">Review the list before submission</p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add More
            </button>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {medicines.map((medicine, idx) => (
              <div
                key={medicine._id}
                className="p-5 hover:bg-gray-50 transition-colors flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">
                      #{idx + 1}
                    </span>
                    <h4 className="text-sm font-bold text-gray-900 truncate">{medicine.name}</h4>
                  </div>
                  {medicine.genericName && (
                    <p className="text-xs text-gray-600 mb-2">Generic: {medicine.genericName}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    {medicine.units?.length || 0} unit{(medicine.units?.length || 0) !== 1 ? 's' : ''} configured
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveMedicine(medicine._id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors flex-shrink-0"
                  title="Remove"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 mb-4">
            <Plus className="h-8 w-8 text-gray-600" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">No medicines added yet</h3>
          <p className="text-sm text-gray-600 mb-6">
            Click "Add Medicine" to start adding medicines to your bulk list
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Your First Medicine
          </button>
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="text-sm text-gray-700">
          {medicines.length > 0 ? (
            <span className="font-semibold">
              ✓ {medicines.length} medicine{medicines.length !== 1 ? 's' : ''} ready to create
            </span>
          ) : (
            <span className="text-gray-600">Add medicines to proceed</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || medicines.length === 0}
            className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md hover:shadow-lg"
          >
            {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
            Create {medicines.length} Medicine{medicines.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      {/* Add Medicine Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <h2 className="text-lg font-bold">Add New Medicine</h2>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex items-center justify-center rounded-lg p-1.5 hover:bg-blue-500 transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <SingleMedicineAddForm
                onAdd={handleAddMedicine}
                onCancel={() => setShowAddForm(false)}
                uoms={uoms}
                categories={categories}
                manufacturers={manufacturers}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
