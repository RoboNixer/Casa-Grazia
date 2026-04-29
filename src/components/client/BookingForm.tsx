'use client';

import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { format, parseISO, addDays, isBefore } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  Banknote,
  CalendarDays,
  Users,
  User,
  Mail,
  Phone,
  Globe,
  ArrowRight,
  Building2,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { submitBookingAction } from '@/app/(client)/book/actions';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/types/database';
import AvailabilityCalendar, {
  type CalendarRange,
} from './AvailabilityCalendar';

interface BookingFormProps {
  propertyId?: string;
  properties?: Property[];
  currencySymbol?: string;
  /**
   * Active bookings (anything not cancelled, including pending "Na čekanju"
   * requests and confirmed stays). Used to mark days as unavailable so two
   * guests can't request the same range.
   */
  bookings: { property_id: string; check_in: string; check_out: string }[];
  /** Lightweight blocked-date ranges used to compute unavailable days. */
  blocked: { property_id: string; start_date: string; end_date: string }[];
  /** Today as yyyy-MM-dd, server-rendered to avoid hydration drift. */
  todayStr: string;
}

const fieldClass =
  'w-full px-4 py-3.5 rounded-xl border border-emerald-900/[0.1] bg-white text-ink text-[14px] placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 outline-none transition-all hover:border-emerald-700/30';

const labelClass =
  'flex items-center gap-2 font-mono text-[10.5px] font-medium text-ink-muted uppercase tracking-[0.2em] mb-2';

const sectionHeadingClass =
  'font-display text-[22px] sm:text-[24px] text-ink tracking-tight mb-5 leading-none';

export default function BookingForm({
  propertyId: initialPropertyId,
  properties = [],
  currencySymbol = '€',
  bookings,
  blocked,
  todayStr,
}: BookingFormProps) {
  const [propertyId, setPropertyId] = useState<string>(
    initialPropertyId ?? (properties[0]?.id ?? ''),
  );
  const [range, setRange] = useState<CalendarRange>({ checkIn: null, checkOut: null });
  const [numGuests, setNumGuests] = useState<number>(1);

  const selectedProperty = useMemo(
    () => (propertyId ? properties.find((p) => p.id === propertyId) ?? null : null),
    [propertyId, properties],
  );

  // ─── Compute unavailable dates for the currently selected property ──────
  // We keep booked vs admin-blocked in separate sets so the calendar can
  // render them with distinct visual states (slate "Zauzeto" pill vs rose
  // "Blokirano" lock pill). The combined set is used for click-rejection.
  const { bookedDates, blockedDates, unavailableDates } = useMemo(() => {
    const booked = new Set<string>();
    const blockedSet = new Set<string>();
    if (!propertyId) {
      return { bookedDates: booked, blockedDates: blockedSet, unavailableDates: new Set<string>() };
    }

    // Bookings (pending OR confirmed — anything not cancelled): every day
    // from check_in (inclusive) to the night BEFORE check_out is occupied.
    // The check_out day is the turnover day and a new guest can arrive that
    // morning, so we leave it bookable. Pending requests block the range too
    // so the same dates can't be double-requested while admin reviews.
    for (const b of bookings) {
      if (b.property_id !== propertyId) continue;
      const ci = parseISO(b.check_in);
      const co = parseISO(b.check_out);
      for (let d = ci; isBefore(d, co); d = addDays(d, 1)) {
        booked.add(format(d, 'yyyy-MM-dd'));
      }
    }

    // Blocked dates: inclusive on both ends (matches admin display).
    for (const bd of blocked) {
      if (bd.property_id !== propertyId) continue;
      const s = parseISO(bd.start_date);
      const e = parseISO(bd.end_date);
      for (let d = s; !isBefore(e, d); d = addDays(d, 1)) {
        blockedSet.add(format(d, 'yyyy-MM-dd'));
      }
    }

    const combined = new Set<string>([...booked, ...blockedSet]);
    return { bookedDates: booked, blockedDates: blockedSet, unavailableDates: combined };
  }, [propertyId, bookings, blocked]);

  // If the user changes property and the previously picked range is now
  // invalid, drop the selection so they don't accidentally submit a booking
  // that overlaps another guest's stay.
  useEffect(() => {
    if (!range.checkIn || !range.checkOut) return;
    const ci = parseISO(range.checkIn);
    const co = parseISO(range.checkOut);
    for (let d = ci; isBefore(d, co); d = addDays(d, 1)) {
      if (unavailableDates.has(format(d, 'yyyy-MM-dd'))) {
        setRange({ checkIn: null, checkOut: null });
        return;
      }
    }
  }, [unavailableDates, range.checkIn, range.checkOut]);

  // Cap guest count to the property's max
  useEffect(() => {
    if (selectedProperty && numGuests > selectedProperty.max_guests) {
      setNumGuests(selectedProperty.max_guests);
    }
  }, [selectedProperty, numGuests]);

  // ─── Live price ────────────────────────────────────────────────────────
  const nights =
    range.checkIn && range.checkOut
      ? Math.max(
          0,
          Math.round(
            (parseISO(range.checkOut).getTime() - parseISO(range.checkIn).getTime()) /
              86_400_000,
          ),
        )
      : 0;

  const accommodationCost = selectedProperty ? nights * selectedProperty.base_price : 0;
  const cleaningFee = selectedProperty?.cleaning_fee ?? 0;
  const totalPrice = accommodationCost + (nights > 0 ? cleaningFee : 0);

  // ─── Submission ────────────────────────────────────────────────────────
  const canSubmit =
    !!propertyId &&
    !!range.checkIn &&
    !!range.checkOut &&
    nights > 0 &&
    numGuests >= 1;

  return (
    <form
      action={submitBookingAction}
      className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 lg:gap-8 max-w-6xl mx-auto items-start"
    >
      {/* ════════════════════════════════════════════════════════════════
          LEFT COLUMN — Calendar + form fields
          ════════════════════════════════════════════════════════════════ */}
      <div className="space-y-6">

        {/* ── Property picker / chosen card ─────────────────────────── */}
        {properties.length > 1 && !initialPropertyId ? (
          <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium p-5 sm:p-6">
            <label htmlFor="property" className={labelClass}>
              <Building2 className="w-3.5 h-3.5" />
              Odaberi nekretninu
            </label>
            <select
              id="property"
              name="property_id"
              required
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className={fieldClass}
            >
              <option value="" disabled>
                Odaberi nekretninu...
              </option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.base_price, currencySymbol)}/noć
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="property_id" value={propertyId} />
        )}

        {/* Selected property card */}
        {selectedProperty && (
          <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium p-4 sm:p-5 flex items-center gap-4">
            {selectedProperty.images?.[0] && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={
                  (
                    selectedProperty.images.find((i) => i.is_cover) ??
                    selectedProperty.images[0]
                  ).url
                }
                alt={selectedProperty.name}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover shrink-0 shadow-sm"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-display text-[20px] sm:text-[22px] text-ink truncate leading-none">
                {selectedProperty.name}
              </p>
              <p className="text-[13px] text-ink-muted mt-2">
                Do {selectedProperty.max_guests} gostiju
                {' · '}
                <span className="font-semibold text-emerald-700">
                  {formatCurrency(selectedProperty.base_price, currencySymbol)}/noć
                </span>
              </p>
            </div>
          </div>
        )}

        {/* ── Calendar ──────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3 mb-5">
            <h3 className={sectionHeadingClass + ' mb-0'}>
              Odaberi <span className="italic text-emerald-700">datume</span>
            </h3>
            <span className="hidden sm:inline-flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-ink-faint">
              <CalendarDays className="w-3 h-3" />
              Dolazak / Odlazak
            </span>
          </div>

          {!propertyId ? (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-5 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600" />
              <p className="text-[13.5px] text-amber-900">
                Odaberite nekretninu iznad za prikaz dostupnosti.
              </p>
            </div>
          ) : (
            <AvailabilityCalendar
              bookedDates={bookedDates}
              blockedDates={blockedDates}
              todayStr={todayStr}
              value={range}
              onChange={setRange}
            />
          )}

          {/* Hidden inputs that submit to the server action */}
          <input type="hidden" name="check_in" value={range.checkIn ?? ''} />
          <input type="hidden" name="check_out" value={range.checkOut ?? ''} />
        </div>

        {/* ── Guest count ───────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium p-5 sm:p-7">
          <h3 className={sectionHeadingClass}>
            Detalji <span className="italic text-emerald-700">boravka</span>
          </h3>
          <div>
            <label htmlFor="guests" className={labelClass}>
              <Users className="h-3.5 w-3.5" />
              Broj gostiju
              {selectedProperty && (
                <span className="ml-auto normal-case tracking-normal text-[10.5px] text-ink-faint">
                  max {selectedProperty.max_guests}
                </span>
              )}
            </label>
            <input
              type="number"
              id="guests"
              name="num_guests"
              required
              min={1}
              max={selectedProperty?.max_guests ?? 20}
              value={numGuests}
              onChange={(e) => setNumGuests(parseInt(e.target.value || '1', 10))}
              className={fieldClass}
            />
          </div>
        </div>

        {/* ── Guest details ─────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium p-5 sm:p-7">
          <h3 className={sectionHeadingClass}>
            Podaci o <span className="italic text-emerald-700">gostu</span>
          </h3>
          <div className="space-y-5">
            <div>
              <label htmlFor="name" className={labelClass}>
                <User className="h-3.5 w-3.5" /> Ime i prezime
              </label>
              <input
                type="text"
                id="name"
                name="guest_name"
                required
                placeholder="Ivan Horvat"
                className={fieldClass}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label htmlFor="email" className={labelClass}>
                  <Mail className="h-3.5 w-3.5" /> E-mail
                </label>
                <input
                  type="email"
                  id="email"
                  name="guest_email"
                  required
                  placeholder="ivan@primjer.hr"
                  className={fieldClass}
                />
              </div>
              <div>
                <label htmlFor="phone" className={labelClass}>
                  <Phone className="h-3.5 w-3.5" /> Telefon
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="guest_phone"
                  required
                  placeholder="+385 91 234 5678"
                  className={fieldClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="country" className={labelClass}>
                <Globe className="h-3.5 w-3.5" /> Država
              </label>
              <input
                type="text"
                id="country"
                name="guest_country"
                required
                placeholder="Hrvatska"
                className={fieldClass}
              />
            </div>
          </div>
        </div>

        {/* Cash note */}
        <div className="flex items-start gap-3.5 bg-amber-50/60 border border-amber-200/70 rounded-2xl px-5 py-4">
          <Banknote className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-[13.5px] text-amber-900 leading-relaxed">
            <span className="font-semibold">Plaćanje gotovinom pri dolasku.</span>{' '}
            Nije potrebno online plaćanje. Platite ugodno kada se prijavite.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          RIGHT COLUMN — Sticky pricing summary
          ════════════════════════════════════════════════════════════════ */}
      <aside className="lg:sticky lg:top-28">
        <div className="bg-white rounded-3xl border border-emerald-900/[0.07] shadow-premium overflow-hidden">
          <div className="p-6 sm:p-7 space-y-5">
            <div>
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-emerald-700 mb-2">
                <Sparkles className="inline w-3 h-3 -mt-0.5 mr-1" />
                Sažetak rezervacije
              </p>
              <h3 className="font-display text-[26px] text-ink leading-tight tracking-tight">
                {selectedProperty?.name ?? 'Odaberi nekretninu'}
              </h3>
              {selectedProperty && (
                <p className="text-[13px] text-ink-muted mt-1.5">
                  {formatCurrency(selectedProperty.base_price, currencySymbol)}
                  <span className="text-ink-faint"> / noć</span>
                </p>
              )}
            </div>

            {/* Date pills */}
            <div className="grid grid-cols-2 gap-2.5">
              <DatePill label="Dolazak" date={range.checkIn} />
              <DatePill label="Odlazak" date={range.checkOut} />
            </div>

            {/* Price breakdown */}
            <div className="border-t border-emerald-900/[0.06] pt-4 space-y-2.5">
              <Row
                label={
                  selectedProperty && nights > 0
                    ? `${formatCurrency(selectedProperty.base_price, currencySymbol)} × ${nights} ${nights === 1 ? 'noć' : 'noći'}`
                    : 'Smještaj'
                }
                value={
                  nights > 0
                    ? formatCurrency(accommodationCost, currencySymbol)
                    : '—'
                }
              />
              <Row
                label="Čišćenje"
                value={
                  nights > 0 && cleaningFee > 0
                    ? formatCurrency(cleaningFee, currencySymbol)
                    : '—'
                }
              />
              <div className="flex items-baseline justify-between pt-3 mt-1 border-t border-emerald-900/[0.06]">
                <span className="font-display text-[20px] text-ink">Ukupno</span>
                <span className="font-display text-[28px] text-ink tabular-nums">
                  {nights > 0
                    ? formatCurrency(totalPrice, currencySymbol)
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-7 py-5 bg-emerald-50/40 border-t border-emerald-900/[0.07]">
            <SubmitButton canSubmit={canSubmit} />
            <p className="text-center font-mono text-[10.5px] tracking-[0.2em] uppercase text-ink-faint mt-3.5">
              Potvrda obično unutar 24 sata
            </p>
          </div>
        </div>
      </aside>
    </form>
  );
}

/* ──────────────────────────────────────────────────────────────────────── */

function SubmitButton({ canSubmit }: { canSubmit: boolean }) {
  const { pending } = useFormStatus();
  const disabled = !canSubmit || pending;
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-full bg-ink text-white font-medium text-[15px] hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-ink"
    >
      {pending
        ? 'Šaljem...'
        : canSubmit
          ? 'Pošalji zahtjev'
          : 'Odaberi datume'}
      <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

function DatePill({ label, date }: { label: string; date: string | null }) {
  return (
    <div className="rounded-2xl border border-emerald-900/[0.08] bg-emerald-50/40 px-3.5 py-3">
      <p className="font-mono text-[9.5px] tracking-[0.2em] uppercase text-ink-faint mb-1">
        {label}
      </p>
      {date ? (
        <p className="font-display text-[15.5px] text-ink leading-none">
          {format(parseISO(date), 'd. MMM', { locale: hr })}
          <span className="text-ink-faint italic ml-1.5 text-[12px]">
            {format(parseISO(date), 'yyyy')}
          </span>
        </p>
      ) : (
        <p className="font-display text-[15.5px] text-ink-faint/60 leading-none italic">
          Odaberi
        </p>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[13.5px]">
      <span className="text-ink-muted">{label}</span>
      <span className="font-medium text-ink tabular-nums">{value}</span>
    </div>
  );
}
