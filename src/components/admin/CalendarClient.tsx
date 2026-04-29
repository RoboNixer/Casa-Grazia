'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
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
  isWithinInterval,
  isBefore,
  isAfter,
  addDays,
  differenceInCalendarDays,
} from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Plus,
  X,
  Calendar as CalendarIcon,
  Users,
  Building2,
  CreditCard,
  Trash2,
  Save,
  AlertCircle,
  ArrowLeft,
  StickyNote,
  Mail,
  Phone,
  Globe,
  User,
  Pencil,
  ChevronRight as ChevRightIcon,
  Loader2,
} from 'lucide-react';
import { cn, formatDate, formatCurrency } from '@/lib/utils';
import {
  calCreateBooking,
  calUpdateBooking,
  calDeleteBooking,
  calBlockDates,
  calUnblockDate,
} from '@/app/admin/actions';
import type {
  Booking,
  BlockedDate,
  Property,
  BookingStatus,
  PaymentStatus,
} from '@/types/database';

/* ─────────────────────────────────────────────────────────────────────────────
 * BULLETPROOF MOBILE CALENDAR
 *
 * Design principles in this rewrite (after the earlier mobile-tap problems):
 *
 *  1. Plain <button type="button" onClick={...}> for EVERY interactive
 *     element. No <a href>, no preventDefault on touch events, no
 *     pointer-events tricks.
 *
 *  2. NO React portal. NO body scroll lock. NO swipe gestures.
 *     Each of these added a way for a glitch to leave the page in a stuck
 *     state where nothing was tappable. The modal is rendered inline as a
 *     `position:fixed` overlay with z-index 9999 — high enough to clear
 *     the bottom nav (z-40), the topbar (z-30), and anything else.
 *
 *  3. Server actions return data — never redirect. We patch local state
 *     optimistically so the page never re-mounts. revalidatePath inside
 *     the action quietly refreshes the server cache for next visit.
 *
 *  4. One file, one component, one source of truth. Easier to reason
 *     about, easier to debug on a phone.
 * ───────────────────────────────────────────────────────────────────────── */

const WEEKDAYS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

const STATUS: Record<BookingStatus, {
  label: string;
  dot: string;
  bar: string;
  badge: string;
  badgeDark: string;
}> = {
  pending:     { label: 'Na čekanju',  dot: 'bg-amber-400',   bar: 'bg-amber-50/90 border-l-[3px] border-amber-400 text-amber-900',          badge: 'bg-amber-100 text-amber-700',     badgeDark: 'bg-amber-400/10 text-amber-300 ring-1 ring-amber-400/20' },
  confirmed:   { label: 'Potvrđeno',   dot: 'bg-blue-500',    bar: 'bg-blue-50/90 border-l-[3px] border-blue-500 text-blue-900',             badge: 'bg-blue-100 text-blue-700',       badgeDark: 'bg-blue-500/10 text-blue-300 ring-1 ring-blue-500/20' },
  checked_in:  { label: 'Prijavljeno', dot: 'bg-emerald-500', bar: 'bg-emerald-50/90 border-l-[3px] border-emerald-500 text-emerald-900',    badge: 'bg-emerald-100 text-emerald-700', badgeDark: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20' },
  checked_out: { label: 'Odjavljeno',  dot: 'bg-slate-400',   bar: 'bg-slate-100 border-l-[3px] border-slate-300 text-slate-600',            badge: 'bg-slate-100 text-slate-600',     badgeDark: 'bg-slate-500/10 text-slate-400 ring-1 ring-slate-500/20' },
  cancelled:   { label: 'Otkazano',    dot: 'bg-red-400',     bar: 'bg-red-50/80 border-l-[3px] border-red-300 text-red-700',                badge: 'bg-red-100 text-red-600',         badgeDark: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20' },
};

const PAYMENT: Record<PaymentStatus, { label: string; cls: string; clsDark: string }> = {
  unpaid:  { label: 'Neplaćeno',  cls: 'bg-red-100 text-red-700',         clsDark: 'bg-red-500/10 text-red-300 ring-1 ring-red-500/20' },
  paid:    { label: 'Plaćeno',    cls: 'bg-emerald-100 text-emerald-700', clsDark: 'bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/20' },
  partial: { label: 'Djelomično', cls: 'bg-amber-100 text-amber-700',     clsDark: 'bg-amber-500/10 text-amber-300 ring-1 ring-amber-500/20' },
};

const STATUSES: BookingStatus[] = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'];
const PAYMENTS:  PaymentStatus[] = ['unpaid', 'paid', 'partial'];

export type CalendarModalState =
  | null
  | { kind: 'day';     dateStr: string }
  | { kind: 'booking'; id: string;       fromDateStr?: string }
  | { kind: 'new';     date?: string;    fromDateStr?: string }
  | { kind: 'block';   date?: string };

interface Props {
  bookings: Booking[];
  blockedDates: BlockedDate[];
  properties: Property[];
  currencySymbol: string;
  todayStr: string;
  initialMonth: string;
  initialModal?: CalendarModalState;
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════

export default function CalendarClient({
  bookings: initialBookings,
  blockedDates: initialBlocked,
  properties,
  currencySymbol,
  todayStr,
  initialMonth,
  initialModal = null,
}: Props) {

  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [blocked,  setBlocked]  = useState<BlockedDate[]>(initialBlocked);

  const [monthStr,       setMonthStr]       = useState(initialMonth);
  const [propertyFilter, setPropertyFilter] = useState<string>('all');
  const [modal,          setModal]          = useState<CalendarModalState>(initialModal);
  const [toast,          setToast]          = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // ESC closes modal
  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setModal(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [modal]);

  // Hide the mobile bottom nav while a modal is open by toggling a
  // class on <html> — pure CSS, no body style mutation, can never get
  // "stuck" because we always remove it on cleanup.
  useEffect(() => {
    const root = document.documentElement;
    if (modal) root.classList.add('cal-modal-open');
    else       root.classList.remove('cal-modal-open');
    return () => root.classList.remove('cal-modal-open');
  }, [modal]);

  const currentMonth = useMemo(() => parseISO(monthStr + '-01'), [monthStr]);

  const filteredBookings = useMemo(
    () => propertyFilter === 'all'
      ? bookings.filter(b => b.status !== 'cancelled')
      : bookings.filter(b => b.status !== 'cancelled' && b.property_id === propertyFilter),
    [bookings, propertyFilter],
  );

  const filteredBlocked = useMemo(
    () => propertyFilter === 'all'
      ? blocked
      : blocked.filter(b => b.property_id === propertyFilter),
    [blocked, propertyFilter],
  );

  const monthGrid = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd   = endOfMonth(currentMonth);
    const calStart   = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd     = endOfWeek(monthEnd,     { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [currentMonth]);

  // O(days) per-day index instead of O(days * bookings)
  const dayIndex = useMemo(() => {
    const ix = new Map<string, { bookings: Booking[]; blocked?: BlockedDate }>();
    for (const day of monthGrid) {
      ix.set(format(day, 'yyyy-MM-dd'), { bookings: [], blocked: undefined });
    }
    const first = monthGrid[0];
    const last  = monthGrid[monthGrid.length - 1];
    for (const b of filteredBookings) {
      const ci = parseISO(b.check_in);
      const co = parseISO(b.check_out);
      const start = isAfter(ci, first) ? ci : first;
      const end   = isBefore(co, last) ? co : last;
      if (isAfter(start, end)) continue;
      for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
        const slot = ix.get(format(d, 'yyyy-MM-dd'));
        if (slot) slot.bookings.push(b);
      }
    }
    for (const bd of filteredBlocked) {
      const s = parseISO(bd.start_date);
      const e = parseISO(bd.end_date);
      const start = isAfter(s, first) ? s : first;
      const end   = isBefore(e, last) ? e : last;
      if (isAfter(start, end)) continue;
      for (let d = start; !isAfter(d, end); d = addDays(d, 1)) {
        const slot = ix.get(format(d, 'yyyy-MM-dd'));
        if (slot && !slot.blocked) slot.blocked = bd;
      }
    }
    return ix;
  }, [monthGrid, filteredBookings, filteredBlocked]);

  const counts = useMemo(() => {
    const active = bookings.filter(b => b.status !== 'cancelled');
    return {
      pending:   active.filter(b => b.status === 'pending').length,
      confirmed: active.filter(b => b.status === 'confirmed').length,
      checkedIn: active.filter(b => b.status === 'checked_in').length,
    };
  }, [bookings]);

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[26px] font-bold text-ink tracking-tight leading-none">
            Kalendar
          </h1>
          <p className="text-[12px] sm:text-[12.5px] text-ink-faint mt-1 hidden sm:block">
            Upravljajte rezervacijama i dostupnošću
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ kind: 'new' })}
          className="inline-flex items-center gap-2 pl-3.5 pr-4 h-11 bg-[#0b1120] text-white text-[13px] font-bold rounded-xl active:bg-[#1a2238] transition-colors shadow-[0_6px_20px_-8px_rgba(11,17,32,0.5)]"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Nova rezervacija</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { label: 'Na čekanju', count: counts.pending,   color: 'text-amber-600',   ring: 'ring-amber-100',    glow: 'from-amber-50 to-white' },
          { label: 'Potvrđeno',  count: counts.confirmed, color: 'text-blue-600',    ring: 'ring-blue-100',     glow: 'from-blue-50 to-white' },
          { label: 'Aktivno',    count: counts.checkedIn, color: 'text-emerald-600', ring: 'ring-emerald-100',  glow: 'from-emerald-50 to-white' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-2xl p-3 sm:p-4 ring-1 bg-gradient-to-br', s.ring, s.glow)}>
            <p className={cn('text-2xl sm:text-3xl font-extrabold tabular-nums leading-none', s.color)}>{s.count}</p>
            <p className="text-[10.5px] sm:text-[11.5px] text-ink-muted font-semibold mt-1.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Property filter chips ─────────────────────────────────── */}
      {properties.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-1 px-1 scrollbar-hide">
          <Chip active={propertyFilter === 'all'} onClick={() => setPropertyFilter('all')} label="Sve nekretnine" />
          {properties.map(p => (
            <Chip key={p.id} active={propertyFilter === p.id} onClick={() => setPropertyFilter(p.id)} label={p.name} />
          ))}
        </div>
      )}

      {/* ── Calendar Grid ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 overflow-hidden shadow-premium">
        {/* Month nav */}
        <div className="flex items-center justify-between px-2 py-2.5 sm:px-5 sm:py-4 bg-gradient-to-br from-[#0b1120] via-[#0d1530] to-[#0b1120]">
          <button
            type="button"
            onClick={() => setMonthStr(format(subMonths(currentMonth, 1), 'yyyy-MM'))}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-300 active:bg-white/10 active:text-white transition-colors"
            aria-label="Prethodni mjesec"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setMonthStr(format(new Date(), 'yyyy-MM'))}
            className="px-4 h-10 inline-flex items-center justify-center text-[14px] sm:text-[15px] font-bold text-white capitalize tracking-tight rounded-lg active:bg-white/10"
          >
            {format(currentMonth, 'LLLL yyyy', { locale: hr })}
          </button>
          <button
            type="button"
            onClick={() => setMonthStr(format(addMonths(currentMonth, 1), 'yyyy-MM'))}
            className="w-12 h-12 flex items-center justify-center rounded-xl text-slate-300 active:bg-white/10 active:text-white transition-colors"
            aria-label="Sljedeći mjesec"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Weekdays */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/60">
          {WEEKDAYS.map(d => (
            <div key={d} className="py-2 sm:py-2.5 text-center text-[9.5px] sm:text-[10.5px] font-bold text-slate-400 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {monthGrid.map((day) => {
            const dayStr = format(day, 'yyyy-MM-dd');
            const slot = dayIndex.get(dayStr);
            const inMonth = isSameMonth(day, currentMonth);
            const isToday = dayStr === todayStr;
            const dayBookings = slot?.bookings ?? [];
            const isBlocked = !!slot?.blocked;

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => setModal({ kind: 'day', dateStr: dayStr })}
                className={cn(
                  'block text-left min-h-[68px] sm:min-h-[100px] border-b border-r border-slate-100 p-1.5 sm:p-2 relative active:bg-blue-100/60 transition-colors',
                  !inMonth && 'bg-slate-50/40',
                  isBlocked && inMonth && 'bg-red-50/80',
                  isBlocked && !inMonth && 'bg-red-50/30',
                )}
              >
                <div className="flex items-center justify-between">
                  <span className={cn(
                    'text-[12px] sm:text-[13px] font-semibold w-6 h-6 sm:w-7 sm:h-7 inline-flex items-center justify-center rounded-full',
                    isToday && 'bg-[#0b1120] text-white font-bold shadow-sm',
                    !isToday && inMonth && 'text-ink',
                    !isToday && !inMonth && 'text-slate-300',
                  )}>
                    {format(day, 'd')}
                  </span>
                  {isBlocked && <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-red-400 flex-shrink-0" />}
                </div>

                {/* Mobile: status dots */}
                {dayBookings.length > 0 && (
                  <div className="flex gap-[3px] mt-1 sm:hidden flex-wrap">
                    {dayBookings.slice(0, 4).map((b, i) => (
                      <span key={b.id + i} className={cn('w-[6px] h-[6px] rounded-full flex-shrink-0', STATUS[b.status]?.dot ?? 'bg-slate-400')} />
                    ))}
                    {dayBookings.length > 4 && (
                      <span className="text-[7px] text-slate-400 font-bold leading-none self-center">+{dayBookings.length - 4}</span>
                    )}
                  </div>
                )}

                {/* Desktop: name bars */}
                <div className="hidden sm:block mt-1.5 space-y-[3px] overflow-hidden">
                  {dayBookings.slice(0, 3).map(b => (
                    <div
                      key={b.id}
                      className={cn(
                        'text-[9.5px] font-semibold px-1.5 py-[2px] rounded-[5px] truncate leading-tight',
                        STATUS[b.status]?.bar ?? 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {b.guest_name}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-[9px] text-slate-400 px-1 font-semibold">+{dayBookings.length - 3} više</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 px-1">
        {(Object.entries(STATUS) as [BookingStatus, typeof STATUS[BookingStatus]][])
          .filter(([k]) => k !== 'cancelled')
          .map(([k, cfg]) => (
            <div key={k} className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full flex-shrink-0', cfg.dot)} />
              <span className="text-[11px] text-ink-faint">{cfg.label}</span>
            </div>
          ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-red-200 ring-1 ring-red-300 flex-shrink-0" />
          <span className="text-[11px] text-ink-faint">Blokirano</span>
        </div>
      </div>

      {/* ── Upcoming list ─────────────────────────────────────────── */}
      <UpcomingList
        bookings={bookings}
        currencySymbol={currencySymbol}
        todayStr={todayStr}
        onOpen={(id) => setModal({ kind: 'booking', id })}
      />

      {/* ════════════════════════════════════════════════════════════
          MODAL — single render, fixed position, top-of-stack z-index.
          No portal, no body lock, no swipe — bulletproof.
         ════════════════════════════════════════════════════════════ */}
      {modal && (
        <div
          className="fixed inset-0 z-[2147483646] flex items-end sm:items-center justify-center sm:p-4"
          style={{
            height: '100dvh',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {/* Backdrop */}
          <button
            type="button"
            onClick={() => setModal(null)}
            aria-label="Zatvori"
            className="absolute inset-0 bg-slate-950/82 cursor-default"
          />

          {/* Sheet */}
          <div
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full sm:max-w-2xl flex flex-col',
              'bg-[#0a0e1a] text-slate-100',
              'rounded-t-3xl sm:rounded-2xl overflow-hidden',
              'shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)]',
              'sm:max-h-[88vh]',
              'animate-slide-in-bottom sm:animate-scale-in',
            )}
            style={{
              maxHeight: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 10px)',
              marginBottom: 'max(env(safe-area-inset-bottom), 10px)',
            }}
          >
            {modal.kind === 'day' && (
              <DayModalBody
                dateStr={modal.dateStr}
                bookings={filteredBookings}
                blocked={filteredBlocked}
                properties={properties}
                currencySymbol={currencySymbol}
                onClose={() => setModal(null)}
                onOpenBooking={(id) => setModal({ kind: 'booking', id, fromDateStr: modal.dateStr })}
                onOpenNew={() => setModal({ kind: 'new', date: modal.dateStr, fromDateStr: modal.dateStr })}
                onOpenBlock={() => setModal({ kind: 'block', date: modal.dateStr })}
                onUnblock={async (id) => {
                  const prev = blocked;
                  setBlocked(p => p.filter(b => b.id !== id));
                  const r = await calUnblockDate(id);
                  if (!r.ok) { setBlocked(prev); setToast({ kind: 'err', msg: r.error }); }
                  else setToast({ kind: 'ok', msg: 'Datum odblokiran' });
                }}
              />
            )}

            {modal.kind === 'booking' && (
              <BookingModalBody
                booking={bookings.find(b => b.id === modal.id) || null}
                properties={properties}
                currencySymbol={currencySymbol}
                onClose={() => setModal(null)}
                onBack={modal.fromDateStr ? () => setModal({ kind: 'day', dateStr: modal.fromDateStr! }) : undefined}
                onSaved={(b) => {
                  setBookings(prev => prev.map(x => x.id === b.id ? { ...x, ...b } : x));
                  setToast({ kind: 'ok', msg: 'Spremljeno' });
                  setModal(null);
                }}
                onDeleted={(id) => {
                  setBookings(prev => prev.filter(b => b.id !== id));
                  setToast({ kind: 'ok', msg: 'Obrisano' });
                  setModal(null);
                }}
                onError={(m) => setToast({ kind: 'err', msg: m })}
              />
            )}

            {modal.kind === 'new' && (
              <NewBookingBody
                prefillDate={modal.date}
                properties={properties}
                onClose={() => setModal(null)}
                onBack={modal.fromDateStr ? () => setModal({ kind: 'day', dateStr: modal.fromDateStr! }) : undefined}
                onCreated={(b) => {
                  setBookings(prev => [b, ...prev]);
                  setToast({ kind: 'ok', msg: 'Rezervacija dodana' });
                  setModal(null);
                }}
                onError={(m) => setToast({ kind: 'err', msg: m })}
              />
            )}

            {modal.kind === 'block' && (
              <BlockBody
                prefillDate={modal.date}
                properties={properties}
                propertyFilter={propertyFilter}
                onClose={() => setModal(null)}
                onBlocked={(bd) => {
                  setBlocked(prev => [bd, ...prev]);
                  setToast({ kind: 'ok', msg: 'Datumi blokirani' });
                  setModal(null);
                }}
                onError={(m) => setToast({ kind: 'err', msg: m })}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────── */}
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
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Filter chip
// ────────────────────────────────────────────────────────────────────────────

function Chip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-shrink-0 h-10 px-3.5 rounded-xl text-[12.5px] font-semibold whitespace-nowrap transition-colors',
        active
          ? 'bg-[#0b1120] text-white'
          : 'bg-white ring-1 ring-slate-200 text-ink-muted active:bg-slate-100',
      )}
    >
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Upcoming list
// ────────────────────────────────────────────────────────────────────────────

function UpcomingList({
  bookings,
  currencySymbol,
  todayStr,
  onOpen,
}: {
  bookings: Booking[];
  currencySymbol: string;
  todayStr: string;
  onOpen: (id: string) => void;
}) {
  const todayDate = parseISO(todayStr);
  const upcoming = useMemo(() => bookings
    .filter(b =>
      b.status !== 'cancelled' &&
      b.status !== 'checked_out' &&
      !isBefore(parseISO(b.check_out), todayDate),
    )
    .sort((a, b) => parseISO(a.check_in).getTime() - parseISO(b.check_in).getTime())
    .slice(0, 8),
  [bookings, todayDate]);

  if (upcoming.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl ring-1 ring-slate-200/80 overflow-hidden shadow-premium">
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-[14px] font-bold text-ink">Nadolazeće rezervacije</h2>
        <span className="text-[11px] font-semibold text-ink-faint tabular-nums">{upcoming.length}</span>
      </div>
      <div className="divide-y divide-slate-100">
        {upcoming.map(b => (
          <button
            key={b.id}
            type="button"
            onClick={() => onOpen(b.id)}
            className="w-full text-left px-5 py-3.5 active:bg-slate-100 transition-colors flex items-center gap-3 min-h-[64px]"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-slate-200 flex items-center justify-center flex-shrink-0 text-[13px] font-bold text-slate-600">
              {b.guest_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <p className="text-[13px] font-semibold text-ink truncate">{b.guest_name}</p>
                <span className={cn('flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md', STATUS[b.status]?.badge)}>
                  {STATUS[b.status]?.label}
                </span>
              </div>
              <p className="text-[11.5px] text-ink-faint truncate">
                {b.property?.name || '—'} · {formatDate(b.check_in, 'dd.MM.')}–{formatDate(b.check_out, 'dd.MM.yyyy')}
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-[12.5px] font-bold text-ink tabular-nums">{formatCurrency(b.total_price, currencySymbol)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MODAL HEADER  (shared across all four modal bodies)
// ════════════════════════════════════════════════════════════════════════════

function ModalHeader({
  title,
  subtitle,
  icon: Icon,
  onClose,
  onBack,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <>
      {/* Drag handle (visual only — close happens by tap on backdrop or X) */}
      <div className="flex justify-center pt-2.5 pb-1 sm:hidden flex-shrink-0">
        <div className="w-10 h-[4px] rounded-full bg-white/15" />
      </div>

      <div className="flex-shrink-0 px-4 sm:px-6 pt-2 sm:pt-5 pb-3 sm:pb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              aria-label="Natrag"
              className="flex items-center justify-center w-11 h-11 -ml-2 rounded-xl text-slate-300 bg-white/[0.04] active:bg-white/[0.12] transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-[18px] h-[18px]" />
            </button>
          ) : Icon && (
            <div className="w-10 h-10 rounded-xl bg-white/[0.05] ring-1 ring-white/[0.06] flex items-center justify-center flex-shrink-0">
              <Icon className="w-[18px] h-[18px] text-slate-300" />
            </div>
          )}
          <div className="min-w-0">
            <h2 className="text-[15px] sm:text-[16px] font-semibold text-white leading-tight truncate capitalize">{title}</h2>
            {subtitle && (
              <p className="text-[11.5px] sm:text-[12px] text-slate-400 mt-0.5 truncate capitalize">{subtitle}</p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Zatvori"
          className="flex items-center justify-center w-11 h-11 -mr-2 rounded-xl text-slate-300 active:bg-white/[0.12] transition-colors flex-shrink-0"
        >
          <X className="w-[18px] h-[18px]" />
        </button>
      </div>
    </>
  );
}

function FooterBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex-shrink-0 border-t border-white/[0.05] bg-[#0a0e1a]"
      style={{
        // Extra offset so action row never sits under Safari/Chrome bottom UI
        // (home indicator + browser toolbar states).
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 10px)',
      }}
    >
      <div className="px-4 sm:px-6 py-3.5">{children}</div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// DAY MODAL BODY
// ────────────────────────────────────────────────────────────────────────────

function DayModalBody({
  dateStr,
  bookings,
  blocked,
  properties,
  currencySymbol,
  onClose,
  onOpenBooking = () => {},
  onOpenNew = () => {},
  onOpenBlock = () => {},
  onUnblock = () => {},
}: {
  dateStr: string;
  bookings: Booking[];
  blocked: BlockedDate[];
  properties: Property[];
  currencySymbol: string;
  onClose: () => void;
  onOpenBooking?: (id: string) => void;
  onOpenNew?: () => void;
  onOpenBlock?: () => void;
  onUnblock?: (id: string) => void;
}) {
  const date = parseISO(dateStr);
  const dayBookings = bookings.filter(b => {
    const ci = parseISO(b.check_in);
    const co = parseISO(b.check_out);
    return isSameDay(date, ci) || isSameDay(date, co) || (isAfter(date, ci) && isBefore(date, co));
  });
  const blockedEntry = blocked.find(bd => {
    const s = parseISO(bd.start_date);
    const e = parseISO(bd.end_date);
    return isSameDay(date, s) || isSameDay(date, e) || isWithinInterval(date, { start: s, end: e });
  });
  const isBlocked = !!blockedEntry;
  const blockedProperty = blockedEntry ? properties.find(p => p.id === blockedEntry.property_id) : null;

  const [unblocking, setUnblocking] = useState(false);

  return (
    <>
      <ModalHeader
        title={format(date, 'EEEE', { locale: hr })}
        subtitle={format(date, 'd. LLLL yyyy', { locale: hr })}
        icon={CalendarIcon}
        onClose={onClose}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 pb-4">
        {isBlocked && blockedEntry && (
          <div className="mt-1 p-3.5 bg-red-500/[0.08] ring-1 ring-red-500/20 rounded-2xl flex items-start gap-3">
            <Lock className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[12.5px] font-bold text-red-300">Blokirano</p>
              <p className="text-[11.5px] text-red-400/80 mt-0.5">
                {blockedEntry.reason}
                {blockedProperty && ` · ${blockedProperty.name}`}
              </p>
            </div>
            <button
              type="button"
              disabled={unblocking}
              onClick={() => { setUnblocking(true); onUnblock(blockedEntry.id); }}
              className="flex items-center gap-1.5 h-10 px-3 text-[11.5px] font-bold text-red-300 active:bg-red-500/20 rounded-lg transition-colors flex-shrink-0 disabled:opacity-60"
            >
              {unblocking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Unlock className="w-3.5 h-3.5" />}
              Odblokiraj
            </button>
          </div>
        )}

        {dayBookings.length === 0 && !isBlocked && (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/[0.04] ring-1 ring-white/[0.06] flex items-center justify-center mb-3">
              <CalendarIcon className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-[14px] font-semibold text-slate-300">Slobodan dan</p>
            <p className="text-[12px] text-slate-500 mt-1">Dodajte rezervaciju ili blokirajte datum</p>
          </div>
        )}

        {dayBookings.length > 0 && (
          <div className="mt-1 space-y-1.5">
            {dayBookings.map(b => (
              <button
                key={b.id}
                type="button"
                onClick={() => onOpenBooking(b.id)}
                className="w-full text-left px-3 py-3 rounded-xl bg-white/[0.03] active:bg-white/[0.10] transition-colors flex items-center gap-3 min-h-[64px]"
              >
                <div className={cn('w-1 self-stretch rounded-full flex-shrink-0', STATUS[b.status]?.dot ?? 'bg-slate-400')} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-[14px] font-bold text-white truncate">{b.guest_name}</p>
                    <span className={cn('flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md', STATUS[b.status]?.badgeDark)}>
                      {STATUS[b.status]?.label}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-slate-400 truncate">{b.property?.name || '—'}</p>
                  <p className="text-[11.5px] text-slate-500">
                    {formatDate(b.check_in, 'dd.MM.')} – {formatDate(b.check_out, 'dd.MM.yyyy')} · {b.num_nights}n
                  </p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-[13px] font-bold text-white tabular-nums">{formatCurrency(b.total_price, currencySymbol)}</p>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 inline-block', PAYMENT[b.payment_status]?.clsDark)}>
                    {PAYMENT[b.payment_status]?.label}
                  </span>
                </div>
                <ChevRightIcon className="w-4 h-4 text-slate-600 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      <FooterBar>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onOpenNew}
            className="flex items-center justify-center gap-2 h-12 px-4 bg-white text-slate-900 rounded-xl text-[13.5px] font-bold active:bg-slate-200 transition-colors shadow-[0_6px_16px_-6px_rgba(255,255,255,0.3)]"
          >
            <Plus className="w-4 h-4" />
            Nova rezervacija
          </button>
          {isBlocked ? (
            <span className="flex items-center justify-center gap-2 h-12 px-4 bg-white/[0.04] text-slate-600 rounded-xl text-[13px] font-semibold">
              <Lock className="w-3.5 h-3.5" />
              Blokirano
            </span>
          ) : (
            <button
              type="button"
              onClick={onOpenBlock}
              className="flex items-center justify-center gap-2 h-12 px-4 bg-white/[0.05] ring-1 ring-white/[0.06] text-slate-200 rounded-xl text-[13.5px] font-semibold active:bg-white/[0.10] transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              Blokiraj
            </button>
          )}
        </div>
      </FooterBar>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BOOKING MODAL BODY
// ────────────────────────────────────────────────────────────────────────────

function BookingModalBody({
  booking,
  properties,
  currencySymbol,
  onClose,
  onBack,
  onSaved,
  onDeleted,
  onError,
}: {
  booking: Booking | null;
  properties: Property[];
  currencySymbol: string;
  onClose: () => void;
  onBack?: () => void;
  onSaved: (b: Booking) => void;
  onDeleted: (id: string) => void;
  onError: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Controlled state for everything — doesn't rely on uncontrolled forms,
  // simpler to debug and works perfectly with the sticky footer Save button.
  const [status, setStatus]               = useState<BookingStatus>(booking?.status ?? 'pending');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(booking?.payment_status ?? 'unpaid');
  const [adminNotes, setAdminNotes]       = useState(booking?.admin_notes ?? '');
  const [guestName, setGuestName]         = useState(booking?.guest_name ?? '');
  const [guestEmail, setGuestEmail]       = useState(booking?.guest_email ?? '');
  const [guestPhone, setGuestPhone]       = useState(booking?.guest_phone ?? '');
  const [numGuests, setNumGuests]         = useState(booking?.num_guests ?? 1);
  const [checkIn, setCheckIn]             = useState(booking?.check_in ?? '');
  const [checkOut, setCheckOut]           = useState(booking?.check_out ?? '');
  const [propertyId, setPropertyId]       = useState(booking?.property_id ?? '');

  if (!booking) {
    return (
      <>
        <ModalHeader title="Rezervacija nije pronađena" onClose={onClose} onBack={onBack} />
        <div className="p-8 text-center text-slate-500">Rezervacija nije pronađena.</div>
      </>
    );
  }

  const onSave = () => {
    startTransition(async () => {
      const r = await calUpdateBooking({
        id: booking.id,
        status, payment_status: paymentStatus, admin_notes: adminNotes,
        guest_name: guestName, guest_email: guestEmail, guest_phone: guestPhone,
        num_guests: numGuests, check_in: checkIn, check_out: checkOut,
        property_id: propertyId,
      });
      if (r.ok) onSaved(r.data);
      else onError(r.error);
    });
  };

  const onDelete = () => {
    startTransition(async () => {
      const r = await calDeleteBooking(booking.id);
      if (r.ok) onDeleted(booking.id);
      else onError(r.error);
    });
  };

  return (
    <>
      <ModalHeader
        title="Detalji rezervacije"
        subtitle={`#${booking.id.slice(0, 8).toUpperCase()}`}
        icon={Pencil}
        onClose={onClose}
        onBack={onBack}
      />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-5">

        <div className="flex flex-wrap gap-2">
          <span className={cn('px-2.5 py-1 rounded-lg text-[11.5px] font-bold', STATUS[booking.status]?.badgeDark)}>
            {STATUS[booking.status]?.label}
          </span>
          <span className={cn('px-2.5 py-1 rounded-lg text-[11.5px] font-bold', PAYMENT[booking.payment_status]?.clsDark)}>
            {PAYMENT[booking.payment_status]?.label}
          </span>
        </div>

        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/[0.03] ring-1 ring-white/[0.05]">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 ring-1 ring-white/10 flex items-center justify-center flex-shrink-0 text-[16px] font-bold text-white">
            {booking.guest_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-white truncate">{booking.guest_name}</p>
            {booking.guest_email && <p className="text-[12px] text-slate-400 truncate">{booking.guest_email}</p>}
            {booking.guest_phone && <p className="text-[12px] text-slate-400">{booking.guest_phone}</p>}
          </div>
        </div>

        <div className="rounded-2xl p-4 bg-gradient-to-br from-blue-500/[0.10] via-indigo-500/[0.06] to-transparent ring-1 ring-blue-500/15 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-blue-300 uppercase tracking-wider mb-1">{booking.num_nights} noći</p>
            <p className="text-[26px] font-extrabold text-white tracking-tight leading-none tabular-nums">
              {formatCurrency(booking.total_price, currencySymbol)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Čišćenje</p>
            <p className="text-[15px] font-bold text-slate-300 tabular-nums">{formatCurrency(booking.cleaning_fee, currencySymbol)}</p>
          </div>
        </div>

        <SectionHeader icon={CalendarIcon} label="Boravak" />
        <div className="grid grid-cols-2 gap-3 -mt-2">
          <Field label="Dolazak">
            <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="modal-input" />
          </Field>
          <Field label="Odlazak">
            <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="modal-input" />
          </Field>
          <Field label="Nekretnina">
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="modal-input">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Gosti">
            <input type="number" inputMode="numeric" min={1} value={numGuests} onChange={(e) => setNumGuests(parseInt(e.target.value) || 1)} className="modal-input" />
          </Field>
        </div>

        <SectionHeader icon={User} label="Kontakt" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-2">
          <Field label="Ime gosta">
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="modal-input" />
          </Field>
          <Field label="E-mail">
            <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} className="modal-input" />
          </Field>
          <Field label="Telefon">
            <input type="tel" inputMode="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} className="modal-input" />
          </Field>
        </div>

        {booking.notes && (
          <div className="rounded-2xl p-3.5 bg-amber-500/[0.06] ring-1 ring-amber-500/15">
            <div className="flex items-center gap-1.5 mb-2">
              <StickyNote className="w-3.5 h-3.5 text-amber-400" />
              <p className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">Napomene gosta</p>
            </div>
            <p className="text-[12.5px] text-amber-100/90 leading-relaxed whitespace-pre-line">{booking.notes}</p>
          </div>
        )}

        <SectionHeader icon={CreditCard} label="Status" />
        <div className="grid grid-cols-2 gap-3 -mt-2">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className="modal-input">
              {STATUSES.map(s => <option key={s} value={s}>{STATUS[s].label}</option>)}
            </select>
          </Field>
          <Field label="Plaćanje">
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className="modal-input">
              {PAYMENTS.map(s => <option key={s} value={s}>{PAYMENT[s].label}</option>)}
            </select>
          </Field>
        </div>

        <Field label="Admin napomene">
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className="modal-input resize-y" placeholder="Interne napomene..." />
        </Field>
      </div>

      <FooterBar>
        <div className="flex items-center justify-between gap-2.5">
          {confirmingDelete ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                className="h-11 px-3 text-[12.5px] font-semibold text-slate-300 bg-white/[0.06] active:bg-white/[0.12] rounded-xl"
              >
                Odustani
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={onDelete}
                className="flex items-center gap-1.5 h-11 px-3.5 text-[12.5px] font-bold text-white bg-red-600 active:bg-red-500 rounded-xl disabled:opacity-60"
              >
                {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Potvrdi brisanje
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              className="flex items-center gap-1.5 h-11 px-3.5 text-[12.5px] font-semibold text-red-300 active:bg-red-500/15 rounded-xl"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Obriši
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 text-[13px] font-medium text-slate-300 bg-white/[0.04] active:bg-white/[0.10] rounded-xl"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={pending}
              className="h-11 px-5 text-[13px] font-bold text-slate-900 bg-white active:bg-slate-200 rounded-xl flex items-center gap-2 shadow-[0_6px_16px_-6px_rgba(255,255,255,0.3)] disabled:opacity-70"
            >
              {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Spremi
            </button>
          </div>
        </div>
      </FooterBar>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// NEW BOOKING BODY
// ────────────────────────────────────────────────────────────────────────────

function NewBookingBody({
  prefillDate,
  properties,
  onClose,
  onBack,
  onCreated,
  onError,
}: {
  prefillDate?: string;
  properties: Property[];
  onClose: () => void;
  onBack?: () => void;
  onCreated: (b: Booking) => void;
  onError: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  const [propertyId, setPropertyId]   = useState(properties[0]?.id ?? '');
  const [guestName, setGuestName]     = useState('');
  const [guestEmail, setGuestEmail]   = useState('');
  const [guestPhone, setGuestPhone]   = useState('');
  const [guestCountry, setGuestCountry] = useState('');
  const [numGuests, setNumGuests]     = useState(2);
  const [status, setStatus]           = useState<BookingStatus>('confirmed');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('unpaid');
  const [adminNotes, setAdminNotes]   = useState('');
  const [checkIn, setCheckIn]         = useState(prefillDate || '');
  const [checkOut, setCheckOut]       = useState(
    prefillDate ? format(addDays(parseISO(prefillDate), 1), 'yyyy-MM-dd') : ''
  );

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    try { return Math.max(0, differenceInCalendarDays(parseISO(checkOut), parseISO(checkIn))); }
    catch { return 0; }
  }, [checkIn, checkOut]);

  const onCreate = () => {
    if (!propertyId || !guestName || !checkIn || !checkOut) {
      onError('Ispunite obavezna polja.');
      return;
    }
    startTransition(async () => {
      const r = await calCreateBooking({
        property_id: propertyId, guest_name: guestName, guest_email: guestEmail,
        guest_phone: guestPhone, guest_country: guestCountry,
        check_in: checkIn, check_out: checkOut, num_guests: numGuests,
        status, payment_status: paymentStatus, admin_notes: adminNotes,
      });
      if (r.ok) onCreated(r.data);
      else onError(r.error);
    });
  };

  return (
    <>
      <ModalHeader title="Nova rezervacija" subtitle="Ručni unos" icon={Plus} onClose={onClose} onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-5">

        <SectionHeader icon={User} label="Informacije o gostu" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-2">
          <Field label="Ime gosta *" icon={User}>
            <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} placeholder="Npr. Ivan Horvat" className="modal-input" />
          </Field>
          <Field label="E-mail" icon={Mail}>
            <input type="email" inputMode="email" autoCapitalize="none" autoCorrect="off" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} placeholder="gost@email.com" className="modal-input" />
          </Field>
          <Field label="Telefon" icon={Phone}>
            <input type="tel" inputMode="tel" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} placeholder="+385 91 000 0000" className="modal-input" />
          </Field>
          <Field label="Država" icon={Globe}>
            <input type="text" value={guestCountry} onChange={(e) => setGuestCountry(e.target.value)} placeholder="Hrvatska" className="modal-input" />
          </Field>
        </div>

        <SectionHeader icon={CalendarIcon} label="Detalji boravka" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-2">
          <Field label="Nekretnina *" icon={Building2}>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="modal-input">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Broj gostiju" icon={Users}>
            <input type="number" inputMode="numeric" min={1} value={numGuests} onChange={(e) => setNumGuests(parseInt(e.target.value) || 1)} className="modal-input" />
          </Field>
          <Field label="Datum dolaska *" icon={CalendarIcon}>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => {
                const v = e.target.value;
                setCheckIn(v);
                if (v && (!checkOut || checkOut <= v)) {
                  try { setCheckOut(format(addDays(parseISO(v), 1), 'yyyy-MM-dd')); } catch {}
                }
              }}
              className="modal-input"
            />
          </Field>
          <Field label="Datum odlaska *" icon={CalendarIcon}>
            <input
              type="date"
              value={checkOut}
              min={checkIn || undefined}
              onChange={(e) => setCheckOut(e.target.value)}
              className="modal-input"
            />
          </Field>
        </div>

        {nights > 0 && (
          <div className="flex items-center justify-between rounded-xl p-3 bg-blue-500/[0.06] ring-1 ring-blue-500/15">
            <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">Trajanje</span>
            <span className="text-[13px] font-bold text-white tabular-nums">{nights} {nights === 1 ? 'noć' : 'noći'}</span>
          </div>
        )}

        <SectionHeader icon={CreditCard} label="Status i plaćanje" />
        <div className="grid grid-cols-2 gap-3 -mt-2">
          <Field label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as BookingStatus)} className="modal-input">
              <option value="pending">Na čekanju</option>
              <option value="confirmed">Potvrđeno</option>
            </select>
          </Field>
          <Field label="Plaćanje">
            <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)} className="modal-input">
              <option value="unpaid">Neplaćeno</option>
              <option value="paid">Plaćeno</option>
              <option value="partial">Djelomično</option>
            </select>
          </Field>
        </div>

        <Field label="Admin napomene" icon={Pencil}>
          <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className="modal-input resize-y" placeholder="Interne napomene..." />
        </Field>
      </div>

      <FooterBar>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 text-[13px] font-medium text-slate-300 bg-white/[0.04] active:bg-white/[0.10] rounded-xl"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={onCreate}
            disabled={pending}
            className="h-11 px-5 text-[13px] font-bold text-slate-900 bg-white active:bg-slate-200 rounded-xl flex items-center gap-2 shadow-[0_6px_16px_-6px_rgba(255,255,255,0.3)] disabled:opacity-70"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            Kreiraj
          </button>
        </div>
      </FooterBar>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// BLOCK BODY
// ────────────────────────────────────────────────────────────────────────────

function BlockBody({
  prefillDate,
  properties,
  propertyFilter,
  onClose,
  onBlocked,
  onError,
}: {
  prefillDate?: string;
  properties: Property[];
  propertyFilter: string;
  onClose: () => void;
  onBlocked: (bd: BlockedDate) => void;
  onError: (msg: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const hasProperty = propertyFilter !== 'all';

  const [propertyId, setPropertyId] = useState(hasProperty ? propertyFilter : (properties[0]?.id ?? ''));
  const [startDate, setStartDate]   = useState(prefillDate || '');
  const [endDate, setEndDate]       = useState(prefillDate || '');
  const [reason, setReason]         = useState('Blokirano od admina');

  const onSubmit = () => {
    if (!propertyId || !startDate) {
      onError('Odaberite nekretninu i datum.');
      return;
    }
    startTransition(async () => {
      const r = await calBlockDates({
        property_id: propertyId,
        start_date: startDate,
        end_date: endDate || startDate,
        reason,
      });
      if (r.ok) onBlocked(r.data);
      else onError(r.error);
    });
  };

  return (
    <>
      <ModalHeader title="Blokiraj datume" subtitle="Onemogući rezervacije" icon={Lock} onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pb-4 space-y-4">
        {!hasProperty && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/[0.06] ring-1 ring-amber-500/15">
            <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[12.5px] text-amber-100/90 leading-relaxed">
              Odaberite nekretninu za blokiranje datuma.
            </p>
          </div>
        )}

        {!hasProperty && (
          <Field label="Nekretnina *" icon={Building2}>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="modal-input">
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Od datuma *" icon={CalendarIcon}>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="modal-input" />
          </Field>
          <Field label="Do datuma" icon={CalendarIcon}>
            <input type="date" value={endDate} min={startDate || undefined} onChange={(e) => setEndDate(e.target.value)} className="modal-input" />
          </Field>
        </div>

        <Field label="Razlog">
          <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} className="modal-input" placeholder="Razlog blokiranja..." />
        </Field>
      </div>

      <FooterBar>
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-11 px-4 text-[13px] font-medium text-slate-300 bg-white/[0.04] active:bg-white/[0.10] rounded-xl"
          >
            Odustani
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="h-11 px-5 text-[13px] font-bold text-white bg-red-500 active:bg-red-600 rounded-xl flex items-center gap-2 shadow-[0_6px_16px_-6px_rgba(239,68,68,0.4)] disabled:opacity-70"
          >
            {pending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
            Blokiraj
          </button>
        </div>
      </FooterBar>
    </>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Form bits
// ────────────────────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2.5 pt-2">
      <div className="w-6 h-6 rounded-lg bg-blue-500/10 ring-1 ring-blue-500/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-blue-300" />
      </div>
      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-[0.14em]">{label}</p>
    </div>
  );
}

function Field({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </label>
      {children}
    </div>
  );
}
