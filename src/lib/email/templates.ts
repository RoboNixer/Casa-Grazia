import 'server-only';
import { format, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import type { Booking, BookingStatus } from '@/types/database';

/* ──────────────────────────────────────────────────────────────────────────
 * Brand tokens. Kept in sync with tailwind / globals.css emerald accents so
 * the emails look like extensions of the site, not generic transactional mail.
 * Inline-only styles — no <style> block — for max client compatibility
 * (Gmail/Outlook strip <head>).
 * ────────────────────────────────────────────────────────────────────────── */
const C = {
  ink: '#0e1f17',
  inkMuted: '#56655c',
  inkFaint: '#8a978f',
  emerald: '#0d6e4f',
  emeraldSoft: '#e8f1ec',
  border: 'rgba(13, 110, 79, 0.12)',
  pageBg: '#f5f4ef',
  cardBg: '#ffffff',
  amber: '#b65a14',
  amberSoft: '#fff5e6',
  rose: '#a8242b',
  roseSoft: '#fde8ea',
  blue: '#1e60a8',
  blueSoft: '#e7f0fa',
} as const;

function fmtDate(iso: string): string {
  try {
    return format(parseISO(iso), 'EEEE, d. MMMM yyyy', { locale: hr });
  } catch {
    return iso;
  }
}

function fmtMoney(amount: number, symbol: string = '€'): string {
  return `${symbol}${(amount ?? 0).toFixed(2)}`;
}

function statusBadgeColors(status: BookingStatus): { fg: string; bg: string } {
  switch (status) {
    case 'pending':     return { fg: C.amber,   bg: C.amberSoft };
    case 'confirmed':   return { fg: C.blue,    bg: C.blueSoft  };
    case 'checked_in':  return { fg: C.emerald, bg: C.emeraldSoft };
    case 'checked_out': return { fg: C.inkMuted, bg: '#eef0ee' };
    case 'cancelled':   return { fg: C.rose,    bg: C.roseSoft };
  }
}

export function statusLabelHr(status: BookingStatus): string {
  switch (status) {
    case 'pending':     return 'Na čekanju';
    case 'confirmed':   return 'Potvrđeno';
    case 'checked_in':  return 'Prijavljen';
    case 'checked_out': return 'Odjavljen';
    case 'cancelled':   return 'Otkazano';
  }
}

/* ──────────────────────────────────────────────────────────────────────────
 * Layout primitives
 * ────────────────────────────────────────────────────────────────────────── */
function shell(args: { preheader: string; bodyHtml: string; siteName: string }) {
  return `<!DOCTYPE html>
<html lang="hr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(args.siteName)}</title>
  </head>
  <body style="margin:0;padding:0;background:${C.pageBg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${C.ink};">
    <span style="display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;font-size:1px;line-height:1px;">
      ${escapeHtml(args.preheader)}
    </span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.pageBg};padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:0 4px 24px 4px;">
                <p style="margin:0;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:${C.emerald};">
                  ${escapeHtml(args.siteName)}
                </p>
              </td>
            </tr>
            <tr>
              <td style="background:${C.cardBg};border:1px solid ${C.border};border-radius:24px;padding:32px;box-shadow:0 1px 2px rgba(13,110,79,.04),0 8px 24px rgba(13,110,79,.06);">
                ${args.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:24px 4px 0 4px;text-align:center;">
                <p style="margin:0;font-size:11px;color:${C.inkFaint};font-family:ui-monospace,'SF Mono',Menlo,monospace;letter-spacing:0.18em;text-transform:uppercase;">
                  ${escapeHtml(args.siteName)} · automatska poruka
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function statusBadge(status: BookingStatus): string {
  const { fg, bg } = statusBadgeColors(status);
  return `<span style="display:inline-block;padding:6px 12px;background:${bg};color:${fg};border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;font-family:ui-monospace,'SF Mono',Menlo,monospace;">${escapeHtml(statusLabelHr(status))}</span>`;
}

function bookingDetailsTable(b: Booking, currencySymbol: string): string {
  const rows: Array<[string, string]> = [
    ['Nekretnina', b.property?.name ?? '—'],
    ['Dolazak', fmtDate(b.check_in)],
    ['Odlazak', fmtDate(b.check_out)],
    ['Broj noći', String(b.num_nights)],
    ['Broj gostiju', String(b.num_guests)],
    ['Smještaj', fmtMoney(Math.max(0, (b.total_price ?? 0) - (b.cleaning_fee ?? 0)), currencySymbol)],
    ['Čišćenje', fmtMoney(b.cleaning_fee ?? 0, currencySymbol)],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.border};margin-top:8px;">
    ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.inkMuted};width:50%;">${escapeHtml(k)}</td>
        <td style="padding:14px 0;border-bottom:1px solid ${C.border};font-size:14px;color:${C.ink};font-weight:500;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(v)}</td>
      </tr>
    `).join('')}
    <tr>
      <td style="padding:18px 0 0 0;font-size:15px;color:${C.ink};font-weight:600;">Ukupno</td>
      <td style="padding:18px 0 0 0;font-size:22px;color:${C.ink};font-weight:700;text-align:right;font-variant-numeric:tabular-nums;">${escapeHtml(fmtMoney(b.total_price ?? 0, currencySymbol))}</td>
    </tr>
  </table>`;
}

function guestDetailsTable(b: Booking): string {
  const rows: Array<[string, string]> = [
    ['Ime i prezime', b.guest_name || '—'],
    ['E-mail', b.guest_email || '—'],
    ['Telefon', b.guest_phone || '—'],
    ['Država', b.guest_country || '—'],
  ];
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${C.border};margin-top:8px;">
    ${rows.map(([k, v]) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${C.border};font-size:13px;color:${C.inkMuted};width:40%;">${escapeHtml(k)}</td>
        <td style="padding:12px 0;border-bottom:1px solid ${C.border};font-size:14px;color:${C.ink};font-weight:500;">${escapeHtml(v)}</td>
      </tr>
    `).join('')}
  </table>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;color:${C.ink};font-weight:400;letter-spacing:-0.01em;">${escapeHtml(text)}</h1>`;
}

function lead(text: string): string {
  return `<p style="margin:0 0 24px 0;font-size:15px;line-height:1.6;color:${C.inkMuted};">${escapeHtml(text)}</p>`;
}

function sectionLabel(text: string): string {
  return `<p style="margin:24px 0 0 0;font-family:ui-monospace,'SF Mono',Menlo,monospace;font-size:10px;letter-spacing:0.22em;text-transform:uppercase;color:${C.emerald};">${escapeHtml(text)}</p>`;
}

function callout(text: string, tone: 'info' | 'warn' | 'good' = 'info'): string {
  const palette =
    tone === 'good' ? { bg: C.emeraldSoft, fg: C.emerald, border: C.emerald }
    : tone === 'warn' ? { bg: C.amberSoft, fg: C.amber, border: C.amber }
    : { bg: C.blueSoft, fg: C.blue, border: C.blue };
  return `<div style="margin-top:24px;padding:14px 16px;background:${palette.bg};border-left:3px solid ${palette.border};border-radius:8px;">
    <p style="margin:0;font-size:13.5px;line-height:1.55;color:${palette.fg};">${escapeHtml(text)}</p>
  </div>`;
}

/**
 * "Email · Phone" footer block. Returns empty string if neither is set so we
 * don't render an empty section. Filters defensively so TS knows it's a
 * `string[]` after stripping nullish entries.
 */
function contactBlock(ctx: TemplateContext, label: string = 'Kontakt'): string {
  const parts = [ctx.ownerEmail, ctx.ownerPhone].filter(
    (s): s is string => !!s && s.length > 0,
  );
  if (parts.length === 0) return '';
  return `${sectionLabel(label)}<p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:${C.ink};">${parts.map(escapeHtml).join(' · ')}</p>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ──────────────────────────────────────────────────────────────────────────
 * Public template builders
 * ────────────────────────────────────────────────────────────────────────── */

export interface TemplateContext {
  siteName: string;
  currencySymbol: string;
  ownerPhone?: string;
  ownerEmail?: string;
  checkInTime?: string;
  checkOutTime?: string;
  adminUrl?: string; // absolute URL to /admin/bookings (optional)
}

/** Sent to the OWNER when a guest submits a new booking request from the public form. */
export function ownerNewBookingTemplate(b: Booking, ctx: TemplateContext) {
  const subject = `Nova rezervacija — ${b.guest_name} · ${b.property?.name ?? ''} (${fmtDate(b.check_in)})`;
  const body = `
    ${sectionLabel('Novi zahtjev')}
    ${heading('Stigla je nova rezervacija')}
    ${lead(`Gost ${b.guest_name} traži ${b.num_nights} ${b.num_nights === 1 ? 'noć' : 'noći'} u nekretnini ${b.property?.name ?? ''}.`)}
    <div style="display:inline-block;">${statusBadge(b.status)}</div>
    ${sectionLabel('Detalji rezervacije')}
    ${bookingDetailsTable(b, ctx.currencySymbol)}
    ${sectionLabel('Podaci o gostu')}
    ${guestDetailsTable(b)}
    ${b.notes ? `${sectionLabel('Napomena gosta')}<p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:${C.ink};white-space:pre-wrap;">${escapeHtml(b.notes)}</p>` : ''}
    ${ctx.adminUrl ? `<div style="margin-top:28px;"><a href="${ctx.adminUrl}" style="display:inline-block;padding:14px 22px;background:${C.ink};color:#fff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:500;">Otvori u admin panelu →</a></div>` : ''}
    ${callout('Potvrdi ili otkaži rezervaciju u admin panelu — gost će automatski dobiti e-mail s ažuriranjem statusa.', 'info')}
  `;
  return {
    subject,
    html: shell({ preheader: `Nova rezervacija od ${b.guest_name} za ${fmtDate(b.check_in)}.`, bodyHtml: body, siteName: ctx.siteName }),
  };
}

/** Sent to the GUEST immediately after they submit the public booking form. */
export function guestRequestReceivedTemplate(b: Booking, ctx: TemplateContext) {
  const subject = `Vaš zahtjev za rezervaciju — ${b.property?.name ?? ctx.siteName}`;
  const body = `
    ${sectionLabel('Hvala vam')}
    ${heading(`Zaprimili smo Vaš zahtjev, ${firstName(b.guest_name)}`)}
    ${lead(`Vaša rezervacija u nekretnini ${b.property?.name ?? ctx.siteName} čeka potvrdu. Javit ćemo Vam se u najkraćem mogućem roku — najčešće unutar 24 sata.`)}
    <div style="display:inline-block;">${statusBadge('pending')}</div>
    ${sectionLabel('Sažetak rezervacije')}
    ${bookingDetailsTable(b, ctx.currencySymbol)}
    ${callout(`Plaćanje u gotovini pri dolasku. Prijava od ${ctx.checkInTime ?? '15:00'}, odjava do ${ctx.checkOutTime ?? '10:00'}.`, 'info')}
    ${contactBlock(ctx, 'Trebate nam se javiti?')}
  `;
  return {
    subject,
    html: shell({ preheader: 'Hvala — Vaš zahtjev je zaprimljen i čeka potvrdu.', bodyHtml: body, siteName: ctx.siteName }),
  };
}

/** Sent to the GUEST whenever an admin changes the booking status. */
export function guestStatusChangedTemplate(b: Booking, prev: BookingStatus, ctx: TemplateContext) {
  const lookup: Record<BookingStatus, { headline: string; lead: string; tone: 'info' | 'warn' | 'good'; calloutText: string }> = {
    pending: {
      headline: 'Vaša rezervacija čeka pregled',
      lead: 'Status Vaše rezervacije je vraćen na čekanje. Javit ćemo Vam se s ažuriranjem.',
      tone: 'info',
      calloutText: 'Bez brige — kontaktirat ćemo Vas za potvrdu.',
    },
    confirmed: {
      headline: 'Vaša rezervacija je potvrđena',
      lead: 'Drago nam je potvrditi Vaš boravak. Detalji ostaju nepromijenjeni — vidimo se uskoro.',
      tone: 'good',
      calloutText: `Prijava od ${ctx.checkInTime ?? '15:00'}. Plaćanje gotovinom pri dolasku.`,
    },
    checked_in: {
      headline: 'Dobrodošli — uspješno ste prijavljeni',
      lead: 'Veselimo se Vašem boravku. Ako Vam išta zatreba, slobodno nam se javite.',
      tone: 'good',
      calloutText: `Odjava do ${ctx.checkOutTime ?? '10:00'} na dan odlaska.`,
    },
    checked_out: {
      headline: 'Hvala Vam na boravku',
      lead: 'Nadamo se da ste uživali. Bilo bi nam drago vidjeti Vas ponovno.',
      tone: 'info',
      calloutText: 'Ako želite, ostavite recenziju — pomoći ćete drugim gostima.',
    },
    cancelled: {
      headline: 'Vaša rezervacija je otkazana',
      lead: 'Obavještavamo Vas da je rezervacija otkazana. Ako se radi o pogrešci, javite nam se.',
      tone: 'warn',
      calloutText: 'Za pitanja oko otkaza možete nam pisati ili nazvati.',
    },
  };
  const info = lookup[b.status];
  const subject = `Rezervacija ${statusLabelHr(b.status).toLowerCase()} — ${b.property?.name ?? ctx.siteName}`;

  const body = `
    ${sectionLabel('Ažuriranje statusa')}
    ${heading(info.headline)}
    ${lead(info.lead)}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="padding-right:10px;">${statusBadge(prev)}</td>
        <td style="padding-right:10px;font-size:14px;color:${C.inkFaint};">→</td>
        <td>${statusBadge(b.status)}</td>
      </tr>
    </table>
    ${sectionLabel('Sažetak rezervacije')}
    ${bookingDetailsTable(b, ctx.currencySymbol)}
    ${callout(info.calloutText, info.tone)}
    ${contactBlock(ctx)}
  `;
  return {
    subject,
    html: shell({ preheader: `Status: ${statusLabelHr(b.status)}.`, bodyHtml: body, siteName: ctx.siteName }),
  };
}

/** Sent to the GUEST when admin creates a confirmed booking on their behalf. */
export function guestBookingCreatedTemplate(b: Booking, ctx: TemplateContext) {
  const subject = `Potvrda rezervacije — ${b.property?.name ?? ctx.siteName}`;
  const body = `
    ${sectionLabel('Potvrda rezervacije')}
    ${heading(`Rezervacija je kreirana, ${firstName(b.guest_name)}`)}
    ${lead(`Kreirali smo Vašu rezervaciju u nekretnini ${b.property?.name ?? ctx.siteName}. Niže su svi detalji.`)}
    <div style="display:inline-block;">${statusBadge(b.status)}</div>
    ${sectionLabel('Sažetak rezervacije')}
    ${bookingDetailsTable(b, ctx.currencySymbol)}
    ${callout(`Prijava od ${ctx.checkInTime ?? '15:00'}, odjava do ${ctx.checkOutTime ?? '10:00'}. Plaćanje gotovinom pri dolasku.`, 'good')}
    ${contactBlock(ctx)}
  `;
  return {
    subject,
    html: shell({ preheader: 'Vaša rezervacija je zabilježena.', bodyHtml: body, siteName: ctx.siteName }),
  };
}

function firstName(fullName: string): string {
  const trimmed = (fullName || '').trim();
  if (!trimmed) return 'gost';
  return trimmed.split(/\s+/)[0];
}
