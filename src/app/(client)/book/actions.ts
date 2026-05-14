'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getNights } from '@/lib/utils';
import { notifyBookingRequested } from '@/lib/email/notifications';
import type { Booking } from '@/types/database';
import { getServerDictionary } from '@/i18n/server';
import { format as fmt } from '@/i18n/format';

function buildErrorRedirect(propertyId: string, message: string) {
  const params = new URLSearchParams();
  if (propertyId) params.set('property', propertyId);
  params.set('error', message);
  return `/book?${params.toString()}`;
}

export async function submitBookingAction(formData: FormData) {
  const propertyId = (formData.get('property_id') as string) || '';
  const checkIn = (formData.get('check_in') as string) || '';
  const checkOut = (formData.get('check_out') as string) || '';
  const numGuests = parseInt((formData.get('num_guests') as string) || '0', 10);
  const guestName = (formData.get('guest_name') as string) || '';
  const guestEmail = (formData.get('guest_email') as string) || '';
  const guestPhone = (formData.get('guest_phone') as string) || '';
  const guestCountry = (formData.get('guest_country') as string) || '';

  const { t } = await getServerDictionary();

  if (
    !propertyId ||
    !checkIn ||
    !checkOut ||
    !guestName ||
    !guestEmail ||
    !guestPhone ||
    !guestCountry
  ) {
    redirect(buildErrorRedirect(propertyId, t.book.errors.fillAll));
  }

  const nights = getNights(checkIn, checkOut);
  if (nights <= 0) {
    redirect(
      buildErrorRedirect(propertyId, t.book.errors.checkoutAfter)
    );
  }

  const supabase = await createClient();

  // We pull the full row (not just price fields) because RLS won't let an anon
  // session SELECT the inserted booking back, so we can't `.select(...)` after
  // insert. Instead we build the email payload below from this property row +
  // the form fields we already have.
  const { data: property } = await supabase
    .from('properties')
    .select('id, name, base_price, cleaning_fee, max_guests, min_nights')
    .eq('id', propertyId)
    .single();

  if (!property) {
    redirect(buildErrorRedirect(propertyId, t.book.errors.propertyNotFound));
  }

  if (numGuests > property.max_guests) {
    redirect(
      buildErrorRedirect(
        propertyId,
        fmt(t.book.errors.maxGuests, { n: property.max_guests }),
      )
    );
  }

  const minNights = Math.max(1, property.min_nights ?? 1);
  if (nights < minNights) {
    redirect(
      buildErrorRedirect(
        propertyId,
        fmt(t.book.errors.minNights, { n: minNights }),
      )
    );
  }

  const { data: bookings } = await supabase
    .from('bookings')
    .select('check_in, check_out')
    .eq('property_id', propertyId)
    .neq('status', 'cancelled');

  if (bookings?.some((b) => checkIn < b.check_out && checkOut > b.check_in)) {
    redirect(
      buildErrorRedirect(propertyId, t.book.errors.datesUnavailable)
    );
  }

  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('start_date, end_date')
    .eq('property_id', propertyId);

  if (blocked?.some((b) => checkIn < b.end_date && checkOut > b.start_date)) {
    redirect(
      buildErrorRedirect(propertyId, t.book.errors.datesBlocked)
    );
  }

  const accommodationCost = nights * property.base_price;
  const cleaningFee = property.cleaning_fee ?? 0;
  const totalPrice = accommodationCost + cleaningFee;

  const { error: insertError } = await supabase.from('bookings').insert({
    property_id: propertyId,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    guest_country: guestCountry,
    check_in: checkIn,
    check_out: checkOut,
    num_guests: numGuests,
    num_nights: nights,
    total_price: totalPrice,
    cleaning_fee: cleaningFee,
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'cash',
    notes: '',
    admin_notes: '',
  });

  if (insertError) {
    redirect(
      buildErrorRedirect(propertyId, t.book.errors.generic)
    );
  }

  // RLS blocks anon SELECT on bookings, so we synthesise a Booking-shaped
  // object from the data we already have for the email templates. The id is
  // unknown (DB-generated) — we fall back to a deterministic key based on
  // guest+dates+property so a double-submit within Resend's 24h dedup window
  // is still caught.
  const bookingForEmail = {
    id: `${guestEmail}|${propertyId}|${checkIn}|${checkOut}`,
    property_id: propertyId,
    guest_name: guestName,
    guest_email: guestEmail,
    guest_phone: guestPhone,
    guest_country: guestCountry,
    check_in: checkIn,
    check_out: checkOut,
    num_guests: numGuests,
    num_nights: nights,
    total_price: totalPrice,
    cleaning_fee: cleaningFee,
    notes: '',
    status: 'pending',
    payment_status: 'unpaid',
    payment_method: 'cash',
    admin_notes: '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    property: {
      id: property.id,
      name: property.name,
      base_price: property.base_price,
      cleaning_fee: property.cleaning_fee ?? 0,
      max_guests: property.max_guests,
    },
  } as unknown as Booking;

  // Owner gets a "new request" alert, guest gets a "we received your request"
  // confirmation. notifyBookingRequested swallows all errors internally so a
  // Resend outage can never break the redirect to /book/success.
  await notifyBookingRequested(bookingForEmail);

  // Invalidate availability everywhere the new pending booking matters so the
  // dates are immediately blocked for any other guest about to request them,
  // and so the admin calendar picks up the new "Na čekanju" entry on next view.
  revalidatePath('/book');
  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/guests');

  redirect(
    '/book/success?name=' +
      encodeURIComponent(guestName) +
      '&email=' +
      encodeURIComponent(guestEmail)
  );
}
