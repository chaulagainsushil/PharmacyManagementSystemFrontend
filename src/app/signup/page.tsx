'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  Activity, Eye, EyeOff, Lock, Mail, User, Building2,
  Crown, Gem, Shield, CheckCircle, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { authService } from '@/services/authService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { PlanType, TenantSignupDto } from '@/types';

// ── Plan definitions ────────────────────────────────────────────────────────

interface PlanDef {
  id: PlanType;
  name: string;
  price: string;
  duration: string;
  description: string;
  features: string[];
  highlight: boolean;
  color: string;
  border: string;
  badge?: string;
  Icon: React.FC<{ className?: string }>;
}

const PLANS: PlanDef[] = [
  {
    id: 'Silver',
    name: 'Silver',
    price: 'Rs 1,999',
    duration: '6 months',
    description: 'Great for small clinics getting started',
    features: [
      'Full medicine inventory',
      'Sales & billing',
      'Batch tracking',
      'Disposal records',
      'Customer management',
      '6-month access',
    ],
    highlight: false,
    color: 'text-slate-700',
    border: 'border-slate-300',
    Icon: Shield,
  },
  {
    id: 'Gold',
    name: 'Gold',
    price: 'Rs 3,499',
    duration: '1 year',
    description: 'Best value for growing pharmacies',
    features: [
      'Everything in Silver',
      'Advanced reports',
      'Near-expiry alerts',
      'Multi-user support',
      'Priority support',
      '12-month access',
    ],
    highlight: true,
    badge: 'Most Popular',
    color: 'text-yellow-700',
    border: 'border-yellow-400',
    Icon: Crown,
  },
  {
    id: 'Diamond',
    name: 'Diamond',
    price: 'Rs 8,999',
    duration: 'Lifetime',
    description: 'One-time purchase, lifetime access',
    features: [
      'Everything in Gold',
      'Never expires',
      'Free upgrades',
      'Dedicated support',
      'API access',
      'Lifetime access',
    ],
    highlight: false,
    color: 'text-indigo-700',
    border: 'border-indigo-400',
    badge: 'Best Deal',
    Icon: Gem,
  },
];

// ── Registration form shape ──────────────────────────────────────────────────

interface RegistrationForm {
  pharmacyName: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep]            = useState<1 | 2>(1);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('Gold');
  const [showPw, setShowPw]        = useState(false);
  const [showCon, setShowCon]      = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegistrationForm>();

  const password = watch('password');

  const onSubmit = async (data: RegistrationForm) => {
    setSubmitting(true);
    try {
      const dto: TenantSignupDto = {
        fullName:     data.fullName,
        email:        data.email,
        password:     data.password,
        confirmPassword: data.confirmPassword,
        pharmacyName: data.pharmacyName,
        initialPlan:  selectedPlan,
      };
      const res = await authService.tenantSignup(dto);
      if (!res.isSuccess) {
        // Surface tenant-specific error messages from the API
        toast.error(res.message || 'Registration failed. Please try again.');
        return;
      }
      toast.success('Pharmacy registered! Please log in to continue.');
      router.replace('/login');
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      // Handle ASP.NET model validation errors and business rule errors
      const apiData = err.response?.data;
      if (apiData?.errors) {
        const firstMsg = Object.values(apiData.errors).flat()[0];
        toast.error(firstMsg ?? 'Validation failed');
      } else {
        toast.error(apiData?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
      <div className={`w-full ${step === 1 ? 'max-w-3xl' : 'max-w-sm'}`}>
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-500/30">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-white">PharmaCare PMS</h1>
          <p className="mt-1 text-sm text-slate-400">
            {step === 1 ? 'Choose your subscription plan' : 'Set up your pharmacy account'}
          </p>

          {/* Step indicator */}
          <div className="mt-4 flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
              ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              1
            </div>
            <div className={`h-0.5 w-12 transition-colors ${step >= 2 ? 'bg-blue-600' : 'bg-slate-700'}`} />
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-colors
              ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              2
            </div>
          </div>
          <div className="mt-1 flex gap-10 text-xs text-slate-500">
            <span className={step === 1 ? 'text-slate-300' : 'text-slate-500'}>Choose Plan</span>
            <span className={step === 2 ? 'text-slate-300' : 'text-slate-500'}>Register</span>
          </div>
        </div>

        {/* ── Step 1: Plan picker ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="grid gap-4 md:grid-cols-3">
            {PLANS.map((plan) => {
              const active = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`relative flex flex-col rounded-2xl border-2 bg-white p-6 text-left shadow-lg transition-all duration-200
                    ${active ? `${plan.border} shadow-xl scale-[1.02]` : 'border-transparent hover:border-slate-200'}
                    ${plan.highlight && !active ? 'ring-2 ring-yellow-400/40' : ''}`}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <span className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-bold text-white shadow
                      ${plan.id === 'Gold' ? 'bg-yellow-500' : 'bg-indigo-600'}`}>
                      {plan.badge}
                    </span>
                  )}

                  {/* Icon + Name */}
                  <div className="mb-4 flex items-center gap-3">
                    <plan.Icon className={`h-7 w-7 ${plan.color}`} />
                    <span className={`text-lg font-bold ${plan.color}`}>{plan.name}</span>
                    {active && <CheckCircle className="ml-auto h-5 w-5 text-blue-600" />}
                  </div>

                  {/* Price */}
                  <div className="mb-1">
                    <span className="text-2xl font-extrabold text-slate-900">{plan.price}</span>
                  </div>
                  <div className="mb-3 text-xs font-medium text-slate-500">{plan.duration}</div>
                  <p className="mb-4 text-xs text-slate-500">{plan.description}</p>

                  {/* Features */}
                  <ul className="space-y-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}

            {/* Continue button */}
            <div className="md:col-span-3 flex justify-center mt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 transition-colors"
              >
                Continue with {selectedPlan}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <p className="md:col-span-3 text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-400 hover:underline">Sign In</Link>
            </p>
          </div>
        )}

        {/* ── Step 2: Registration form ───────────────────────────────────── */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-2xl">
            {/* Selected plan summary */}
            <div className="mb-5 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3">
              {(() => {
                const p = PLANS.find((x) => x.id === selectedPlan)!;
                return (
                  <>
                    <p.Icon className={`h-5 w-5 ${p.color}`} />
                    <span className="text-sm font-semibold text-slate-700">
                      {p.name} Plan — {p.price} / {p.duration}
                    </span>
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="ml-auto flex items-center gap-1 text-xs text-blue-600 hover:underline"
                    >
                      <ArrowLeft className="h-3 w-3" />
                      Change
                    </button>
                  </>
                );
              })()}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Pharmacy Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Pharmacy Name</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City Pharmacy & Medical Store"
                    autoComplete="organization"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    {...register('pharmacyName', { required: 'Pharmacy name is required' })}
                  />
                </div>
                {errors.pharmacyName && <p className="text-xs text-red-600">{errors.pharmacyName.message}</p>}
              </div>

              {/* Full Name */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Your Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ram Prasad Sharma"
                    autoComplete="name"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    {...register('fullName', { required: 'Full name is required' })}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-600">{errors.fullName.message}</p>}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    placeholder="admin@citypharmacy.com"
                    autoComplete="email"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    {...register('email', { required: 'Email is required' })}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    {...register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters' },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type={showCon ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                    className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (v) => v === password || 'Passwords do not match',
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCon(!showCon)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCon ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-60 transition-colors mt-2"
              >
                {submitting && <LoadingSpinner className="h-4 w-4 text-white" />}
                {submitting ? 'Creating pharmacy…' : 'Create Pharmacy Account'}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-blue-600 hover:underline">Sign In</Link>
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-500">
          Pharmacy Management System © 2026
        </p>
      </div>
    </div>
  );
}
