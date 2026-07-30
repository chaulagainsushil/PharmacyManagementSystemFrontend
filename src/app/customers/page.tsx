'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { format } from 'date-fns';
import { AppLayout } from '@/components/layout/AppLayout';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormField } from '@/components/ui/FormField';
import { PageLoader, LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { customerService } from '@/services/customerService';
import type { Customer, CreateCustomerDto } from '@/types';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Customer | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateCustomerDto>();

  const load = useCallback(async () => {
    const data = await customerService.getAll();
    setCustomers(data);
  }, []);

  useEffect(() => { load().finally(() => setLoading(false)); }, [load]);

  const openCreate = () => { reset({}); setEditing(null); setModalOpen(true); };
  const openEdit = (c: Customer) => { reset({ fullName: c.fullName, phoneNumber: c.phoneNumber, address: c.address ?? '' }); setEditing(c); setModalOpen(true); };

  const onSubmit = async (data: CreateCustomerDto) => {
    setSaving(true);
    try {
      if (editing) { await customerService.update(editing.customerId, data); toast.success('Customer updated'); }
      else          { await customerService.create(data); toast.success('Customer added'); }
      setModalOpen(false); await load();
    } catch (e: any) {
      toast.error(e.response?.data?.message ?? 'Something went wrong');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try { await customerService.delete(deleteTarget.customerId); toast.success('Customer deleted'); setDeleteTarget(null); await load(); }
    catch (e: any) { toast.error(e.response?.data?.message ?? 'Delete failed'); }
    finally { setDeleting(false); }
  };

  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search)
  );

  if (loading) return <AppLayout title="Customers"><PageLoader /></AppLayout>;

  return (
    <AppLayout title="Customers">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <button onClick={openCreate} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors shadow-sm">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Total Sales</th>
                <th className="px-6 py-3">Registered</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                  <Users className="mx-auto mb-2 h-8 w-8 text-gray-200" />No customers found
                </td></tr>
              )}
              {filtered.map(c => (
                <tr key={c.customerId} className="hover:bg-blue-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{c.fullName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-gray-600">{c.phoneNumber}</td>
                  <td className="px-6 py-3 text-gray-500">{c.address ?? '—'}</td>
                  <td className="px-6 py-3 font-semibold text-gray-900">{c.totalSales ?? 0}</td>
                  <td className="px-6 py-3 text-gray-500">{c.createdAt ? format(new Date(c.createdAt), 'dd MMM yyyy') : '—'}</td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setDeleteTarget(c)} className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Full Name *" placeholder="e.g. Ram Prasad Sharma" error={errors.fullName?.message}
            {...register('fullName', { required: 'Required' })} />
          <FormField label="Phone Number *" placeholder="e.g. 9841234567" error={errors.phoneNumber?.message}
            {...register('phoneNumber', { required: 'Required' })} />
          <FormField label="Address" placeholder="e.g. Baneshwor, Kathmandu" {...register('address')} />
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
              {saving && <LoadingSpinner className="h-4 w-4 text-white" />}
              {editing ? 'Save Changes' : 'Add Customer'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteTarget} title="Delete Customer" message={`Delete "${deleteTarget?.fullName}"?`}
        onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} loading={deleting} />
    </AppLayout>
  );
}
