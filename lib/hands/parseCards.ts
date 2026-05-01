/**
 * Parse a free-form card string into structured cards.
 *
 * Accepts forms commonly produced by the AI structurer:
 *   "AhKd"          → [Ah, Kd]
 *   "Ah Kd"         → [Ah, Kd]
 *   "Ah, Kd"        → [Ah, Kd]
 *   "Qh7s2c4d"      → [Qh, 7s, 2c, 4d]
 *   "10h Jd"        → [Th, Jd]   (10 normalised to T)
 *   "A♥ K♦"         → [Ah, Kd]   (suit symbols accepted)
 *
 * Returns an empty array if nothing parses cleanly. Never throws — invalid
 * input degrades to "no cards" rather than failing the render.
 */

export type Suit = 's' | 'h' | 'd' | 'c';
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  rank: Rank;
  suit: Suit;
}

const RANKS: ReadonlySet<string> = new Set([
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  'T',
  'J',
  'Q',
  'K',
  'A',
]);

const SUIT_MAP: Record<string, Suit> = {
  s: 's',
  h: 'h',
  d: 'd',
  c: 'c',
  S: 's',
  H: 'h',
  D: 'd',
  C: 'c',
  '♠': 's',
  '♥': 'h',
  '♦': 'd',
  '♣': 'c',
};

export function parseCards(input: string | undefined | null): Card[] {
  if (!input) return [];
  // Normalise: collapse whitespace/punctuation, replace "10" with "T".
  const cleaned = input.replace(/10/g, 'T').replace(/[\s,;|/]+/g, '');
  const cards: Card[] = [];

  let i = 0;
  while (i < cleaned.length) {
    const rankChar = cleaned[i];
    const rank = rankChar.toUpperCase();
    if (!RANKS.has(rank)) {
      i += 1;
      continue;
    }
    const suitChar = cleaned[i + 1];
    const suit = suitChar ? SUIT_MAP[suitChar] : undefined;
    if (!suit) {
      i += 1;
      continue;
    }
    cards.push({ rank: rank as Rank, suit });
    i += 2;
  }

  return cards;
}

export const SUIT_SYMBOL: Record<Suit, string> = {
  s: '♠',
  h: '♥',
  d: '♦',
  c: '♣',
};
