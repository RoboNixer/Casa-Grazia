import { cache } from 'react';
import { format } from 'date-fns';
import { createClient } from '@/lib/supabase/server';
import type { Booking, BlockedDate, Property, SiteSettings } from '@/types/database';

/**
 * Cached calendar data fetcher. React's `cache()` ensures both the layout
 * AND the page can call this within the same request and only fetch once.
 *
 * Used by:
 *  - layout.tsx → for the calendar grid
 *  - page.tsx   → for modal contents (booking detail, day list, etc.)
 */
export const getCalendarData = cache(async () => {
  const supabase = await createClient();

  const [bRes, bdRes, pRes, sRes] = await Promise.all([
    supabase
      .from('bookings')
      .select('*, property:properties(*)')
      .neq('status', 'cancelled'),
    supabase.from('blocked_dates').select('*'),
    supabase.from('properties').select('*').eq('is_active', true).order('name'),
    supabase.from('site_settings').select('currency_symbol').single(),
  ]);

  const now = new Date();
  return {
    bookings:       (bRes.data  || []) as Booking[],
    blockedDates:   (bdRes.data || []) as BlockedDate[],
    properties:     (pRes.data  || []) as Property[],
    currencySymbol: (sRes.data as SiteSettings | null)?.currency_symbol ?? '€',
    todayStr:       format(now, 'yyyy-MM-dd'),
    initialMonth:   format(now, 'yyyy-MM'),
  };
});

export type CalendarData = Awaited<ReturnType<typeof getCalendarData>>;
