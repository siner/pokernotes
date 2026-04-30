import { and, eq, isNull } from 'drizzle-orm';
import { hands } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';

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
    .from(hands)
    .where(and(eq(hands.id, id), eq(hands.userId, userId), isNull(hands.deletedAt)))
    .get();

  if (!row) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json(row, { headers: { 'Cache-Control': 'no-store' } });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const now = new Date();
  const result = await db
    .update(hands)
    .set({ deletedAt: now, updatedAt: now })
    .where(and(eq(hands.id, id), eq(hands.userId, userId)))
    .returning({ id: hands.id });

  if (result.length === 0) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json({ ok: true });
}
