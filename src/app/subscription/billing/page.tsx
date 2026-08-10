'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Crown, Gem, Shield, RefreshCw, ArrowUpCircle, CheckCircle,
  Calendar, Clock, CreditCard, AlertTriangle,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/context/AuthContext';
import type { PlanType, SubscriptionInfo } from '@/types';
import { format } from 'date-fns';

// ── Plan meta helpers ────────────────────────────────────────────────────────

const PLAN_META: Record<PlanType, { label: string; color: string; bg: string; border: string; Icon: React.FC<{ className?: string }>; price: string; duration: string }> = {
  Trial: {
    label: 'Trial',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    Icon: CheckCircle,
    price: 'Free',
    duration: '15 days',
  },
  Silver: {
    label: 'Silver',
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-300',
    Icon: Shield,
    price: 'Rs 999',
    duration: '6 months',
  },
  Gold: {
    label: 'Gold',
    color: 'text-yellow-700',
    bg: 'bg-yellow-50',
    border: 'border-yellow-400',
    Icon: Crown,
    price: 'Rs 1,799',
    duration: '1 year',
  },
  Diamond: {
    label: 'Diamond',
    color: 'text-indigo-700',
    bg: 'bg-indigo-50',
    border: 'border-indigo-400',
    Icon: Gem,
    price: 'Rs 4,999',
    duration: 'Lifetime',
  },
};

const PLAN_ORDER: PlanType[] = ['Silver', 'Gold', 'Diamond'];

function statusBadge(status: string, daysRemaining: number | null) {
  if (status === 'Active') {
    if (daysRemaining !== null && daysRemaining <= 14) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
          <AlertTriangle className="h-3 w-3" />
          Expiring soon ({daysRemaining}d)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
        <CheckCircle className="h-3 w-3" />
        Active
      </span>
    );
  }
  if (status === 'Expired') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
      {status}
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
  const router = useRouter();
  const { refreshSubscription } = useAuth();
  const [sub, setSub]           = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading]   = useState(true);
  const [renewing, setRenewing] = useState(false);
  const [upgrading, setUpgrading] = useState<PlanType | null>(null);

  useEffect(() => {
    subscriptionService.getMine()
      .then(setSub)
      .catch(() => {
        toast.error('Could not load subscription details.');
        router.replace('/dashboard');
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleRenew = async () => {
    if (!sub) return;
    setRenewing(true);
    try {
      const updated = await subscriptionService.renew();
      setSub(updated);
      await refreshSubscription();
      toast.success('Subscription renewed successfully!');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Renewal failed. Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    if (!sub || plan === sub.planType) return;
    setUpgrading(plan);
    try {
      const updated = await subscriptionService.upgrade({ newPlan: plan });
      setSub(updated);
      await refreshSubscription();
      toast.success(`Upgraded to ${plan} plan!`);
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  if (loading) {
    return (
      <AppLayout title="Subscription & Billing">
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner className="h-8 w-8 text-blue-600" />
        </div>
      </AppLayout>
    );
  }

  if (!sub) return null;

  const meta = PLAN_META[sub.planType];
  const PlanIcon = meta.Icon;
  const isLifetime = sub.endDate === null;
  const upgradePlans = PLAN_ORDER.filter((p) => p !== sub.planType);

  return (
    <AppLayout title="Subscription & Billing">
      <div className="mx-auto max-w-3xl space-y-6">

        {/* ── Current plan card ─────────────────────────────────────────── */}
        <div className={`rounded-2xl border-2 ${meta.border} bg-white p-6 shadow-sm`}>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${meta.bg}`}>
                <PlanIcon className={`h-7 w-7 ${meta.color}`} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-xl font-bold ${meta.color}`}>{meta.label} Plan</h2>
                  {statusBadge(sub.status, sub.daysRemaining)}
                </div>
                <p className="mt-0.5 text-sm text-slate-500">{meta.price} / {meta.duration}</p>
              </div>
            </div>

            {/* Renew button — shown for non-Diamond or expired plans */}
            {(!isLifetime || sub.status !== 'Active') && (
              <button
                onClick={handleRenew}
                disabled={renewing}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {renewing
                  ? <LoadingSpinner className="h-4 w-4 text-white" />
                  : <RefreshCw className="h-4 w-4" />}
                {renewing ? 'Renewing…' : 'Renew'}
              </button>
            )}
          </div>

          {/* Dates */}
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Calendar className="h-3.5 w-3.5" />
                Start Date
              </p>
              <p className="text-sm font-bold text-slate-800">
                {format(new Date(sub.startDate), 'dd MMM yyyy')}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Expiry Date
              </p>
              <p className="text-sm font-bold text-slate-800">
                {isLifetime ? '∞ Lifetime' : format(new Date(sub.endDate!), 'dd MMM yyyy')}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <CreditCard className="h-3.5 w-3.5" />
                Days Remaining
              </p>
              <p className={`text-sm font-bold ${
                isLifetime
                  ? 'text-indigo-700'
                  : sub.daysRemaining !== null && sub.daysRemaining <= 14
                  ? 'text-orange-600'
                  : 'text-slate-800'
              }`}>
                {isLifetime ? 'Lifetime' : sub.daysRemaining !== null ? `${sub.daysRemaining} days` : 'Expired'}
              </p>
            </div>
          </div>

          {sub.paymentReference && (
            <p className="mt-4 text-xs text-slate-400">
              Payment reference: <span className="font-mono text-slate-600">{sub.paymentReference}</span>
            </p>
          )}
        </div>

        {/* ── Upgrade options ───────────────────────────────────────────── */}
        {upgradePlans.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 font-bold text-slate-800">
              <ArrowUpCircle className="h-5 w-5 text-blue-600" />
              Change Plan
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              {upgradePlans.map((planId) => {
                const pm = PLAN_META[planId];
                const Icon = pm.Icon;
                const isDowngrade = PLAN_ORDER.indexOf(planId) < PLAN_ORDER.indexOf(sub.planType);
                const isUpgrading = upgrading === planId;

                return (
                  <div
                    key={planId}
                    className={`flex items-center justify-between rounded-xl border ${pm.border} ${pm.bg} p-4`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-6 w-6 ${pm.color}`} />
                      <div>
                        <p className={`text-sm font-bold ${pm.color}`}>{pm.label}</p>
                        <p className="text-xs text-slate-500">{pm.price} / {pm.duration}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUpgrade(planId)}
                      disabled={!!upgrading}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-60 shadow
                        ${isDowngrade ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {isUpgrading
                        ? <LoadingSpinner className="h-3.5 w-3.5 text-white" />
                        : <ArrowUpCircle className="h-3.5 w-3.5" />}
                      {isUpgrading ? 'Processing…' : isDowngrade ? 'Downgrade' : 'Upgrade'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info note */}
        <p className="text-center text-xs text-slate-400">
          Plan changes take effect immediately. Contact support if you need a refund.
        </p>
      </div>
    </AppLayout>
  );
}
