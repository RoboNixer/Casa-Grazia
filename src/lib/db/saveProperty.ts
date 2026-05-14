import type { Pool } from 'pg';
import type { Property, PropertyImage } from '@/types/database';
import { getPgPool } from './pool';

export type PropertySavePayload = {
  id: string | null;
  name: string;
  description: string;
  short_description: string;
  property_type: string;
  max_guests: number;
  bedrooms: number;
  bathrooms: number;
  size_sqm: number;
  base_price: number;
  cleaning_fee: number;
  min_nights: number;
  amenities: string[];
  address: string;
  latitude: number;
  longitude: number;
  is_active: boolean;
  sort_order: number;
};

function num(v: unknown, fallback = 0): number {
  if (v == null) return fallback;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  const x = Number(v);
  return Number.isFinite(x) ? x : fallback;
}

function mapImageRow(row: Record<string, unknown>): PropertyImage {
  return {
    id: String(row.id),
    property_id: String(row.property_id),
    url: String(row.url ?? ''),
    alt_text: String(row.alt_text ?? ''),
    is_cover: Boolean(row.is_cover),
    sort_order: Math.trunc(num(row.sort_order, 0)),
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
  };
}

function mapPropertyRow(
  row: Record<string, unknown>,
  images: PropertyImage[],
  minNightOverride?: number,
): Property {
  const mn = Math.max(1, minNightOverride ?? Math.trunc(num(row.min_nights, 1)));
  return {
    id: String(row.id),
    name: String(row.name ?? ''),
    description: String(row.description ?? ''),
    short_description: String(row.short_description ?? ''),
    property_type: String(row.property_type ?? 'apartment') as Property['property_type'],
    max_guests: Math.trunc(num(row.max_guests, 2)),
    bedrooms: Math.trunc(num(row.bedrooms, 1)),
    bathrooms: Math.trunc(num(row.bathrooms, 1)),
    size_sqm: Math.trunc(num(row.size_sqm, 0)),
    base_price: num(row.base_price, 0),
    cleaning_fee: num(row.cleaning_fee, 0),
    min_nights: mn,
    amenities: Array.isArray(row.amenities)
      ? (row.amenities as unknown[]).map((x) => String(x))
      : ([] as string[]),
    address: String(row.address ?? ''),
    latitude: num(row.latitude, 0),
    longitude: num(row.longitude, 0),
    is_active: Boolean(row.is_active ?? true),
    sort_order: Math.trunc(num(row.sort_order, 0)),
    created_at:
      row.created_at instanceof Date ? row.created_at.toISOString() : String(row.created_at ?? ''),
    updated_at:
      row.updated_at instanceof Date ? row.updated_at.toISOString() : String(row.updated_at ?? ''),
    images,
  };
}

/**
 * Persist full property row incl. min_nights — bypasses PostgREST entirely.
 */
export async function persistPropertyViaPostgres(
  args: PropertySavePayload,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const pool = getPgPool();
  if (!pool)
    return { ok: false, error: 'Nedostaje DATABASE_URL (Postgres connection string) u okruženju.' };

  const pt = args.property_type?.trim() || 'apartment';
  const minNights = Math.max(1, args.min_nights);

  try {
    if (!args.id) {
      const res = await pool.query<{ id: string }>(
        `insert into public.properties (
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
          min_nights,
          amenities,
          address,
          latitude,
          longitude,
          is_active,
          sort_order
        ) values (
          $1, $2, $3,
          coalesce(trim($4::text), 'apartment')::public.property_type,
          $5, $6, $7, $8, $9, $10,
          $11,
          coalesce($12::text[], '{}'),
          coalesce(trim($13::text), ''),
          case when $14::numeric is null then null else $14::numeric(10,7) end,
          case when $15::numeric is null then null else $15::numeric(10,7) end,
          $16,
          coalesce($17, 0)
        )
        returning id::text as id`,
        [
          args.name,
          args.description,
          args.short_description,
          pt,
          args.max_guests,
          args.bedrooms,
          args.bathrooms,
          args.size_sqm,
          args.base_price,
          args.cleaning_fee,
          minNights,
          args.amenities,
          args.address,
          args.latitude,
          args.longitude,
          args.is_active,
          args.sort_order,
        ],
      );
      const id = res.rows[0]?.id;
      if (!id) return { ok: false, error: 'Greška spremanja' };
      return { ok: true, id };
    }

    const res = await pool.query<{ id: string }>(
      `update public.properties set
        name               = $1,
        description        = coalesce(trim($2::text), ''),
        short_description  = coalesce(trim($3::text), ''),
        property_type      = coalesce(trim($4::text), 'apartment')::public.property_type,
        max_guests         = $5,
        bedrooms           = $6,
        bathrooms          = $7,
        size_sqm           = $8,
        base_price         = $9,
        cleaning_fee       = $10,
        min_nights         = $11,
        amenities          = coalesce($12::text[], '{}'),
        address            = coalesce(trim($13::text), ''),
        latitude           = case when $14::numeric is null then null else $14::numeric(10,7) end,
        longitude          = case when $15::numeric is null then null else $15::numeric(10,7) end,
        is_active          = $16,
        sort_order         = coalesce($17, 0)
      where id = $18::uuid
      returning id::text as id`,
      [
        args.name,
        args.description,
        args.short_description,
        pt,
        args.max_guests,
        args.bedrooms,
        args.bathrooms,
        args.size_sqm,
        args.base_price,
        args.cleaning_fee,
        minNights,
        args.amenities,
        args.address,
        args.latitude,
        args.longitude,
        args.is_active,
        args.sort_order,
        args.id,
      ],
    );

    const id = res.rows[0]?.id;
    if (!id)
      return { ok: false, error: 'Nema prava uređivanja ili nekretnina ne postoji' };
    return { ok: true, id };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Greška spremanja';
    return { ok: false, error: msg };
  }
}

export async function loadPropertyWithImagesPg(
  pool: Pool,
  id: string,
  minNightOverride?: number,
): Promise<Property | null> {
  const prop = await pool.query<Record<string, unknown>>(`select * from public.properties where id = $1`, [id]);
  if (prop.rows.length === 0) return null;
  const imgs = await pool.query<Record<string, unknown>>(
    `select * from public.property_images where property_id = $1 order by sort_order asc, created_at asc`,
    [id],
  );
  return mapPropertyRow(
    prop.rows[0],
    imgs.rows.map((r) => mapImageRow(r)),
    minNightOverride,
  );
}
