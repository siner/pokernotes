import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type AppDB = ReturnType<typeof getDb>;

/**
 * Returns a Drizzle ORM instance bound to a Cloudflare D1 database.
 * Usage: const db = getDb(env.DB)
 */
export function getDb(d1: D1Database) {
  return drizzle(d1, { schema });
}
