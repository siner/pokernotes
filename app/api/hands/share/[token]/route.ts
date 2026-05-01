import { and, eq, isNotNull, isNull, sql } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { getDb } from '@/lib/db';
import { hands } from '@/lib/db/schema';

interface Params {
  params: Promise<{ token: string }>;
}

const RATE_LIMIT_PER_MIN = 60;

/**
 * Public read of a shared hand. No auth. Returns only the structured data
 * + creation/share metadata + view count — strips userId, playerId,
 * sessionId, and rawDescription (which can contain real nicknames).
 *
 * Rate-limited by IP at 60 req/min — token is a UUID v4 so enumeration is
 * infeasible, but this caps DoS-style scraping. View count is best-effort
 * (no concurrency guard; race conditions just under-count, never over).
 */
export async function GET(request: Request, { params }: Params) {
  const { token } = await params;
  if (!token || token.length > 80) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const { env } = await getCloudflareContext({ async: true });

  if (env.RATE_LIMITS) {
    const ip = getIp(request);
    const minute = Math.floor(Date.now() / 60_000);
    const key = `share_view:${ip}:${minute}`;
    const current = parseInt((await env.RATE_LIMITS.get(key)) ?? '0', 10);
    if (current >= RATE_LIMIT_PER_MIN) {
      return Response.json({ error: 'rate_limited' }, { status: 429 });
    }
    // Best-effort: write doesn't block on failure
    env.RATE_LIMITS.put(key, String(current + 1), { expirationTtl: 120 }).catch(() => {});
  }

  const db = getDb(env.DB);

  const row = await db
    .select({
      id: hands.id,
      structuredData: hands.structuredData,
      shareCreatedAt: hands.shareCreatedAt,
      shareViewCount: hands.shareViewCount,
      createdAt: hands.createdAt,
    })
    .from(hands)
    .where(and(eq(hands.shareToken, token), isNotNull(hands.shareToken), isNull(hands.deletedAt)))
    .get();

  if (!row) return Response.json({ error: 'not_found' }, { status: 404 });

  // Best-effort increment. Failure is silently ignored — counter is
  // approximate by design, and a stale read shouldn't fail the request.
  db.update(hands)
    .set({ shareViewCount: sql`${hands.shareViewCount} + 1` })
    .where(eq(hands.shareToken, token))
    .run()
    .catch(() => {});

  return Response.json(
    {
      id: row.id,
      structuredData: row.structuredData,
      shareCreatedAt: row.shareCreatedAt,
      shareViewCount: (row.shareViewCount ?? 0) + 1,
      createdAt: row.createdAt,
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      },
    }
  );
}

function getIp(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? 'unknown'
  );
}
