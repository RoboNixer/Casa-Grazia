import { redirect } from 'next/navigation';

/**
 * Legacy route kept only for backwards compatibility.
 * Reservation management is now calendar-first.
 */
export default async function LegacyBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const qs = new URLSearchParams();

  for (const [key, raw] of Object.entries(params)) {
    if (Array.isArray(raw)) {
      for (const value of raw) qs.append(key, value);
    } else if (typeof raw === 'string') {
      qs.set(key, raw);
    }
  }

  const query = qs.toString();
  redirect(`/admin/calendar${query ? `?${query}` : ''}`);
}
