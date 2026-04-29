import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb, type AppDB } from '@/lib/db';
import { getAuth } from '@/lib/auth';

export interface AdminContext {
  userId: string;
  email: string;
  db: AppDB;
}

export type AdminAuthResult =
  | { ok: true; ctx: AdminContext }
  | { ok: false; reason: 'unauthenticated' | 'forbidden' };

/**
 * Resolves the caller (server component or route handler) to an admin user.
 * Admins are gated by the `ADMIN_EMAILS` env var (comma-separated list).
 * Falls back to "no admins" when the env var is missing — safe default so
 * misconfigurations don't accidentally expose the panel.
 *
 * Pass `headers` directly so this works equally well from `app/.../page.tsx`
 * (via `await headers()`) and from route handlers (`request.headers`).
 */
export async function requireAdmin(reqHeaders: Headers): Promise<AdminAuthResult> {
  const allowed = parseAllowedEmails(process.env.ADMIN_EMAILS);
  if (allowed.size === 0) return { ok: false, reason: 'forbidden' };

  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const auth = getAuth(db, env);

  const session = await auth.api.getSession({ headers: reqHeaders });
  if (!session?.user?.email) return { ok: false, reason: 'unauthenticated' };

  const email = session.user.email.toLowerCase();
  if (!allowed.has(email)) return { ok: false, reason: 'forbidden' };

  return { ok: true, ctx: { userId: session.user.id, email, db } };
}

function parseAllowedEmails(raw: string | undefined): Set<string> {
  if (!raw) return new Set();
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0)
  );
}
