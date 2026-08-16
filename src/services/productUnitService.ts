import api from '@/lib/api';

export interface DualUnitFirstEntry {
  unitOfMeasureId: number;
  totalUnitQty: number;
  conversionFactorToBase: number;
  purchasePrice: number;
  salePrice: number;
}

export interface DualUnitSecondEntry {
  unitOfMeasureId: number;
  purchasePrice?: number;
  salePrice?: number;
}

export interface AddDualUnitCommand {
  firstUnit: DualUnitFirstEntry;
  secondUnit?: DualUnitSecondEntry;
}

export interface ProductUnitDto {
  productUnitId: number;
  productId: number;
  unitOfMeasureId: number;
  uomName: string;
  uomSymbol: string;
  isBaseUnit: boolean;
  conversionFactorToBase: number;
  totalUnitQty: number;
  purchasePrice: number;
  salePrice: number;
  updatedAt: string;
}

export interface ProductUnitsResponse {
  productId: number;
  productName: string;
  units: ProductUnitDto[];
}

export const productUnitService = {
  addDualUnit: (productId: number, cmd: AddDualUnitCommand) =>
    api
      .post<ProductUnitDto[]>(`/api/product/${productId}/units`, cmd)
      .then((r) => r.data),

  getUnits: (productId: number) =>
    api
      .get<ProductUnitsResponse>(`/api/product/${productId}/units`)
      .then((r) => r.data),
};
