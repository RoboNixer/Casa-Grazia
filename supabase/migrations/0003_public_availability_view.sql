-- =============================================================================
-- Public availability view
-- =============================================================================
-- Why this exists:
--
-- The `bookings` table holds guest PII (name, email, phone, country, notes,
-- pricing, admin_notes…). Anonymous visitors must NEVER read that. But the
-- /book page calendar still needs to know which date ranges are occupied
-- so it can grey them out before the guest tries to submit. Without that,
-- two strangers can request the same nights and only the second submission
-- is rejected — the first one looks fine because the calendar shows the
-- nights as free.
--
-- Solution: expose a narrow read-only view that contains ONLY the columns
-- needed for the availability grid (property_id + the date range), filtered
-- to active future bookings, and grant SELECT on that view to `anon`. The
-- underlying `bookings` table keeps its existing strict RLS so guest PII
-- stays admin-only.
--
-- The view runs with the owner's privileges (security_invoker = false, the
-- Postgres default) so it bypasses bookings RLS — that's intentional. The
-- only thing leaking out is the date range + the property it belongs to.
-- =============================================================================

create or replace view public.public_bookings as
  select
    property_id,
    check_in,
    check_out
  from public.bookings
  where status <> 'cancelled'
    and check_out >= current_date;

-- Belt-and-braces: explicitly state the security mode so future PG upgrades
-- (which may flip the default) don't silently expose more than intended.
alter view public.public_bookings set (security_invoker = false);

comment on view public.public_bookings is
  'Public-facing availability surface. Exposes only property_id + check_in + '
  'check_out for active future bookings so the /book calendar can mark '
  'occupied days. Contains NO guest PII or pricing.';

-- Drop any previous grants and reapply cleanly.
revoke all on public.public_bookings from public, anon, authenticated;
grant select on public.public_bookings to anon, authenticated;
