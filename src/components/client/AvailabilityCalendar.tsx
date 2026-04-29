'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
  isBefore,
  isAfter,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

export interface CalendarRange {
  checkIn: string | null;  // 'yyyy-MM-dd'
  checkOut: string | null; // 'yyyy-MM-dd'
}

interface Props {
  /**
   * Days occupied by an existing booking (pending or confirmed). Rendered as
   * a slate "Zauzeto" pill — visually unmistakable as not-pickable.
   */
  bookedDates: Set<string>;
  /**
   * Days the admin has manually blocked (maintenance, owner stay, etc.).
   * Rendered as a rose lock pill.
   */
  blockedDates: Set<string>;
  /** Today as yyyy-MM-dd (computed on the server, passed in to avoid hydration drift). */
  todayStr: string;
  value: CalendarRange;
  onChange: (range: CalendarRange) => void;
  /** Optional max guests / property name shown in the legend. Purely cosmetic. */
  className?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * AvailabilityCalendar
 *
 * • Two months side-by-side on desktop (≥ md), single month on mobile.
 * • Click a free day → sets check-in. Click another free day later → sets
 *   check-out. Click an earlier date or the same day again → resets and starts
 *   a new check-in.
 * • Hover preview of the in-progress range.
 * • Disabled (unavailable / past) days cannot be tapped.
 * • If the would-be range crosses an unavailable day, the click is rejected
 *   and the calendar starts a new range from the new tap.
 * ───────────────────────────────────────────────────────────────────────── */

export default function AvailabilityCalendar({
  bookedDates,
  blockedDates,
  todayStr,
  value,
  onChange,
  className,
}: Props) {
  const today = useMemo(() => parseISO(todayStr), [todayStr]);

  // Combined view used for click-rejection + range validity checks. Booked
  // and blocked are kept separate above purely for the per-cell visual
  // treatment (slate vs rose); for the "can the user pick this?" question
  // they're identical.
  const unavailableDates = useMemo(
    () => new Set<string>([...bookedDates, ...blockedDates]),
    [bookedDates, blockedDates],
  );

  // Anchor month — the LEFT month shown on desktop / the only month on mobile.
  const initialAnchor = useMemo(() => {
    const ref = value.checkIn ? parseISO(value.checkIn) : today;
    return startOfMonth(ref);
  }, [todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const [anchor, setAnchor] = useState<Date>(initialAnchor);
  const [hovered, setHovered] = useState<string | null>(null);

  // If the consumer programmatically clears the range, reset hover too.
  useEffect(() => {
    if (!value.checkIn) setHovered(null);
  }, [value.checkIn]);

  const monthsToShow = useTwoMonthOnDesktop() ? 2 : 1;
  const grids = useMemo(
    () =>
      Array.from({ length: monthsToShow }, (_, i) =>
        buildMonthGrid(addMonths(anchor, i)),
      ),
    [anchor, monthsToShow],
  );

  // Compute the effective range to highlight: real range, or in-progress
  // hover preview when only check-in is set.
  const effectiveRange = useMemo<CalendarRange>(() => {
    if (value.checkIn && !value.checkOut && hovered) {
      const ci = parseISO(value.checkIn);
      const hv = parseISO(hovered);
      if (isAfter(hv, ci) && !rangeCrossesUnavailable(value.checkIn, hovered, unavailableDates)) {
        return { checkIn: value.checkIn, checkOut: hovered };
      }
    }
    return value;
  }, [value, hovered, unavailableDates]);

  // ─── Day click handler ──────────────────────────────────────────────────
  const handleDayClick = (dayStr: string) => {
    const day = parseISO(dayStr);

    // Reject past + unavailable
    if (isBefore(day, today) && !isSameDay(day, today)) return;
    if (unavailableDates.has(dayStr)) return;

    // No selection yet, or both already set → start a fresh check-in
    if (!value.checkIn || (value.checkIn && value.checkOut)) {
      onChange({ checkIn: dayStr, checkOut: null });
      return;
    }

    // Have check-in, picking check-out
    const ci = parseISO(value.checkIn);

    // Same day or earlier → restart
    if (!isAfter(day, ci)) {
      onChange({ checkIn: dayStr, checkOut: null });
      return;
    }

    // Range would cross a blocked day → restart from this day
    if (rangeCrossesUnavailable(value.checkIn, dayStr, unavailableDates)) {
      onChange({ checkIn: dayStr, checkOut: null });
      return;
    }

    onChange({ checkIn: value.checkIn, checkOut: dayStr });
  };

  const nights =
    value.checkIn && value.checkOut
      ? Math.max(0, differenceInCalendarDays(parseISO(value.checkOut), parseISO(value.checkIn)))
      : 0;

  return (
    <div className={cn('select-none', className)}>
      {/* ── Top bar: month nav + selection summary ───────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          type="button"
          onClick={() => setAnchor((a) => subMonths(a, 1))}
          disabled={
            // don't let the left month go before "this month"
            isSameMonth(anchor, today) || isBefore(anchor, today)
          }
          aria-label="Prethodni mjesec"
          className="w-10 h-10 sm:w-11 sm:h-11 inline-flex items-center justify-center rounded-full text-ink bg-white border border-emerald-900/[0.08] hover:border-emerald-700/40 hover:text-emerald-700 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-emerald-900/[0.08] disabled:hover:text-ink shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <div className="text-center min-w-0 flex-1">
          {value.checkIn && value.checkOut ? (
            <div className="flex flex-col items-center">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-emerald-700">
                {nights} {nights === 1 ? 'noć' : nights < 5 ? 'noći' : 'noći'} odabrano
              </p>
              <p className="font-display text-[15px] sm:text-[17px] text-ink mt-0.5 truncate">
                {format(parseISO(value.checkIn), 'd. MMM', { locale: hr })}
                <span className="mx-2 text-emerald-700">→</span>
                {format(parseISO(value.checkOut), 'd. MMM yyyy', { locale: hr })}
              </p>
            </div>
          ) : value.checkIn ? (
            <div className="flex flex-col items-center">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-amber-600">
                Odaberite datum odlaska
              </p>
              <p className="font-display text-[15px] sm:text-[17px] text-ink mt-0.5 truncate">
                Dolazak: {format(parseISO(value.checkIn), 'd. MMMM yyyy', { locale: hr })}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink-faint">
                Odaberite datume
              </p>
              <p className="font-display text-[15px] sm:text-[17px] text-ink mt-0.5">
                Dolazak <span className="mx-2 text-emerald-700/40">→</span> Odlazak
              </p>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => setAnchor((a) => addMonths(a, 1))}
          aria-label="Sljedeći mjesec"
          className="w-10 h-10 sm:w-11 sm:h-11 inline-flex items-center justify-center rounded-full text-ink bg-white border border-emerald-900/[0.08] hover:border-emerald-700/40 hover:text-emerald-700 active:scale-95 transition-all shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── Calendar grid(s) ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-10">
        {grids.map((grid, idx) => (
          <MonthGrid
            key={idx}
            month={addMonths(anchor, idx)}
            days={grid}
            today={today}
            todayStr={todayStr}
            bookedDates={bookedDates}
            blockedDates={blockedDates}
            range={effectiveRange}
            committedRange={value}
            onDayClick={handleDayClick}
            onDayHover={setHovered}
            onLeave={() => setHovered(null)}
          />
        ))}
      </div>

      {/* ── Clear-selection button (only when something is picked) ──────── */}
      {(value.checkIn || value.checkOut) && (
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={() => onChange({ checkIn: null, checkOut: null })}
            className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.18em] uppercase text-ink-faint hover:text-emerald-700 transition-colors"
          >
            <X className="w-3 h-3" /> Poništi odabir
          </button>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Single month grid
 * ──────────────────────────────────────────────────────────────────────── */

function MonthGrid({
  month,
  days,
  today,
  todayStr,
  bookedDates,
  blockedDates,
  range,
  committedRange,
  onDayClick,
  onDayHover,
  onLeave,
}: {
  month: Date;
  days: Date[];
  today: Date;
  todayStr: string;
  bookedDates: Set<string>;
  blockedDates: Set<string>;
  range: CalendarRange;
  committedRange: CalendarRange;
  onDayClick: (dayStr: string) => void;
  onDayHover: (dayStr: string) => void;
  onLeave: () => void;
}) {
  const ci = range.checkIn ? parseISO(range.checkIn) : null;
  const co = range.checkOut ? parseISO(range.checkOut) : null;
  const committedCi = committedRange.checkIn ? parseISO(committedRange.checkIn) : null;
  const committedCo = committedRange.checkOut ? parseISO(committedRange.checkOut) : null;

  return (
    <div onMouseLeave={onLeave}>
      {/* Month label */}
      <div className="text-center mb-3">
        <h3 className="font-display text-[18px] sm:text-[20px] text-ink capitalize tracking-tight leading-none">
          {format(month, 'LLLL', { locale: hr })}
          <span className="text-emerald-700/60 ml-1.5 font-normal italic">
            {format(month, 'yyyy')}
          </span>
        </h3>
      </div>

      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1.5">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center font-mono text-[9.5px] tracking-[0.16em] uppercase text-ink-faint py-1.5"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const inMonth = isSameMonth(day, month);
          const isToday = dayStr === todayStr;
          const isPast = isBefore(day, today) && !isSameDay(day, today);
          const isBooked = bookedDates.has(dayStr);
          // Blocked wins visually if a date is somehow in both sets (it
          // shouldn't happen, but be defensive).
          const isBlocked = blockedDates.has(dayStr) && !isBooked;
          const isUnavailable = isBooked || isBlocked;
          const disabled = !inMonth || isPast || isUnavailable;

          const isCheckIn = ci && isSameDay(day, ci);
          const isCheckOut = co && isSameDay(day, co);
          const inRange =
            ci && co && isAfter(day, ci) && isBefore(day, co);

          // Shows commited (vs hover preview) so the user gets a stable
          // visual once both ends are set.
          const isCommittedCheckIn = committedCi && isSameDay(day, committedCi);
          const isCommittedCheckOut = committedCo && isSameDay(day, committedCo);

          // We render unavailable cells as a non-interactive `<div>` (not a
          // disabled button). A disabled button still receives mouse events
          // in some browsers and the default cursor stays as pointer in
          // others — both make the cell feel "tappable" even though clicks
          // are no-ops. A plain div with no handlers is the most honest
          // signal that the date is off-limits.
          //
          // All disabled states (past, booked-by-others, admin-blocked)
          // share one understated visual: faded number with a strikethrough
          // and a not-allowed cursor. We deliberately don't differentiate
          // "occupied" from "in the past" so the calendar stays calm and
          // doesn't expose the existence of competing pending requests.
          if (disabled) {
            const ariaLabel = inMonth
              ? format(day, 'EEEE, d. MMMM yyyy', { locale: hr }) +
                (isPast ? ' — prošli datum' : ' — nedostupno')
              : undefined;

            return (
              <div key={dayStr} className="relative aspect-square">
                <div
                  role={inMonth ? 'gridcell' : 'presentation'}
                  aria-disabled={inMonth ? true : undefined}
                  aria-label={ariaLabel}
                  className={cn(
                    'group relative z-10 w-full h-full flex flex-col items-center justify-center rounded-full text-[13px] sm:text-[14px] font-medium select-none cursor-not-allowed',
                    !inMonth && 'opacity-0 pointer-events-none',
                    inMonth && 'text-ink-faint/35 line-through',
                  )}
                >
                  <span className="tabular-nums leading-none">
                    {format(day, 'd')}
                  </span>
                </div>
              </div>
            );
          }

          return (
            <div key={dayStr} className="relative aspect-square">
              {/* Range fill — sits behind the day pill */}
              {(isCheckIn || isCheckOut || inRange) && inMonth && (
                <div
                  className={cn(
                    'absolute inset-y-1 bg-emerald-100/70',
                    isCheckIn && 'left-1/2 right-0 rounded-l-full',
                    isCheckOut && 'left-0 right-1/2 rounded-r-full',
                    inRange && 'left-0 right-0',
                    isCheckIn && isCheckOut && 'left-1/2 right-1/2 bg-transparent',
                  )}
                  aria-hidden
                />
              )}

              <button
                type="button"
                onClick={() => onDayClick(dayStr)}
                onMouseEnter={() => onDayHover(dayStr)}
                onFocus={() => onDayHover(dayStr)}
                className={cn(
                  'group relative z-10 w-full h-full flex flex-col items-center justify-center rounded-full text-[13px] sm:text-[14px] font-medium text-ink transition-all cursor-pointer',
                  // Today ring
                  isToday && !isCheckIn && !isCheckOut && 'ring-1 ring-emerald-700/40',
                  // Available hover (interactive)
                  !isCheckIn &&
                    !isCheckOut &&
                    !inRange &&
                    'hover:bg-emerald-700/10 hover:text-emerald-800 active:scale-95',
                  // Selected endpoints
                  (isCheckIn || isCheckOut) &&
                    'bg-emerald-700 text-white shadow-md shadow-emerald-700/30 ring-2 ring-emerald-700/15 ring-offset-1 ring-offset-white',
                  // In-range hover preview cells
                  inRange && !isCheckIn && !isCheckOut && 'text-emerald-900',
                )}
                aria-label={format(day, "EEEE, d. MMMM yyyy", { locale: hr })}
                aria-pressed={isCommittedCheckIn || isCommittedCheckOut || undefined}
              >
                <span className="tabular-nums leading-none">
                  {format(day, 'd')}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
 * Helpers
 * ──────────────────────────────────────────────────────────────────────── */

function buildMonthGrid(month: Date) {
  const first = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const last = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  return eachDayOfInterval({ start: first, end: last });
}

/** True if any day strictly between [check_in .. check_out - 1] is unavailable. */
function rangeCrossesUnavailable(
  checkInStr: string,
  checkOutStr: string,
  unavailable: Set<string>,
): boolean {
  const ci = parseISO(checkInStr);
  const co = parseISO(checkOutStr);
  // Iterate from check_in (inclusive) to the night BEFORE check-out.
  // We allow check-in itself only if it isn't unavailable (caller checks),
  // and the check-out day is "free" because the guest leaves that morning.
  for (let d = addDays(ci, 0); isBefore(d, co); d = addDays(d, 1)) {
    if (unavailable.has(format(d, 'yyyy-MM-dd'))) return true;
  }
  return false;
}

/* ──────────────────────────────────────────────────────────────────────────
 * Show two months on tablet/desktop, one on mobile.
 * Implemented as a hook so SSR renders one (mobile-first) and we upgrade
 * after mount — keeps hydration calm.
 * ──────────────────────────────────────────────────────────────────────── */
function useTwoMonthOnDesktop() {
  const [twoMonth, setTwoMonth] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const apply = () => setTwoMonth(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);
  return twoMonth;
}
