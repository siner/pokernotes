import { describe, it, expect } from 'vitest';
import { HandPayloadSchema, SyncImportSchema } from './schemas';

describe('HandPayloadSchema', () => {
  const baseHand = {
    id: 'hand-1',
    rawDescription: 'Hero opens AKs from CO, BB calls. Flop AK7, c-bet, fold.',
    structuredData: {
      title: 'AKs c-bet on AK7',
      summary: 'Hero c-bets and gets the fold.',
    },
    aiProcessed: true,
    createdAt: '2026-04-30T10:00:00.000Z',
    updatedAt: '2026-04-30T10:00:00.000Z',
  };

  it('accepts a minimal valid payload', () => {
    const parsed = HandPayloadSchema.parse(baseHand);
    expect(parsed.id).toBe('hand-1');
    expect(parsed.aiProcessed).toBe(true);
    expect(parsed.playerId).toBeUndefined();
    expect(parsed.sessionId).toBeUndefined();
    expect(parsed.createdAt).toBeInstanceOf(Date);
  });

  it('accepts optional player and session bindings', () => {
    const parsed = HandPayloadSchema.parse({
      ...baseHand,
      playerId: 'player-1',
      sessionId: 'session-1',
    });
    expect(parsed.playerId).toBe('player-1');
    expect(parsed.sessionId).toBe('session-1');
  });

  it('coerces null player/session to undefined (D1 round-trip)', () => {
    const parsed = HandPayloadSchema.parse({
      ...baseHand,
      playerId: null,
      sessionId: null,
    });
    expect(parsed.playerId).toBeUndefined();
    expect(parsed.sessionId).toBeUndefined();
  });

  it('keeps structuredData as a flexible record (no AI schema lock-in)', () => {
    const evolvedShape = {
      ...baseHand,
      structuredData: {
        title: 'New shape',
        summary: 'Has some new field we added later',
        someFutureField: 42,
        nestedThing: { deeper: 'value' },
      },
    };
    const parsed = HandPayloadSchema.parse(evolvedShape);
    expect(parsed.structuredData.someFutureField).toBe(42);
  });

  it('rejects empty rawDescription', () => {
    expect(() => HandPayloadSchema.parse({ ...baseHand, rawDescription: '' })).toThrow();
  });

  it('rejects rawDescription over 8000 chars', () => {
    expect(() =>
      HandPayloadSchema.parse({ ...baseHand, rawDescription: 'a'.repeat(8001) })
    ).toThrow();
  });

  it('defaults aiProcessed to false when missing', () => {
    const { aiProcessed: _omit, ...without } = baseHand;
    void _omit;
    const parsed = HandPayloadSchema.parse(without);
    expect(parsed.aiProcessed).toBe(false);
  });
});

describe('SyncImportSchema', () => {
  it('accepts a payload with hands alongside the other entities', () => {
    const parsed = SyncImportSchema.parse({
      players: [],
      notes: [],
      sessions: [],
      hands: [
        {
          id: 'h1',
          rawDescription: 'AA vs KK preflop, hero won.',
          structuredData: { title: 't', summary: 's' },
          aiProcessed: true,
          createdAt: '2026-04-30T10:00:00.000Z',
          updatedAt: '2026-04-30T10:00:00.000Z',
        },
      ],
    });
    expect(parsed.hands).toHaveLength(1);
    expect(parsed.hands[0].id).toBe('h1');
  });

  it('defaults hands to empty array if omitted (backward compat)', () => {
    const parsed = SyncImportSchema.parse({
      players: [],
      notes: [],
      sessions: [],
    });
    expect(parsed.hands).toEqual([]);
  });
});
