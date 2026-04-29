import { describe, expect, it } from 'vitest';
import { calculateEquity } from './calculate';
import { parseCard } from './cards';

const h = (a: string, b: string) => [parseCard(a), parseCard(b)];
const board = (...cards: string[]) => cards.map(parseCard);

describe('calculateEquity', () => {
  it('AA vs KK preflop ≈ 81/18 (Monte Carlo, ±2%)', () => {
    const result = calculateEquity([h('Ah', 'As'), h('Kh', 'Ks')], [], { iterations: 8000 });
    expect(result.exhaustive).toBe(false);
    expect(result.hands[0].equity).toBeGreaterThan(0.79);
    expect(result.hands[0].equity).toBeLessThan(0.84);
    expect(result.hands[1].equity).toBeGreaterThan(0.16);
    expect(result.hands[1].equity).toBeLessThan(0.21);
  });

  it('AKs vs QQ preflop is roughly a coin flip (±2%)', () => {
    const result = calculateEquity([h('Ah', 'Kh'), h('Qs', 'Qd')], [], { iterations: 8000 });
    // AKs vs QQ ≈ 46.2 / 53.8
    expect(result.hands[0].equity).toBeGreaterThan(0.43);
    expect(result.hands[0].equity).toBeLessThan(0.49);
    expect(result.hands[1].equity).toBeGreaterThan(0.51);
    expect(result.hands[1].equity).toBeLessThan(0.57);
  });

  it('exhaustively enumerates flop scenarios', () => {
    // AhKh vs 2c2d on As Ks 7d → flopped two pair AAKK vs underpair 22.
    // Hand 1 always has top two pair on the flop; only set/full house outs for 22.
    // 22 needs to hit a 2 (twice in remaining, 2 cards out) or runner-runner same card on turn+river.
    const result = calculateEquity(
      [h('Ah', 'Kh'), h('2c', '2d')],
      board('As', 'Ks', '7d'),
      { iterations: 1 } // ignored, exhaustive will trigger
    );
    expect(result.exhaustive).toBe(true);
    expect(result.iterations).toBe(990); // C(45,2)
    expect(result.hands[0].equity).toBeGreaterThan(0.89);
    expect(result.hands[1].equity).toBeLessThan(0.11);
    expect(result.hands[0].equity + result.hands[1].equity).toBeCloseTo(1, 5);
  });

  it('on the river, equity is deterministic', () => {
    // AhKh vs QcJc on As Ks Qs Jh 2d. Hand 1 has AAKK (top two pair).
    // Hand 2 has QQJJ (two pair, lower kickers). Hand 1 wins outright.
    const result = calculateEquity(
      [h('Ah', 'Kh'), h('Qc', 'Jc')],
      board('As', 'Ks', 'Qs', 'Jh', '2d')
    );
    expect(result.exhaustive).toBe(true);
    expect(result.iterations).toBe(1);
    expect(result.hands[0].equity).toBe(1);
    expect(result.hands[1].equity).toBe(0);
    expect(result.hands[0].winCount).toBe(1);
    expect(result.hands[1].winCount).toBe(0);
  });

  it('detects exact ties (chopped board)', () => {
    // Both players play the board: AsKsQsJsTs → royal flush on board.
    const result = calculateEquity(
      [h('2c', '3c'), h('2d', '3d')],
      board('As', 'Ks', 'Qs', 'Js', 'Ts')
    );
    expect(result.iterations).toBe(1);
    expect(result.hands[0].equity).toBe(0.5);
    expect(result.hands[1].equity).toBe(0.5);
    expect(result.hands[0].tieCount).toBe(1);
    expect(result.hands[1].tieCount).toBe(1);
  });

  it('multi-way: AA dominates 3 random hands but wins less than HU', () => {
    const result = calculateEquity(
      [h('As', 'Ah'), h('Kc', 'Qc'), h('Jd', 'Tc'), h('7h', '7s')],
      [],
      { iterations: 5000 }
    );
    // Sum of equities ≈ 1
    const total = result.hands.reduce((s, hand) => s + hand.equity, 0);
    expect(total).toBeCloseTo(1, 1);
    // AA still wins majority of pots but typically < 60% 4-way
    expect(result.hands[0].equity).toBeGreaterThan(0.45);
    expect(result.hands[0].equity).toBeLessThan(0.7);
  });

  it('rejects duplicate cards', () => {
    expect(() => calculateEquity([h('Ah', 'Kh'), h('Ah', 'Qh')], [])).toThrow(/Duplicate card/);
  });

  it('rejects malformed input', () => {
    expect(() => calculateEquity([h('Ah', 'Kh')], [])).toThrow(/two hands/);
    expect(() => calculateEquity([h('Ah', 'Kh'), h('Ah', 'Qh')], board('Qh'))).toThrow(/Board/);
  });
});
