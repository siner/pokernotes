import { describe, it, expect } from 'vitest';
import { searchPlayers, tokenize } from './searchPlayers';
import type { Note, Player } from '@/lib/storage';

function makePlayer(p: Partial<Player> & Pick<Player, 'id' | 'nickname'>): Player {
  return {
    description: undefined,
    photoUrl: undefined,
    tags: [],
    timesPlayed: 0,
    firstSeenAt: undefined,
    lastSeenAt: undefined,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...p,
  };
}

function makeNote(n: Partial<Note> & Pick<Note, 'id' | 'playerId'>): Note {
  return {
    sessionId: undefined,
    rawNote: undefined,
    structuredSummary: undefined,
    preflopTendency: undefined,
    postflopTendency: undefined,
    aiSuggestedTags: [],
    aiProcessed: false,
    createdAt: new Date('2026-01-01'),
    ...n,
  };
}

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('  Big   Hat  ')).toEqual(['big', 'hat']);
  });

  it('strips diacritics', () => {
    expect(tokenize('Está Cañón')).toEqual(['esta', 'canon']);
  });

  it('returns empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('searchPlayers', () => {
  const p1 = makePlayer({ id: '1', nickname: 'Big Hat Guy', tags: ['aggro'] });
  const p2 = makePlayer({ id: '2', nickname: 'Quiet Mike', description: 'old man, blue cap' });
  const p3 = makePlayer({ id: '3', nickname: 'Whale' });

  it('returns all players when query is empty', () => {
    const result = searchPlayers([p1, p2, p3], [], '');
    expect(result.map((m) => m.player.id)).toEqual(['1', '2', '3']);
  });

  it('matches by nickname', () => {
    const result = searchPlayers([p1, p2, p3], [], 'mike');
    expect(result.map((m) => m.player.id)).toEqual(['2']);
  });

  it('matches by description', () => {
    const result = searchPlayers([p1, p2, p3], [], 'blue cap');
    expect(result.map((m) => m.player.id)).toEqual(['2']);
  });

  it('matches by tag', () => {
    const result = searchPlayers([p1, p2, p3], [], 'aggro');
    expect(result.map((m) => m.player.id)).toEqual(['1']);
  });

  it('matches by note content (rawNote)', () => {
    const notes = [
      makeNote({ id: 'n1', playerId: '3', rawNote: 'Limps every hand, calls 3bet light' }),
    ];
    const result = searchPlayers([p1, p2, p3], notes, 'limps');
    expect(result.map((m) => m.player.id)).toEqual(['3']);
    expect(result[0].noteMatchCount).toBe(1);
  });

  it('matches by structured AI fields', () => {
    const notes = [
      makeNote({ id: 'n1', playerId: '3', preflopTendency: 'tight from EP, opens wide BTN' }),
    ];
    const result = searchPlayers([p1, p2, p3], notes, 'btn');
    expect(result.map((m) => m.player.id)).toEqual(['3']);
  });

  it('all tokens must match (AND)', () => {
    const result = searchPlayers([p1, p2, p3], [], 'big mike');
    expect(result).toEqual([]);
  });

  it('ranks field-matches before note-only matches', () => {
    const notes = [makeNote({ id: 'n1', playerId: '1', rawNote: 'whale tendencies on river' })];
    const result = searchPlayers([p1, p3], notes, 'whale');
    // p3 (nickname Whale) should come before p1 (only matches via note text)
    expect(result.map((m) => m.player.id)).toEqual(['3', '1']);
  });

  it('counts multiple matching notes for the same player', () => {
    const notes = [
      makeNote({ id: 'n1', playerId: '3', rawNote: 'shoves wide' }),
      makeNote({ id: 'n2', playerId: '3', structuredSummary: 'shoves all-in on turn often' }),
      makeNote({ id: 'n3', playerId: '3', rawNote: 'folds to 3bets' }),
    ];
    const result = searchPlayers([p3], notes, 'shoves');
    expect(result).toHaveLength(1);
    expect(result[0].noteMatchCount).toBe(2);
  });

  it('is diacritic-insensitive', () => {
    const accented = makePlayer({ id: '4', nickname: 'Cañón', description: 'el más loco' });
    const result = searchPlayers([accented], [], 'canon mas');
    expect(result.map((m) => m.player.id)).toEqual(['4']);
  });
});
