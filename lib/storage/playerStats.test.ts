import { describe, expect, it } from 'vitest';
import type { Note, Session } from './types';
import { buildPlayerSessionHistory, computePlayerStats } from './playerStats';

const session = (id: string, startedAt: Date): Session => ({
  id,
  startedAt,
  createdAt: startedAt,
});

const note = (id: string, sessionId: string | undefined, createdAt: Date): Note => ({
  id,
  playerId: 'p1',
  sessionId,
  rawNote: 'x',
  aiSuggestedTags: [],
  aiProcessed: false,
  createdAt,
});

describe('computePlayerStats', () => {
  it('counts unique sessions, ignoring orphan notes', () => {
    const sessions = {
      s1: session('s1', new Date('2026-01-01')),
      s2: session('s2', new Date('2026-02-01')),
    };
    const notes = [
      note('n1', 's1', new Date('2026-01-01T20:00')),
      note('n2', 's1', new Date('2026-01-01T22:00')),
      note('n3', 's2', new Date('2026-02-01T18:00')),
      note('n4', undefined, new Date('2026-03-01T18:00')), // orphan
    ];
    const stats = computePlayerStats(notes, sessions);
    expect(stats.uniqueSessionsCount).toBe(2);
    expect(stats.firstSeenAt).toEqual(new Date('2026-01-01'));
    expect(stats.lastSeenAt).toEqual(new Date('2026-03-01T18:00'));
  });

  it('returns 0 sessions and no dates for an empty note list', () => {
    expect(computePlayerStats([], {})).toEqual({ uniqueSessionsCount: 0 });
  });

  it('falls back to note.createdAt when the linked session is gone', () => {
    const notes = [note('n1', 'deleted-session', new Date('2026-04-15'))];
    const stats = computePlayerStats(notes, {});
    expect(stats.uniqueSessionsCount).toBe(1);
    expect(stats.firstSeenAt).toEqual(new Date('2026-04-15'));
    expect(stats.lastSeenAt).toEqual(new Date('2026-04-15'));
  });
});

describe('buildPlayerSessionHistory', () => {
  it('returns sessions ordered most recent first with note counts', () => {
    const sessions = {
      s1: session('s1', new Date('2026-01-01')),
      s2: session('s2', new Date('2026-03-01')),
      s3: session('s3', new Date('2026-02-01')),
    };
    const notes = [
      note('n1', 's1', new Date()),
      note('n2', 's2', new Date()),
      note('n3', 's2', new Date()),
      note('n4', 's3', new Date()),
    ];

    const history = buildPlayerSessionHistory(notes, sessions);
    expect(history).toHaveLength(3);
    expect(history[0].session.id).toBe('s2');
    expect(history[0].noteCount).toBe(2);
    expect(history[1].session.id).toBe('s3');
    expect(history[1].noteCount).toBe(1);
    expect(history[2].session.id).toBe('s1');
    expect(history[2].noteCount).toBe(1);
  });

  it('skips orphaned notes whose session is no longer present', () => {
    const sessions = { s1: session('s1', new Date('2026-01-01')) };
    const notes = [note('n1', 's1', new Date()), note('n2', 'gone', new Date())];
    const history = buildPlayerSessionHistory(notes, sessions);
    expect(history.map((e) => e.session.id)).toEqual(['s1']);
  });
});
