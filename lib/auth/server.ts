import { headers } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';

/**
 * Server-side auth check shared between the layout and pages that need to
 * branch on logged-in state (e.g. the home redirect, hiding the footer on
 * mobile). Returns `false` on any auth resolution error so transient
 * Cloudflare/D1 hiccups never lock the user out — the public surface is the
 * safe fallback.
 */
export async function isAuthenticatedServer(): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const db = getDb(env.DB);
    const auth = getAuth(db);
    const session = await auth.api.getSession({ headers: await headers() });
    return !!session?.user;
  } catch {
    return false;
  }
}
