import { format, differenceInDays, eachDayOfInterval, parseISO, isWithinInterval } from 'date-fns';

export function formatDate(date: string | Date, fmt: string = 'MMM dd, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function formatCurrency(amount: number, symbol: string = '€'): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function getNights(checkIn: string | Date, checkOut: string | Date): number {
  const start = typeof checkIn === 'string' ? parseISO(checkIn) : checkIn;
  const end = typeof checkOut === 'string' ? parseISO(checkOut) : checkOut;
  return differenceInDays(end, start);
}

export function getDatesInRange(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function isDateBlocked(
  date: Date,
  blockedRanges: { start_date: string; end_date: string }[]
): boolean {
  return blockedRanges.some((range) =>
    isWithinInterval(date, {
      start: parseISO(range.start_date),
      end: parseISO(range.end_date),
    })
  );
}

export function isDateBooked(
  date: Date,
  bookings: { check_in: string; check_out: string; status: string }[]
): boolean {
  return bookings
    .filter((b) => b.status !== 'cancelled')
    .some((booking) =>
      isWithinInterval(date, {
        start: parseISO(booking.check_in),
        end: parseISO(booking.check_out),
      })
    );
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    checked_in: 'bg-green-100 text-green-800',
    checked_out: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800',
    unpaid: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-orange-100 text-orange-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}
