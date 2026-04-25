import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { getAuth } from '@/lib/auth';

async function handler(request: Request): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const auth = getAuth(db, env);
  return auth.handler(request);
}

export { handler as GET, handler as POST };
