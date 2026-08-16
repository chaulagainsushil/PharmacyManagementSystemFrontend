import api from '@/lib/api';
import type { Product } from '@/types';

export interface CreateProductDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateProductDto extends CreateProductDto {
  updatedAt: string;
}

export const productService = {
  getAll: (includeInactive: boolean = false) =>
    api.get<Product[]>(`/api/product?includeInactive=${includeInactive}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<Product>(`/api/product/${id}`).then((r) => r.data),

  create: (dto: CreateProductDto) =>
    api.post<Product>('/api/product', dto).then((r) => r.data),

  update: (id: number, dto: UpdateProductDto) =>
    api.put<Product>(`/api/product/${id}`, dto).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/product/${id}`).then((r) => r.data),
};
