'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  LoaderCircle,
} from 'lucide-react';
import { loginAction } from '@/app/login/actions';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3 text-[13.5px] font-semibold text-slate-900 shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_8px_24px_-12px_rgba(0,0,0,0.6)] transition-all duration-150 hover:bg-slate-100 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
    >
      {pending ? (
        <>
          <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />
          <span>Prijava u tijeku…</span>
        </>
      ) : (
        <>
          <span>Prijava</span>
          <ArrowRight className="h-4 w-4 text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}

export default function LoginForm({ error }: { error?: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={loginAction} className="space-y-5" noValidate>
      {/* Email */}
      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          E-mail adresa
        </label>
        <div className="group relative">
          <Mail
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-slate-300"
            aria-hidden
          />
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="ime@vasdomen.com"
            autoComplete="email"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pl-10 text-[13.5px] text-white placeholder-slate-600 transition-all duration-150 focus:border-white/20 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-white/10"
          />
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-[10.5px] font-semibold uppercase tracking-[0.18em] text-slate-500"
        >
          Lozinka
        </label>
        <div className="group relative">
          <Lock
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-slate-300"
            aria-hidden
          />
          <input
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            required
            placeholder="Unesite lozinku"
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 pl-10 pr-11 text-[13.5px] text-white placeholder-slate-600 transition-all duration-150 focus:border-white/20 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-white/10"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Sakrij lozinku' : 'Prikaži lozinku'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition-colors hover:bg-white/5 hover:text-slate-300 focus:outline-none focus:ring-2 focus:ring-white/15"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3.5 py-3 text-[12.5px] text-red-300 animate-fade-in"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <div className="pt-1">
        <SubmitButton />
      </div>
    </form>
  );
}
