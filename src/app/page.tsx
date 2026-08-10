import Link from 'next/link';
import {
  Activity, ArrowRight, CheckCircle, Shield, Crown, Gem,
  Pill, BarChart3, Users, Package,
} from 'lucide-react';

const highlights = [
  { icon: Pill,     label: 'Inventory tracking'    },
  { icon: BarChart3, label: 'Sales analytics'       },
  { icon: Users,    label: 'Role-based access'      },
  { icon: Package,  label: 'Batch & expiry mgmt'    },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white">

      {/* ── Nav ──────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-slate-900/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight">PharmaCare PMS</span>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <Link href="/features"      className="hover:text-white transition-colors">Features</Link>
            <Link href="/signup"        className="hover:text-white transition-colors">Pricing</Link>
            <Link href="/login"         className="hover:text-white transition-colors">Sign In</Link>
          </nav>
          <Link
            href="/signup"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-500 transition-colors"
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-28 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold text-blue-300">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
          Multi-tenant SaaS · Silver / Gold / Diamond plans
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
          The smarter way to{' '}
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            run your pharmacy
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-slate-400 leading-relaxed">
          PharmaCare PMS handles inventory, billing, expiry tracking, and reporting —
          so you can focus on your patients, not your spreadsheets.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/features"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-colors"
          >
            See all features
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold hover:bg-white/10 transition-colors"
          >
            Sign in
          </Link>
        </div>

        {/* Quick feature pills */}
        <div className="mt-12 flex flex-wrap justify-center gap-3">
          {highlights.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300"
            >
              <Icon className="h-4 w-4 text-blue-400" />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing tiers teaser ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-3xl px-6 pb-28">
        <p className="mb-8 text-center text-sm font-semibold uppercase tracking-widest text-slate-500">
          Simple plans, no hidden fees
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { Icon: Shield, name: 'Silver', price: 'Rs 1,999', period: '6 months', color: 'text-slate-300'  },
            { Icon: Crown,  name: 'Gold',   price: 'Rs 3,499', period: '1 year',   color: 'text-yellow-400', highlight: true },
            { Icon: Gem,    name: 'Diamond',price: 'Rs 8,999', period: 'Lifetime', color: 'text-indigo-400' },
          ].map(({ Icon, name, price, period, color, highlight }) => (
            <Link
              key={name}
              href="/signup"
              className={`group flex flex-col items-center rounded-2xl border p-6 text-center transition-all hover:scale-[1.02]
                ${highlight
                  ? 'border-yellow-400/50 bg-yellow-400/10 shadow-lg shadow-yellow-400/10'
                  : 'border-white/10 bg-white/5 hover:border-white/20'}`}
            >
              <Icon className={`h-7 w-7 ${color}`} />
              <p className="mt-3 text-base font-bold text-white">{name}</p>
              <p className={`mt-1 text-xl font-extrabold ${color}`}>{price}</p>
              <p className="text-xs text-slate-500">{period}</p>
              <div className={`mt-4 flex items-center gap-1 text-xs font-semibold transition-colors
                ${highlight ? 'text-yellow-400' : 'text-blue-400 group-hover:text-blue-300'}`}>
                Get started <ArrowRight className="h-3 w-3" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 py-8 text-center text-xs text-slate-600">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
          <span className="text-slate-400">HIPAA-ready data isolation · Encrypted credentials · Audit logs</span>
        </div>
        © 2026 PharmaCare PMS. All rights reserved.
      </footer>
    </div>
  );
}
