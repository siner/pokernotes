import { and, eq, isNull } from 'drizzle-orm';
import { hands } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Enable public sharing for a hand. Generates a UUID v4 token (~122 bits of
 * entropy — opaque enough that we can skip rate limiting on the public read
 * endpoint for v1). Idempotent: if a token already exists, return it as-is
 * rather than rotating, so existing share URLs keep working.
 */
export async function POST(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const existing = await db
    .select()
    .from(hands)
    .where(and(eq(hands.id, id), eq(hands.userId, userId), isNull(hands.deletedAt)))
    .get();

  if (!existing) return Response.json({ error: 'not_found' }, { status: 404 });

  if (existing.shareToken) {
    return Response.json(existing);
  }

  const token = globalThis.crypto.randomUUID();
  const now = new Date();
  const updated = await db
    .update(hands)
    .set({ shareToken: token, shareCreatedAt: now, updatedAt: now })
    .where(and(eq(hands.id, id), eq(hands.userId, userId)))
    .returning()
    .get();

  return Response.json(updated, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  const now = new Date();
  const updated = await db
    .update(hands)
    .set({ shareToken: null, shareCreatedAt: null, shareViewCount: 0, updatedAt: now })
    .where(and(eq(hands.id, id), eq(hands.userId, userId), isNull(hands.deletedAt)))
    .returning()
    .get();

  if (!updated) return Response.json({ error: 'not_found' }, { status: 404 });
  return Response.json(updated);
}
