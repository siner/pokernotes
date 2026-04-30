import { and, eq, isNull, sql } from 'drizzle-orm';
import { hands } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { HandPayloadSchema } from '@/lib/sync/schemas';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');
  const sessionId = url.searchParams.get('sessionId');

  const conditions = [eq(hands.userId, userId), isNull(hands.deletedAt)];
  if (playerId) conditions.push(eq(hands.playerId, playerId));
  if (sessionId) conditions.push(eq(hands.sessionId, sessionId));

  const rows = await db
    .select()
    .from(hands)
    .where(and(...conditions))
    .all();

  return Response.json(rows, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = HandPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const h = parsed.data;
  await db
    .insert(hands)
    .values({
      id: h.id,
      userId,
      playerId: h.playerId,
      sessionId: h.sessionId,
      rawDescription: h.rawDescription,
      structuredData: h.structuredData,
      aiProcessed: h.aiProcessed,
      shareToken: h.shareToken,
      shareCreatedAt: h.shareCreatedAt,
      createdAt: h.createdAt,
      updatedAt: h.updatedAt,
    })
    .onConflictDoUpdate({
      target: hands.id,
      set: {
        playerId: h.playerId,
        sessionId: h.sessionId,
        rawDescription: h.rawDescription,
        structuredData: h.structuredData,
        aiProcessed: h.aiProcessed,
        shareToken: h.shareToken,
        shareCreatedAt: h.shareCreatedAt,
        updatedAt: h.updatedAt,
        deletedAt: null,
      },
      // Cross-tenant write guard + LWW: only accept if incoming updatedAt
      // is newer than what's already in D1.
      setWhere: sql`${hands.userId} = ${userId} AND excluded.updated_at > ${hands.updatedAt}`,
    });

  return Response.json({ ok: true }, { status: 201 });
}
