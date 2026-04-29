import CalendarClient, { type CalendarModalState } from '@/components/admin/CalendarClient';
import { getCalendarData } from './_data';

/**
 * Server component: fetches calendar data once and hands it to a single
 * client component. All interactions (open modal, edit, create, block) are
 * handled client-side via useState + server actions that RETURN data —
 * no redirects, no full RSC navigations, no re-mounts. The calendar stays
 * mounted permanently while you work.
 */
export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    day?: string;
    id?: string;
    new?: string;
    block?: string;
    date?: string;
    from?: string;
  }>;
}) {
  const params = await searchParams;
  const data = await getCalendarData();

  const initialModal: CalendarModalState = params.id
    ? { kind: 'booking', id: params.id, fromDateStr: params.from }
    : params.new === '1'
    ? { kind: 'new', date: params.date, fromDateStr: params.from }
    : params.block === '1'
    ? { kind: 'block', date: params.date }
    : params.day
    ? { kind: 'day', dateStr: params.day }
    : null;

  return <CalendarClient {...data} initialModal={initialModal} />;
}
