import { and, eq, isNull, sql } from 'drizzle-orm';
import { pokerSessions } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { SessionPayloadSchema } from '@/lib/sync/schemas';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  const rows = await db
    .select()
    .from(pokerSessions)
    .where(and(eq(pokerSessions.userId, userId), isNull(pokerSessions.deletedAt)))
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

  const parsed = SessionPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const s = parsed.data;
  await db
    .insert(pokerSessions)
    .values({
      id: s.id,
      userId,
      name: s.name,
      venue: s.venue,
      gameType: s.gameType,
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      notes: s.notes,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })
    .onConflictDoUpdate({
      target: pokerSessions.id,
      set: {
        name: s.name,
        venue: s.venue,
        gameType: s.gameType,
        startedAt: s.startedAt,
        endedAt: s.endedAt,
        notes: s.notes,
        updatedAt: s.updatedAt,
        deletedAt: null,
      },
      // Cross-tenant write guard: only the row's owner can update it.
      setWhere: sql`${pokerSessions.userId} = ${userId}`,
    });

  return Response.json({ ok: true }, { status: 201 });
}
