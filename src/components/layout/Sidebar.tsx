'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Pill, Package, Users, Tag, Building2,
  Truck, ShoppingCart, LogOut, Activity, X, History, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const navItems = [
  { href: '/dashboard',      label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/medicines',      label: 'Medicines',       icon: Pill },
  { href: '/batches',        label: 'Batches',         icon: Package },
  { href: '/customers',      label: 'Customers',       icon: Users },
  { href: '/sales',          label: 'Sell Medicine',   icon: ShoppingCart },
  { href: '/sales-history',  label: 'Sales History',   icon: History },
  { href: '/categories',     label: 'Categories',      icon: Tag },
  { href: '/manufacturers',  label: 'Manufacturers',   icon: Building2 },
  { href: '/suppliers',      label: 'Suppliers',       icon: Truck },
  { href: '/signup',         label: 'Add Pharmacist',  icon: UserPlus },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

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
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="border-t border-slate-800 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {user?.fullName?.charAt(0).toUpperCase() ?? 'P'}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.fullName ?? 'Pharmacist'}</p>
              <p className="truncate text-xs text-slate-400">{user?.email ?? ''}</p>
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
