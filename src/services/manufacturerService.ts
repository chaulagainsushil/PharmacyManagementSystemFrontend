import api from '@/lib/api';
import type { Manufacturer, CreateManufacturerDto } from '@/types';

export const manufacturerService = {
  getAll: () => api.get<Manufacturer[]>('/api/manufacturer').then((r) => r.data),
  getById: (id: number) => api.get<Manufacturer>(`/api/manufacturer/${id}`).then((r) => r.data),
  create: (dto: CreateManufacturerDto) =>
    api.post<Manufacturer>('/api/manufacturer', dto).then((r) => r.data),
  update: (id: number, dto: CreateManufacturerDto) =>
    api.put<Manufacturer>(`/api/manufacturer/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/manufacturer/${id}`).then((r) => r.data),
};
