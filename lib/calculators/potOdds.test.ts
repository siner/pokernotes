import { describe, it, expect } from 'vitest';
import { calculatePotOdds, potOddsPercent } from './potOdds';

describe('calculatePotOdds', () => {
  it('returns 0 when betToCall is 0', () => {
    expect(calculatePotOdds(100, 0)).toBe(0);
  });

  it('calculates correct pot odds fraction', () => {
    // Pot: 100, Bet: 50 → need 50/150 = 0.333...
    expect(calculatePotOdds(100, 50)).toBeCloseTo(1 / 3, 5);
  });

  it('calculates pot odds when facing large overbet', () => {
    // Pot: 100, Bet: 200 → need 200/300 = 0.666...
    expect(calculatePotOdds(100, 200)).toBeCloseTo(2 / 3, 5);
  });
});

describe('potOddsPercent', () => {
  it('returns 33.3% for a half-pot bet', () => {
    // Pot: 100, Bet: 50 → 33.3%
    expect(potOddsPercent(100, 50)).toBe(33.3);
  });

  it('returns 50% when bet equals pot', () => {
    expect(potOddsPercent(100, 100)).toBe(50);
  });

  it('returns 0 for zero bet', () => {
    expect(potOddsPercent(100, 0)).toBe(0);
  });
});
