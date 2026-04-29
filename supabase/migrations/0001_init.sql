-- =============================================================================
-- Booking platform — base schema (Casa Grazia / single-villa install)
-- =============================================================================
-- Idempotent: safe to re-run on a fresh Supabase project.
-- Run order:  0001_init.sql  →  0002_casa_grazia_seed.sql
-- =============================================================================

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- ── Helper: auto-update `updated_at` on UPDATE ───────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── ENUMs ────────────────────────────────────────────────────────────────────
do $$ begin
  create type booking_status as enum ('pending','confirmed','checked_in','checked_out','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','paid','partial');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_type as enum ('apartment','villa','studio','house','room');
exception when duplicate_object then null; end $$;

-- =============================================================================
-- TABLES
-- =============================================================================

-- ── site_settings (single-row config) ────────────────────────────────────────
create table if not exists public.site_settings (
  id                      uuid primary key default gen_random_uuid(),
  site_name               text        not null default '',
  site_description        text        not null default '',
  logo_url                text        not null default '',
  primary_color           text        not null default '#2563eb',
  secondary_color         text        not null default '#f59e0b',
  phone                   text        not null default '',
  email                   text        not null default '',
  address                 text        not null default '',
  google_maps_url         text        not null default '',
  facebook_url            text        not null default '',
  instagram_url           text        not null default '',
  whatsapp                text        not null default '',
  currency                text        not null default 'EUR',
  currency_symbol         text        not null default '€',
  check_in_time           text        not null default '15:00',
  check_out_time          text        not null default '10:00',
  terms_and_conditions    text        not null default '',
  cancellation_policy     text        not null default '',
  hero_image_url          text        not null default '',
  hero_title              text        not null default '',
  hero_subtitle           text        not null default '',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

drop trigger if exists trg_site_settings_updated_at on public.site_settings;
create trigger trg_site_settings_updated_at
  before update on public.site_settings
  for each row execute procedure public.set_updated_at();

-- ── properties ───────────────────────────────────────────────────────────────
create table if not exists public.properties (
  id                uuid primary key default gen_random_uuid(),
  name              text          not null,
  description       text          not null default '',
  short_description text          not null default '',
  property_type     property_type not null default 'apartment',
  max_guests        integer       not null default 2,
  bedrooms          integer       not null default 1,
  bathrooms         integer       not null default 1,
  size_sqm          integer       not null default 0,
  base_price        numeric(10,2) not null default 0,
  cleaning_fee      numeric(10,2) not null default 0,
  amenities         text[]        not null default '{}',
  address           text          not null default '',
  latitude          numeric(10,7),
  longitude         numeric(10,7),
  is_active         boolean       not null default true,
  sort_order        integer       not null default 0,
  created_at        timestamptz   not null default now(),
  updated_at        timestamptz   not null default now()
);

create index if not exists idx_properties_active     on public.properties (is_active);
create index if not exists idx_properties_sort_order on public.properties (sort_order);

drop trigger if exists trg_properties_updated_at on public.properties;
create trigger trg_properties_updated_at
  before update on public.properties
  for each row execute procedure public.set_updated_at();

-- ── property_images ──────────────────────────────────────────────────────────
create table if not exists public.property_images (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  url         text not null,
  alt_text    text not null default '',
  is_cover    boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists idx_property_images_property on public.property_images (property_id);
create index if not exists idx_property_images_sort     on public.property_images (property_id, sort_order);

-- Only one cover image per property (partial unique index)
create unique index if not exists uq_property_images_one_cover
  on public.property_images (property_id) where is_cover;

-- ── seasonal_pricing ─────────────────────────────────────────────────────────
create table if not exists public.seasonal_pricing (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete cascade,
  name            text not null default '',
  start_date      date not null,
  end_date        date not null,
  price_per_night numeric(10,2) not null default 0,
  min_nights      integer not null default 1,
  created_at      timestamptz not null default now(),
  constraint chk_seasonal_dates check (end_date >= start_date)
);

create index if not exists idx_seasonal_pricing_property on public.seasonal_pricing (property_id);
create index if not exists idx_seasonal_pricing_dates    on public.seasonal_pricing (property_id, start_date, end_date);

-- ── bookings ─────────────────────────────────────────────────────────────────
create table if not exists public.bookings (
  id              uuid primary key default gen_random_uuid(),
  property_id     uuid not null references public.properties(id) on delete restrict,
  guest_name      text not null,
  guest_email     text not null default '',
  guest_phone     text not null default '',
  guest_country   text not null default '',
  check_in        date not null,
  check_out       date not null,
  num_guests      integer not null default 1,
  num_nights      integer not null default 1,
  total_price     numeric(10,2) not null default 0,
  cleaning_fee    numeric(10,2) not null default 0,
  notes           text not null default '',
  status          booking_status not null default 'pending',
  payment_status  payment_status not null default 'unpaid',
  payment_method  text not null default 'cash',
  admin_notes     text not null default '',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint chk_booking_dates check (check_out > check_in)
);

create index if not exists idx_bookings_property      on public.bookings (property_id);
create index if not exists idx_bookings_check_in      on public.bookings (check_in);
create index if not exists idx_bookings_check_out     on public.bookings (check_out);
create index if not exists idx_bookings_status        on public.bookings (status);
create index if not exists idx_bookings_property_dates on public.bookings (property_id, check_in, check_out);

drop trigger if exists trg_bookings_updated_at on public.bookings;
create trigger trg_bookings_updated_at
  before update on public.bookings
  for each row execute procedure public.set_updated_at();

-- ── blocked_dates ────────────────────────────────────────────────────────────
create table if not exists public.blocked_dates (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text not null default '',
  created_at  timestamptz not null default now(),
  constraint chk_blocked_dates check (end_date >= start_date)
);

create index if not exists idx_blocked_dates_property on public.blocked_dates (property_id);
create index if not exists idx_blocked_dates_range    on public.blocked_dates (property_id, start_date, end_date);

-- ── reviews ──────────────────────────────────────────────────────────────────
create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  booking_id  uuid     references public.bookings(id) on delete set null,
  guest_name  text not null,
  rating      integer not null check (rating between 1 and 5),
  comment     text not null default '',
  is_visible  boolean not null default true,
  created_at  timestamptz not null default now()
);

create index if not exists idx_reviews_property on public.reviews (property_id);
create index if not exists idx_reviews_visible  on public.reviews (is_visible);

-- ── gallery_images ───────────────────────────────────────────────────────────
create table if not exists public.gallery_images (
  id         uuid primary key default gen_random_uuid(),
  url        text not null,
  alt_text   text not null default '',
  category   text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_gallery_sort     on public.gallery_images (sort_order);
create index if not exists idx_gallery_category on public.gallery_images (category);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
-- Strategy:
--   • PUBLIC (anon) can read everything that drives the public website
--     (site_settings, active properties, their images, gallery, visible reviews,
--     plus blocked_dates / seasonal_pricing so the booking form can validate
--     availability and show seasonal prices).
--   • PUBLIC (anon) can INSERT a booking (the public booking form runs server-
--     side with the anon key). All other booking writes require auth.
--   • Anything else (writes) requires an authenticated user (admin).
-- =============================================================================

alter table public.site_settings    enable row level security;
alter table public.properties       enable row level security;
alter table public.property_images  enable row level security;
alter table public.seasonal_pricing enable row level security;
alter table public.bookings         enable row level security;
alter table public.blocked_dates    enable row level security;
alter table public.reviews          enable row level security;
alter table public.gallery_images   enable row level security;

-- Drop existing policies if re-running
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'site_settings','properties','property_images','seasonal_pricing',
        'bookings','blocked_dates','reviews','gallery_images'
      )
  loop
    execute format('drop policy if exists %I on %I.%I',
      r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ── site_settings ────────────────────────────────────────────────────────────
create policy "site_settings_read_public" on public.site_settings
  for select to anon, authenticated using (true);

create policy "site_settings_write_auth" on public.site_settings
  for all to authenticated using (true) with check (true);

-- ── properties ───────────────────────────────────────────────────────────────
create policy "properties_read_public" on public.properties
  for select to anon using (is_active = true);

create policy "properties_read_auth" on public.properties
  for select to authenticated using (true);

create policy "properties_write_auth" on public.properties
  for all to authenticated using (true) with check (true);

-- ── property_images ──────────────────────────────────────────────────────────
create policy "property_images_read_public" on public.property_images
  for select to anon using (
    exists (
      select 1 from public.properties p
      where p.id = property_images.property_id and p.is_active = true
    )
  );

create policy "property_images_read_auth" on public.property_images
  for select to authenticated using (true);

create policy "property_images_write_auth" on public.property_images
  for all to authenticated using (true) with check (true);

-- ── seasonal_pricing ─────────────────────────────────────────────────────────
create policy "seasonal_pricing_read_public" on public.seasonal_pricing
  for select to anon, authenticated using (true);

create policy "seasonal_pricing_write_auth" on public.seasonal_pricing
  for all to authenticated using (true) with check (true);

-- ── bookings ────────────────────────────────────────────────────────────────
-- Anonymous can create a booking (public booking form), but cannot read/update.
create policy "bookings_insert_public" on public.bookings
  for insert to anon
  with check (
    char_length(guest_name) between 2 and 200
    and char_length(guest_email) <= 200
    and char_length(guest_phone) <= 50
    and check_in < check_out
    and num_guests between 1 and 50
    and status = 'pending'
  );

create policy "bookings_select_auth" on public.bookings
  for select to authenticated using (true);

create policy "bookings_write_auth" on public.bookings
  for all to authenticated using (true) with check (true);

-- ── blocked_dates ───────────────────────────────────────────────────────────
-- Public read so the booking form can check availability.
create policy "blocked_dates_read_public" on public.blocked_dates
  for select to anon, authenticated using (true);

create policy "blocked_dates_write_auth" on public.blocked_dates
  for all to authenticated using (true) with check (true);

-- ── reviews ─────────────────────────────────────────────────────────────────
create policy "reviews_read_public" on public.reviews
  for select to anon using (is_visible = true);

create policy "reviews_read_auth" on public.reviews
  for select to authenticated using (true);

create policy "reviews_write_auth" on public.reviews
  for all to authenticated using (true) with check (true);

-- ── gallery_images ──────────────────────────────────────────────────────────
create policy "gallery_read_public" on public.gallery_images
  for select to anon, authenticated using (true);

create policy "gallery_write_auth" on public.gallery_images
  for all to authenticated using (true) with check (true);

-- =============================================================================
-- DONE
-- =============================================================================
