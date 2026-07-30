// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginDto {
  email: string;
  password: string;
}

export interface SignupDto {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  isSuccess: boolean;
  message: string;
  token: string | null;
  expiration: string | null;
  email: string | null;
  fullName: string | null;
  roles: string[];
  /** Integer PK from AppUsers table — used as PharmacistId when creating sales */
  userId: number | null;
}

// ── Category ─────────────────────────────────────────────────────────────────
export interface Category {
  categoryId: number;
  categoryName: string;
  medicineCount?: number;
}

export interface CreateCategoryDto {
  categoryName: string;
}

// ── Manufacturer ─────────────────────────────────────────────────────────────
export interface Manufacturer {
  manufacturerId: number;
  name: string;
  medicineCount?: number;
}

export interface CreateManufacturerDto {
  name: string;
}

// ── Supplier ─────────────────────────────────────────────────────────────────
export interface Supplier {
  supplierId: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  batchCount?: number;
}

export interface CreateSupplierDto {
  name: string;
  phone?: string;
  address?: string;
}

// ── Medicine ─────────────────────────────────────────────────────────────────
export interface Medicine {
  medicineId: number;
  name: string;
  genericName?: string | null;
  categoryId?: number | null;
  categoryName?: string | null;
  manufacturerId?: number | null;
  manufacturerName?: string | null;
  tabletsPerStrip: number;
  stripPrice: number;
  tabletPrice: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  isActive: boolean;
  totalStockInTablets: number;
  createdAt?: string;
}

export interface CreateMedicineDto {
  name: string;
  genericName?: string;
  categoryId?: number | null;
  manufacturerId?: number | null;
  tabletsPerStrip: number;
  stripPrice: number;
  tabletPrice: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  isActive: boolean;
}

// ── Medicine Batch ────────────────────────────────────────────────────────────
export interface MedicineBatch {
  batchId: number;
  medicineId: number;
  medicineName: string;
  batchNumber: string;
  supplierId?: number | null;
  supplierName?: string | null;
  manufactureDate?: string | null;
  expiryDate: string;
  quantityInTablets: number;
  purchasePricePerTablet: number;
  receivedDate: string;
  isExpired: boolean;
}

export interface CreateMedicineBatchDto {
  medicineId: number;
  batchNumber: string;
  supplierId?: number | null;
  manufactureDate?: string | null;
  expiryDate: string;
  quantityInTablets: number;
  purchasePricePerTablet: number;
  receivedDate: string;
}

// ── Customer ─────────────────────────────────────────────────────────────────
export interface Customer {
  customerId: number;
  fullName: string;
  phoneNumber: string;
  address?: string | null;
  totalSales?: number;
  createdAt?: string;
}

export interface CreateCustomerDto {
  fullName: string;
  phoneNumber: string;
  address?: string;
}

// ── Sale ─────────────────────────────────────────────────────────────────────
export enum SaleUnitType {
  Tablet = 0,
  Strip = 1,
}

export enum PaymentMode {
  Cash = 0,
  Card = 1,
  Online = 2,
  Credit = 3,
}

export interface CreateSaleItemDto {
  medicineId: number;
  saleUnitType: SaleUnitType;
  quantity: number;
  discountPercent: number;
}

export interface CreateSaleRequestDto {
  customerId: number;
  pharmacistId: number;
  discountPercent: number;
  paymentMode: PaymentMode;
  items: CreateSaleItemDto[];
}

export interface SaleItemResponse {
  saleItemId: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  saleUnitType: SaleUnitType;
  quantity: number;
  tabletsDeducted: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
}

export interface SaleResponse {
  saleId: number;
  invoiceNumber: string;
  customerId: number;
  customerName: string;
  pharmacistId: number;
  pharmacistName: string;
  saleDate: string;
  paymentMode: PaymentMode;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  totalAmount: number;
  items: SaleItemResponse[];
}

// ── Cart (client-side only) ───────────────────────────────────────────────────
export interface CartItem {
  id: string; // uuid for key
  medicineId: number;
  medicineName: string;
  saleUnitType: SaleUnitType;
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  tabletsPerStrip: number;
}

// ── Pharmacist (AppUser) ─────────────────────────────────────────────────────
export interface Pharmacist {
  userId: number;
  fullName: string;
  email: string;
}
