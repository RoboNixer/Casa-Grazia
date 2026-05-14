-- =============================================================================
-- Per-property minimum stay length
-- =============================================================================
-- Idempotent: safe to re-run.
-- =============================================================================

alter table public.properties
  add column if not exists min_nights integer not null default 1;

alter table public.properties
  drop constraint if exists chk_properties_min_nights;

alter table public.properties
  add constraint chk_properties_min_nights check (min_nights >= 1);
