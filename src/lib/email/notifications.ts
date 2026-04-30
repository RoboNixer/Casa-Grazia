import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { Booking, BookingStatus } from '@/types/database';
import { getEmailFrom, getOwnerEmail, getResend } from './client';
import {
  guestBookingCreatedTemplate,
  guestRequestReceivedTemplate,
  guestStatusChangedTemplate,
  ownerNewBookingTemplate,
  type TemplateContext,
} from './templates';

/* ──────────────────────────────────────────────────────────────────────────
 * High-level email notifications.
 *
 * Design notes:
 *   - Every public function is `try/catch`-wrapped and ALWAYS resolves. Email
 *     delivery must never block a booking mutation — if Resend is down or a
 *     key is missing we log and move on.
 *   - We use `idempotencyKey`s of the form `<event>/<booking-id>(/<extra>)`
 *     so that retried server actions don't double-send within Resend's 24h
 *     dedup window.
 *   - Site-level context (site_name, currency_symbol, check_in_time, etc.) is
 *     fetched once per send. Cheap (single row) and avoids stale env vars.
 *   - The Resend Node SDK does NOT throw on API errors — it returns
 *     `{ data, error }`. We branch explicitly. (Skill gotcha #5.)
 * ────────────────────────────────────────────────────────────────────────── */

interface SiteSettingsLite {
  site_name: string;
  currency_symbol: string;
  email: string;
  phone: string;
  check_in_time: string;
  check_out_time: string;
}

async function loadContext(): Promise<TemplateContext> {
  // Read with the public anon client — site_settings is publicly readable per
  // the RLS policy `site_settings_read_public`, so no service role needed.
  const supabase = await createClient();
  const { data } = await supabase
    .from('site_settings')
    .select('site_name, currency_symbol, email, phone, check_in_time, check_out_time')
    .single<SiteSettingsLite>();

  return {
    siteName: data?.site_name || 'Booking',
    currencySymbol: data?.currency_symbol || '€',
    ownerEmail: data?.email || undefined,
    ownerPhone: data?.phone || undefined,
    checkInTime: data?.check_in_time || '15:00',
    checkOutTime: data?.check_out_time || '10:00',
  };
}

interface SendArgs {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string | string[];
  idempotencyKey?: string;
  /** Used purely for log messages so we can spot failures in server logs. */
  tag: string;
}

async function send({ to, subject, html, replyTo, idempotencyKey, tag }: SendArgs): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.warn(`[email:${tag}] skipped — RESEND_API_KEY not set`);
    return;
  }
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (recipients.length === 0) {
    console.warn(`[email:${tag}] skipped — no recipients`);
    return;
  }

  const { data, error } = await resend.emails.send(
    {
      from: getEmailFrom(),
      to: recipients,
      subject,
      html,
      ...(replyTo ? { replyTo } : {}),
    },
    idempotencyKey ? { idempotencyKey } : undefined,
  );

  if (error) {
    console.error(`[email:${tag}] send failed:`, error.message);
    return;
  }
  console.log(`[email:${tag}] sent id=${data?.id} to=${recipients.join(',')}`);
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public API
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Public booking form was submitted. Notifies the owner AND sends a "request
 * received" confirmation to the guest. Both are scheduled in parallel.
 */
export async function notifyBookingRequested(booking: Booking): Promise<void> {
  try {
    const ctx = await loadContext();
    const owner = getOwnerEmail();

    const ownerTpl = ownerNewBookingTemplate(booking, ctx);
    const guestTpl = guestRequestReceivedTemplate(booking, ctx);

    await Promise.all([
      owner
        ? send({
            to: owner,
            subject: ownerTpl.subject,
            html: ownerTpl.html,
            replyTo: booking.guest_email || undefined,
            idempotencyKey: `booking-requested-owner/${booking.id}`,
            tag: 'owner:new-booking',
          })
        : Promise.resolve(),
      booking.guest_email
        ? send({
            to: booking.guest_email,
            subject: guestTpl.subject,
            html: guestTpl.html,
            replyTo: ctx.ownerEmail || owner || undefined,
            idempotencyKey: `booking-requested-guest/${booking.id}`,
            tag: 'guest:request-received',
          })
        : Promise.resolve(),
    ]);
  } catch (err) {
    console.error('[email] notifyBookingRequested unexpected error:', err);
  }
}

/**
 * Admin changed a booking's status. Sends ONE email to the guest describing
 * the new status. No-op if the status didn't actually change.
 */
export async function notifyBookingStatusChanged(
  booking: Booking,
  prevStatus: BookingStatus,
): Promise<void> {
  try {
    if (prevStatus === booking.status) return;
    if (!booking.guest_email) return;

    const ctx = await loadContext();
    const tpl = guestStatusChangedTemplate(booking, prevStatus, ctx);

    await send({
      to: booking.guest_email,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: ctx.ownerEmail || getOwnerEmail() || undefined,
      // Same booking can move pending → confirmed → cancelled, etc — include
      // both endpoints in the key so each transition has its own dedup window.
      idempotencyKey: `booking-status/${booking.id}/${prevStatus}-${booking.status}`,
      tag: `guest:status:${booking.status}`,
    });
  } catch (err) {
    console.error('[email] notifyBookingStatusChanged unexpected error:', err);
  }
}

/**
 * Admin manually created a booking. Sends a confirmation to the guest (if we
 * have their email). Owner doesn't need to be notified — they made it.
 */
export async function notifyAdminBookingCreated(booking: Booking): Promise<void> {
  try {
    if (!booking.guest_email) return;
    const ctx = await loadContext();
    const tpl = guestBookingCreatedTemplate(booking, ctx);
    await send({
      to: booking.guest_email,
      subject: tpl.subject,
      html: tpl.html,
      replyTo: ctx.ownerEmail || getOwnerEmail() || undefined,
      idempotencyKey: `booking-created-guest/${booking.id}`,
      tag: 'guest:admin-created',
    });
  } catch (err) {
    console.error('[email] notifyAdminBookingCreated unexpected error:', err);
  }
}
