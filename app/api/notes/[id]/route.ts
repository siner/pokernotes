import { and, eq } from 'drizzle-orm';
import { notes } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const now = new Date();
  const result = await db
    .update(notes)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(notes.id, id), eq(notes.userId, userId)))
    .returning({ id: notes.id });

  if (result.length === 0) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true });
}
