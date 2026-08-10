import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, ArrowRight,
  // Inventory & Stock
  Package, AlertTriangle, RefreshCw, Layers,
  // Billing & Invoicing
  Receipt, Calculator, CreditCard, RotateCcw,
  // Multi-Branch
  LayoutDashboard, GitBranch, UserCheck, Globe,
  // Reporting
  BarChart3, TrendingUp, FileText, Download,
  // User & Role Management
  Users, Shield, ClipboardList, KeyRound,
  // Compliance & Security
  Lock, Database, ScrollText, EyeOff,
  // CTA
  Gem,
  CheckCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface FeatureGroup {
  id: string;
  heading: string;
  subheading: string;
  accentColor: string;       // Tailwind text-* for icon tint
  accentBg: string;          // Tailwind bg-* for icon wrapper
  cards: FeatureCard[];
}

// ── Data ─────────────────────────────────────────────────────────────────────

const FEATURE_GROUPS: FeatureGroup[] = [
  {
    id: 'inventory',
    heading: 'Inventory & Stock',
    subheading: 'Real-time stock control from batch intake to dispensing',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
    cards: [
      {
        icon: Package,
        title: 'Batch & Expiry Tracking',
        description: 'Record every batch with manufacture and expiry dates. Get automatic alerts before stock expires.',
      },
      {
        icon: RefreshCw,
        title: 'FEFO Stock Rotation',
        description: 'First-Expiry-First-Out logic ensures oldest batches are dispensed first, minimizing waste.',
      },
      {
        icon: AlertTriangle,
        title: 'Low-Stock Alerts',
        description: 'Set reorder levels per medicine. Get notified the moment stock falls below your threshold.',
      },
      {
        icon: Layers,
        title: 'Multi-Unit Conversion',
        description: 'Sell in strips, tablets, or boxes with automatic conversion factors applied to every transaction.',
      },
    ],
  },
  {
    id: 'billing',
    heading: 'Billing & Invoicing',
    subheading: 'Fast, accurate invoicing built for pharmacy workflows',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
    cards: [
      {
        icon: Receipt,
        title: 'Fast POS Billing',
        description: 'Search medicines, add to cart, and generate a printed invoice in seconds — even at peak hours.',
      },
      {
        icon: Calculator,
        title: 'GST / VAT-Ready Invoices',
        description: 'Tax breakdowns auto-calculated and printed on every invoice. Stays compliant out of the box.',
      },
      {
        icon: CreditCard,
        title: 'Payment Tracking',
        description: 'Log cash, card, online, and credit payments. Track outstanding balances per customer.',
      },
      {
        icon: RotateCcw,
        title: 'Returns & Refunds',
        description: 'Process partial or full returns against any invoice, with stock automatically restocked.',
      },
    ],
  },
  {
    id: 'multi-branch',
    heading: 'Multi-Branch & Tenant Support',
    subheading: 'One system, many branches — completely isolated data per tenant',
    accentColor: 'text-violet-600',
    accentBg: 'bg-violet-50',
    cards: [
      {
        icon: LayoutDashboard,
        title: 'Centralized Dashboard',
        description: 'See your entire pharmacy business at a glance — sales, stock, and alerts across all branches.',
      },
      {
        icon: GitBranch,
        title: 'Per-Branch Stock',
        description: 'Each branch maintains its own inventory, customers, and transactions — no data cross-contamination.',
      },
      {
        icon: UserCheck,
        title: 'Role-Based Access per Branch',
        description: 'Assign PharmacyAdmin, Pharmacist, or Receptionist roles scoped to specific branches.',
      },
      {
        icon: Globe,
        title: 'Cloud-Based Multi-Tenancy',
        description: 'Each tenant gets a fully isolated data environment — perfect for pharmacy chains and franchises.',
      },
    ],
  },
  {
    id: 'reporting',
    heading: 'Reporting & Analytics',
    subheading: 'Turn your pharmacy data into decisions',
    accentColor: 'text-orange-600',
    accentBg: 'bg-orange-50',
    cards: [
      {
        icon: TrendingUp,
        title: 'Sales Trends',
        description: 'Monthly and daily breakdowns of revenue, units sold, and top-performing medicines.',
      },
      {
        icon: BarChart3,
        title: 'Stock Valuation',
        description: 'Know the current value of your entire inventory at any point in time, by category or supplier.',
      },
      {
        icon: FileText,
        title: 'Expiry Reports',
        description: 'See all batches expiring within a configurable window. Act before losses occur.',
      },
      {
        icon: Download,
        title: 'Exportable Reports',
        description: 'Download any report as PDF or CSV for audits, supplier meetings, or regulatory submissions.',
      },
    ],
  },
  {
    id: 'users',
    heading: 'User & Role Management',
    subheading: 'The right people see the right things — nothing more',
    accentColor: 'text-sky-600',
    accentBg: 'bg-sky-50',
    cards: [
      {
        icon: Users,
        title: 'Pharmacist / Cashier / Admin Roles',
        description: 'Built-in role hierarchy: SystemAdmin, PharmacyAdmin, Pharmacist, and Receptionist.',
      },
      {
        icon: KeyRound,
        title: 'Secure Credential Management',
        description: 'Password policies enforced at signup. Change password flows with current-password verification.',
      },
      {
        icon: ClipboardList,
        title: 'Audit Trail',
        description: 'Every create, update, and delete action is logged with timestamp and the user who made it.',
      },
      {
        icon: Shield,
        title: 'Subscription-Gated Access',
        description: 'Subscription expiry gracefully blocks access system-wide, with a clear renewal flow.',
      },
    ],
  },
  {
    id: 'compliance',
    heading: 'Compliance & Security',
    subheading: 'Enterprise-grade security for patient-sensitive data',
    accentColor: 'text-rose-600',
    accentBg: 'bg-rose-50',
    cards: [
      {
        icon: Database,
        title: 'Data Isolation per Tenant',
        description: 'Row-level tenant scoping ensures no pharmacy ever sees another\'s data — by architecture.',
      },
      {
        icon: Lock,
        title: 'Encrypted Credentials',
        description: 'Passwords hashed with ASP.NET Identity. JWT tokens are short-lived and signed with strong secrets.',
      },
      {
        icon: ScrollText,
        title: 'Activity Logs',
        description: 'Compliance-ready logs of all sensitive operations — dispensing, deletions, and role changes.',
      },
      {
        icon: EyeOff,
        title: 'Minimal Data Exposure',
        description: 'API responses return only what each role needs. No over-fetching of sensitive patient records.',
      },
    ],
  },
];

// ── Public nav (shared with landing page) ────────────────────────────────────

function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight text-white">PharmaCare PMS</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
          <Link href="/features" className="text-white transition-colors">Features</Link>
          <Link href="/signup"   className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/login"    className="hover:text-white transition-colors">Sign In</Link>
        </nav>
        <Link
          href="/signup"
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
        >
          Get started
        </Link>
      </div>
    </header>
  );
}

// ── Feature card ─────────────────────────────────────────────────────────────

function FeatureCardItem({
  card,
  accentColor,
  accentBg,
}: {
  card: FeatureCard;
  accentColor: string;
  accentBg: string;
}) {
  const Icon = card.icon;
  return (
    <div className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md">
      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentBg}`}>
        <Icon className={`h-5 w-5 ${accentColor}`} />
      </div>
      <div>
        <h3 className="text-sm font-bold text-slate-800">{card.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{card.description}</p>
      </div>
    </div>
  );
}

// ── Feature group section ─────────────────────────────────────────────────────

function FeatureGroupSection({ group }: { group: FeatureGroup }) {
  return (
    <section id={group.id} className="scroll-mt-24">
      {/* Section header */}
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900">{group.heading}</h2>
        <p className="mt-1.5 text-sm text-slate-500">{group.subheading}</p>
      </div>

      {/* Cards grid: 1 col → 2 col → 4 col */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {group.cards.map((card) => (
          <FeatureCardItem
            key={card.title}
            card={card}
            accentColor={group.accentColor}
            accentBg={group.accentBg}
          />
        ))}
      </div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export const metadata = {
  title: 'Features — PharmaCare PMS',
  description:
    'Everything you need to run your pharmacy: inventory, billing, reporting, multi-tenant support, and more.',
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      <PublicNav />

      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pb-8 pt-20 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
          <CheckCircle className="h-3.5 w-3.5" />
          Full-featured pharmacy management
        </div>
        <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
          Everything you need to{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            run your pharmacy
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-400">
          From dispensing counter to boardroom analytics — PharmaCare PMS covers
          every workflow in your pharmacy with one integrated platform.
        </p>

        {/* Quick-jump anchors */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {FEATURE_GROUPS.map((g) => (
            <a
              key={g.id}
              href={`#${g.id}`}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              {g.heading}
            </a>
          ))}
        </div>
      </div>

      {/* ── Feature groups ──────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        {FEATURE_GROUPS.map((group) => (
          <FeatureGroupSection key={group.id} group={group} />
        ))}
      </div>

      {/* ── Bottom CTA ──────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pb-32 pt-8">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-700 p-10 text-center shadow-2xl shadow-blue-500/20">
          <div className="mb-3 flex justify-center">
            <Gem className="h-10 w-10 text-white/80" />
          </div>
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            Ready to upgrade your pharmacy?
          </h2>
          <p className="mx-auto mt-3 max-w-sm text-sm text-blue-100">
            Choose a plan that fits your pharmacy size. Silver, Gold, or Diamond — all plans
            include every feature above.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-blue-700 shadow-lg transition-all hover:bg-blue-50 hover:shadow-xl"
          >
            See pricing plans
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* ── Sticky floating CTA (visible on scroll) ─────────────────────── */}
      <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <Link
          href="/signup"
          className="flex items-center gap-2.5 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-2xl shadow-blue-500/40 ring-1 ring-blue-500/50 backdrop-blur-sm transition-all hover:bg-blue-500 hover:shadow-blue-500/60 hover:scale-[1.03]"
        >
          <Gem className="h-4 w-4" />
          See pricing plans
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600">
        © 2026 PharmaCare PMS. All rights reserved.
      </footer>
    </div>
  );
}
