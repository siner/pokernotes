import { and, eq } from 'drizzle-orm';
import { pokerSessions } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { SessionPatchSchema } from '@/lib/sync/schemas';

interface Params {
  params: Promise<{ id: string }>;
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

  const parsed = SessionPatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const patch = parsed.data;
  const result = await db
    .update(pokerSessions)
    .set({
      name: patch.name,
      venue: patch.venue,
      gameType: patch.gameType,
      startedAt: patch.startedAt,
      endedAt: patch.endedAt,
      notes: patch.notes,
      updatedAt: patch.updatedAt,
    })
    .where(and(eq(pokerSessions.id, id), eq(pokerSessions.userId, userId)))
    .returning({ id: pokerSessions.id });

  if (result.length === 0) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const now = new Date();
  const result = await db
    .update(pokerSessions)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(pokerSessions.id, id), eq(pokerSessions.userId, userId)))
    .returning({ id: pokerSessions.id });

  if (result.length === 0) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true });
}
