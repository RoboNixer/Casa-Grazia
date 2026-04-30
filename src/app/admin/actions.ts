'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import {
  notifyAdminBookingCreated,
  notifyBookingStatusChanged,
} from '@/lib/email/notifications';
import type {
  Booking,
  BlockedDate,
  BookingStatus,
  GalleryImage,
  PaymentStatus,
  Property,
  PropertyImage,
} from '@/types/database';

async function requireAdmin() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return supabase;
}

// ============ CALENDAR (data-returning, no redirect) ============
// These are used by the live calendar UI. They mutate, revalidate caches in
// the background, and RETURN the updated row so the client can patch its
// local state instantly — no full RSC reload, no flicker.

export type CalendarMutationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function calCreateBooking(input: {
  property_id: string;
  guest_name: string;
  guest_email?: string;
  guest_phone?: string;
  guest_country?: string;
  check_in: string;
  check_out: string;
  num_guests?: number;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  notes?: string;
  admin_notes?: string;
}): Promise<CalendarMutationResult<Booking>> {
  const supabase = await requireAdmin();
  if (!input.property_id || !input.guest_name || !input.check_in || !input.check_out) {
    return { ok: false, error: 'Nedostaju obavezna polja' };
  }

  const { data: property } = await supabase
    .from('properties')
    .select('base_price, cleaning_fee')
    .eq('id', input.property_id)
    .single();

  const ci = new Date(input.check_in);
  const co = new Date(input.check_out);
  const num_nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000));
  const total_price = num_nights * (property?.base_price || 0);
  const cleaning_fee = property?.cleaning_fee || 0;

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      property_id: input.property_id,
      guest_name: input.guest_name,
      guest_email: input.guest_email || '',
      guest_phone: input.guest_phone || '',
      guest_country: input.guest_country || '',
      check_in: input.check_in,
      check_out: input.check_out,
      num_guests: input.num_guests || 1,
      num_nights,
      total_price,
      cleaning_fee,
      status: input.status || 'confirmed',
      payment_status: input.payment_status || 'unpaid',
      payment_method: 'cash',
      notes: input.notes || '',
      admin_notes: input.admin_notes || '',
    })
    .select('*, property:properties(*)')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška' };

  // Confirm to the guest that we created the booking on their behalf. Silent
  // no-op if no email was provided. Errors are swallowed inside the helper.
  await notifyAdminBookingCreated(data as Booking);

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  return { ok: true, data: data as Booking };
}

export async function calUpdateBooking(input: {
  id: string;
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  admin_notes?: string;
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  num_guests?: number;
  check_in?: string;
  check_out?: string;
  property_id?: string;
}): Promise<CalendarMutationResult<Booking>> {
  const supabase = await requireAdmin();
  if (!input.id) return { ok: false, error: 'Nedostaje ID' };

  // Snapshot the previous status before we mutate, so we can detect a real
  // status transition and only email the guest when something changed.
  let prevStatus: BookingStatus | undefined;
  if (input.status !== undefined) {
    const { data: before } = await supabase
      .from('bookings')
      .select('status')
      .eq('id', input.id)
      .maybeSingle();
    prevStatus = (before?.status as BookingStatus) || undefined;
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.status        !== undefined) update.status        = input.status;
  if (input.payment_status!== undefined) update.payment_status= input.payment_status;
  if (input.admin_notes   !== undefined) update.admin_notes   = input.admin_notes;
  if (input.guest_name    !== undefined) update.guest_name    = input.guest_name;
  if (input.guest_email   !== undefined) update.guest_email   = input.guest_email;
  if (input.guest_phone   !== undefined) update.guest_phone   = input.guest_phone;
  if (input.num_guests    !== undefined) update.num_guests    = input.num_guests;
  if (input.property_id   !== undefined) update.property_id   = input.property_id;

  if (input.check_in || input.check_out) {
    const { data: existing } = await supabase
      .from('bookings')
      .select('check_in, check_out, property_id')
      .eq('id', input.id)
      .single();

    const ci = new Date(input.check_in  || existing?.check_in);
    const co = new Date(input.check_out || existing?.check_out);
    const propId = input.property_id || existing?.property_id;

    const { data: prop } = await supabase
      .from('properties')
      .select('base_price')
      .eq('id', propId)
      .single();

    const num_nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000));
    update.check_in    = input.check_in  || existing?.check_in;
    update.check_out   = input.check_out || existing?.check_out;
    update.num_nights  = num_nights;
    update.total_price = num_nights * (prop?.base_price || 0);
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(update)
    .eq('id', input.id)
    .select('*, property:properties(*)')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška' };

  // Email the guest only when the status actually changed (e.g. pending →
  // confirmed). The helper itself is a no-op when prev === current.
  if (prevStatus && (data as Booking).status !== prevStatus) {
    await notifyBookingStatusChanged(data as Booking, prevStatus);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/guests');
  revalidatePath('/book'); // public availability calendar
  return { ok: true, data: data as Booking };
}

export async function calDeleteBooking(id: string): Promise<CalendarMutationResult<{ id: string }>> {
  const supabase = await requireAdmin();
  if (!id) return { ok: false, error: 'Nedostaje ID' };

  // Pull the row + joined property BEFORE deleting so we can email the guest a
  // cancellation notice. We also need the previous status for the transition
  // arrow in the email body.
  const { data: doomed } = await supabase
    .from('bookings')
    .select('*, property:properties(*)')
    .eq('id', id)
    .maybeSingle<Booking>();

  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };

  if (doomed && doomed.status !== 'cancelled') {
    // Synthesise a "cancelled" snapshot — the row is gone, but for the email
    // we want to show the original details with the new status.
    await notifyBookingStatusChanged(
      { ...doomed, status: 'cancelled' },
      doomed.status,
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/guests');
  revalidatePath('/book'); // public availability calendar
  return { ok: true, data: { id } };
}

export async function calBlockDates(input: {
  property_id: string;
  start_date: string;
  end_date?: string;
  reason?: string;
}): Promise<CalendarMutationResult<BlockedDate>> {
  const supabase = await requireAdmin();
  if (!input.property_id || !input.start_date) {
    return { ok: false, error: 'Nedostaju obavezna polja' };
  }
  const { data, error } = await supabase
    .from('blocked_dates')
    .insert({
      property_id: input.property_id,
      start_date: input.start_date,
      end_date: input.end_date || input.start_date,
      reason: input.reason || 'Blokirano od admina',
    })
    .select('*')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška' };
  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  return { ok: true, data: data as BlockedDate };
}

export async function calUnblockDate(id: string): Promise<CalendarMutationResult<{ id: string }>> {
  const supabase = await requireAdmin();
  if (!id) return { ok: false, error: 'Nedostaje ID' };
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  return { ok: true, data: { id } };
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

// ============ BOOKINGS ============

export async function updateBookingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const status = formData.get('status') as string;
  const payment_status = formData.get('payment_status') as string;
  const admin_notes = (formData.get('admin_notes') as string) || '';
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/calendar';

  if (!id) return;

  // Snapshot prev status so we can email the guest only on a real transition.
  const { data: before } = await supabase
    .from('bookings')
    .select('status')
    .eq('id', id)
    .maybeSingle();
  const prevStatus = (before?.status as BookingStatus) || undefined;

  const { data: after } = await supabase
    .from('bookings')
    .update({
      status,
      payment_status,
      admin_notes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*, property:properties(*)')
    .maybeSingle<Booking>();

  if (after && prevStatus && after.status !== prevStatus) {
    await notifyBookingStatusChanged(after, prevStatus);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/guests');
  revalidatePath('/book'); // public availability calendar
  redirect(redirectTo);
}

export async function createBookingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const property_id = formData.get('property_id') as string;
  const guest_name = formData.get('guest_name') as string;
  const guest_email = (formData.get('guest_email') as string) || '';
  const guest_phone = (formData.get('guest_phone') as string) || '';
  const guest_country = (formData.get('guest_country') as string) || '';
  const check_in = formData.get('check_in') as string;
  const check_out = formData.get('check_out') as string;
  const num_guests = parseInt(formData.get('num_guests') as string) || 1;
  const status = (formData.get('status') as string) || 'pending';
  const payment_status = (formData.get('payment_status') as string) || 'unpaid';
  const notes = (formData.get('notes') as string) || '';
  const admin_notes = (formData.get('admin_notes') as string) || '';
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/calendar';

  if (!property_id || !guest_name || !check_in || !check_out) return;

  const { data: property } = await supabase
    .from('properties')
    .select('base_price, cleaning_fee')
    .eq('id', property_id)
    .single();

  const ci = new Date(check_in);
  const co = new Date(check_out);
  const num_nights = Math.max(1, Math.round((co.getTime() - ci.getTime()) / 86400000));
  const total_price = num_nights * (property?.base_price || 0);
  const cleaning_fee = property?.cleaning_fee || 0;

  const { data: created } = await supabase
    .from('bookings')
    .insert({
      property_id,
      guest_name,
      guest_email,
      guest_phone,
      guest_country,
      check_in,
      check_out,
      num_guests,
      num_nights,
      total_price,
      cleaning_fee,
      status,
      payment_status,
      payment_method: 'cash',
      notes,
      admin_notes,
    })
    .select('*, property:properties(*)')
    .maybeSingle<Booking>();

  if (created) {
    await notifyAdminBookingCreated(created);
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  redirect(redirectTo);
}

export async function deleteBookingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/calendar';
  if (!id) return;

  // Fetch full row + property BEFORE delete so the cancellation email can
  // reference the property name, dates, totals, etc.
  const { data: doomed } = await supabase
    .from('bookings')
    .select('*, property:properties(*)')
    .eq('id', id)
    .maybeSingle<Booking>();

  await supabase.from('bookings').delete().eq('id', id);

  if (doomed && doomed.status !== 'cancelled') {
    await notifyBookingStatusChanged(
      { ...doomed, status: 'cancelled' },
      doomed.status,
    );
  }

  revalidatePath('/admin');
  revalidatePath('/admin/bookings');
  revalidatePath('/admin/calendar');
  revalidatePath('/admin/guests');
  revalidatePath('/book'); // public availability calendar
  redirect(redirectTo);
}

// ============ CALENDAR / BLOCKED DATES ============

export async function blockDatesAction(formData: FormData) {
  const supabase = await requireAdmin();
  const property_id = formData.get('property_id') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = (formData.get('end_date') as string) || start_date;
  const reason = (formData.get('reason') as string) || 'Blocked by admin';
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/calendar';

  if (!property_id || !start_date) return;

  await supabase.from('blocked_dates').insert({
    property_id,
    start_date,
    end_date,
    reason,
  });

  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  redirect(redirectTo);
}

export async function unblockDateAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/calendar';
  if (!id) return;
  await supabase.from('blocked_dates').delete().eq('id', id);
  revalidatePath('/admin/calendar');
  revalidatePath('/book'); // public availability calendar
  redirect(redirectTo);
}

// ============ PROPERTIES ============

export async function togglePropertyActiveAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const is_active = formData.get('is_active') === 'true';
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/properties';
  if (!id) return;
  await supabase.from('properties').update({ is_active: !is_active }).eq('id', id);
  revalidatePath('/admin/properties');
  revalidatePath('/');
  redirect(redirectTo);
}

export async function deletePropertyAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('properties').delete().eq('id', id);
  revalidatePath('/admin/properties');
  revalidatePath('/admin/pricing');
  revalidatePath('/');
  redirect('/admin/properties');
}

export async function savePropertyAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = (formData.get('id') as string) || null;
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/properties';

  const data = {
    name: (formData.get('name') as string) || '',
    description: (formData.get('description') as string) || '',
    short_description: (formData.get('short_description') as string) || '',
    property_type: (formData.get('property_type') as string) || 'apartment',
    max_guests: parseInt(formData.get('max_guests') as string) || 2,
    bedrooms: parseInt(formData.get('bedrooms') as string) || 1,
    bathrooms: parseInt(formData.get('bathrooms') as string) || 1,
    size_sqm: parseInt(formData.get('size_sqm') as string) || 0,
    base_price: parseFloat(formData.get('base_price') as string) || 0,
    cleaning_fee: parseFloat(formData.get('cleaning_fee') as string) || 0,
    amenities: ((formData.get('amenities') as string) || '')
      .split(',')
      .map((a) => a.trim())
      .filter(Boolean),
    address: (formData.get('address') as string) || '',
    latitude: parseFloat(formData.get('latitude') as string) || 0,
    longitude: parseFloat(formData.get('longitude') as string) || 0,
    is_active: formData.get('is_active') === 'on' || formData.get('is_active') === 'true',
    sort_order: parseInt(formData.get('sort_order') as string) || 0,
  };

  if (!data.name) return;

  if (id) {
    await supabase.from('properties').update(data).eq('id', id);
  } else {
    await supabase.from('properties').insert(data);
  }

  revalidatePath('/admin/properties');
  revalidatePath('/admin/pricing');
  revalidatePath('/');
  redirect(redirectTo);
}

export async function addPropertyImageAction(formData: FormData) {
  const supabase = await requireAdmin();
  const property_id = formData.get('property_id') as string;
  const url = formData.get('url') as string;
  const alt_text = (formData.get('alt_text') as string) || '';
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/properties';
  if (!property_id || !url) return;

  const { count } = await supabase
    .from('property_images')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', property_id);

  await supabase.from('property_images').insert({
    property_id,
    url,
    alt_text,
    is_cover: (count ?? 0) === 0,
    sort_order: count ?? 0,
  });

  revalidatePath('/admin/properties');
  revalidatePath('/');
  redirect(redirectTo);
}

export async function deletePropertyImageAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/properties';
  if (!id) return;
  await supabase.from('property_images').delete().eq('id', id);
  revalidatePath('/admin/properties');
  revalidatePath('/');
  redirect(redirectTo);
}

export async function setPropertyImageCoverAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const property_id = formData.get('property_id') as string;
  const redirectTo = (formData.get('redirect_to') as string) || '/admin/properties';
  if (!id || !property_id) return;
  await supabase.from('property_images').update({ is_cover: false }).eq('property_id', property_id);
  await supabase.from('property_images').update({ is_cover: true }).eq('id', id);
  revalidatePath('/admin/properties');
  revalidatePath('/');
  redirect(redirectTo);
}

// Live properties page (data-returning, no redirect)
export async function propSaveProperty(input: {
  id?: string;
  name: string;
  description?: string;
  short_description?: string;
  property_type?: string;
  max_guests?: number;
  bedrooms?: number;
  bathrooms?: number;
  size_sqm?: number;
  base_price?: number;
  cleaning_fee?: number;
  amenities?: string[];
  address?: string;
  latitude?: number;
  longitude?: number;
  is_active?: boolean;
  sort_order?: number;
}): Promise<CalendarMutationResult<Property>> {
  const supabase = await requireAdmin();

  if (!input.name?.trim()) return { ok: false, error: 'Naziv je obavezan' };

  const payload = {
    name: input.name.trim(),
    description: input.description || '',
    short_description: input.short_description || '',
    property_type: input.property_type || 'apartment',
    max_guests: input.max_guests ?? 2,
    bedrooms: input.bedrooms ?? 1,
    bathrooms: input.bathrooms ?? 1,
    size_sqm: input.size_sqm ?? 0,
    base_price: input.base_price ?? 0,
    cleaning_fee: input.cleaning_fee ?? 0,
    amenities: input.amenities || [],
    address: input.address || '',
    latitude: input.latitude ?? 0,
    longitude: input.longitude ?? 0,
    is_active: input.is_active ?? true,
    sort_order: input.sort_order ?? 0,
  };

  const query = input.id
    ? supabase.from('properties').update(payload).eq('id', input.id)
    : supabase.from('properties').insert(payload);

  const { data, error } = await query
    .select('*, images:property_images(*)')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška spremanja' };

  revalidatePath('/admin/properties');
  revalidatePath('/admin/pricing');
  revalidatePath('/');
  return { ok: true, data: data as Property };
}

export async function propDeleteProperty(id: string): Promise<CalendarMutationResult<{ id: string }>> {
  const supabase = await requireAdmin();
  if (!id) return { ok: false, error: 'Nedostaje ID' };
  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/properties');
  revalidatePath('/admin/pricing');
  revalidatePath('/');
  return { ok: true, data: { id } };
}

export async function propTogglePropertyActive(input: {
  id: string;
  is_active: boolean;
}): Promise<CalendarMutationResult<{ id: string; is_active: boolean }>> {
  const supabase = await requireAdmin();
  if (!input.id) return { ok: false, error: 'Nedostaje ID' };
  const nextActive = !input.is_active;
  const { error } = await supabase
    .from('properties')
    .update({ is_active: nextActive })
    .eq('id', input.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: { id: input.id, is_active: nextActive } };
}

export async function propAddPropertyImage(input: {
  property_id: string;
  url: string;
  alt_text?: string;
}): Promise<CalendarMutationResult<PropertyImage>> {
  const supabase = await requireAdmin();
  if (!input.property_id || !input.url) {
    return { ok: false, error: 'Nedostaju obavezna polja' };
  }

  const { count } = await supabase
    .from('property_images')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', input.property_id);

  const { data, error } = await supabase
    .from('property_images')
    .insert({
      property_id: input.property_id,
      url: input.url,
      alt_text: input.alt_text || '',
      is_cover: (count ?? 0) === 0,
      sort_order: count ?? 0,
    })
    .select('*')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška dodavanja slike' };

  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: data as PropertyImage };
}

export async function propDeletePropertyImage(id: string): Promise<CalendarMutationResult<{ id: string }>> {
  const supabase = await requireAdmin();
  if (!id) return { ok: false, error: 'Nedostaje ID' };
  const { error } = await supabase.from('property_images').delete().eq('id', id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: { id } };
}

export async function propSetPropertyImageCover(input: {
  id: string;
  property_id: string;
}): Promise<CalendarMutationResult<{ id: string; property_id: string }>> {
  const supabase = await requireAdmin();
  if (!input.id || !input.property_id) return { ok: false, error: 'Nedostaju podaci' };

  await supabase.from('property_images').update({ is_cover: false }).eq('property_id', input.property_id);
  const { error } = await supabase.from('property_images').update({ is_cover: true }).eq('id', input.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: { id: input.id, property_id: input.property_id } };
}

export async function propListGalleryImages(): Promise<CalendarMutationResult<GalleryImage[]>> {
  const supabase = await requireAdmin();
  const { data, error } = await supabase
    .from('gallery_images')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data || []) as GalleryImage[] };
}

// Batch insert: 1 round-trip for N images instead of N individual calls.
export async function propAddPropertyImagesBatch(input: {
  property_id: string;
  images: { url: string; alt_text?: string }[];
}): Promise<CalendarMutationResult<PropertyImage[]>> {
  const supabase = await requireAdmin();
  if (!input.property_id || !input.images?.length) {
    return { ok: false, error: 'Nedostaju obavezna polja' };
  }

  const { count } = await supabase
    .from('property_images')
    .select('*', { count: 'exact', head: true })
    .eq('property_id', input.property_id);

  const startCount = count ?? 0;
  const rows = input.images.map((img, i) => ({
    property_id: input.property_id,
    url: img.url,
    alt_text: img.alt_text || '',
    is_cover: startCount === 0 && i === 0,
    sort_order: startCount + i,
  }));

  const { data, error } = await supabase
    .from('property_images')
    .insert(rows)
    .select('*');

  if (error || !data) return { ok: false, error: error?.message || 'Greška dodavanja slika' };

  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: data as PropertyImage[] };
}

// ============ PRICING ============

export async function updatePropertyPricingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  const base_price = parseFloat(formData.get('base_price') as string) || 0;
  const cleaning_fee = parseFloat(formData.get('cleaning_fee') as string) || 0;
  if (!id) return;
  await supabase.from('properties').update({ base_price, cleaning_fee }).eq('id', id);
  revalidatePath('/admin/pricing');
  revalidatePath('/admin/properties');
  revalidatePath('/');
  redirect('/admin/pricing');
}

// Live pricing update (data-returning, no redirect)
export async function propUpdatePricing(input: {
  id: string;
  base_price: number;
  cleaning_fee: number;
}): Promise<CalendarMutationResult<Property>> {
  const supabase = await requireAdmin();
  if (!input.id) return { ok: false, error: 'Nedostaje ID' };

  const base_price = Number.isFinite(input.base_price) ? Math.max(0, input.base_price) : 0;
  const cleaning_fee = Number.isFinite(input.cleaning_fee) ? Math.max(0, input.cleaning_fee) : 0;

  const { data, error } = await supabase
    .from('properties')
    .update({ base_price, cleaning_fee })
    .eq('id', input.id)
    .select('*, images:property_images(*)')
    .single();

  if (error || !data) return { ok: false, error: error?.message || 'Greška spremanja' };

  revalidatePath('/admin/pricing');
  revalidatePath('/admin/properties');
  revalidatePath('/');
  return { ok: true, data: data as Property };
}

export async function addSeasonalPricingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const property_id = formData.get('property_id') as string;
  const name = formData.get('name') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const price_per_night = parseFloat(formData.get('price_per_night') as string) || 0;
  const min_nights = parseInt(formData.get('min_nights') as string) || 1;

  if (!property_id || !name || !start_date || !end_date) return;

  await supabase.from('seasonal_pricing').insert({
    property_id,
    name,
    start_date,
    end_date,
    price_per_night,
    min_nights,
  });

  revalidatePath('/admin/pricing');
  redirect('/admin/pricing');
}

export async function deleteSeasonalPricingAction(formData: FormData) {
  const supabase = await requireAdmin();
  const id = formData.get('id') as string;
  if (!id) return;
  await supabase.from('seasonal_pricing').delete().eq('id', id);
  revalidatePath('/admin/pricing');
  redirect('/admin/pricing');
}
