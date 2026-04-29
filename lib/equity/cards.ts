export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'T' | 'J' | 'Q' | 'K' | 'A';
export type Suit = 'c' | 'd' | 'h' | 's';

export interface Card {
  rank: Rank;
  suit: Suit;
}

export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS: Suit[] = ['s', 'h', 'd', 'c'];

export function cardToString(card: Card): string {
  return `${card.rank}${card.suit}`;
}

export function parseCard(input: string): Card {
  if (input.length !== 2) throw new Error(`Invalid card: ${input}`);
  const rank = input[0].toUpperCase() as Rank;
  const suit = input[1].toLowerCase() as Suit;
  if (!RANKS.includes(rank)) throw new Error(`Invalid rank: ${input[0]}`);
  if (!SUITS.includes(suit)) throw new Error(`Invalid suit: ${input[1]}`);
  return { rank, suit };
}

export function fullDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit });
    }
  }
  return deck;
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}
