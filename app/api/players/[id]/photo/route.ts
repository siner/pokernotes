import { and, eq, isNull } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { players } from '@/lib/db/schema';
import { requireProUser, type ProUserContext } from '@/lib/auth/requireProUser';

interface Params {
  params: Promise<{ id: string }>;
}

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 500 * 1024; // 500 KB — client compresses to ~150 KB; this is defensive.

function r2Key(userId: string, playerId: string) {
  return `users/${userId}/players/${playerId}/photo`;
}

async function getR2(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return env.PLAYER_PHOTOS;
}

async function assertOwnsPlayer(db: ProUserContext['db'], userId: string, playerId: string) {
  const row = await db
    .select({ id: players.id })
    .from(players)
    .where(and(eq(players.id, playerId), eq(players.userId, userId), isNull(players.deletedAt)))
    .get();
  return Boolean(row);
}

export async function GET(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  if (!(await assertOwnsPlayer(db, userId, id))) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const bucket = await getR2();
  const obj = await bucket.get(r2Key(userId, id));
  if (!obj) return Response.json({ error: 'not_found' }, { status: 404 });

  const contentType = obj.httpMetadata?.contentType ?? 'application/octet-stream';
  return new Response(obj.body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  if (!(await assertOwnsPlayer(db, userId, id))) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: 'invalid_form' }, { status: 400 });
  }

  const file = form.get('photo');
  if (!(file instanceof File)) {
    return Response.json({ error: 'missing_photo' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return Response.json({ error: 'unsupported_type', got: file.type }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return Response.json({ error: 'too_large', max: MAX_BYTES, got: file.size }, { status: 413 });
  }

  const bytes = await file.arrayBuffer();
  const bucket = await getR2();
  await bucket.put(r2Key(userId, id), bytes, {
    httpMetadata: { contentType: file.type },
  });

  const now = new Date();
  const photoUrl = `/api/players/${id}/photo?v=${now.getTime()}`;
  await db
    .update(players)
    .set({ photoUrl, updatedAt: now })
    .where(and(eq(players.id, id), eq(players.userId, userId)));

  return Response.json({ photoUrl, updatedAt: now.toISOString() }, { status: 201 });
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;
  const { id } = await params;

  if (!(await assertOwnsPlayer(db, userId, id))) {
    return Response.json({ error: 'not_found' }, { status: 404 });
  }

  const bucket = await getR2();
  await bucket.delete(r2Key(userId, id));

  const now = new Date();
  await db
    .update(players)
    .set({ photoUrl: null, updatedAt: now })
    .where(and(eq(players.id, id), eq(players.userId, userId)));

  return Response.json({ ok: true });
}
