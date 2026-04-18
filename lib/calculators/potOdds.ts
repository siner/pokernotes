/**
 * Pot Odds Calculator
 *
 * Calculates the equity needed to call profitably given the pot size and bet.
 *
 * Formula: equityNeeded = betToCall / (potSize + betToCall)
 */
export function calculatePotOdds(potSize: number, betToCall: number): number {
  if (betToCall <= 0) return 0;
  return betToCall / (potSize + betToCall);
}

/**
 * Returns the equity needed as a percentage (0–100), rounded to 1 decimal.
 */
export function potOddsPercent(potSize: number, betToCall: number): number {
  return Math.round(calculatePotOdds(potSize, betToCall) * 1000) / 10;
}
