import { Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import GuestsClient, { type GuestRow } from '@/components/admin/GuestsClient';
import type { Booking } from '@/types/database';

type SearchParams = {
  q?: string;
  expand?: string;
};

export default async function GuestsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialQuery = (params.q || '').trim();
  const initialExpanded = params.expand || null;

  const supabase = await createClient();
  const [bookingsRes, settingsRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, property:properties(name)')
      .order('created_at', { ascending: false }),
    supabase.from('site_settings').select('currency_symbol').single(),
  ]);

  const bookings = (bookingsRes.data || []) as Booking[];
  const currencySymbol = settingsRes.data?.currency_symbol || '€';

  /* Roll up bookings into unique guests */
  const map = new Map<string, GuestRow>();
  for (const b of bookings) {
    const key = b.guest_phone || b.guest_email || b.guest_name;
    const existing = map.get(key);
    if (existing) {
      existing.totalBookings++;
      existing.totalSpent += b.total_price + (b.cleaning_fee || 0);
      if (b.created_at > existing.lastBooking) existing.lastBooking = b.created_at;
      existing.bookings.push(b);
    } else {
      map.set(key, {
        key,
        name: b.guest_name,
        email: b.guest_email,
        phone: b.guest_phone,
        country: b.guest_country,
        totalBookings: 1,
        totalSpent: b.total_price + (b.cleaning_fee || 0),
        lastBooking: b.created_at,
        bookings: [b],
      });
    }
  }
  const guests = Array.from(map.values()).sort((a, b) =>
    b.lastBooking.localeCompare(a.lastBooking),
  );

  return (
    <div className="space-y-7 animate-fade-up">
      {/* ── Hero header ── */}
      <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-white to-slate-50 p-6 lg:p-8">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-gradient-to-br from-violet-500/10 to-pink-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-20 w-72 h-72 rounded-full bg-gradient-to-tr from-blue-400/10 to-transparent blur-3xl pointer-events-none" />

        <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/80 ring-1 ring-slate-200 backdrop-blur-sm">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-[11px] font-semibold text-slate-500 tracking-wide">CRM</span>
            </div>
            <h1 className="mt-3 text-[28px] sm:text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
              Gosti
            </h1>
            <p className="text-[13px] text-slate-500 mt-1.5">
              Pregled jedinstvenih gostiju i njihove povijesti rezervacija
            </p>
          </div>
        </div>
      </header>

      <GuestsClient
        guests={guests}
        currencySymbol={currencySymbol}
        initialQuery={initialQuery}
        initialExpanded={initialExpanded}
      />
    </div>
  );
}
