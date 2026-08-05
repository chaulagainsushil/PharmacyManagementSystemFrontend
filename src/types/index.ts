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

// ── Unit of Measure ───────────────────────────────────────────────────────────
export interface UnitOfMeasure {
  unitOfMeasureId: number;
  name: string;
  symbol: string;
  isActive: boolean;
}

// ── MedicineUnit ──────────────────────────────────────────────────────────────
export interface MedicineUnit {
  medicineUnitId: number;
  medicineId: number;
  unitOfMeasureId: number;
  uomName: string;
  uomSymbol: string;
  conversionFactorToBase: number;
  isBaseUnit: boolean;
  isDefault: boolean;
  isActive: boolean;
  unitPrice: number;
}

export interface MedicineUnitForPos {
  medicineUnitId: number;
  uomName: string;
  uomSymbol: string;
  unitPrice: number;
  conversionFactorToBase: number;
  isDefault: boolean;
  isBaseUnit: boolean;
}

export interface CreateMedicineUnitDto {
  unitOfMeasureId: number;
  conversionFactorToBase: number;
  unitPrice: number;
  isBaseUnit: boolean;
  isDefault: boolean;
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
  strapsPerBox: number;
  totalTabletsPerBox: number;
  stripPrice: number;
  tabletPrice: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  isActive: boolean;
  totalStockInTablets: number;
  createdAt?: string;
  units: MedicineUnit[];
}

export interface CreateMedicineDto {
  name: string;
  genericName?: string;
  categoryId?: number | null;
  manufacturerId?: number | null;
  tabletsPerStrip: number;
  strapsPerBox: number;
  stripPrice: number;
  tabletPrice: number;
  reorderLevel: number;
  requiresPrescription: boolean;
  isActive: boolean;
  units?: CreateMedicineUnitDto[];
}

export interface BulkCreateMedicineItemResult {
  index: number;
  success: boolean;
  message: string;
  data?: Medicine;
}

export interface BulkCreateMedicineResult {
  totalRequested: number;
  totalCreated: number;
  totalFailed: number;
  results: BulkCreateMedicineItemResult[];
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

export interface BulkCreateMedicineBatchItemResult {
  index: number;
  success: boolean;
  message: string;
  data?: MedicineBatch;
}

export interface BulkCreateMedicineBatchResult {
  totalRequested: number;
  totalCreated: number;
  totalFailed: number;
  results: BulkCreateMedicineBatchItemResult[];
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
export type PaymentMode = 'Cash' | 'Card' | 'Online' | 'Credit';

export interface CreateSaleItemDto {
  medicineId: number;
  medicineUnitId: number;
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
  medicineUnitId: number;
  uomName: string;
  quantity: number;
  baseQuantityDeducted: number;
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
  id: string;
  medicineId: number;
  medicineName: string;
  medicineUnitId: number;
  uomName: string;
  quantity: number;
  discountPercent: number;
  unitPrice: number;
  availableUnits: MedicineUnitForPos[];
}

// ── Pharmacist (AppUser) ─────────────────────────────────────────────────────
export interface Pharmacist {
  userId: number;
  fullName: string;
  email: string;
}

// ── Disposal ─────────────────────────────────────────────────────────────────
export interface DisposalItemResponse {
  disposalItemId: number;
  medicineId: number;
  medicineName: string;
  batchId: number;
  batchNumber: string;
  quantityInTablets: number;
  reason: string;
}

export interface DisposalResponse {
  disposalId: number;
  disposalNumber: string;
  pharmacistId: number;
  pharmacistName: string;
  disposalDate: string;
  items: DisposalItemResponse[];
}

export interface CreateDisposalItemDto {
  medicineId: number;
  batchId: number;
  quantityInTablets: number;
  reason: string;
}

export interface CreateDisposalRequestDto {
  pharmacistId: number;
  items: CreateDisposalItemDto[];
}

// ── Reports ───────────────────────────────────────────────────────────────────
export interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
}

export interface TopMedicine {
  medicineId: number;
  medicineName: string;
  totalQuantitySold: number;
  totalRevenue: number;
}

export interface TopManufacturer {
  manufacturerId: number;
  manufacturerName: string;
  totalMedicinesSold: number;
  totalRevenue: number;
}

export interface TopSupplier {
  supplierId: number;
  supplierName: string;
  totalBatchesSupplied: number;
  totalTabletsSupplied: number;
}

export interface DashboardReport {
  today: SalesSummary;
  thisMonth: SalesSummary;
  topMedicines: TopMedicine[];
  topManufacturers: TopManufacturer[];
  topSuppliers: TopSupplier[];
}

export interface MonthlySalesSummary {
  year: number;
  month: number;
  monthLabel: string;
  totalSales: number;
  totalRevenue: number;
  totalItemsSold: number;
}

export interface LowStockItem {
  medicineId: number;
  medicineName: string;
  genericName?: string | null;
  categoryName?: string | null;
  manufacturerName?: string | null;
  totalStockInTablets: number;
  reorderLevel: number;
  shortfallInTablets: number;
}

export interface StockConsumptionItem {
  medicineId: number;
  medicineName: string;
  genericName?: string | null;
  categoryName?: string | null;
  manufacturerName?: string | null;
  supplierName?: string | null;
  totalQuantitySold: number;
  totalSalesCount: number;
  totalRevenue: number;
}

export interface StockConsumptionReport {
  fromDate?: string | null;
  toDate?: string | null;
  supplierId?: number | null;
  manufacturerId?: number | null;
  items: StockConsumptionItem[];
  totalQuantitySold: number;
  totalRevenue: number;
}
