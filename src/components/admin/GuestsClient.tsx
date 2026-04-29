'use client';

import Link from 'next/link';
import {
  ChangeEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Search,
  Users,
  Mail,
  Phone,
  Globe,
  ChevronDown,
  UserCheck,
  Wallet,
  Star,
  X,
  Command,
} from 'lucide-react';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import type { Booking } from '@/types/database';

export interface GuestRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  totalBookings: number;
  totalSpent: number;
  lastBooking: string;
  bookings: Booking[];
}

const statusLabels: Record<string, string> = {
  pending: 'Na čekanju',
  confirmed: 'Potvrđeno',
  checked_in: 'Prijavljeno',
  checked_out: 'Odjavljeno',
  cancelled: 'Otkazano',
};

const paymentLabels: Record<string, string> = {
  unpaid: 'Neplaćeno',
  paid: 'Plaćeno',
  partial: 'Djelomično',
};

const avatarPalettes = [
  'from-blue-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-500 to-fuchsia-600',
  'from-cyan-500 to-blue-600',
  'from-lime-500 to-emerald-600',
  'from-indigo-500 to-blue-600',
];

function paletteFor(key: string) {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return avatarPalettes[h % avatarPalettes.length];
}

export default function GuestsClient({
  guests,
  currencySymbol,
  initialQuery = '',
  initialExpanded = null,
}: {
  guests: GuestRow[];
  currencySymbol: string;
  initialQuery?: string;
  initialExpanded?: string | null;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [expandedKey, setExpandedKey] = useState<string | null>(initialExpanded);
  const inputRef = useRef<HTMLInputElement>(null);

  const trimmed = query.trim().toLowerCase();

  /* ── Filter ─────────────────────────────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!trimmed) return guests;
    return guests.filter(
      (g) =>
        g.name.toLowerCase().includes(trimmed) ||
        g.email?.toLowerCase().includes(trimmed) ||
        g.phone?.toLowerCase().includes(trimmed) ||
        g.country?.toLowerCase().includes(trimmed),
    );
  }, [guests, trimmed]);

  /* ── Reactive summary based on the filter ──────────────────────────── */
  const summary = useMemo(() => {
    const totalRevenue = filtered.reduce((s, g) => s + g.totalSpent, 0);
    const totalBookings = filtered.reduce((s, g) => s + g.totalBookings, 0);
    const avg = filtered.length ? totalRevenue / filtered.length : 0;
    const top = filtered.reduce<GuestRow | null>(
      (best, g) => (best && best.totalSpent > g.totalSpent ? best : g),
      null,
    );
    return { totalRevenue, totalBookings, avg, top };
  }, [filtered]);

  /* ── Sync URL without RSC roundtrip ────────────────────────────────── */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id = window.setTimeout(() => {
      const url = new URL(window.location.href);
      if (trimmed) url.searchParams.set('q', query.trim());
      else url.searchParams.delete('q');
      if (expandedKey) url.searchParams.set('expand', expandedKey);
      else url.searchParams.delete('expand');
      const next = url.pathname + (url.search ? url.search : '');
      if (next !== window.location.pathname + window.location.search) {
        window.history.replaceState(null, '', next);
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [query, trimmed, expandedKey]);

  /* ── Cmd/Ctrl+K and "/" shortcuts to focus search ─────────────────── */
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        return;
      }
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable;
      if (!isTyping && e.key === '/') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value);
  const handleEsc = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape' && query) {
      e.preventDefault();
      setQuery('');
    }
  };
  const clear = useCallback(() => {
    setQuery('');
    inputRef.current?.focus();
  }, []);

  const toggle = (key: string) => {
    setExpandedKey((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-7">
      {/* ── Reactive summary stats (responds to filter) ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryStat
          icon={Users}
          label={trimmed ? 'Pronađenih gostiju' : 'Ukupno gostiju'}
          value={String(filtered.length)}
          accent="blue"
        />
        <SummaryStat
          icon={UserCheck}
          label="Rezervacija"
          value={String(summary.totalBookings)}
          accent="emerald"
        />
        <SummaryStat
          icon={Wallet}
          label="Prihod"
          value={formatCurrency(summary.totalRevenue, currencySymbol)}
          accent="amber"
        />
        <SummaryStat
          icon={Star}
          label={summary.top ? `Top: ${summary.top.name.split(' ')[0]}` : 'Prosjek'}
          value={formatCurrency(
            summary.top ? summary.top.totalSpent : summary.avg,
            currencySymbol,
          )}
          accent="violet"
        />
      </div>

      {/* ── Live search input ── */}
      <div
        className={cn(
          'relative bg-white rounded-2xl border border-slate-200/80 p-2 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all',
          'focus-within:border-blue-300 focus-within:shadow-[0_4px_22px_-10px_rgba(37,99,235,0.35)]',
        )}
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={handleInput}
            onKeyDown={handleEsc}
            placeholder="Pretraži po imenu, e-mailu, telefonu, državi…"
            autoComplete="off"
            spellCheck={false}
            className="w-full h-11 pl-10 pr-32 bg-transparent text-[13.5px] focus:outline-none placeholder-slate-400"
          />

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {query ? (
              <button
                type="button"
                onClick={clear}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                aria-label="Očisti pretragu"
              >
                <X className="w-3 h-3" /> Očisti
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 h-6 rounded-md text-[10.5px] font-bold text-slate-400 bg-slate-50 ring-1 ring-slate-200 tabular-nums">
                <Command className="w-3 h-3" />K
              </kbd>
            )}
          </div>
        </div>

        {trimmed && (
          <p className="px-3 pt-2 pb-1 text-[11.5px] font-medium text-slate-400">
            <span className="text-slate-700 font-bold tabular-nums">{filtered.length}</span> od{' '}
            <span className="tabular-nums">{guests.length}</span> gostiju odgovara{' '}
            <span className="text-slate-700 font-semibold">“{query.trim()}”</span>
          </p>
        )}
      </div>

      {/* ── Guests list ── */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-4">
              <Search className="w-6 h-6 text-slate-300" />
            </div>
            <p className="text-[14px] font-semibold text-slate-600">
              {trimmed ? 'Nema pronađenih gostiju' : 'Još nema gostiju'}
            </p>
            <p className="text-[12.5px] text-slate-400 mt-1">
              {trimmed
                ? <>Nije pronađen niti jedan gost za <span className="font-semibold text-slate-600">“{query.trim()}”</span>.</>
                : 'Kada gosti rezerviraju, pojavit će se ovdje.'}
            </p>
            {trimmed && (
              <button
                type="button"
                onClick={clear}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                <X className="w-3 h-3" /> Očisti pretragu
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {filtered.map((guest) => {
              const isExpanded = expandedKey === guest.key;
              const palette = paletteFor(guest.key);
              const isTop = summary.top?.key === guest.key && filtered.length > 1;

              return (
                <li key={guest.key} className="group">
                  <button
                    type="button"
                    onClick={() => toggle(guest.key)}
                    aria-expanded={isExpanded}
                    className="w-full text-left flex flex-col md:flex-row md:items-center gap-3 md:gap-4 px-5 py-4 hover:bg-slate-50/70 active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <div
                          className={cn(
                            'w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white text-[14px] font-bold tracking-tight ring-2 ring-white shadow-[0_4px_12px_-4px_rgba(15,23,42,0.25)]',
                            palette,
                          )}
                        >
                          {guest.name.charAt(0).toUpperCase()}
                        </div>
                        {isTop && (
                          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-400 ring-2 ring-white flex items-center justify-center shadow-sm">
                            <Star className="w-2.5 h-2.5 text-white fill-white" />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-900 truncate tracking-tight">
                          <Highlight text={guest.name} q={trimmed} />
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                          {guest.email && (
                            <span className="flex items-center gap-1 text-[11.5px] text-slate-500 truncate max-w-[200px]">
                              <Mail className="w-3 h-3 flex-shrink-0 text-slate-400" />
                              <Highlight text={guest.email} q={trimmed} />
                            </span>
                          )}
                          {guest.phone && (
                            <span className="flex items-center gap-1 text-[11.5px] text-slate-500">
                              <Phone className="w-3 h-3 text-slate-400" />
                              <Highlight text={guest.phone} q={trimmed} />
                            </span>
                          )}
                          {guest.country && (
                            <span className="flex items-center gap-1 text-[11.5px] text-slate-500">
                              <Globe className="w-3 h-3 text-slate-400" />
                              <Highlight text={guest.country} q={trimmed} />
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-5 md:flex-shrink-0">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-100 tabular-nums">
                        {guest.totalBookings} {guest.totalBookings === 1 ? 'rezervacija' : 'rezervacija'}
                      </span>
                      <div className="text-right">
                        <p className="text-[14px] font-bold text-slate-900 tabular-nums leading-none">
                          {formatCurrency(guest.totalSpent, currencySymbol)}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
                          {formatDate(guest.lastBooking)}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all flex-shrink-0',
                          isExpanded && 'bg-slate-900 text-white group-hover:bg-slate-900',
                        )}
                      >
                        <ChevronDown
                          className={cn('w-4 h-4 transition-transform duration-200', isExpanded && 'rotate-180')}
                        />
                      </div>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="bg-slate-50/70 px-5 py-5 border-t border-slate-100 animate-fade-in">
                      <h4 className="text-[10.5px] font-semibold text-slate-500 uppercase tracking-[0.14em] mb-3">
                        Povijest rezervacija
                      </h4>
                      <div className="space-y-2">
                        {guest.bookings.map((b) => (
                          <Link
                            key={b.id}
                            href={`/admin/calendar?id=${b.id}`}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white rounded-xl px-4 py-3 border border-slate-200/80 hover:border-slate-300 hover:shadow-[0_4px_14px_-6px_rgba(15,23,42,0.12)] active:scale-[0.99] transition-all"
                          >
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                              <span className="text-[13px] font-bold text-slate-900">
                                {(b.property as unknown as { name: string })?.name || 'Nepoznato'}
                              </span>
                              <span className="text-[12px] text-slate-500 tabular-nums">
                                {formatDate(b.check_in, 'dd.MM.')} – {formatDate(b.check_out, 'dd.MM.yyyy')}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold',
                                  getStatusColor(b.status),
                                )}
                              >
                                {statusLabels[b.status]}
                              </span>
                              <span
                                className={cn(
                                  'inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold',
                                  getStatusColor(b.payment_status),
                                )}
                              >
                                {paymentLabels[b.payment_status] || b.payment_status}
                              </span>
                            </div>
                            <span className="text-[13.5px] font-bold text-slate-900 tabular-nums">
                              {formatCurrency(b.total_price, currencySymbol)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function Highlight({ text, q }: { text: string; q: string }) {
  if (!q || !text) return <>{text}</>;
  // Split on the query (case-insensitive). Capturing group keeps the matched
  // segments in the resulting array so we can render them as <mark>.
  const parts = text.split(new RegExp(`(${escapeRegExp(q)})`, 'i'));
  const lowerQ = q.toLowerCase();
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === lowerQ ? (
          <mark
            key={i}
            className="bg-amber-100 text-amber-900 rounded px-0.5 -mx-0.5 font-semibold"
          >
            {p}
          </mark>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

const summaryAccents = {
  blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', iconRing: 'ring-blue-100' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', iconRing: 'ring-emerald-100' },
  amber: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', iconRing: 'ring-amber-100' },
  violet: { iconBg: 'bg-violet-50', iconText: 'text-violet-600', iconRing: 'ring-violet-100' },
} as const;

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  accent: keyof typeof summaryAccents;
}) {
  const c = summaryAccents[accent];
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white ring-1 ring-slate-200/80 shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
      <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl ring-1 flex-shrink-0', c.iconBg, c.iconRing)}>
        <Icon className={cn('w-[17px] h-[17px]', c.iconText)} strokeWidth={2.2} />
      </div>
      <div className="min-w-0">
        <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em] truncate">{label}</p>
        <p className="text-[15px] font-bold text-slate-900 tabular-nums leading-tight mt-0.5 truncate">{value}</p>
      </div>
    </div>
  );
}
