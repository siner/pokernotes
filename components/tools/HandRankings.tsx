'use client';

const RANKINGS = [
  {
    name: 'Royal Flush',
    desc: 'A, K, Q, J, 10, all of the same suit. The best possible hand.',
    example: ['A♠', 'K♠', 'Q♠', 'J♠', 'T♠'],
    color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  },
  {
    name: 'Straight Flush',
    desc: 'Five consecutive cards of the same suit.',
    example: ['9♥', '8♥', '7♥', '6♥', '5♥'],
    color: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  },
  {
    name: 'Four of a Kind',
    desc: 'Four cards of the same rank.',
    example: ['Q♠', 'Q♥', 'Q♦', 'Q♣', '4♠'],
    color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  },
  {
    name: 'Full House',
    desc: 'Three of a kind + a pair.',
    example: ['J♠', 'J♥', 'J♦', '8♣', '8♠'],
    color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  },
  {
    name: 'Flush',
    desc: 'Five cards of the same suit, not in sequence.',
    example: ['K♣', 'J♣', '8♣', '4♣', '3♣'],
    color: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  },
  {
    name: 'Straight',
    desc: 'Five consecutive cards of mixed suits.',
    example: ['T♠', '9♥', '8♦', '7♣', '6♠'],
    color: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
  },
  {
    name: 'Three of a Kind',
    desc: 'Three cards of the same rank.',
    example: ['7♠', '7♥', '7♦', 'A♣', '2♠'],
    color: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  },
  {
    name: 'Two Pair',
    desc: 'Two different pairs.',
    example: ['K♠', 'K♥', '9♦', '9♣', '5♠'],
    color: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
  },
  {
    name: 'One Pair',
    desc: 'Two cards of the same rank.',
    example: ['A♠', 'A♥', 'J♦', '8♣', '4♠'],
    color: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  },
  {
    name: 'High Card',
    desc: 'No matching cards, high card plays.',
    example: ['A♠', 'Q♥', '9♦', '6♣', '3♠'],
    color: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  },
];

export function HandRankings() {
  return (
    <div className="space-y-4">
      {RANKINGS.map((rank, i) => (
        <div
          key={rank.name}
          className="flex flex-col gap-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-4 transition-colors hover:bg-slate-800/80 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-4">
            <div
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border ${rank.color}`}
            >
              <span className="font-bold">{i + 1}</span>
            </div>
            <div>
              <h3 className="font-semibold text-slate-200">{rank.name}</h3>
              <p className="text-sm text-slate-400">{rank.desc}</p>
            </div>
          </div>

          <div className="flex gap-1">
            {rank.example.map((card, idx) => {
              const isRed = card.includes('♥') || card.includes('♦');
              return (
                <div
                  key={`${rank.name}-${idx}`}
                  className={`flex h-10 w-8 items-center justify-center rounded border border-slate-700 bg-slate-800 text-sm font-medium shadow-sm ${isRed ? 'text-rose-400' : 'text-slate-200'}`}
                >
                  {card}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
