import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { players } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { PlayerPatchSchema } from '@/lib/sync/schemas';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const row = await db
    .select()
    .from(players)
    .where(and(eq(players.id, id), eq(players.userId, userId), isNull(players.deletedAt)))
    .get();

  if (!row) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json(row, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = PlayerPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const patch = parsed.data;
  const result = await db
    .update(players)
    .set({
      nickname: patch.nickname,
      description: patch.description,
      // photoUrl is owned by the photo upload route; PATCH must not mutate it.
      tags: patch.tags,
      timesPlayed: patch.timesPlayed,
      firstSeenAt: patch.firstSeenAt,
      lastSeenAt: patch.lastSeenAt,
      updatedAt: patch.updatedAt,
    })
    // LWW: only apply if the incoming updatedAt is newer than what's stored.
    .where(
      and(
        eq(players.id, id),
        eq(players.userId, userId),
        gt(sql`${patch.updatedAt}`, players.updatedAt)
      )
    )
    .returning({ id: players.id });

  if (result.length === 0) {
    // Either the row doesn't exist, doesn't belong to this user, or the patch
    // is stale (a newer updatedAt is already in D1). All map to "no-op".
    return Response.json({ error: 'not_found_or_stale' }, { status: 404 });
  }
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const now = new Date();
  const result = await db
    .update(players)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(players.id, id), eq(players.userId, userId)))
    .returning({ id: players.id });

  if (result.length === 0) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true });
}
