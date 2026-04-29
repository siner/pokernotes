import { Hand } from 'pokersolver';
import { type Card, cardToString, fullDeck } from './cards';

export interface HandEquity {
  winCount: number;
  tieCount: number;
  equity: number;
}

export interface EquityResult {
  hands: HandEquity[];
  iterations: number;
  exhaustive: boolean;
}

export interface EquityOptions {
  iterations?: number;
}

const EXHAUSTIVE_THRESHOLD = 25_000;
const DEFAULT_MONTE_CARLO_ITERATIONS = 10_000;

export function calculateEquity(
  hands: Card[][],
  board: Card[],
  options: EquityOptions = {}
): EquityResult {
  if (hands.length < 2) throw new Error('At least two hands are required');
  for (const h of hands) {
    if (h.length !== 2) throw new Error('Each hand must have exactly 2 cards');
  }
  if (![0, 3, 4, 5].includes(board.length)) {
    throw new Error('Board must have 0, 3, 4 or 5 cards');
  }

  const seen = new Set<string>();
  for (const c of [...hands.flat(), ...board]) {
    const key = cardToString(c);
    if (seen.has(key)) throw new Error(`Duplicate card: ${key}`);
    seen.add(key);
  }

  const handStrings = hands.map((h) => h.map(cardToString));
  const boardStrings = board.map(cardToString);
  const remaining = fullDeck()
    .map(cardToString)
    .filter((c) => !seen.has(c));
  const cardsNeeded = 5 - boardStrings.length;

  const totalCombos = combinations(remaining.length, cardsNeeded);
  const requestedIterations = options.iterations ?? DEFAULT_MONTE_CARLO_ITERATIONS;
  const exhaustive = totalCombos <= Math.max(EXHAUSTIVE_THRESHOLD, requestedIterations);

  const winCount = new Array<number>(hands.length).fill(0);
  const tieCount = new Array<number>(hands.length).fill(0);
  const winShare = new Array<number>(hands.length).fill(0);

  const evalIteration = (extraBoard: string[]): void => {
    const finalBoard = boardStrings.concat(extraBoard);
    const solved = handStrings.map((h) => Hand.solve(h.concat(finalBoard)));
    const winners = Hand.winners(solved);
    const splitShare = 1 / winners.length;
    const winnerSet = new Set(winners);
    for (let i = 0; i < solved.length; i++) {
      if (winnerSet.has(solved[i])) {
        winShare[i] += splitShare;
        if (winners.length === 1) {
          winCount[i]++;
        } else {
          tieCount[i]++;
        }
      }
    }
  };

  let iterations = 0;
  if (exhaustive) {
    forEachCombination(remaining, cardsNeeded, (combo) => {
      evalIteration(combo);
      iterations++;
    });
  } else {
    for (let it = 0; it < requestedIterations; it++) {
      evalIteration(sampleWithoutReplacement(remaining, cardsNeeded));
      iterations++;
    }
  }

  return {
    hands: hands.map((_, i) => ({
      winCount: winCount[i],
      tieCount: tieCount[i],
      equity: iterations === 0 ? 0 : winShare[i] / iterations,
    })),
    iterations,
    exhaustive,
  };
}

function combinations(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  let c = 1;
  for (let i = 0; i < k; i++) {
    c = (c * (n - i)) / (i + 1);
  }
  return Math.round(c);
}

function forEachCombination<T>(arr: T[], k: number, fn: (combo: T[]) => void): void {
  if (k === 0) {
    fn([]);
    return;
  }
  if (k > arr.length) return;
  const indices = Array.from({ length: k }, (_, i) => i);
  while (true) {
    fn(indices.map((i) => arr[i]));
    let i = k - 1;
    while (i >= 0 && indices[i] === arr.length - (k - i)) i--;
    if (i < 0) break;
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

function sampleWithoutReplacement<T>(arr: T[], k: number): T[] {
  const a = arr.slice();
  const limit = Math.min(k, a.length);
  for (let i = 0; i < limit; i++) {
    const j = i + Math.floor(Math.random() * (a.length - i));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, limit);
}
