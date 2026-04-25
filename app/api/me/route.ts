import { getCloudflareContext } from '@opennextjs/cloudflare';
import { eq } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { getAuth } from '@/lib/auth';

export interface MeResponse {
  isAuthenticated: boolean;
  tier: 'free' | 'pro';
  email: string | null;
  name: string | null;
}

export async function GET(request: Request) {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const auth = getAuth(db);

  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    const body: MeResponse = {
      isAuthenticated: false,
      tier: 'free',
      email: null,
      name: null,
    };
    return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
  }

  const row = await db.select().from(users).where(eq(users.id, session.user.id)).get();

  const body: MeResponse = {
    isAuthenticated: true,
    tier: row?.tier ?? 'free',
    email: row?.email ?? session.user.email,
    name: row?.name ?? session.user.name ?? null,
  };

  return Response.json(body, { headers: { 'Cache-Control': 'no-store' } });
}
