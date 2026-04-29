'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getNights } from '@/lib/utils';

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

  if (
    !propertyId ||
    !checkIn ||
    !checkOut ||
    !guestName ||
    !guestEmail ||
    !guestPhone ||
    !guestCountry
  ) {
    redirect(buildErrorRedirect(propertyId, 'Molimo ispunite sva polja.'));
  }

  const nights = getNights(checkIn, checkOut);
  if (nights <= 0) {
    redirect(
      buildErrorRedirect(propertyId, 'Datum odlaska mora biti nakon datuma dolaska.')
    );
  }

  const supabase = await createClient();

  const { data: property } = await supabase
    .from('properties')
    .select('base_price, cleaning_fee, max_guests')
    .eq('id', propertyId)
    .single();

  if (!property) {
    redirect(buildErrorRedirect(propertyId, 'Nekretnina nije pronađena.'));
  }

  if (numGuests > property.max_guests) {
    redirect(
      buildErrorRedirect(
        propertyId,
        `Maksimalan broj gostiju je ${property.max_guests}.`
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
      buildErrorRedirect(
        propertyId,
        'Odabrani datumi nisu dostupni. Molimo odaberite druge datume.'
      )
    );
  }

  const { data: blocked } = await supabase
    .from('blocked_dates')
    .select('start_date, end_date')
    .eq('property_id', propertyId);

  if (blocked?.some((b) => checkIn < b.end_date && checkOut > b.start_date)) {
    redirect(
      buildErrorRedirect(
        propertyId,
        'Odabrani datumi su blokirani. Molimo odaberite druge datume.'
      )
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
      buildErrorRedirect(propertyId, 'Nešto je pošlo po krivu. Molimo pokušajte ponovo.')
    );
  }

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
