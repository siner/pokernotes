import { and, desc, eq, isNull } from 'drizzle-orm';
import { notes, players, pokerSessions } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { buildCsv } from '@/lib/utils/csv';

export async function GET(request: Request) {
  const auth = await requireProUser(request);
  if (!auth.ok) return auth.response;
  const { db, userId } = auth.ctx;

  // Drive the export from players so users with no notes still appear in the
  // output (one row per player with empty note fields). Players with N notes
  // produce N rows.
  const rows = await db
    .select({
      nickname: players.nickname,
      tags: players.tags,
      rawNote: notes.rawNote,
      structuredSummary: notes.structuredSummary,
      createdAt: notes.createdAt,
      sessionName: pokerSessions.name,
      sessionVenue: pokerSessions.venue,
    })
    .from(players)
    .leftJoin(notes, and(eq(notes.playerId, players.id), isNull(notes.deletedAt)))
    .leftJoin(pokerSessions, eq(pokerSessions.id, notes.sessionId))
    .where(and(eq(players.userId, userId), isNull(players.deletedAt)))
    .orderBy(players.nickname, desc(notes.createdAt))
    .all();

  const csv = buildCsv(
    ['player_name', 'tags', 'note', 'date', 'session'],
    rows.map((r) => [
      r.nickname,
      (r.tags ?? []).join('; '),
      r.rawNote ?? r.structuredSummary ?? '',
      r.createdAt instanceof Date ? r.createdAt.toISOString() : '',
      [r.sessionName, r.sessionVenue].filter(Boolean).join(' — '),
    ])
  );

  const today = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="pokerreads-export-${today}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
