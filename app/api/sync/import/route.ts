import { sql } from 'drizzle-orm';
import { players, notes, pokerSessions } from '@/lib/db/schema';
import { requireProUser } from '@/lib/auth/requireProUser';
import { SyncImportSchema } from '@/lib/sync/schemas';

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

  const parsed = SyncImportSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: 'invalid_payload', issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { players: ps, notes: ns, sessions: ss } = parsed.data;

  // Last-write-wins: only overwrite if incoming updatedAt is newer than stored.
  for (const p of ps) {
    await db
      .insert(players)
      .values({
        id: p.id,
        userId,
        nickname: p.nickname,
        description: p.description,
        photoUrl: p.photoUrl,
        tags: p.tags,
        timesPlayed: p.timesPlayed,
        firstSeenAt: p.firstSeenAt,
        lastSeenAt: p.lastSeenAt,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })
      .onConflictDoUpdate({
        target: players.id,
        set: {
          nickname: p.nickname,
          description: p.description,
          // photoUrl is owned by the photo upload route, not generic sync.
          // The values clause above still lets brand-new players land their
          // photoUrl during the bootstrap insert; updates skip it.
          tags: p.tags,
          timesPlayed: p.timesPlayed,
          firstSeenAt: p.firstSeenAt,
          lastSeenAt: p.lastSeenAt,
          updatedAt: p.updatedAt,
        },
        setWhere: sql`${players.userId} = ${userId} AND excluded.updated_at > ${players.updatedAt}`,
      });
  }

  for (const s of ss) {
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
        },
        setWhere: sql`${pokerSessions.userId} = ${userId} AND excluded.updated_at > ${pokerSessions.updatedAt}`,
      });
  }

  for (const n of ns) {
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
        },
        setWhere: sql`${notes.userId} = ${userId} AND excluded.updated_at > ${notes.updatedAt}`,
      });
  }

  return Response.json({
    ok: true,
    imported: { players: ps.length, notes: ns.length, sessions: ss.length },
  });
}
