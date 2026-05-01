import { describe, it, expect } from 'vitest';
import { parseCards } from './parseCards';

describe('parseCards', () => {
  it('parses concatenated 2-char form', () => {
    expect(parseCards('AhKd')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
    ]);
  });

  it('parses space-separated cards', () => {
    expect(parseCards('Ah Kd')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
    ]);
  });

  it('parses a 5-card board', () => {
    expect(parseCards('Qh7s2c4dKs')).toEqual([
      { rank: 'Q', suit: 'h' },
      { rank: '7', suit: 's' },
      { rank: '2', suit: 'c' },
      { rank: '4', suit: 'd' },
      { rank: 'K', suit: 's' },
    ]);
  });

  it('normalises 10 to T', () => {
    expect(parseCards('10h Jd')).toEqual([
      { rank: 'T', suit: 'h' },
      { rank: 'J', suit: 'd' },
    ]);
  });

  it('accepts uppercase suits', () => {
    expect(parseCards('AH KD')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
    ]);
  });

  it('accepts suit symbols', () => {
    expect(parseCards('A♥ K♦')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
    ]);
  });

  it('strips punctuation', () => {
    expect(parseCards('Ah, Kd | 7s')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
      { rank: '7', suit: 's' },
    ]);
  });

  it('skips invalid tokens', () => {
    expect(parseCards('AhXX Kd')).toEqual([
      { rank: 'A', suit: 'h' },
      { rank: 'K', suit: 'd' },
    ]);
  });

  it('returns empty array for empty or invalid input', () => {
    expect(parseCards('')).toEqual([]);
    expect(parseCards(undefined)).toEqual([]);
    expect(parseCards(null)).toEqual([]);
    expect(parseCards('hello world')).toEqual([]);
  });
});
