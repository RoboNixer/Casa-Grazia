import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import BookingForm from '@/components/client/BookingForm';
import type { Property, SiteSettings } from '@/types/database';

// Availability must always be live: any new booking (including pending
// "Na čekanju" requests) needs to mark the calendar immediately so two
// guests can't request overlapping dates. Skipping the route cache here
// guarantees the bookings + blocked_dates queries run on every visit.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BookPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const queryPropertyId =
    typeof params.property === 'string' ? params.property : undefined;
  const error = typeof params.error === 'string' ? params.error : undefined;

  const supabase = await createClient();

  // Fetch availability data for the next ~24 months. Anything older than today
  // is irrelevant; we use that as the lower bound to keep the payload tiny.
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const [
    { data: propertiesData },
    { data: settings },
    { data: bookingsData },
    { data: blockedData },
  ] = await Promise.all([
    supabase
      .from('properties')
      .select('*, images:property_images(*)')
      .eq('is_active', true)
      .order('sort_order', { ascending: true }),
    supabase.from('site_settings').select('currency_symbol').single(),
    // We query the `public_bookings` view (not the `bookings` table) so
    // anonymous visitors can actually read availability data. The bookings
    // table itself is admin-only via RLS to keep guest PII private — the
    // view exposes only property_id + check_in + check_out for active
    // future bookings. See supabase/migrations/0003_public_availability_view.sql
    supabase
      .from('public_bookings')
      .select('property_id, check_in, check_out')
      .gte('check_out', todayStr),
    supabase
      .from('blocked_dates')
      .select('property_id, start_date, end_date')
      .gte('end_date', todayStr),
  ]);

  const properties = (propertiesData ?? []) as Property[];
  const currencySymbol =
    (settings as SiteSettings | null)?.currency_symbol ?? '€';

  const singleMode = process.env.NEXT_PUBLIC_SINGLE_PROPERTY_MODE === 'true';
  const propertyId =
    queryPropertyId ?? (singleMode || properties.length === 1 ? properties[0]?.id : undefined);

  const bookings = (bookingsData ?? []) as {
    property_id: string;
    check_in: string;
    check_out: string;
  }[];
  const blocked = (blockedData ?? []) as {
    property_id: string;
    start_date: string;
    end_date: string;
  }[];

  return (
    <div className="min-h-screen">
      {/* Page header */}
      <div className="hero-mediterranean py-24 lg:py-32 pt-32 lg:pt-40">
        <div className="relative z-10 mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 text-center animate-fade-up">
          <span className="inline-flex items-center gap-3 font-mono text-[10.5px] tracking-[0.28em] uppercase text-emerald-700 mb-4">
            <span className="h-px w-6 bg-emerald-700/50" />
            Rezervacije
            <span className="h-px w-6 bg-emerald-700/50" />
          </span>
          <h1 className="font-display font-medium text-ink text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05]">
            Rezervirajte <span className="italic text-emerald-700">smještaj</span>
          </h1>
          <p className="mt-6 text-[15.5px] sm:text-base text-ink-muted max-w-xl mx-auto leading-relaxed">
            Odaberite slobodne datume u kalendaru, a mi ćemo potvrditi rezervaciju.{' '}
            <span className="text-emerald-700 font-medium">Nije potrebno online plaćanje.</span>
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="py-16 lg:py-24 bg-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {error && (
            <div className="max-w-3xl mx-auto mb-8 flex items-start gap-3 px-5 py-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm animate-fade-in shadow-sm">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <BookingForm
            propertyId={propertyId}
            properties={properties}
            currencySymbol={currencySymbol}
            bookings={bookings}
            blocked={blocked}
            todayStr={todayStr}
          />
        </div>
      </div>
    </div>
  );
}
