# PharmaCare PMS — Frontend Documentation

> **Project name:** `pms-frontend`  
> **Version:** 1.0.0  
> **Framework:** Next.js 16 (App Router) · React 19 · TypeScript 5  
> **Styling:** Tailwind CSS v4  

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Environment Configuration](#4-environment-configuration)
5. [Authentication & Authorization](#5-authentication--authorization)
6. [Subscription System](#6-subscription-system)
7. [Application Routes (Pages)](#7-application-routes-pages)
8. [Services Layer (API Calls)](#8-services-layer-api-calls)
9. [Data Types (TypeScript Interfaces)](#9-data-types-typescript-interfaces)
10. [Components](#10-components)
11. [State Management](#11-state-management)
12. [API Client](#12-api-client)
13. [Getting Started](#13-getting-started)

---

## 1. Project Overview

PharmaCare PMS is a **multi-tenant SaaS Pharmacy Management System** frontend built with Next.js. It connects to a .NET backend API and provides a full-featured dashboard for pharmacies to manage:

- Medicine inventory with batch and expiry tracking
- Sales (Point-of-Sale) and sales history
- Customers, suppliers, manufacturers, and categories
- Units of measure per medicine
- Disposal records for expired/damaged medicines
- Reporting and analytics (daily, monthly, top medicines, low stock)
- Role-based access (PharmacyAdmin, Pharmacist)
- Subscription management (Trial, Silver, Gold, Diamond plans)

The landing page (`/`) publicly showcases the product; all management pages are behind authentication.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2.12 (App Router) |
| UI Library | React 19.2.4 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + tailwind-merge + clsx |
| HTTP Client | Axios 1.7.9 |
| Forms | react-hook-form 7 + zod 3 + @hookform/resolvers |
| Icons | lucide-react 0.468.0 |
| Date utilities | date-fns 4.1.0 |
| Notifications | react-hot-toast 2.4.1 |
| Font | Geist (via next/font) |
| Linting | ESLint 9 + eslint-config-next |

---

## 3. Project Structure

```
pms-frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx            # Landing / marketing page
│   │   ├── layout.tsx          # Root layout (AuthProvider, fonts)
│   │   ├── globals.css         # Global Tailwind styles
│   │   ├── login/page.tsx      # Login page
│   │   ├── signup/page.tsx     # Tenant & pharmacist signup
│   │   ├── dashboard/page.tsx  # Main dashboard
│   │   ├── medicines/page.tsx  # Medicine management
│   │   ├── batches/page.tsx    # Batch management
│   │   ├── units/page.tsx      # Units of Measure management
│   │   ├── sales/page.tsx      # Point-of-Sale (create sale)
│   │   ├── sales-history/page.tsx  # View past sales
│   │   ├── customers/page.tsx  # Customer management
│   │   ├── suppliers/page.tsx  # Supplier management
│   │   ├── manufacturers/page.tsx  # Manufacturer management
│   │   ├── categories/page.tsx # Category management
│   │   ├── disposals/page.tsx  # Disposal records
│   │   ├── near-expiry/page.tsx # Near-expiry batch alerts
│   │   ├── reports/page.tsx    # Analytics & reports
│   │   ├── features/page.tsx   # Public features/pricing page
│   │   └── subscription/
│   │       ├── billing/        # Subscription billing page
│   │       └── expired/        # Subscription expired page
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx   # Authenticated page wrapper
│   │   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   │   └── Navbar.tsx      # Top navbar
│   │   └── ui/
│   │       ├── Badge.tsx
│   │       ├── BillPrint.tsx   # Invoice/bill print component
│   │       ├── ConfirmDialog.tsx
│   │       ├── FormField.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── MedicineRow.tsx # POS medicine row component
│   │       ├── Modal.tsx
│   │       ├── StatCard.tsx    # Dashboard stat card
│   │       └── UnitsManager.tsx
│   ├── context/
│   │   └── AuthContext.tsx     # Auth state + subscription state
│   ├── lib/
│   │   ├── api.ts              # Axios instance + interceptors
│   │   └── utils.ts            # cn() utility (clsx + tailwind-merge)
│   ├── services/               # API service modules
│   │   ├── authService.ts
│   │   ├── batchService.ts
│   │   ├── categoryService.ts
│   │   ├── customerService.ts
│   │   ├── disposalService.ts
│   │   ├── manufacturerService.ts
│   │   ├── medicineService.ts
│   │   ├── medicineUnitService.ts
│   │   ├── reportService.ts
│   │   ├── saleService.ts
│   │   ├── subscriptionService.ts
│   │   ├── supplierService.ts
│   │   └── uomService.ts
│   └── types/
│       └── index.ts            # All TypeScript interfaces and DTOs
├── public/                     # Static assets (SVGs)
├── .env.example                # Environment variable template
├── next.config.ts              # Next.js config with env validation
├── tsconfig.json
├── postcss.config.mjs
└── package.json
```

---

## 4. Environment Configuration

Copy `.env.example` to `.env.local` before running the project.

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | **Yes** | `http://localhost:5259` | Base URL of the .NET backend API (no trailing slash) |
| `NEXT_PUBLIC_APP_NAME` | No | `PharmaCare PMS` | Display name shown in the sidebar and browser title |
| `NEXT_PUBLIC_APP_VERSION` | No | `1.0.0` | Version string shown in the sidebar |

> `NEXT_PUBLIC_API_URL` is validated at build/start time in `next.config.ts`. The build will **fail** if it is missing.

---

## 5. Authentication & Authorization

### Flow

1. User visits `/login` → submits email + password.
2. `authService.login()` calls `POST /api/auth/login`.
3. On success, the JWT token and user object are stored in `localStorage` (`pms_token`, `pms_user`).
4. Subscription data is fetched immediately and stored in `localStorage` (`pms_subscription`).
5. All subsequent API requests attach the token via Axios request interceptor as `Authorization: Bearer <token>`.

### Auth Context

`AuthContext` (in `src/context/AuthContext.tsx`) is the single source of truth for auth state. It provides:

| Value/Method | Type | Description |
|---|---|---|
| `user` | `AuthUser \| null` | Currently logged-in user (email, fullName, roles, userId, tenantId) |
| `subscription` | `SubscriptionInfo \| null` | Current tenant's subscription details |
| `loading` | `boolean` | True while hydrating from localStorage |
| `isAuthenticated` | `boolean` | True when a user is set |
| `login(dto)` | `async fn` | Logs in and populates context |
| `logout()` | `fn` | Clears localStorage and redirects to `/login` |
| `refreshSubscription()` | `async fn` | Re-fetches subscription from API and updates context |

### Axios Interceptors

The Axios instance in `src/lib/api.ts` handles two error scenarios automatically:

- **HTTP 401** — Clears all auth data from localStorage and redirects to `/login`.
- **HTTP 402** — Redirects to `/subscription/expired` (subscription has lapsed; token is preserved so the user can access the billing page).

### Roles

Roles come from the JWT claims and are stored in `user.roles`. The two known roles are:
- `PharmacyAdmin` — can add pharmacists, manage subscription, and perform all operations.
- `Pharmacist` — standard staff access.

---

## 6. Subscription System

The app is multi-tenant and subscription-gated. Plans are:

| Plan | Medicine Limit | Duration |
|---|---|---|
| Trial | 20 medicines | Limited days |
| Silver | Unlimited | Time-limited |
| Gold | Unlimited | Time-limited |
| Diamond | Unlimited | Lifetime |

### Status

- `Active` — subscription is running.
- `Expired` — subscription has lapsed; API returns HTTP 402 on protected endpoints.
- `Cancelled` — subscription was cancelled.

### Sidebar Integration

The sidebar shows a live subscription status banner below the nav links. Color coding:
- **Red** — Expired
- **Orange** — Expiring within 14 days
- **Indigo** — Diamond (Lifetime)
- **Green** — Active with days remaining

### Billing Page

`/subscription/billing` allows renewing (same plan) or upgrading to a higher tier.  
`/subscription/expired` is the locked page shown when a tenant's subscription has expired.

---

## 7. Application Routes (Pages)

### Public Routes

| Route | Description |
|---|---|
| `/` | Landing / marketing page with feature highlights and plan overview |
| `/features` | Detailed features & pricing page |
| `/login` | Email + password login form |
| `/signup` | New pharmacy (tenant) registration form |

### Protected Routes (require login)

| Route | Description |
|---|---|
| `/dashboard` | Main dashboard with KPIs, low stock, expiring batches, and monthly sales chart |
| `/medicines` | Full medicine CRUD — includes bulk import, unit management |
| `/batches` | Batch management — receive new stock, track per-batch expiry |
| `/units` | Units of Measure management (UoM per medicine) |
| `/sales` | Point-of-Sale interface — build a cart and create an invoice |
| `/sales-history` | List and view past sales with bill print |
| `/customers` | Customer CRUD |
| `/suppliers` | Supplier CRUD |
| `/manufacturers` | Manufacturer CRUD |
| `/categories` | Category CRUD |
| `/disposals` | Record medicine disposals (expired, damaged) |
| `/near-expiry` | List batches expiring within a configurable threshold |
| `/reports` | Analytics: top medicines, top suppliers, top manufacturers, low stock, stock consumption |
| `/signup` | Add a new pharmacist to the current tenant (Admin only) |
| `/subscription/billing` | View current plan, renew or upgrade subscription |
| `/subscription/expired` | Shown when HTTP 402 is returned (subscription lapsed) |

---

## 8. Services Layer (API Calls)

All HTTP calls go through `src/lib/api.ts` (the Axios instance). Each domain has its own service module.

### `authService`

| Method | API Endpoint | Description |
|---|---|---|
| `login(dto)` | `POST /api/auth/login` | Authenticate user; returns JWT |
| `tenantSignup(dto)` | `POST /api/auth/tenant-signup` | Create new pharmacy (tenant) + admin |
| `signup(dto)` | `POST /api/auth/signup` | Add pharmacist to existing tenant |

### `subscriptionService`

| Method | API Endpoint | Description |
|---|---|---|
| `getMine()` | `GET /api/subscription/mine` | Get current tenant's subscription |
| `renew(dto?)` | `POST /api/subscription/renew` | Renew with same plan |
| `upgrade(dto)` | `POST /api/subscription/upgrade` | Upgrade to a higher plan |

### `medicineService`

| Method | API Endpoint | Description |
|---|---|---|
| `getAll()` | `GET /api/medicine` | List all medicines |
| `create(dto)` | `POST /api/medicine` | Create a medicine |
| `update(id, dto)` | `PUT /api/medicine/{id}` | Update a medicine |
| `delete(id)` | `DELETE /api/medicine/{id}` | Delete a medicine |
| `bulkCreate(items)` | `POST /api/medicine/bulk` | Bulk import medicines |

### `batchService`

| Method | API Endpoint | Description |
|---|---|---|
| `getAll()` | `GET /api/batch` | List all batches |
| `create(dto)` | `POST /api/batch` | Receive a new batch |
| `bulkCreate(items)` | `POST /api/batch/bulk` | Bulk import batches |

### `saleService`

| Method | API Endpoint | Description |
|---|---|---|
| `create(dto)` | `POST /api/sales` | Create a new sale/invoice |
| `getAll()` | `GET /api/sales` | List all sales |
| `getById(id)` | `GET /api/sales/{id}` | Get a single sale |

### `disposalService`

| Method | API Endpoint | Description |
|---|---|---|
| `getAll()` | `GET /api/disposal` | List all disposal records |
| `getById(id)` | `GET /api/disposal/{id}` | Get a disposal record |
| `create(dto)` | `POST /api/disposal` | Create a disposal record |

### `reportService`

| Method | API Endpoint | Description |
|---|---|---|
| `getDashboard()` | `GET /api/report/dashboard` | Combined dashboard report |
| `getToday()` | `GET /api/report/today` | Today's sales summary |
| `getThisMonth()` | `GET /api/report/this-month` | This month's sales summary |
| `getMonthlySales(n)` | `GET /api/report/monthly-sales?months={n}` | Last n months of sales |
| `getLowStock()` | `GET /api/report/low-stock` | Medicines at or below reorder level |
| `getStockConsumption(params)` | `GET /api/report/stock-consumption` | Stock consumption with filters |
| `getTopMedicines(n)` | `GET /api/report/top-medicines?top={n}` | Top-selling medicines |
| `getTopManufacturers(n)` | `GET /api/report/top-manufacturers?top={n}` | Top manufacturers by revenue |
| `getTopSuppliers(n)` | `GET /api/report/top-suppliers?top={n}` | Top suppliers by volume |

### Other Services

| Service | Endpoints |
|---|---|
| `categoryService` | CRUD on `/api/category` |
| `customerService` | CRUD on `/api/customer` |
| `supplierService` | CRUD on `/api/supplier` |
| `manufacturerService` | CRUD on `/api/manufacturer` |
| `medicineUnitService` | CRUD on `/api/medicine/{id}/units` |
| `uomService` | CRUD on `/api/uom` |

---

## 9. Data Types (TypeScript Interfaces)

All types are centralized in `src/types/index.ts`.

### Auth

```typescript
interface LoginDto { email: string; password: string; }

interface TenantSignupDto {
  fullName: string; email: string; password: string;
  confirmPassword: string; pharmacyName: string;
}

interface AuthResponse {
  isSuccess: boolean; message: string; token: string | null;
  email: string | null; fullName: string | null; roles: string[];
  userId: number | null; tenantId: string | null;
}
```

### Subscription

```typescript
type PlanType = 'Trial' | 'Silver' | 'Gold' | 'Diamond';
type SubscriptionStatus = 'Active' | 'Expired' | 'Cancelled';

interface SubscriptionInfo {
  subscriptionId: number; tenantId: string;
  planType: PlanType; status: SubscriptionStatus;
  startDate: string; endDate: string | null;
  isActive: boolean; daysRemaining: number | null;
  medicineLimit: number | null; // null = unlimited
}
```

### Medicine

```typescript
interface Medicine {
  medicineId: number; name: string; genericName?: string | null;
  categoryId?: number | null; manufacturerId?: number | null;
  tabletsPerStrip: number; strapsPerBox: number;
  stripPrice: number; tabletPrice: number;
  reorderLevel: number; requiresPrescription: boolean;
  isActive: boolean; totalStockInTablets: number;
  units: MedicineUnit[];
}
```

### Sale (POS)

```typescript
interface CreateSaleRequestDto {
  customerId: number; pharmacistId: number;
  discountPercent: number;
  paymentMode: 'Cash' | 'Card' | 'Online' | 'Credit';
  items: CreateSaleItemDto[];
}

interface CartItem {
  id: string; medicineId: number; medicineName: string;
  medicineUnitId: number; uomName: string;
  quantity: number; discountPercent: number;
  unitPrice: number; availableUnits: MedicineUnitForPos[];
}
```

---

## 10. Components

### Layout Components

**`AppLayout`** — Wraps every authenticated page. Renders `Sidebar` + `Navbar` + a scrollable main content area. Accepts a `title` prop for the page heading.

**`Sidebar`** — Fixed left navigation with:
- App logo + name + version
- Navigation links (active state highlighted in blue)
- `/near-expiry` link highlighted in yellow as a warning
- Subscription status banner (color-coded by plan/status)
- User avatar, name, email, plan badge, and Sign Out button

**`Navbar`** — Top bar with hamburger button (mobile) and page title.

### UI Components

| Component | Purpose |
|---|---|
| `StatCard` | KPI card with icon, value, title, subtitle, and color variant |
| `Badge` | Inline status pill — variants: `green`, `red`, `yellow`, `blue`, `gray` |
| `Modal` | Accessible modal overlay |
| `ConfirmDialog` | Confirmation prompt (uses Modal internally) |
| `FormField` | Labeled input with error message support |
| `LoadingSpinner` / `PageLoader` | Inline spinner and full-page loader |
| `MedicineRow` | POS cart row — medicine search, unit selector, quantity, discount |
| `BillPrint` | Printable invoice layout for a completed sale |
| `UnitsManager` | CRUD UI for medicine-specific units of measure |

---

## 11. State Management

The project uses React Context for global state. There is no Redux or Zustand.

- **`AuthContext`** — Manages the logged-in user, subscription info, and auth actions (login, logout, refreshSubscription).
- **Page-level state** — Each page manages its own local state with `useState` and `useEffect` for data fetching.
- **Forms** — Managed by `react-hook-form` with `zod` schemas for validation.

---

## 12. API Client

`src/lib/api.ts` exports a pre-configured Axios instance:

```typescript
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: { 'Content-Type': 'application/json' },
});
```

**Request interceptor** — Reads `pms_token` from localStorage and attaches `Authorization: Bearer <token>` to every outgoing request.

**Response interceptor** — Handles:
- `401 Unauthorized` → clears auth data, redirects to `/login`
- `402 Payment Required` → redirects to `/subscription/expired` (token preserved)

---

## 13. Getting Started

### Prerequisites

- Node.js 18+
- The .NET PMS backend API running (default: `http://localhost:5259`)

### Setup

```bash
# 1. Clone and enter the project
cd pms-frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_URL to your backend URL

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

### First-time Setup

1. Go to `/` (landing page) and click **Get started free**.
2. Fill in the signup form to create a new pharmacy tenant and admin account.
3. You will receive a Trial subscription automatically.
4. Log in at `/login` and start managing your pharmacy.
