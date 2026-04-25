import { and, eq, isNull } from 'drizzle-orm';
import { players, notes, pokerSessions } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  const [playerRows, noteRows, sessionRows] = await Promise.all([
    db
      .select()
      .from(players)
      .where(and(eq(players.userId, userId), isNull(players.deletedAt)))
      .all(),
    db
      .select()
      .from(notes)
      .where(and(eq(notes.userId, userId), isNull(notes.deletedAt)))
      .all(),
    db
      .select()
      .from(pokerSessions)
      .where(and(eq(pokerSessions.userId, userId), isNull(pokerSessions.deletedAt)))
      .all(),
  ]);

  return Response.json(
    {
      players: playerRows,
      notes: noteRows,
      sessions: sessionRows,
      pulledAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
