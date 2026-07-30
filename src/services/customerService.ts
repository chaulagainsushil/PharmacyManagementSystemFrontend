import api from '@/lib/api';
import type { Customer, CreateCustomerDto } from '@/types';

export const customerService = {
  getAll: () => api.get<Customer[]>('/api/customer').then((r) => r.data),
  getById: (id: number) => api.get<Customer>(`/api/customer/${id}`).then((r) => r.data),
  create: (dto: CreateCustomerDto) =>
    api.post<Customer>('/api/customer', dto).then((r) => r.data),
  update: (id: number, dto: CreateCustomerDto) =>
    api.put<Customer>(`/api/customer/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/customer/${id}`).then((r) => r.data),
};
