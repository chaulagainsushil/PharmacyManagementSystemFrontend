import api from '@/lib/api';
import type { Category, CreateCategoryDto } from '@/types';

export const categoryService = {
  getAll: () => api.get<Category[]>('/api/category').then((r) => r.data),
  getById: (id: number) => api.get<Category>(`/api/category/${id}`).then((r) => r.data),
  create: (dto: CreateCategoryDto) => api.post<Category>('/api/category', dto).then((r) => r.data),
  update: (id: number, dto: CreateCategoryDto) =>
    api.put<Category>(`/api/category/${id}`, dto).then((r) => r.data),
  delete: (id: number) => api.delete(`/api/category/${id}`).then((r) => r.data),
};
