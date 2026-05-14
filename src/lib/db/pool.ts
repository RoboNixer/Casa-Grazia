import { Pool } from 'pg';

let pool: Pool | undefined;

/**
 * Lazy singleton for server-side use only (Server Actions).
 * Requires `DATABASE_URL` — Postgres URI from Supabase Dashboard → Database.
 */
export function getPgPool(): Pool | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;
  if (!pool) {
    pool = new Pool({
      connectionString: url,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 15_000,
    });
  }
  return pool;
}
