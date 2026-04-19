/**
 * Break-Even & MDF (Minimum Defense Frequency) Calculator
 *
 * Break-even% (attacker): how often a bet must work as a bluff to be profitable
 *   = bet / (pot + bet)
 *
 * MDF (defender): how often you must continue to prevent profitable bluffs
 *   = pot / (pot + bet)  →  always = 1 - breakEven%
 */

export interface BreakEvenResult {
  breakEvenPct: number; // 0–100: bluff needs to work this % to break even
  mdfPct: number; // 0–100: defender must continue this % of range
  potAfterBet: number; // pot size if called
  betToPotRatio: number; // bet as fraction of pot (0–∞)
}

export function calculateBreakEven(potSize: number, betSize: number): BreakEvenResult {
  if (potSize <= 0 || betSize <= 0) {
    return { breakEvenPct: 0, mdfPct: 0, potAfterBet: potSize, betToPotRatio: 0 };
  }

  const breakEven = betSize / (potSize + betSize);
  return {
    breakEvenPct: Math.round(breakEven * 1000) / 10,
    mdfPct: Math.round((1 - breakEven) * 1000) / 10,
    potAfterBet: potSize + betSize * 2,
    betToPotRatio: Math.round((betSize / potSize) * 100) / 100,
  };
}

/** Common bet sizes as fractions of pot */
export const PRESET_BET_SIZES = [
  { label: '25%', fraction: 0.25 },
  { label: '33%', fraction: 0.333 },
  { label: '50%', fraction: 0.5 },
  { label: '66%', fraction: 0.667 },
  { label: '75%', fraction: 0.75 },
  { label: 'Pot', fraction: 1.0 },
  { label: '1.5x', fraction: 1.5 },
  { label: '2x', fraction: 2.0 },
] as const;
