import Link from 'next/link';
import type { Viewport } from 'next';
import { ArrowLeft, Building2 } from 'lucide-react';
import LoginForm from '@/components/admin/LoginForm';

export const metadata = {
  title: 'Prijava — Admin',
  description: 'Prijavite se za upravljanje nekretninama.',
};

export const viewport: Viewport = {
  themeColor: '#0b1120',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;

  return (
    <main data-route="login" className="relative min-h-screen overflow-hidden bg-[#0b1120] text-white">
      {/* ── Ambient layer (very subtle) ──────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(59,130,246,0.10),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
          maskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse at center, black 30%, transparent 75%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-slate-700/60 to-transparent"
      />

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 rounded-lg px-2 py-1.5 -ml-2 text-[13px] font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span>Povratak na stranicu</span>
        </Link>

        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600">
          Admin
        </span>
      </header>

      {/* ── Centered content ─────────────────────────────────────────── */}
      <section className="relative z-10 flex min-h-[calc(100svh-72px)] items-center justify-center px-5 pb-12 sm:px-8">
        <div className="w-full max-w-[400px] animate-fade-up-slow">
          {/* Brand mark */}
          <div className="mb-9 flex flex-col items-center text-center">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-md">
              <Building2 className="h-5 w-5 text-slate-200" strokeWidth={2} />
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">
              Prijava u Admin
            </h1>
            <p className="mt-1.5 max-w-[30ch] text-[13px] leading-relaxed text-slate-500">
              Upravljajte rezervacijama, kalendarom i nekretninama.
            </p>
          </div>

          {/* Glass card */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-7 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-8">
              {/* Inner top highlight */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent"
              />
              <LoginForm error={error} />
            </div>
          </div>

          {/* Footer note */}
          <p className="mt-6 text-center text-[11.5px] text-slate-600">
            Pristup ograničen na ovlaštene administratore.
          </p>
        </div>
      </section>
    </main>
  );
}
