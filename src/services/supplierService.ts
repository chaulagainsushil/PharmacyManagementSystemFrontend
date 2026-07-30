import api from '@/lib/api';
import type { Supplier, CreateSupplierDto } from '@/types';

export const supplierService = {
  getAll: () => api.get<Supplier[]>('/api/supplier').then((r) => r.data),
  getById: (id: number) => api.get<Supplier>(`/api/supplier/${id}`).then((r) => r.data),
  create: (dto: CreateSupplierDto) =>
    api.post<Supplier>('/api/supplier', dto).then((r) => r.data),
  update: (id: number, dto: CreateSupplierDto) =>
    api.put<Supplier>(`/api/supplier/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/supplier/${id}`).then((r) => r.data),
};
