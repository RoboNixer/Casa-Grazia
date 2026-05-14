'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/i18n/client';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n/config';

interface Props {
  /** Light foreground (for transparent header over dark hero) vs ink foreground. */
  lightOnTop?: boolean;
  /** Compact = icon + short code; full = icon + native name. Default compact. */
  variant?: 'compact' | 'full';
  className?: string;
}

export default function LanguageSwitcher({
  lightOnTop = false,
  variant = 'compact',
  className,
}: Props) {
  const { locale, setLocale, t } = useT();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = LOCALE_LABELS[locale];

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.header.languageLabel}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-mono text-[11px] tracking-[0.18em] uppercase transition-all duration-300',
          'border backdrop-blur-sm',
          lightOnTop
            ? 'border-white/30 text-white hover:bg-white/10'
            : 'border-emerald-900/[0.12] text-ink hover:border-emerald-700/60 hover:text-emerald-700',
        )}
      >
        <Globe className="w-3.5 h-3.5" aria-hidden />
        <span className="font-semibold">
          {variant === 'full' ? current.native : current.short}
        </span>
        <ChevronDown
          className={cn(
            'w-3 h-3 transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t.header.languageLabel}
          className="absolute right-0 mt-2 min-w-[160px] rounded-2xl bg-white shadow-premium border border-emerald-900/[0.08] py-1.5 z-50 animate-fade-in"
        >
          {LOCALES.map((l) => {
            const meta = LOCALE_LABELS[l];
            const active = l === locale;
            return (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(l as Locale);
                    setOpen(false);
                  }}
                  className={cn(
                    'group w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors',
                    active
                      ? 'text-emerald-700 font-semibold'
                      : 'text-ink hover:text-emerald-700 hover:bg-emerald-50/60',
                  )}
                >
                  <span aria-hidden className="text-[15px] leading-none">
                    {meta.flag}
                  </span>
                  <span className="flex-1 truncate">{meta.native}</span>
                  {active && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
