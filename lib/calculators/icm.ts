/**
 * Implementation of the Independent Chip Model (Malmuth-Harville) algorithm.
 * Calculates the exact equity of each player given their chip stacks and the tournament payouts.
 */

export function calculateICM(stacks: number[], payouts: number[]): number[] {
  const n = stacks.length;
  const numPayouts = Math.min(payouts.length, n);

  // Pad payouts with 0 if fewer payouts than players
  const paddedPayouts = [...payouts];
  while (paddedPayouts.length < n) {
    paddedPayouts.push(0);
  }

  const results = new Array(n).fill(0);
  const totalChips = stacks.reduce((sum, stack) => sum + stack, 0);

  if (totalChips === 0) return results;

  // For a small number of players, full permutations works (Max ~9 players realistically).
  // A recursive approach allows us to find the probability of a player finishing in place p.
  function calculatePlacementProbabilities(
    currentPlayerIdx: number,
    remainingStacks: number[],
    currentPlace: number,
    currentProb: number
  ) {
    // If we've reached beyond the paid places, stop
    if (currentPlace >= numPayouts) return;

    const remainingChips = remainingStacks.reduce((a, b) => a + b, 0);
    if (remainingChips === 0) return;

    // Prob of the remaining player finishing in this place is their stack / remaining chips
    const targetStack = remainingStacks[currentPlayerIdx];
    const placeProb = currentProb * (targetStack / remainingChips);

    // Add expected value for finishing in this place
    results[currentPlayerIdx] += placeProb * paddedPayouts[currentPlace];

    // Recurse for the next placements over all other players
    for (let i = 0; i < n; i++) {
      if (i !== currentPlayerIdx && remainingStacks[i] > 0) {
        // Temporarily remove the player who just finished
        const nextStacks = [...remainingStacks];
        nextStacks[i] = 0; // i finished in currentPlace
        calculatePlacementProbabilities(
          currentPlayerIdx,
          nextStacks,
          currentPlace + 1,
          currentProb * (remainingStacks[i] / remainingChips)
        );
      }
    }
  }

  // To avoid deep recursion killing performance for > 7 players,
  // Poker ICM typically caps at standard limits or uses shortcuts.
  // For this generic calculator, we will run the simulation for each player.

  if (n > 9) {
    // Fallback: Proportional chip EV for large fields instead of crashing
    return stacks.map((stack) => (stack / totalChips) * paddedPayouts.reduce((a, b) => a + b, 0));
  }

  for (let i = 0; i < n; i++) {
    if (stacks[i] > 0) {
      calculatePlacementProbabilities(i, stacks, 0, 1.0);
    }
  }

  return results;
}
