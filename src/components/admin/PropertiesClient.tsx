'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  X,
  Save,
  Star,
  ImageIcon,
  Loader2,
  Building2,
  BedDouble,
  Bath,
  Users as UsersIcon,
  Upload,
  Images,
  Check,
} from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import {
  propSaveProperty,
  propDeleteProperty,
  propTogglePropertyActive,
  propAddPropertyImage,
  propAddPropertyImagesBatch,
  propDeletePropertyImage,
  propSetPropertyImageCover,
  propListGalleryImages,
} from '@/app/admin/actions';
import { createClient } from '@/lib/supabase/client';
import type { GalleryImage, Property, PropertyImage } from '@/types/database';

const PROPERTY_IMAGES_BUCKET = 'property-images';

const propertyTypes = ['apartment', 'villa', 'studio', 'house', 'room'] as const;
const propertyTypeLabels: Record<string, string> = {
  apartment: 'Apartman',
  villa: 'Vila',
  studio: 'Studio',
  house: 'Kuća',
  room: 'Soba',
};

export type PropertyModalState =
  | null
  | { kind: 'new' }
  | { kind: 'edit'; id: string };

export default function PropertiesClient({
  initialProperties,
  currencySymbol,
  initialModal = null,
  singleMode = false,
}: {
  initialProperties: Property[];
  currencySymbol: string;
  initialModal?: PropertyModalState;
  singleMode?: boolean;
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [modal, setModal] = useState<PropertyModalState>(initialModal);
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

  // Prevent background page scrolling while modal is open.
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

  const activeCount = properties.filter((p) => p.is_active).length;
  const inactiveCount = properties.length - activeCount;

  return (
    <>
    <div className="space-y-7 animate-fade-up">
      {/* ── Hero header ── */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 lg:p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-violet-500/10 to-blue-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-400/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-slate-200 backdrop-blur-sm">
              <Building2 className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 tracking-wide">Portfolio</span>
            </div>
            <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
              Nekretnine
            </h1>
            <p className="text-[13px] text-slate-500 mt-1.5">Pregled, uređivanje i upravljanje svim jedinicama</p>

            {properties.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <StatPill label="Ukupno" value={properties.length} tone="slate" />
                <StatPill label="Aktivno" value={activeCount} tone="emerald" />
                {inactiveCount > 0 && <StatPill label="Neaktivno" value={inactiveCount} tone="slate" />}
              </div>
            )}
          </div>

          {!(singleMode && properties.length >= 1) && (
            <button
              type="button"
              onClick={() => setModal({ kind: 'new' })}
              className="inline-flex items-center gap-2 px-4 h-11 bg-slate-900 text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 active:scale-[0.97] transition-all shadow-[0_8px_22px_-10px_rgba(15,23,42,0.55)] flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Dodaj nekretninu
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4">
        {properties.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
              <ImageIcon className="w-7 h-7 text-slate-300" />
            </div>
            <p className="text-[14px] font-semibold text-slate-600">Nema nekretnina</p>
            <p className="text-[12.5px] text-slate-400 mt-1.5 max-w-xs mx-auto leading-relaxed">Dodajte prvu nekretninu za početak upravljanja.</p>
            <button
              type="button"
              onClick={() => setModal({ kind: 'new' })}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Dodaj nekretninu
            </button>
          </div>
        ) : (
          properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              currencySymbol={currencySymbol}
              onEdit={() => setModal({ kind: 'edit', id: property.id })}
              onToggle={(next) => {
                setProperties((prev) =>
                  prev.map((p) => (p.id === property.id ? { ...p, is_active: next } : p)),
                );
              }}
              onDeleted={() => {
                setProperties((prev) => prev.filter((p) => p.id !== property.id));
              }}
              onToast={setToast}
            />
          ))
        )}
      </div>

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
      {modal && (
        <PropertyModalShell
          title={modal.kind === 'new' ? 'Nova nekretnina' : 'Uredi nekretninu'}
          subtitle={modal.kind === 'new' ? 'Dodaj novu jedinicu' : editing?.name}
          onClose={() => setModal(null)}
        >
          <PropertyEditor
            property={editing}
            isNew={modal.kind === 'new'}
            currencySymbol={currencySymbol}
            onClose={() => setModal(null)}
            onSaved={(saved) => {
              setProperties((prev) => {
                const i = prev.findIndex((p) => p.id === saved.id);
                if (i === -1) return [saved, ...prev];
                const next = prev.slice();
                next[i] = { ...next[i], ...saved };
                return next;
              });
              setToast({ kind: 'ok', msg: modal.kind === 'new' ? 'Nekretnina dodana' : 'Nekretnina spremljena' });
              setModal({ kind: 'edit', id: saved.id });
            }}
            onDeleted={(id) => {
              setProperties((prev) => prev.filter((p) => p.id !== id));
              setToast({ kind: 'ok', msg: 'Nekretnina obrisana' });
              setModal(null);
            }}
            onToast={setToast}
          />
        </PropertyModalShell>
      )}
    </>
  );
}

function PropertyCard({
  property,
  currencySymbol,
  onEdit,
  onToggle,
  onDeleted,
  onToast,
}: {
  property: Property;
  currencySymbol: string;
  onEdit: () => void;
  onToggle: (nextIsActive: boolean) => void;
  onDeleted: () => void;
  onToast: (t: { kind: 'ok' | 'err'; msg: string }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cover = property.images?.find((i) => i.is_cover);

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-start gap-0 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_18px_40px_-20px_rgba(15,23,42,0.18)]">
      {/* Cover */}
      <div className="w-full sm:w-52 h-44 sm:h-auto sm:self-stretch bg-slate-100 flex-shrink-0 relative overflow-hidden">
        {cover?.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover.url}
            alt={property.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
            <ImageIcon className="w-9 h-9 text-slate-300" />
          </div>
        )}
        {/* Subtle bottom gradient for legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950/40 to-transparent pointer-events-none" />

        {/* Status badge */}
        <div
          className={cn(
            'absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold backdrop-blur-md ring-1',
            property.is_active
              ? 'bg-emerald-500/95 text-white ring-white/30 shadow-[0_4px_12px_-4px_rgba(16,185,129,0.5)]'
              : 'bg-slate-700/90 text-slate-100 ring-white/20',
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              property.is_active ? 'bg-white animate-pulse' : 'bg-slate-300',
            )}
          />
          {property.is_active ? 'Aktivno' : 'Neaktivno'}
        </div>

        {/* Image count */}
        {property.images && property.images.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-slate-900/70 text-slate-100 backdrop-blur-md ring-1 ring-white/10">
            <ImageIcon className="w-3 h-3" />
            {property.images.length}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.14em]">
              {propertyTypeLabels[property.property_type] || property.property_type}
            </p>
            <h3 className="text-[16px] font-bold text-slate-900 mt-0.5 truncate tracking-tight">
              {property.name}
            </h3>
          </div>
          <div className="text-right flex-shrink-0 pl-2">
            <p className="text-[18px] font-bold text-slate-900 leading-none tabular-nums">
              {formatCurrency(property.base_price, currencySymbol)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 font-medium">/ noć</p>
          </div>
        </div>

        <p className="text-[12.5px] text-slate-500 line-clamp-2 leading-relaxed mt-3">
          {property.short_description || property.description || '—'}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Spec icon={UsersIcon} value={`${property.max_guests}`} suffix="gostiju" />
          <Spec icon={BedDouble} value={`${property.bedrooms}`} suffix={property.bedrooms === 1 ? 'soba' : 'soba'} />
          <Spec icon={Bath} value={`${property.bathrooms}`} suffix={property.bathrooms === 1 ? 'kupaona' : 'kupaone'} />
          {property.cleaning_fee > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-[11.5px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-100">
              +{formatCurrency(property.cleaning_fee, currencySymbol)} čišćenje
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex sm:flex-col items-center justify-end gap-1.5 px-3 py-3 sm:py-5 sm:px-3 sm:border-l border-t sm:border-t-0 border-slate-100 flex-shrink-0 bg-slate-50/50">
        <ActionBtn label="Uredi" onClick={onEdit} variant="primary">
          <Pencil className="w-4 h-4" />
        </ActionBtn>
        <ActionBtn
          label={property.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
          disabled={pending}
          onClick={() => {
            startTransition(async () => {
              const res = await propTogglePropertyActive({ id: property.id, is_active: property.is_active });
              if (!res.ok) onToast({ kind: 'err', msg: res.error });
              else {
                onToggle(res.data.is_active);
                onToast({ kind: 'ok', msg: res.data.is_active ? 'Nekretnina aktivirana' : 'Nekretnina deaktivirana' });
              }
            });
          }}
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : property.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </ActionBtn>
        <ActionBtn
          label={confirmDelete ? 'Potvrdi brisanje' : 'Obriši'}
          variant="danger"
          disabled={pending}
          onClick={() => {
            if (!confirmDelete) return setConfirmDelete(true);
            startTransition(async () => {
              const res = await propDeleteProperty(property.id);
              if (!res.ok) onToast({ kind: 'err', msg: res.error });
              else onDeleted();
            });
          }}
        >
          <Trash2 className="w-4 h-4" />
        </ActionBtn>
      </div>
    </div>
  );
}

/* ── Card subcomponents ─────────────────────────────────────────────────── */

function Spec({
  icon: Icon,
  value,
  suffix,
}: {
  icon: typeof BedDouble;
  value: string;
  suffix: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11.5px] text-slate-600 bg-slate-50 ring-1 ring-slate-100">
      <Icon className="w-3 h-3 text-slate-400" />
      <span className="font-bold tabular-nums">{value}</span>
      <span className="text-slate-500">{suffix}</span>
    </span>
  );
}

function ActionBtn({
  children,
  label,
  onClick,
  disabled,
  variant = 'default',
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'default' | 'primary' | 'danger';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'p-2.5 rounded-xl ring-1 ring-transparent transition-all duration-150 active:scale-95 disabled:opacity-60',
        variant === 'primary' && 'text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:ring-blue-100',
        variant === 'danger' && 'text-slate-500 hover:text-red-600 hover:bg-red-50 hover:ring-red-100',
        variant === 'default' && 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/70',
      )}
    >
      {children}
    </button>
  );
}

function StatPill({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: number;
  tone?: 'slate' | 'emerald';
}) {
  const tones = {
    slate: 'bg-white/80 text-slate-700 ring-slate-200',
    emerald: 'bg-emerald-50/90 text-emerald-700 ring-emerald-100',
  };
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold ring-1 backdrop-blur-sm', tones[tone])}>
      <span className="opacity-70">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}

function PropertyModalShell({
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
      <button type="button" onClick={onClose} className="absolute inset-0 bg-slate-950/82 backdrop-blur-sm cursor-default" aria-label="Zatvori" />
      <div
        className="relative w-full sm:max-w-5xl flex flex-col rounded-t-3xl sm:rounded-2xl overflow-hidden bg-[#0a0e1a] text-slate-100 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.05)] animate-slide-in-bottom sm:animate-scale-in"
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
          <button type="button" onClick={onClose} className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all" aria-label="Zatvori">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function PropertyEditor({
  property,
  currencySymbol,
  isNew,
  onClose,
  onSaved,
  onDeleted,
  onToast,
}: {
  property?: Property;
  currencySymbol: string;
  isNew: boolean;
  onClose: () => void;
  onSaved: (p: Property) => void;
  onDeleted: (id: string) => void;
  onToast: (t: { kind: 'ok' | 'err'; msg: string }) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState({
    name: property?.name || '',
    short_description: property?.short_description || '',
    description: property?.description || '',
    property_type: property?.property_type || 'apartment',
    max_guests: String(property?.max_guests ?? 2),
    bedrooms: String(property?.bedrooms ?? 1),
    bathrooms: String(property?.bathrooms ?? 1),
    size_sqm: String(property?.size_sqm ?? 0),
    base_price: String(property?.base_price ?? 0),
    cleaning_fee: String(property?.cleaning_fee ?? 0),
    sort_order: String(property?.sort_order ?? 0),
    address: property?.address || '',
    latitude: String(property?.latitude ?? 0),
    longitude: String(property?.longitude ?? 0),
    amenities: (property?.amenities || []).join(', '),
    is_active: property?.is_active ?? true,
  });
  const [images, setImages] = useState<PropertyImage[]>(property?.images || []);

  const save = () => {
    startTransition(async () => {
      const res = await propSaveProperty({
        id: property?.id,
        name: state.name,
        short_description: state.short_description,
        description: state.description,
        property_type: state.property_type,
        max_guests: Number(state.max_guests) || 1,
        bedrooms: Number(state.bedrooms) || 0,
        bathrooms: Number(state.bathrooms) || 0,
        size_sqm: Number(state.size_sqm) || 0,
        base_price: Number(state.base_price) || 0,
        cleaning_fee: Number(state.cleaning_fee) || 0,
        sort_order: Number(state.sort_order) || 0,
        address: state.address,
        latitude: Number(state.latitude) || 0,
        longitude: Number(state.longitude) || 0,
        amenities: state.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        is_active: state.is_active,
      });
      if (!res.ok) onToast({ kind: 'err', msg: res.error });
      else onSaved({ ...res.data, images: images });
    });
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Field label="Naziv *" value={state.name} onChange={(v) => setState((s) => ({ ...s, name: v }))} colSpan={3} />
          <Field label="Kratki opis" value={state.short_description} onChange={(v) => setState((s) => ({ ...s, short_description: v }))} colSpan={3} />
          <Field label="Opis" value={state.description} onChange={(v) => setState((s) => ({ ...s, description: v }))} multiline rows={3} colSpan={3} />
          <div>
            <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">Vrsta</label>
            <select value={state.property_type} onChange={(e) => setState((s) => ({ ...s, property_type: e.target.value as typeof propertyTypes[number] }))} className="modal-input">
              {propertyTypes.map((t) => <option key={t} value={t}>{propertyTypeLabels[t]}</option>)}
            </select>
          </div>
          <Field label="Maks. gostiju" type="number" value={state.max_guests} onChange={(v) => setState((s) => ({ ...s, max_guests: v }))} />
          <Field label="Sobe" type="number" value={state.bedrooms} onChange={(v) => setState((s) => ({ ...s, bedrooms: v }))} />
          <Field label="Kupaone" type="number" value={state.bathrooms} onChange={(v) => setState((s) => ({ ...s, bathrooms: v }))} />
          <Field label="Veličina (m²)" type="number" value={state.size_sqm} onChange={(v) => setState((s) => ({ ...s, size_sqm: v }))} />
          <Field label={`Osnovna cijena (${currencySymbol}/noć)`} type="number" value={state.base_price} onChange={(v) => setState((s) => ({ ...s, base_price: v }))} />
          <Field label={`Naknada čišćenja (${currencySymbol})`} type="number" value={state.cleaning_fee} onChange={(v) => setState((s) => ({ ...s, cleaning_fee: v }))} />
          <Field label="Redoslijed" type="number" value={state.sort_order} onChange={(v) => setState((s) => ({ ...s, sort_order: v }))} />
          <Field label="Adresa" value={state.address} onChange={(v) => setState((s) => ({ ...s, address: v }))} colSpan={3} />
          <Field label="Geografska širina" type="number" value={state.latitude} onChange={(v) => setState((s) => ({ ...s, latitude: v }))} />
          <Field label="Geografska dužina" type="number" value={state.longitude} onChange={(v) => setState((s) => ({ ...s, longitude: v }))} />
        </div>

        <Field label="Sadržaji (odvojeni zarezom)" value={state.amenities} onChange={(v) => setState((s) => ({ ...s, amenities: v }))} />

        <div className="flex items-center gap-2">
          <input type="checkbox" checked={state.is_active} onChange={(e) => setState((s) => ({ ...s, is_active: e.target.checked }))} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary/20" />
          <span className="text-sm font-medium text-slate-200">Aktivno</span>
        </div>

        {!isNew && property && (
          <div className="bg-white/[0.03] ring-1 ring-white/[0.06] rounded-xl p-4 space-y-4">
            <h3 className="text-[14px] font-semibold text-white">Slike</h3>
            {images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {images.map((img) => (
                  <div key={img.id} className="relative rounded-xl overflow-hidden ring-1 ring-white/10 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt_text} className="w-full h-32 object-cover" />
                    {img.is_cover && (
                      <span className="absolute top-1.5 left-1.5 bg-primary text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                        <Star className="w-2.5 h-2.5" /> Naslovna
                      </span>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex gap-1">
                      {!img.is_cover && (
                        <button
                          type="button"
                          onClick={() => startTransition(async () => {
                            const res = await propSetPropertyImageCover({ id: img.id, property_id: property.id });
                            if (!res.ok) return onToast({ kind: 'err', msg: res.error });
                            setImages((prev) => prev.map((p) => ({ ...p, is_cover: p.id === img.id })));
                            onToast({ kind: 'ok', msg: 'Postavljena naslovna slika' });
                          })}
                          className="p-1.5 bg-slate-900/90 text-slate-300 hover:text-white rounded-lg ring-1 ring-white/15 active:scale-90 transition-all"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => startTransition(async () => {
                          const res = await propDeletePropertyImage(img.id);
                          if (!res.ok) return onToast({ kind: 'err', msg: res.error });
                          setImages((prev) => prev.filter((p) => p.id !== img.id));
                          onToast({ kind: 'ok', msg: 'Slika obrisana' });
                        })}
                        className="p-1.5 bg-slate-900/90 text-slate-300 hover:text-red-300 rounded-lg ring-1 ring-white/15 active:scale-90 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <ImageAdder
              propertyId={property.id}
              propertyName={property.name}
              existingUrls={images.map((i) => i.url)}
              onAdded={(img) => setImages((prev) => [...prev, img])}
              onToast={onToast}
            />
          </div>
        )}
      </div>

      <div className="flex-shrink-0 border-t border-white/[0.05] bg-gradient-to-t from-black/30 to-transparent px-4 sm:px-6 py-3.5" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)' }}>
        <div className="flex justify-between gap-2.5">
          {!isNew && property ? (
            <button
              type="button"
              className="h-11 px-4 text-[13px] font-semibold text-red-300 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition-all"
              onClick={() => startTransition(async () => {
                const res = await propDeleteProperty(property.id);
                if (!res.ok) return onToast({ kind: 'err', msg: res.error });
                onDeleted(property.id);
              })}
            >
              Obriši
            </button>
          ) : <span />}
          <div className="flex gap-2.5">
            <button type="button" onClick={onClose} className="h-11 inline-flex items-center px-4 text-[13px] font-medium text-slate-300 bg-white/[0.04] rounded-xl hover:bg-white/[0.08] active:scale-95 transition-all">
              Odustani
            </button>
            <button type="button" disabled={pending} onClick={save} className="h-11 px-5 text-[13px] font-bold text-slate-900 bg-white rounded-xl hover:bg-slate-100 active:scale-95 transition-all inline-flex items-center gap-2 disabled:opacity-70">
              {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isNew ? 'Kreiraj' : 'Spremi'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  multiline = false,
  rows = 3,
  colSpan = 1,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  multiline?: boolean;
  rows?: number;
  colSpan?: 1 | 2 | 3;
}) {
  const colClass = colSpan === 3 ? 'sm:col-span-2 lg:col-span-3' : colSpan === 2 ? 'sm:col-span-2' : '';
  return (
    <div className={colClass}>
      <label className="block text-[12px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} className="modal-input resize-y" />
      ) : (
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="modal-input" />
      )}
    </div>
  );
}

/* ── Image adder: upload from device OR pick from gallery ─────────────── */

type AdderTab = 'upload' | 'gallery';

function ImageAdder({
  propertyId,
  propertyName,
  existingUrls,
  onAdded,
  onToast,
}: {
  propertyId: string;
  propertyName: string;
  existingUrls: string[];
  onAdded: (img: PropertyImage) => void;
  onToast: (t: { kind: 'ok' | 'err'; msg: string }) => void;
}) {
  const [tab, setTab] = useState<AdderTab>('upload');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [galleryLoaded, setGalleryLoaded] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [pickingId, setPickingId] = useState<string | null>(null);

  const existingSet = useMemo(() => new Set(existingUrls), [existingUrls]);

  const handleFiles = useCallback(
    async (files: File[]) => {
      const valid = files.filter((f) => f.type.startsWith('image/'));
      if (valid.length === 0) {
        onToast({ kind: 'err', msg: 'Odaberite slikovne datoteke' });
        return;
      }
      const supabase = createClient();
      setUploading(true);
      setProgress({ done: 0, total: valid.length });

      // Upload all files to Supabase Storage in parallel.
      const ts = Date.now();
      const uploads = await Promise.all(
        valid.map(async (file, i) => {
          const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
          const safeExt = ext || 'jpg';
          const path = `${propertyId}/${ts}-${i}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

          const { error: upErr } = await supabase.storage
            .from(PROPERTY_IMAGES_BUCKET)
            .upload(path, file, {
              cacheControl: '3600',
              upsert: false,
              contentType: file.type || 'image/jpeg',
            });

          setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));

          if (upErr) {
            onToast({ kind: 'err', msg: `Upload greška: ${upErr.message}` });
            return null;
          }

          const { data: pub } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
          return {
            url: pub.publicUrl,
            alt_text: propertyName || file.name.replace(/\.[^.]+$/, ''),
          };
        }),
      );

      const successes = uploads.filter((u): u is { url: string; alt_text: string } => u !== null);

      // One batched DB insert for everything that uploaded successfully.
      if (successes.length > 0) {
        const res = await propAddPropertyImagesBatch({
          property_id: propertyId,
          images: successes,
        });
        if (res.ok) {
          for (const img of res.data) onAdded(img);
          onToast({
            kind: 'ok',
            msg: res.data.length === 1 ? 'Slika dodana' : `${res.data.length} slika dodano`,
          });
        } else {
          onToast({ kind: 'err', msg: res.error });
        }
      }

      setUploading(false);
      setProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    },
    [onAdded, onToast, propertyId, propertyName],
  );

  const loadGallery = useCallback(async () => {
    if (galleryLoaded || galleryLoading) return;
    setGalleryLoading(true);
    const res = await propListGalleryImages();
    setGalleryLoading(false);
    if (!res.ok) return onToast({ kind: 'err', msg: res.error });
    setGallery(res.data);
    setGalleryLoaded(true);
  }, [galleryLoaded, galleryLoading, onToast]);

  useEffect(() => {
    if (tab === 'gallery') loadGallery();
  }, [tab, loadGallery]);

  const pickFromGallery = async (g: GalleryImage) => {
    if (existingSet.has(g.url) || pickingId) return;
    setPickingId(g.id);
    const res = await propAddPropertyImage({
      property_id: propertyId,
      url: g.url,
      alt_text: g.alt_text || propertyName,
    });
    setPickingId(null);
    if (!res.ok) return onToast({ kind: 'err', msg: res.error });
    onAdded(res.data);
    onToast({ kind: 'ok', msg: 'Slika dodana iz galerije' });
  };

  return (
    <div className="space-y-3">
      {/* Tabs */}
      <div className="inline-flex p-1 rounded-xl bg-white/[0.04] ring-1 ring-white/[0.06]">
        <TabBtn active={tab === 'upload'} onClick={() => setTab('upload')} icon={Upload} label="Učitaj sa uređaja" />
        <TabBtn active={tab === 'gallery'} onClick={() => setTab('gallery')} icon={Images} label="Iz galerije" />
      </div>

      {tab === 'upload' && (
        <div>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (uploading) return;
              const files = Array.from(e.dataTransfer.files || []);
              if (files.length) handleFiles(files);
            }}
            className={cn(
              'flex flex-col items-center justify-center gap-2 px-5 py-8 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center',
              dragOver
                ? 'border-blue-400/70 bg-blue-400/[0.06]'
                : 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]',
              uploading && 'opacity-70 cursor-progress',
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              className="hidden"
              onChange={(e) => {
                const files = Array.from(e.target.files || []);
                if (files.length) handleFiles(files);
              }}
            />
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 text-slate-300 animate-spin" />
                <p className="text-[13px] font-semibold text-slate-200">
                  Učitavanje{progress ? ` ${progress.done}/${progress.total}` : '…'}
                </p>
              </>
            ) : (
              <>
                <div className="w-11 h-11 rounded-xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-slate-300" />
                </div>
                <p className="text-[13px] font-semibold text-slate-100">Povucite slike ovdje ili kliknite za odabir</p>
                <p className="text-[11.5px] text-slate-400">PNG, JPG, WEBP — moguće odabrati više slika</p>
              </>
            )}
          </label>
        </div>
      )}

      {tab === 'gallery' && (
        <div className="rounded-2xl bg-white/[0.02] ring-1 ring-white/[0.06] p-3">
          {galleryLoading ? (
            <div className="flex items-center justify-center py-10 text-slate-400 text-[13px]">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Učitavanje galerije…
            </div>
          ) : gallery.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-11 h-11 mx-auto rounded-xl bg-white/[0.05] ring-1 ring-white/10 flex items-center justify-center mb-2">
                <Images className="w-5 h-5 text-slate-400" />
              </div>
              <p className="text-[13px] font-semibold text-slate-200">Galerija je prazna</p>
              <p className="text-[11.5px] text-slate-400 mt-1">Dodajte slike u galeriju kako biste ih ovdje mogli odabrati.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {gallery.map((g) => {
                const added = existingSet.has(g.url);
                const pending = pickingId === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={added || pending}
                    onClick={() => pickFromGallery(g)}
                    className={cn(
                      'relative rounded-xl overflow-hidden ring-1 transition-all group',
                      added
                        ? 'ring-emerald-400/50 cursor-default'
                        : 'ring-white/10 hover:ring-white/30 active:scale-[0.97]',
                    )}
                    title={added ? 'Već dodana' : g.alt_text || 'Dodaj iz galerije'}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.url} alt={g.alt_text} className="w-full h-24 object-cover" />
                    <div
                      className={cn(
                        'absolute inset-0 flex items-center justify-center transition-opacity',
                        added ? 'bg-emerald-500/30 opacity-100' : 'bg-slate-950/40 opacity-0 group-hover:opacity-100',
                      )}
                    >
                      {pending ? (
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      ) : added ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold text-white bg-emerald-500/90 rounded-full">
                          <Check className="w-3 h-3" /> Dodana
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10.5px] font-bold text-slate-900 bg-white rounded-full">
                          <Plus className="w-3 h-3" /> Dodaj
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Upload;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 h-9 rounded-lg text-[12.5px] font-semibold transition-all',
        active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-300 hover:text-white hover:bg-white/5',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}
