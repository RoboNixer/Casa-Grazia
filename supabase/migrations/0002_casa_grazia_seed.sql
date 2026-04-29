-- =============================================================================
-- Casa Grazia — initial data seed
-- =============================================================================
-- Run AFTER 0001_init.sql.  Idempotent: deletes existing rows for this villa
-- before re-inserting, so you can re-run safely while iterating.
-- =============================================================================

-- ── Clean slate (only this property's data) ──────────────────────────────────
delete from public.bookings        where property_id in (select id from public.properties where name = 'Casa Grazia');
delete from public.blocked_dates   where property_id in (select id from public.properties where name = 'Casa Grazia');
delete from public.seasonal_pricing where property_id in (select id from public.properties where name = 'Casa Grazia');
delete from public.property_images where property_id in (select id from public.properties where name = 'Casa Grazia');
delete from public.reviews         where property_id in (select id from public.properties where name = 'Casa Grazia');
delete from public.properties      where name = 'Casa Grazia';
delete from public.gallery_images;
delete from public.site_settings;

-- ── site_settings ────────────────────────────────────────────────────────────
insert into public.site_settings (
  site_name,
  site_description,
  primary_color,
  secondary_color,
  phone,
  email,
  address,
  google_maps_url,
  whatsapp,
  currency,
  currency_symbol,
  check_in_time,
  check_out_time,
  hero_image_url,
  hero_title,
  hero_subtitle
) values (
  'Casa Grazia',
  'Casa Grazia je ugodna obiteljska kuća za odmor s bazenom u srcu Istre — samo 8 minuta vožnje od Rovinja. Smještaj za 4 + 1 osobu, okružen maslinikom i idiličnim krajolikom.',
  '#0d6e4f',
  '#c97b3b',
  '+385 98 974 4931',
  '',
  'Duranka 44, 52210 Rovinjsko Selo, Hrvatska',
  'https://www.google.com/maps?q=Duranka+44,+52210+Rovinjsko+Selo,+Hrvatska&output=embed',
  '+385989744931',
  'EUR',
  '€',
  '15:00',
  '10:00',
  '/villa/casa-grazia-2.png',
  'Casa Grazia',
  'Vila s privatnim bazenom u srcu Istre — savršen bijeg za 4 + 1 osobu, samo 8 minuta od Rovinja.'
);

-- ── properties: Casa Grazia ──────────────────────────────────────────────────
with new_property as (
  insert into public.properties (
    name,
    description,
    short_description,
    property_type,
    max_guests,
    bedrooms,
    bathrooms,
    size_sqm,
    base_price,
    cleaning_fee,
    amenities,
    address,
    latitude,
    longitude,
    is_active,
    sort_order
  ) values (
    'Casa Grazia',
    'Casa Grazia je ugodna, obiteljska kuća za odmor, ukusno obnovljena 2017. godine u tipičnom istarskom stilu. Nalazi se u selu Rovinjsko Selo i može primiti 4 + 1 osobu. Okružena je lijepim, idiličnim krajolikom na 2,5 hektara zemlje, od čega 1 hektar maslinika, samo 8 minuta vožnje automobilom od živopisnog grada Rovinja.

Kuća za odmor sastoji se od dvije spavaće sobe, dnevnog boravka, potpuno opremljene kuhinje, dvije kupaonice, perilice suđa, klima uređaja, besplatnog bežičnog pristupa internetu, satelitske TV i natkrivene terase. Parking na imanju.',
    'Vila s bazenom za 4+1 osobu, 8 min od Rovinja.',
    'villa',
    5,
    2,
    2,
    110,
    180.00,
    60.00,
    array[
      'Privatni bazen',
      'Vlastiti vrt',
      'Vrtna garnitura',
      'Roštilj na korištenje',
      'Klima uređaj',
      'Besplatan Wi-Fi',
      'SAT-TV',
      'Potpuno opremljena kuhinja',
      'Perilica suđa',
      'Natkrivena terasa',
      'Privatni parking',
      'Domaćin govori engleski',
      'Domaćin govori njemački',
      'Domaćin govori talijanski',
      'Kućni ljubimci nisu dozvoljeni'
    ]::text[],
    'Duranka 44, 52210 Rovinjsko Selo, Hrvatska',
    45.0852,
    13.6900,
    true,
    0
  )
  returning id
)
-- ── property_images (7 photos) ───────────────────────────────────────────────
insert into public.property_images (property_id, url, alt_text, is_cover, sort_order)
select id, url, alt_text, is_cover, sort_order from new_property
cross join (values
  ('/villa/casa-grazia-2.png', 'Privatni bazen vile Casa Grazia',                    true,  0),
  ('/villa/casa-grazia-1.jpg', 'Natkrivena terasa i bazen vile Casa Grazia',         false, 1),
  ('/villa/casa-grazia-4.jpg', 'Blagovaonica na natkrivenoj terasi s pogledom',      false, 2),
  ('/villa/casa-grazia-3.png', 'Dnevni boravak s pogledom na maslinik',              false, 3),
  ('/villa/casa-grazia-5.png', 'Potpuno opremljena kuhinja s blagovaonicom',         false, 4),
  ('/villa/casa-grazia-6.png', 'Glavna spavaća soba s bračnim krevetom',             false, 5),
  ('/villa/casa-grazia-7.png', 'Druga spavaća soba u istarskom stilu',               false, 6)
) as imgs(url, alt_text, is_cover, sort_order);

-- ── seasonal_pricing (typical Istrian summer bands — adjust to taste) ────────
insert into public.seasonal_pricing (property_id, name, start_date, end_date, price_per_night, min_nights)
select p.id, bands.band_name, bands.start_date, bands.end_date, bands.price_per_night, bands.min_nights
from public.properties p
cross join (values
  ('Predsezona',     '2026-04-01'::date, '2026-06-14'::date, 150.00, 3),
  ('Glavna sezona',  '2026-06-15'::date, '2026-09-15'::date, 240.00, 7),
  ('Posezona',       '2026-09-16'::date, '2026-10-31'::date, 160.00, 3)
) as bands(band_name, start_date, end_date, price_per_night, min_nights)
where p.name = 'Casa Grazia';

-- ── gallery_images: same 7 photos so /gallery shows the villa ────────────────
insert into public.gallery_images (url, alt_text, category, sort_order) values
  ('/villa/casa-grazia-2.png', 'Privatni bazen vile Casa Grazia',           'Vanjski prostor', 0),
  ('/villa/casa-grazia-1.jpg', 'Natkrivena terasa i bazen Casa Grazia',     'Vanjski prostor', 1),
  ('/villa/casa-grazia-4.jpg', 'Blagovaonica na terasi s pogledom',         'Vanjski prostor', 2),
  ('/villa/casa-grazia-3.png', 'Dnevni boravak s pogledom na maslinik',     'Interijer',       3),
  ('/villa/casa-grazia-5.png', 'Potpuno opremljena kuhinja',                'Interijer',       4),
  ('/villa/casa-grazia-6.png', 'Glavna spavaća soba',                       'Spavaće sobe',    5),
  ('/villa/casa-grazia-7.png', 'Druga spavaća soba u istarskom stilu',      'Spavaće sobe',    6);

-- =============================================================================
-- DONE — admin user must be created via Supabase Auth dashboard.
-- =============================================================================
