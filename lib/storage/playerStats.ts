import { type Note, type Player, type Session, type StorageAdapter } from './types';

export interface PlayerStats {
  uniqueSessionsCount: number;
  lastSeenAt?: Date;
  firstSeenAt?: Date;
}

export interface PlayerSessionEntry {
  session: Session;
  noteCount: number;
}

/**
 * Derive cross-session stats for a player from their notes + the available sessions.
 * - `uniqueSessionsCount`: distinct sessions in which the player has at least one note.
 *   Notes without a sessionId are not counted (they had no session context).
 * - `firstSeenAt` / `lastSeenAt`: span of session.startedAt across those sessions.
 *   Falls back to the note's createdAt when the linked session is missing or has no
 *   startedAt (e.g. orphaned notes after a session was deleted).
 */
export function computePlayerStats(
  notes: Note[],
  sessionMap: Record<string, Session>
): PlayerStats {
  const sessionsSeen = new Set<string>();
  const dates: Date[] = [];

  for (const note of notes) {
    if (note.sessionId) {
      sessionsSeen.add(note.sessionId);
      const session = sessionMap[note.sessionId];
      const at = session?.startedAt;
      if (at) {
        dates.push(at);
        continue;
      }
    }
    dates.push(note.createdAt);
  }

  if (dates.length === 0) {
    return { uniqueSessionsCount: sessionsSeen.size };
  }

  let first = dates[0];
  let last = dates[0];
  for (const d of dates) {
    if (d.getTime() < first.getTime()) first = d;
    if (d.getTime() > last.getTime()) last = d;
  }

  return {
    uniqueSessionsCount: sessionsSeen.size,
    firstSeenAt: first,
    lastSeenAt: last,
  };
}

/**
 * Group notes by session and return an entry per session the player appeared in,
 * ordered most-recent first. Sessions present in `sessionMap` come with their full
 * data; orphaned notes (whose session was deleted) are skipped — the note still
 * shows up in the player's notes feed, but the history only lists known sessions.
 */
export function buildPlayerSessionHistory(
  notes: Note[],
  sessionMap: Record<string, Session>
): PlayerSessionEntry[] {
  const counts = new Map<string, number>();
  for (const note of notes) {
    if (!note.sessionId) continue;
    counts.set(note.sessionId, (counts.get(note.sessionId) ?? 0) + 1);
  }

  const entries: PlayerSessionEntry[] = [];
  for (const [sessionId, noteCount] of counts) {
    const session = sessionMap[sessionId];
    if (!session) continue;
    entries.push({ session, noteCount });
  }

  entries.sort((a, b) => {
    const aTime = a.session.startedAt?.getTime() ?? a.session.createdAt.getTime();
    const bTime = b.session.startedAt?.getTime() ?? b.session.createdAt.getTime();
    return bTime - aTime;
  });

  return entries;
}

/**
 * Recompute the persisted stats on a player record (timesPlayed + first/last seen)
 * from the ground truth (their notes). Saves only when something changed so we don't
 * cause spurious cloud writes on every page load.
 */
export async function syncPlayerStats(
  player: Player,
  notes: Note[],
  sessionMap: Record<string, Session>,
  storage: StorageAdapter
): Promise<Player> {
  const stats = computePlayerStats(notes, sessionMap);

  const changed =
    player.timesPlayed !== stats.uniqueSessionsCount ||
    sameTime(player.firstSeenAt, stats.firstSeenAt) === false ||
    sameTime(player.lastSeenAt, stats.lastSeenAt) === false;

  if (!changed) return player;

  const updated: Player = {
    ...player,
    timesPlayed: stats.uniqueSessionsCount,
    firstSeenAt: stats.firstSeenAt,
    lastSeenAt: stats.lastSeenAt,
    updatedAt: new Date(),
  };
  await storage.savePlayer(updated);
  return updated;
}

function sameTime(a?: Date, b?: Date): boolean {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.getTime() === b.getTime();
}
