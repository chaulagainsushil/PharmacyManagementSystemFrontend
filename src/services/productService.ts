import api from '@/lib/api';
import type { Product, ProductUnitDto } from '@/types';

export interface CreateProductDto {
  name: string;
  description?: string;
  isActive: boolean;
}

export interface UpdateProductDto extends CreateProductDto {
  updatedAt: string;
}

export interface ProductWithUnits extends Product {
  units: ProductUnitDto[];
}

export const productService = {
  getAll: (includeInactive: boolean = false) =>
    api.get<Product[]>(`/api/product?includeInactive=${includeInactive}`).then((r) => r.data),

  getById: (id: number) =>
    api.get<Product>(`/api/product/${id}`).then((r) => r.data),

  /** Get all active products with their units (for sales page) */
  getAllWithUnits: async (): Promise<ProductWithUnits[]> => {
    const products = await api.get<Product[]>('/api/product?includeInactive=false').then(r => r.data);
    const productsWithUnits = await Promise.all(
      products.map(async (product) => {
        try {
          const unitsResponse = await api.get(`/api/product/${product.productId}/units`).then(r => r.data);
          return {
            ...product,
            units: unitsResponse.units || []
          };
        } catch {
          return { ...product, units: [] };
        }
      })
    );
    return productsWithUnits;
  },

  create: (dto: CreateProductDto) =>
    api.post<Product>('/api/product', dto).then((r) => r.data),

  update: (id: number, dto: UpdateProductDto) =>
    api.put<Product>(`/api/product/${id}`, dto).then((r) => r.data),

  delete: (id: number) =>
    api.delete(`/api/product/${id}`).then((r) => r.data),
};
