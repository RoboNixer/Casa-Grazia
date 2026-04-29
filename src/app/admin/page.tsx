import Link from 'next/link';
import { startOfMonth, endOfMonth, addDays, format } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  BookOpen,
  CalendarCheck,
  DollarSign,
  Building2,
  ArrowRight,
  Plus,
  Eye,
  CalendarDays,
  Clock,
  LogIn,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { formatDate, formatCurrency, getStatusColor, cn } from '@/lib/utils';
import StatsCard from '@/components/admin/StatsCard';
import type { Booking, SiteSettings } from '@/types/database';

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

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const now = new Date();
  const monthStart = startOfMonth(now).toISOString().split('T')[0];
  const monthEnd = endOfMonth(now).toISOString().split('T')[0];
  const weekAhead = addDays(now, 7).toISOString().split('T')[0];
  const today = now.toISOString().split('T')[0];
  const todayFmt = format(now, "EEEE, d. MMMM yyyy.", { locale: hr });
  const greeting =
    now.getHours() < 12 ? 'Dobro jutro' : now.getHours() < 18 ? 'Dobar dan' : 'Dobra večer';

  const [
    bookingsRes,
    propertiesRes,
    settingsRes,
    countRes,
    upcomingRes,
    monthRes,
    todayCheckInsRes,
    todayCheckOutsRes,
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('properties').select('id, is_active'),
    supabase.from('site_settings').select('currency_symbol').single(),
    supabase.from('bookings').select('*', { count: 'exact', head: true }),
    supabase
      .from('bookings')
      .select('id')
      .gte('check_in', today)
      .lte('check_in', weekAhead)
      .in('status', ['confirmed', 'pending']),
    supabase
      .from('bookings')
      .select('total_price, cleaning_fee')
      .gte('check_in', monthStart)
      .lte('check_in', monthEnd)
      .neq('status', 'cancelled'),
    supabase
      .from('bookings')
      .select('id, guest_name, property:properties(name), check_in')
      .eq('check_in', today)
      .neq('status', 'cancelled'),
    supabase
      .from('bookings')
      .select('id, guest_name, property:properties(name), check_out')
      .eq('check_out', today)
      .neq('status', 'cancelled'),
  ]);

  const bookings = (bookingsRes.data || []) as Booking[];
  const currencySymbol = (settingsRes.data as SiteSettings | null)?.currency_symbol ?? '€';
  const totalBookings = countRes.count || 0;
  const upcomingCheckins = upcomingRes.data?.length || 0;
  const monthRevenue = (monthRes.data || []).reduce(
    (sum, b) => sum + (b.total_price || 0) + (b.cleaning_fee || 0), 0,
  );
  const totalProperties = propertiesRes.data?.length || 0;
  const activeProperties = (propertiesRes.data || []).filter((p) => p.is_active).length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  type ActivityRow = {
    id: string;
    guest_name: string;
    property: { name: string } | null;
  };
  const todayCheckIns = (todayCheckInsRes.data || []) as unknown as ActivityRow[];
  const todayCheckOuts = (todayCheckOutsRes.data || []) as unknown as ActivityRow[];

  return (
    <div className="space-y-7 animate-fade-up">
      {/* ── Hero header ── */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 lg:p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-blue-500/10 to-violet-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-emerald-400/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-slate-200 backdrop-blur-sm">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 capitalize tracking-wide">
                {todayFmt}
              </span>
            </div>
            <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
              {greeting}.
              <span className="block text-slate-500 font-medium text-[20px] sm:text-[22px] mt-1">
                Ovdje je sažetak vašeg poslovanja danas.
              </span>
            </h1>
            {pendingCount > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 ring-1 ring-amber-100 text-amber-700">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="text-[12.5px] font-semibold">
                  {pendingCount} {pendingCount === 1 ? 'rezervacija čeka' : pendingCount < 5 ? 'rezervacije čekaju' : 'rezervacija čeka'} odobrenje
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin/calendar"
              className="inline-flex items-center gap-2 h-11 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 hover:border-slate-300 active:scale-[0.97] transition-all"
            >
              <CalendarDays className="w-4 h-4" />
              Otvori kalendar
            </Link>
            <Link
              href="/admin/calendar?new=1"
              className="inline-flex items-center gap-2 h-11 px-4 bg-slate-900 text-white text-[13px] font-bold rounded-xl hover:bg-slate-800 active:scale-[0.97] transition-all shadow-[0_8px_22px_-10px_rgba(15,23,42,0.55)]"
            >
              <Plus className="w-4 h-4" />
              Nova rezervacija
            </Link>
          </div>
        </div>
      </header>

      {/* ── Stats grid ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          icon={BookOpen}
          label="Ukupno rezervacija"
          value={totalBookings}
          accent="blue"
          hint="Od početka rada"
        />
        <StatsCard
          icon={CalendarCheck}
          label="Dolasci ovaj tjedan"
          value={upcomingCheckins}
          accent="emerald"
          hint="Sljedećih 7 dana"
        />
        <StatsCard
          icon={DollarSign}
          label="Prihod ovog mjeseca"
          value={formatCurrency(monthRevenue, currencySymbol)}
          accent="amber"
          hint={format(now, 'LLLL yyyy.', { locale: hr })}
        />
        <StatsCard
          icon={Building2}
          label="Aktivne nekretnine"
          value={activeProperties}
          accent="violet"
          hint={`${totalProperties} ukupno`}
        />
      </div>

      {/* ── Today activity panel ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ActivityCard
          title="Dolasci danas"
          icon={LogIn}
          accent="emerald"
          rows={todayCheckIns}
          empty="Danas nema dolazaka."
        />
        <ActivityCard
          title="Odlasci danas"
          icon={LogOut}
          accent="amber"
          rows={todayCheckOuts}
          empty="Danas nema odlazaka."
        />
      </section>

      {/* ── Recent bookings ── */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h2 className="text-[15px] font-bold text-slate-900 tracking-tight">Nedavne rezervacije</h2>
            <p className="text-[12px] text-slate-400 mt-0.5">Najnoviji unosi i njihov status</p>
          </div>
          <Link
            href="/admin/calendar"
            className="group inline-flex items-center gap-1.5 px-3 py-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 transition-all"
          >
            Prikaži sve
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-slate-300" />
              </div>
              <p className="text-[14px] font-semibold text-slate-600">Još nema rezervacija</p>
              <p className="text-[12.5px] text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                Stvorite prvu rezervaciju i počnite upravljati smještajem.
              </p>
              <Link
                href="/admin/calendar?new=1"
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[13px] font-semibold rounded-xl hover:bg-slate-800 active:scale-95 transition-all"
              >
                <Plus className="w-3.5 h-3.5" /> Nova rezervacija
              </Link>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/70">
                      <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Gost</th>
                      <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Nekretnina</th>
                      <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Datumi</th>
                      <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Status</th>
                      <th className="text-left px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Plaćanje</th>
                      <th className="text-right px-5 py-3 text-[10.5px] font-semibold text-slate-400 uppercase tracking-[0.12em]">Ukupno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking, i) => (
                      <tr
                        key={booking.id}
                        className={cn(
                          'group transition-colors hover:bg-slate-50/70',
                          i < bookings.length - 1 && 'border-b border-slate-100',
                        )}
                      >
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <Avatar name={booking.guest_name} />
                            <div className="min-w-0">
                              <p className="text-[13px] font-semibold text-slate-900 leading-tight truncate">{booking.guest_name}</p>
                              <p className="text-[11.5px] text-slate-400 mt-0.5 truncate">{booking.guest_email || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-slate-600 truncate max-w-[180px]">
                          {booking.property?.name || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-[13px] text-slate-500 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="w-3 h-3 text-slate-300" />
                            {formatDate(booking.check_in, 'dd.MM.')} – {formatDate(booking.check_out, 'dd.MM.')}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold', getStatusColor(booking.status))}>
                            {statusLabels[booking.status] || booking.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center px-2.5 py-1 rounded-lg text-[11.5px] font-semibold', getStatusColor(booking.payment_status))}>
                            {paymentLabels[booking.payment_status] || booking.payment_status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[13.5px] font-bold text-slate-900 whitespace-nowrap tabular-nums">
                              {formatCurrency(booking.total_price, currencySymbol)}
                            </span>
                            <Link
                              href={`/admin/calendar?id=${booking.id}`}
                              className="opacity-0 group-hover:opacity-100 inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                              title="Pregledaj rezervaciju"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <Link
                    key={booking.id}
                    href={`/admin/calendar?id=${booking.id}`}
                    className="flex items-start justify-between gap-3 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <Avatar name={booking.guest_name} />
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-900 truncate">{booking.guest_name}</p>
                        <p className="text-[12px] text-slate-500 truncate mt-0.5">{booking.property?.name || '—'}</p>
                        <p className="text-[11.5px] text-slate-400 mt-1">
                          {formatDate(booking.check_in, 'dd.MM.')} – {formatDate(booking.check_out, 'dd.MM.')}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                      <span className={cn('inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold', getStatusColor(booking.status))}>
                        {statusLabels[booking.status] || booking.status}
                      </span>
                      <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                        {formatCurrency(booking.total_price, currencySymbol)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Avatar({ name }: { name: string }) {
  const initial = name?.charAt(0)?.toUpperCase() || '?';
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold text-white bg-gradient-to-br from-slate-700 to-slate-900 ring-2 ring-white shadow-[0_2px_4px_rgba(15,23,42,0.15)]">
      {initial}
    </div>
  );
}

const activityAccents = {
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    iconRing: 'ring-emerald-100',
    glow: 'from-emerald-500/10',
  },
  amber: {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-600',
    iconRing: 'ring-amber-100',
    glow: 'from-amber-500/10',
  },
} as const;

function ActivityCard({
  title,
  icon: Icon,
  accent,
  rows,
  empty,
}: {
  title: string;
  icon: typeof LogIn;
  accent: keyof typeof activityAccents;
  rows: { id: string; guest_name: string; property: { name: string } | null }[];
  empty: string;
}) {
  const c = activityAccents[accent];
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl border border-slate-200/80 p-5">
      <div className={cn('absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br to-transparent blur-2xl pointer-events-none', c.glow)} />

      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className={cn('flex items-center justify-center w-9 h-9 rounded-xl ring-1', c.iconBg, c.iconRing)}>
            <Icon className={cn('w-[17px] h-[17px]', c.iconText)} strokeWidth={2.2} />
          </div>
          <h3 className="text-[14px] font-bold text-slate-900 tracking-tight">{title}</h3>
        </div>
        <span className="text-[11px] font-semibold text-slate-400 px-2 py-0.5 rounded-full bg-slate-50 ring-1 ring-slate-100 tabular-nums">
          {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="relative text-[12.5px] text-slate-400 py-4">{empty}</p>
      ) : (
        <ul className="relative space-y-1.5">
          {rows.slice(0, 4).map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-50/70 ring-1 ring-slate-100/80"
            >
              <Avatar name={r.guest_name} />
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold text-slate-900 truncate leading-tight">
                  {r.guest_name}
                </p>
                <p className="text-[11.5px] text-slate-500 truncate mt-0.5">
                  {r.property?.name || '—'}
                </p>
              </div>
            </li>
          ))}
          {rows.length > 4 && (
            <li className="text-[11.5px] text-slate-400 text-center pt-1.5 font-medium">
              + još {rows.length - 4}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
