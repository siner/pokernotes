import { eq } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb, type AppDB } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';

export interface ProUserContext {
  userId: string;
  db: AppDB;
}

export type AuthResult = { ok: true; ctx: ProUserContext } | { ok: false; response: Response };

/**
 * Resolves the request to a Pro user with a usable D1 handle.
 * Returns 401 when no session, 403 when the user is not on the Pro tier.
 */
export async function requireProUser(request: Request): Promise<AuthResult> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const auth = getAuth(db);

  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user) {
    return { ok: false, response: Response.json({ error: 'unauthorized' }, { status: 401 }) };
  }

  const row = await db
    .select({ tier: users.tier })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();

  if (row?.tier !== 'pro') {
    return { ok: false, response: Response.json({ error: 'pro_required' }, { status: 403 }) };
  }

  return { ok: true, ctx: { userId: session.user.id, db } };
}
