import 'server-only';
import { Resend } from 'resend';

/**
 * Lazy-initialised, module-scoped Resend client. We don't construct it at
 * import time so that:
 *   1. RSC builds don't fail when RESEND_API_KEY is absent in CI.
 *   2. Edge runtimes only pay the cost on the first send call.
 *
 * Important: never call this in a Client Component or browser context — the
 * Resend API does NOT support CORS (intentional, to protect your key). All
 * sends must go through Server Actions / Route Handlers.
 */
let _client: Resend | null = null;

export function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (_client) return _client;
  _client = new Resend(key);
  return _client;
}

export function getEmailFrom(): string {
  // Must be an address on a domain you've verified at https://resend.com/domains.
  // Falls back to the Resend sandbox, which can ONLY deliver to the email of the
  // account owning the API key — useful for local dev only.
  return process.env.EMAIL_FROM || 'Acme <onboarding@resend.dev>';
}

export function getOwnerEmail(): string | null {
  return process.env.OWNER_EMAIL || null;
}
