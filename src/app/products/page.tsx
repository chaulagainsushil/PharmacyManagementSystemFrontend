'use client';

import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { Plus, Pencil, ToggleLeft, ToggleRight, Package, Trash2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Badge } from '@/components/ui/Badge';
import { SimpleProductDualUnitEditor } from '@/components/ui/SimpleProductDualUnitEditor';
import { productService } from '@/services/productService';
import { productUnitService } from '@/services/productUnitService';
import { uomService } from '@/services/uomService';
import type { Product, UnitOfMeasure, ProductUnitDto } from '@/types';

// ── Product Form State ────────────────────────────────────────────────────────

interface ProductForm {
  name: string;
  description: string;
  isActive: boolean;
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const [products, setProducts] = useState<(Product & { units?: ProductUnitDto[] })[]>([]);
  const [units, setUnits] = useState<UnitOfMeasure[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [unitsModalOpen, setUnitsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [form, setForm] = useState<ProductForm>({ name: '', description: '', isActive: true });
  const [errors, setErrors] = useState<Partial<ProductForm>>({});

  // Unit state for inline form
  const [unit1, setUnit1] = useState({ uomId: '', conversionFactorToBase: '', purchasePrice: '', salePrice: '' });
  const [unit2, setUnit2] = useState({ uomId: '', conversionFactorToBase: '', purchasePrice: '', salePrice: '' });
  const [showUnit2, setShowUnit2] = useState(false);

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadProducts = useCallback(async () => {
    try {
      const data = await productService.getAll(true);
      
      // Load units for each product
      const productsWithUnits = await Promise.all(
        data.map(async (p) => {
          try {
            const response = await productUnitService.getUnits(p.productId);
            return { ...p, units: response.units || [] };
          } catch {
            return { ...p, units: [] };
          }
        })
      );
      
      setProducts(productsWithUnits);
    } catch (e: any) {
      toast.error('Failed to load products');
    }
  }, []);

  const loadUnits = useCallback(async () => {
    try {
      const data = await uomService.getAll(true);
      setUnits(data);
    } catch {
      toast.error('Failed to load units');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
    loadUnits();
  }, [loadProducts, loadUnits]);

  // ── Validation ───────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const e: Partial<ProductForm> = {};
    if (!form.name.trim()) e.name = 'Product name is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Create product ────────────────────────────────────────────────────────

  const handleCreateProduct = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      await productService.create({
        name: form.name.trim(),
        description: form.description.trim(),
        isActive: form.isActive,
      });

      toast.success('Product created successfully!');
      setCreateModalOpen(false);
      setForm({ name: '', description: '', isActive: true });
      setErrors({});
      await loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

  // ── Open units modal ──────────────────────────────────────────────────────

  const openUnitsModal = (product: Product) => {
    setSelectedProduct(product);
    setUnitsModalOpen(true);
  };

  const handleUnitsSuccess = async () => {
    setUnitsModalOpen(false);
    await loadProducts();
  };

  // ── Toggle active ────────────────────────────────────────────────────────

  const handleToggleActive = async (product: Product) => {
    try {
      await productService.update(product.productId, {
        ...product,
        isActive: !product.isActive,
      });
      toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'}`);
      await loadProducts();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Failed to update product');
    }
  };

  const active = products.filter(p => p.isActive);
  const inactive = products.filter(p => !p.isActive);

  if (loading) return <AppLayout title="Products"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Products">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {active.length} active product{active.length !== 1 ? 's' : ''}
            {inactive.length > 0 && ` · ${inactive.length} inactive`}
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" /> New Product
        </button>
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center">
          <Package className="mx-auto mb-3 h-10 w-10 text-gray-200" />
          <p className="text-gray-400 font-medium">No products yet</p>
          <p className="text-sm text-gray-300 mt-1">Create your first product and add units with pricing</p>
          <button
            onClick={() => setCreateModalOpen(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4" /> Create First Product
          </button>
        </div>
      )}

      {/* Products table */}
      {products.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">Units</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((product, idx) => (
                <tr
                  key={product.productId}
                  className={`hover:bg-slate-50 transition-colors ${!product.isActive ? 'opacity-50' : ''}`}
                >
                  <td className="px-6 py-3 text-gray-400">{idx + 1}</td>
                  <td className="px-6 py-3">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-0.5">{product.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {product.units && product.units.length > 0 ? (
                        product.units.map(unit => (
                          <span
                            key={unit.productUnitId}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700"
                          >
                            {unit.uomName}
                            <span className="text-emerald-500">({unit.totalUnitQty})</span>
                            {unit.isBaseUnit && (
                              <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                            )}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No units</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <Badge variant={product.isActive ? 'green' : 'gray'}>
                      {product.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openUnitsModal(product)}
                        className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                        title="Add Units"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(product)}
                        className={`rounded-lg p-1.5 transition-colors ${
                          product.isActive
                            ? 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                            : 'text-gray-400 hover:bg-emerald-50 hover:text-emerald-600'
                        }`}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {product.isActive ? (
                          <ToggleLeft className="h-4 w-4" />
                        ) : (
                          <ToggleRight className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Create Product Modal ──────────────────────────────────────────────── */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Product"
        size="sm"
      >
        <div className="space-y-4">
          {/* Product Name */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Product Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Paracetamol 500mg, Syrup XYZ"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              autoFocus
            />
            {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Description <span className="text-gray-400">(optional)</span>
            </label>
            <textarea
              placeholder="Add notes about this product..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreateProduct}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              Create Product
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Units Modal ───────────────────────────────────────────────────── */}
      {selectedProduct && (
        <Modal
          open={unitsModalOpen}
          onClose={() => setUnitsModalOpen(false)}
          title={`Add Units for: ${selectedProduct.name}`}
          size="lg"
        >
          <SimpleProductDualUnitEditor
            unit1={unit1}
            unit2={unit2}
            uoms={units}
            onUnit1Change={setUnit1}
            onUnit2Change={setUnit2}
            showUnit2={showUnit2}
            onShowUnit2Change={setShowUnit2}
          />
          <div className="flex gap-3 justify-end pt-4 mt-4 border-t border-gray-200">
            <button
              onClick={() => setUnitsModalOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                toast.success('Unit form ready - connect to API');
                setUnitsModalOpen(false);
              }}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Save Units
            </button>
          </div>
        </Modal>
      )}
    </AppLayout>
  );
}
