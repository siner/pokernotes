/**
 * A basic Push/Fold evaluation mock logic for our MVP.
 * In a real-world scenario, this would import or query a large JSON structure
 * mapping every Hand to a specific Minimum Big Blind Push amount or EV value.
 */

export const POSITIONS = ['SB', 'BTN', 'CO', 'HJ', 'UTG'] as const;
export type Position = (typeof POSITIONS)[number];

// Standard poker hand matrix order (Aces to Twos)
export const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

/**
 * Very basic mock rule engine representing Push thresholds:
 * Returns the maximum Big Blinds with which it's profitable to push.
 * If 0, it means it's almost always a fold.
 */
export function getPushMinBB(hand: string, position: Position): number {
  const isPair = hand[0] === hand[1];
  const isSuited = hand.endsWith('s');

  // Pair logic
  if (isPair) {
    if (['A', 'K', 'Q', 'J', 'T'].includes(hand[0])) return 20; // Premium pairs are a push up to 20bb
    if (['9', '8', '7'].includes(hand[0])) return 15;
    return position === 'SB' || position === 'BTN' ? 12 : 5;
  }

  // High card logic
  const hasAce = hand.includes('A');
  const hasKing = hand.includes('K');

  if (hasAce) {
    if (isSuited) return 20; // Any Ax suited is good for high BB pushes
    return position === 'SB' || position === 'BTN' ? 15 : 8; // Ax offsuit
  }

  if (hasKing && isSuited) return position === 'SB' || position === 'BTN' ? 15 : 10;

  // Connectors logic
  const r1 = RANKS.indexOf(hand[0]);
  const r2 = RANKS.indexOf(hand[1] || hand[2]); // handle 's' or 'o' properly if it was not sliced
  const gap = Math.abs(r1 - r2);

  if (isSuited && gap === 1 && r1 < 7) {
    // Suited connectors JTs, T9s, etc.
    return position === 'SB' || position === 'BTN' ? 12 : 6;
  }

  // Trash
  if (position === 'SB') return 5; // SB pushes wide on 5bb or less
  return 0; // Fold everything else otherwise in this mockup
}

/**
 * Returns whether a hand should be PUSHED given a stack amount and position.
 */
export function shouldPush(hand: string, bb: number, position: Position): boolean {
  const maxBB = getPushMinBB(hand, position);
  return maxBB >= bb && maxBB !== 0;
}
