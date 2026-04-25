import { and, eq, isNull } from 'drizzle-orm';
import { notes } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { NotePayloadSchema } from '@/lib/sync/schemas';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  const url = new URL(request.url);
  const playerId = url.searchParams.get('playerId');
  const sessionId = url.searchParams.get('sessionId');

  const conditions = [eq(notes.userId, userId), isNull(notes.deletedAt)];
  if (playerId) conditions.push(eq(notes.playerId, playerId));
  if (sessionId) conditions.push(eq(notes.sessionId, sessionId));

  const rows = await db
    .select()
    .from(notes)
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

  const parsed = NotePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const n = parsed.data;
  await db
    .insert(notes)
    .values({
      id: n.id,
      userId,
      playerId: n.playerId,
      sessionId: n.sessionId,
      rawNote: n.rawNote,
      structuredSummary: n.structuredSummary,
      preflopTendency: n.preflopTendency,
      postflopTendency: n.postflopTendency,
      aiSuggestedTags: n.aiSuggestedTags,
      aiProcessed: n.aiProcessed,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    })
    .onConflictDoUpdate({
      target: notes.id,
      set: {
        playerId: n.playerId,
        sessionId: n.sessionId,
        rawNote: n.rawNote,
        structuredSummary: n.structuredSummary,
        preflopTendency: n.preflopTendency,
        postflopTendency: n.postflopTendency,
        aiSuggestedTags: n.aiSuggestedTags,
        aiProcessed: n.aiProcessed,
        updatedAt: n.updatedAt,
        deletedAt: null,
      },
    });

  return Response.json({ ok: true }, { status: 201 });
}
