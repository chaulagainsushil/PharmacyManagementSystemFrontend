'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  AlertTriangle, RefreshCw, LogOut, CreditCard,
  Crown, Gem, Shield, ArrowUpCircle,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { subscriptionService } from '@/services/subscriptionService';
import { useAuth } from '@/context/AuthContext';
import type { PlanType } from '@/types';

// ── Plan cards for upgrade ───────────────────────────────────────────────────

const PLANS: { id: PlanType; name: string; price: string; duration: string; color: string; bg: string; border: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: 'Silver',  name: 'Silver',  price: 'Rs 1,999', duration: '6 months', color: 'text-slate-700',  bg: 'bg-slate-50',   border: 'border-slate-300',  Icon: Shield },
  { id: 'Gold',    name: 'Gold',    price: 'Rs 3,499', duration: '1 year',   color: 'text-yellow-700', bg: 'bg-yellow-50',  border: 'border-yellow-400', Icon: Crown  },
  { id: 'Diamond', name: 'Diamond', price: 'Rs 8,999', duration: 'Lifetime', color: 'text-indigo-700', bg: 'bg-indigo-50',  border: 'border-indigo-400', Icon: Gem    },
];

// ── Page ─────────────────────────────────────────────────────────────────────

export default function SubscriptionExpiredPage() {
  const router = useRouter();
  const { logout, subscription, refreshSubscription } = useAuth();
  const [renewing, setRenewing]     = useState(false);
  const [upgrading, setUpgrading]   = useState<PlanType | null>(null);

  const handleRenew = async () => {
    setRenewing(true);
    try {
      await subscriptionService.renew();
      await refreshSubscription();
      toast.success('Subscription renewed! Welcome back.');
      router.replace('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Renewal failed. Please try again.');
    } finally {
      setRenewing(false);
    }
  };

  const handleUpgrade = async (plan: PlanType) => {
    setUpgrading(plan);
    try {
      await subscriptionService.upgrade({ newPlan: plan });
      await refreshSubscription();
      toast.success(`Upgraded to ${plan}! Welcome back.`);
      router.replace('/dashboard');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message ?? 'Upgrade failed. Please try again.');
    } finally {
      setUpgrading(null);
    }
  };

  const currentPlan = subscription?.planType;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-4">
      <div className="w-full max-w-md">

        {/* Warning icon */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20 ring-4 ring-red-500/30">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="mt-5 text-2xl font-bold text-white">Subscription Expired</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xs">
            Your subscription has expired. Renew your current plan or upgrade to restore access
            to PharmaCare PMS.
          </p>
          {currentPlan && (
            <div className="mt-3 rounded-full bg-slate-800 px-4 py-1.5 text-xs text-slate-300">
              Current plan: <span className="font-semibold text-white">{currentPlan}</span>
            </div>
          )}
        </div>

        {/* Renew card */}
        <div className="rounded-2xl bg-white p-6 shadow-2xl mb-4">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="h-5 w-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Renew Current Plan</h2>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Continue with your existing{' '}
            <span className="font-semibold">{currentPlan ?? 'subscription'}</span> plan.
          </p>
          <button
            onClick={handleRenew}
            disabled={renewing || !!upgrading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {renewing
              ? <LoadingSpinner className="h-4 w-4 text-white" />
              : <RefreshCw className="h-4 w-4" />}
            {renewing ? 'Processing…' : 'Renew Now'}
          </button>
        </div>

        {/* Upgrade options */}
        <div className="rounded-2xl bg-white/5 border border-white/10 p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpCircle className="h-5 w-5 text-slate-300" />
            <h2 className="font-bold text-white">Or Upgrade Your Plan</h2>
          </div>

          <div className="space-y-3">
            {PLANS.map((plan) => {
              const Icon = plan.Icon;
              const isCurrent  = plan.id === currentPlan;
              const isUpgrading = upgrading === plan.id;

              return (
                <div
                  key={plan.id}
                  className={`flex items-center justify-between rounded-xl border ${plan.border} ${plan.bg} p-4`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${plan.color}`} />
                    <div>
                      <p className={`text-sm font-bold ${plan.color}`}>{plan.name}</p>
                      <p className="text-xs text-slate-500">{plan.price} / {plan.duration}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={isCurrent || renewing || !!upgrading}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors disabled:opacity-50 shadow
                      ${isCurrent ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {isUpgrading
                      ? <LoadingSpinner className="h-3.5 w-3.5 text-white" />
                      : <ArrowUpCircle className="h-3.5 w-3.5" />}
                    {isCurrent ? 'Current' : isUpgrading ? 'Processing…' : 'Select'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sign out link */}
        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
