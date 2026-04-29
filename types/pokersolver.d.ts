declare module 'pokersolver' {
  export class Hand {
    name: string;
    descr: string;
    rank: number;
    cards: unknown[];
    cardPool: unknown[];
    static solve(cards: string[], game?: string, canDisqualify?: boolean): Hand;
    static winners(hands: Hand[]): Hand[];
  }
}
