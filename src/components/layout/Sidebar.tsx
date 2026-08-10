'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Pill, Package, Users, Tag, Building2,
  Truck, ShoppingCart, LogOut, Activity, X, History, UserPlus,
  FlaskConical, AlertTriangle, BarChart3, CreditCard,
  Crown, Gem, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import type { PlanType } from '@/types';

const navItems = [
  { href: '/dashboard',              label: 'Dashboard',        icon: LayoutDashboard },
  { href: '/medicines',              label: 'Medicines',         icon: Pill },
  { href: '/batches',                label: 'Batches',           icon: Package },
  { href: '/customers',              label: 'Customers',         icon: Users },
  { href: '/sales',                  label: 'Sell Medicine',     icon: ShoppingCart },
  { href: '/sales-history',          label: 'Sales History',     icon: History },
  { href: '/reports',                label: 'Reports',           icon: BarChart3 },
  { href: '/near-expiry',            label: 'Near Expiry',       icon: AlertTriangle },
  { href: '/disposals',              label: 'Disposal Records',  icon: FlaskConical },
  { href: '/categories',             label: 'Categories',        icon: Tag },
  { href: '/manufacturers',          label: 'Manufacturers',     icon: Building2 },
  { href: '/suppliers',              label: 'Suppliers',         icon: Truck },
  { href: '/signup',                 label: 'Add Pharmacist',    icon: UserPlus },
  { href: '/subscription/billing',   label: 'Subscription',      icon: CreditCard },
];

// ── Plan icon helper ─────────────────────────────────────────────────────────

function PlanIcon({ plan, className }: { plan: PlanType; className?: string }) {
  if (plan === 'Diamond') return <Gem className={className} />;
  if (plan === 'Gold')    return <Crown className={className} />;
  return <Shield className={className} />;
}

// ── Subscription status banner ────────────────────────────────────────────────

function SubscriptionBanner() {
  const { subscription } = useAuth();

  if (!subscription) return null;

  const isLifetime  = subscription.endDate === null;
  const isExpired   = subscription.status === 'Expired';
  const isWarning   = !isExpired && !isLifetime && subscription.daysRemaining !== null && subscription.daysRemaining <= 14;
  const planName    = subscription.planType;

  let label: string;
  let containerCls: string;
  let textCls: string;
  let iconCls: string;

  if (isExpired) {
    label        = 'Subscription expired';
    containerCls = 'bg-red-900/50 border-red-700/60';
    textCls      = 'text-red-300';
    iconCls      = 'text-red-400';
  } else if (isWarning) {
    label        = `${planName} — ${subscription.daysRemaining}d left`;
    containerCls = 'bg-orange-900/50 border-orange-700/60';
    textCls      = 'text-orange-300';
    iconCls      = 'text-orange-400';
  } else if (isLifetime) {
    label        = `${planName} — Lifetime`;
    containerCls = 'bg-indigo-900/30 border-indigo-700/40';
    textCls      = 'text-indigo-300';
    iconCls      = 'text-indigo-400';
  } else {
    label        = `${planName} — ${subscription.daysRemaining ?? '?'}d left`;
    containerCls = 'bg-emerald-900/30 border-emerald-700/40';
    textCls      = 'text-emerald-300';
    iconCls      = 'text-emerald-400';
  }

  return (
    <Link
      href="/subscription/billing"
      className={cn(
        'mx-3 mb-3 flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-opacity hover:opacity-90',
        containerCls
      )}
    >
      <PlanIcon plan={planName} className={cn('h-4 w-4 flex-shrink-0', iconCls)} />
      <span className={cn('text-xs font-semibold truncate', textCls)}>{label}</span>
      {(isExpired || isWarning) && (
        <AlertTriangle className={cn('ml-auto h-3.5 w-3.5 flex-shrink-0', iconCls)} />
      )}
    </Link>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, subscription } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-gradient-to-b from-indigo-950 to-slate-900 transition-transform duration-300',
          'lg:translate-x-0 lg:static lg:z-auto',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {process.env.NEXT_PUBLIC_APP_NAME ?? 'PharmaCare PMS'}
              </p>
              <p className="text-xs text-slate-400">
                v{process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active   = pathname === href || pathname.startsWith(href + '/');
            const isWarning = href === '/near-expiry';
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active && isWarning
                    ? 'bg-yellow-500 text-white shadow-sm'
                    : active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : isWarning
                    ? 'text-yellow-400 hover:bg-slate-800 hover:text-yellow-300'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Subscription status banner */}
        <SubscriptionBanner />

        {/* User + logout */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                {user?.fullName?.charAt(0).toUpperCase() ?? 'P'}
              </div>
            </div>

            {/* Name + email + plan badge */}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white leading-tight">
                {user?.fullName ?? 'Pharmacist'}
              </p>
              <p className="truncate text-xs text-slate-400 leading-tight mt-0.5">
                {user?.email ?? ''}
              </p>
              {/* Plan badge — shown right below the name */}
              {subscription && (
                <div className="mt-1.5 inline-flex items-center gap-1">
                  <PlanIcon
                    plan={subscription.planType}
                    className={cn(
                      'h-3 w-3',
                      subscription.planType === 'Diamond' ? 'text-indigo-400' :
                      subscription.planType === 'Gold'    ? 'text-yellow-400' :
                                                            'text-slate-400'
                    )}
                  />
                  <span className={cn(
                    'text-[10px] font-bold uppercase tracking-wide',
                    subscription.planType === 'Diamond' ? 'text-indigo-400' :
                    subscription.planType === 'Gold'    ? 'text-yellow-400' :
                                                          'text-slate-400'
                  )}>
                    {subscription.planType}
                  </span>
                  <span className="text-[10px] text-slate-600">·</span>
                  <span className="text-[10px] text-slate-500">
                    {subscription.endDate === null
                      ? 'Lifetime'
                      : subscription.status === 'Expired'
                      ? 'Expired'
                      : `${subscription.daysRemaining ?? '?'}d left`}
                  </span>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
