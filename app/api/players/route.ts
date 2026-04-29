import { and, eq, isNull, sql } from 'drizzle-orm';
import { players } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { PlayerPayloadSchema } from '@/lib/sync/schemas';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  const rows = await db
    .select()
    .from(players)
    .where(and(eq(players.userId, userId), isNull(players.deletedAt)))
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

  const parsed = PlayerPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const p = parsed.data;
  await db
    .insert(players)
    .values({
      id: p.id,
      userId,
      nickname: p.nickname,
      description: p.description,
      photoUrl: p.photoUrl,
      tags: p.tags,
      timesPlayed: p.timesPlayed,
      firstSeenAt: p.firstSeenAt,
      lastSeenAt: p.lastSeenAt,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    })
    .onConflictDoUpdate({
      target: players.id,
      set: {
        nickname: p.nickname,
        description: p.description,
        // photoUrl is intentionally NOT updated here. The photo route owns it
        // (uploads + deletes); a generic savePlayer dispatch can carry stale
        // photoUrl values from devices that haven't bootstrapped yet, which
        // used to wipe a freshly uploaded photo.
        tags: p.tags,
        timesPlayed: p.timesPlayed,
        firstSeenAt: p.firstSeenAt,
        lastSeenAt: p.lastSeenAt,
        updatedAt: p.updatedAt,
        deletedAt: null,
      },
      // Cross-tenant write guard + LWW: never accept a write with an older
      // updatedAt than what's already in D1 (stale dispatches from other tabs
      // or devices). Mirrors the guard in /api/sync/import.
      setWhere: sql`${players.userId} = ${userId} AND excluded.updated_at > ${players.updatedAt}`,
    });

  return Response.json({ ok: true }, { status: 201 });
}
