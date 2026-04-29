'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  Edit2,
  X,
  Save,
  ImageIcon,
  TrendingUp,
  Building2,
  Tag,
  Loader2,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';
import { cn, formatCurrency } from '@/lib/utils';
import { propUpdatePricing } from '@/app/admin/actions';
import type { Property, PropertyImage } from '@/types/database';

type PropertyWithImages = Property & { images?: PropertyImage[] };

export type PricingModalState = null | { kind: 'edit'; id: string };

export default function PricingClient({
  initialProperties,
  currencySymbol,
  initialModal = null,
}: {
  initialProperties: PropertyWithImages[];
  currencySymbol: string;
  initialModal?: PricingModalState;
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [modal, setModal] = useState<PricingModalState>(initialModal);
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  const editing = useMemo(
    () => (modal?.kind === 'edit' ? properties.find((p) => p.id === modal.id) : undefined),
    [modal, properties],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    if (modal) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  useEffect(() => {
    const root = document.documentElement;
    if (modal) root.classList.add('cal-modal-open');
    else root.classList.remove('cal-modal-open');
    return () => root.classList.remove('cal-modal-open');
  }, [modal]);

  useEffect(() => {
    if (!modal) return;
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, [modal]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  const avgBase = properties.length
    ? properties.reduce((s, p) => s + (p.base_price || 0), 0) / properties.length
    : 0;
  const avgCleaning = properties.length
    ? properties.reduce((s, p) => s + (p.cleaning_fee || 0), 0) / properties.length
    : 0;
  const activeProperties = properties.filter((p) => p.is_active).length;

  return (
    <>
      <div className="space-y-7 animate-fade-up">
        {/* ── Hero header ── */}
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 lg:p-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-amber-500/10 to-rose-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-400/10 to-transparent blur-3xl pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-slate-200 backdrop-blur-sm">
                <Tag className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-semibold text-slate-500 tracking-wide">Cijene</span>
              </div>
              <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
                Cijene
              </h1>
              <p className="text-[13px] text-slate-500 mt-1.5 max-w-xl leading-relaxed">
                Postavite osnovne cijene i naknade za čišćenje za svaku nekretninu.
              </p>
            </div>
          </div>

          {properties.length > 0 && (
            <div className="relative mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <SummaryStat icon={Building2} label="Aktivne nekretnine" value={`${activeProperties}`} accent="blue" />
              <SummaryStat icon={TrendingUp} label="Prosječna cijena / noć" value={formatCurrency(avgBase, currencySymbol)} accent="emerald" />
              <SummaryStat icon={DollarSign} label="Prosječno čišćenje" value={formatCurrency(avgCleaning, currencySymbol)} accent="amber" />
            </div>
          )}
        </header>

        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[14px] font-semibold text-slate-600">Nema nekretnina</p>
            <p className="text-[12.5px] text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
              Dodajte nekretnine u sekciji <span className="font-semibold text-slate-600">Nekretnine</span> kako biste upravljali cijenama.
            </p>
            <Link
              href="/admin/properties"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
            >
              Dodaj nekretninu
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {properties.map((property) => {
              const cover = property.images?.find((i) => i.is_cover) || property.images?.[0];

              return (
                <div
                  key={property.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.12)] transition-shadow duration-300"
                >
                  {/* Property header */}
                  <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 to-transparent">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden ring-1 ring-slate-200">
                        {cover?.url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={cover.url} alt={property.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                            <ImageIcon className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-[15px] font-bold text-slate-900 truncate tracking-tight">{property.name}</h2>
                        <p className="text-[11.5px] text-slate-500 capitalize mt-0.5 flex items-center gap-1.5">
                          <span>{property.property_type}</span>
                          {!property.is_active && (
                            <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-600">
                              Neaktivno
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setModal({ kind: 'edit', id: property.id })}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:border-slate-300 rounded-xl active:scale-95 transition-all flex-shrink-0"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Uredi
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <PriceTile
                        label="Osnovna cijena / noć"
                        value={formatCurrency(property.base_price, currencySymbol)}
                        accent="blue"
                      />
                      <PriceTile
                        label="Naknada čišćenja"
                        value={formatCurrency(property.cleaning_fee, currencySymbol)}
                        accent="amber"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {toast && (
          <div
            role="status"
            className={cn(
              'fixed left-1/2 -translate-x-1/2 z-[2147483647] px-4 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-2xl ring-1 ring-white/10 pointer-events-none',
              toast.kind === 'ok' ? 'bg-emerald-600' : 'bg-red-600',
            )}
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 90px)' }}
          >
            {toast.msg}
          </div>
        )}
      </div>

      {modal && editing && (
        <PricingModalShell
          title="Uredi cijene"
          subtitle={editing.name}
          onClose={() => setModal(null)}
        >
          <PricingEditor
            property={editing}
            currencySymbol={currencySymbol}
            onClose={() => setModal(null)}
            onSaved={(saved) => {
              setProperties((prev) =>
                prev.map((p) => (p.id === saved.id ? { ...p, ...saved } : p)),
              );
              setToast({ kind: 'ok', msg: 'Cijene spremljene' });
              setModal(null);
            }}
            onToast={setToast}
          />
        </PricingModalShell>
      )}
    </>
  );
}

/* ── Modal shell (shared style with PropertiesClient) ─────────────────────── */

function PricingModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[2147483647] animate-fade-in flex items-end sm:items-center justify-center sm:p-4"
      style={{ height: '100dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/82 backdrop-blur-sm cursor-default"
        aria-label="Zatvori"
      />
      <div
        className="relative w-full sm:max-w-2xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden bg-[#0a0e1a] text-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] animate-slide-in-bottom sm:animate-scale-in"
        style={{
          maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 10px)',
          marginBottom: 'max(env(safe-area-inset-bottom), 10px)',
        }}
      >
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 flex-shrink-0">
          <div className="w-10 h-[4px] rounded-full bg-white/15" />
        </div>
        <div className="flex-shrink-0 px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold text-white leading-none truncate">{title}</h2>
            {subtitle && <p className="text-[11.5px] text-slate-400 mt-[4px] truncate">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Zatvori"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PricingEditor({
  property,
  currencySymbol,
  onClose,
  onSaved,
  onToast,
}: {
  property: PropertyWithImages;
  currencySymbol: string;
  onClose: () => void;
  onSaved: (p: Property) => void;
  onToast: (t: { kind: 'ok' | 'err'; msg: string }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [basePrice, setBasePrice] = useState(String(property.base_price ?? 0));
  const [cleaningFee, setCleaningFee] = useState(String(property.cleaning_fee ?? 0));

  const save = () => {
    startTransition(async () => {
      const res = await propUpdatePricing({
        id: property.id,
        base_price: Number(basePrice) || 0,
        cleaning_fee: Number(cleaningFee) || 0,
      });
      if (!res.ok) return onToast({ kind: 'err', msg: res.error });
      onSaved(res.data);
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <CurrencyField
            label="Osnovna cijena / noć"
            value={basePrice}
            onChange={setBasePrice}
            currencySymbol={currencySymbol}
          />
          <CurrencyField
            label="Naknada čišćenja"
            value={cleaningFee}
            onChange={setCleaningFee}
            currencySymbol={currencySymbol}
          />
        </div>

        <p className="text-[11.5px] text-slate-400 leading-relaxed">
          Promjene se odmah primjenjuju na sve nove rezervacije za nekretninu{' '}
          <span className="font-semibold text-slate-200">{property.name}</span>.
        </p>
      </div>

      <div
        className="flex-shrink-0 border-t border-white/[0.05] bg-gradient-to-t from-black/30 to-transparent px-4 sm:px-6 py-3.5"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}
      >
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 inline-flex items-center px-4 text-[13px] font-medium text-slate-300 bg-white/[0.04] rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all"
          >
            Odustani
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={save}
            className="h-11 px-5 text-[13px] font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-70"
          >
            {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Spremi
          </button>
        </div>
      </div>
    </div>
  );
}

function CurrencyField({
  label,
  value,
  onChange,
  currencySymbol,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  currencySymbol: string;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[14px] font-bold tabular-nums pointer-events-none">
          {currencySymbol}
        </span>
        <input
          type="number"
          min={0}
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="modal-input pl-9 pr-3 text-right tabular-nums"
        />
      </div>
    </div>
  );
}

/* ── Display pieces ─────────────────────────────────────────────────────── */

const tileAccents = {
  blue: { ring: 'ring-blue-100', dot: 'bg-blue-500', label: 'text-blue-700' },
  amber: { ring: 'ring-amber-100', dot: 'bg-amber-500', label: 'text-amber-700' },
} as const;

function PriceTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: keyof typeof tileAccents;
}) {
  const c = tileAccents[accent];
  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 ring-1', c.ring)}>
      <div className="flex items-center gap-2">
        <span className={cn('w-1.5 h-1.5 rounded-full', c.dot)} />
        <p className={cn('text-[10.5px] font-semibold uppercase tracking-[0.14em]', c.label)}>{label}</p>
      </div>
      <p className="text-[26px] font-bold text-slate-900 mt-2 tabular-nums tracking-tight leading-none">{value}</p>
    </div>
  );
}

const summaryAccents = {
  blue: { iconBg: 'bg-blue-50', iconText: 'text-blue-600', iconRing: 'ring-blue-100' },
  emerald: { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', iconRing: 'ring-emerald-100' },
  amber: { iconBg: 'bg-amber-50', iconText: 'text-amber-600', iconRing: 'ring-amber-100' },
} as const;

function SummaryStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
  accent: keyof typeof summaryAccents;
}) {
  const c = summaryAccents[accent];
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/80 ring-1 ring-slate-200 backdrop-blur-sm">
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
