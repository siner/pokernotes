import { type Card, SUIT_SYMBOL, parseCards } from '@/lib/hands/parseCards';

type Size = 'xs' | 'sm' | 'md' | 'lg';

const SIZE: Record<Size, { box: string; rank: string; suit: string; gap: string }> = {
  xs: { box: 'h-7 w-5', rank: 'text-[10px]', suit: 'text-[10px]', gap: 'gap-0' },
  sm: { box: 'h-10 w-7', rank: 'text-sm', suit: 'text-sm', gap: 'gap-0' },
  md: { box: 'h-14 w-10', rank: 'text-lg', suit: 'text-xl', gap: 'gap-0.5' },
  lg: { box: 'h-20 w-14', rank: 'text-2xl', suit: 'text-3xl', gap: 'gap-1' },
};

interface PlayingCardProps {
  card: Card;
  size?: Size;
}

export function PlayingCard({ card, size = 'md' }: PlayingCardProps) {
  const red = card.suit === 'h' || card.suit === 'd';
  const s = SIZE[size];
  return (
    <div
      className={`${s.box} ${s.gap} relative flex flex-col items-center justify-center rounded-md border border-slate-300 bg-white font-bold leading-none shadow-[0_2px_8px_rgba(0,0,0,0.4)] ${
        red ? 'text-red-600' : 'text-slate-900'
      }`}
      aria-label={`${card.rank}${SUIT_SYMBOL[card.suit]}`}
    >
      <span className={`${s.rank} font-mono`}>{card.rank}</span>
      <span className={s.suit}>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  );
}

export function CardRow({ cards, size = 'md' }: { cards: Card[]; size?: Size }) {
  if (cards.length === 0) return null;
  return (
    <div className={`flex ${size === 'lg' ? 'gap-2' : 'gap-1.5'}`}>
      {cards.map((c, i) => (
        <PlayingCard key={`${c.rank}${c.suit}-${i}`} card={c} size={size} />
      ))}
    </div>
  );
}

function GhostSlot({ size = 'md' }: { size?: Size }) {
  const s = SIZE[size];
  return (
    <div
      className={`${s.box} flex items-center justify-center rounded-md border border-dashed border-slate-700/70 bg-slate-900/40`}
      aria-hidden="true"
    />
  );
}

interface BoardProps {
  /** Raw board string from AI structuring (e.g. "Qh7s2c"). */
  board?: string;
  size?: Size;
  /** Show "Flop / Turn / River" labels above the cards. */
  showLabels?: boolean;
  /** Render ghost slots up to 5 cards even when fewer cards are dealt. */
  fillSlots?: boolean;
  /** Optional translations for street labels. */
  labels?: { flop: string; turn: string; river: string };
}

/**
 * Visual representation of the community board.
 * - 0 cards → renders nothing (caller decides).
 * - 1–2 cards → renders raw cards (rare; AI rarely gives partial flops).
 * - 3 cards → flop only.
 * - 4 cards → flop + turn.
 * - 5 cards → flop + turn + river.
 * - When `fillSlots`, missing streets show as dashed ghost slots.
 */
export function Board({
  board,
  size = 'md',
  showLabels = false,
  fillSlots = false,
  labels,
}: BoardProps) {
  const cards = parseCards(board);
  if (cards.length === 0 && !fillSlots) return null;

  const flop = cards.slice(0, 3);
  const turn = cards[3];
  const river = cards[4];

  const flopSlots = fillSlots ? [flop[0], flop[1], flop[2]] : flop;
  const groups: Array<{
    key: 'flop' | 'turn' | 'river';
    cards: (Card | undefined)[];
  }> = [
    { key: 'flop', cards: flopSlots },
    ...(fillSlots || turn ? [{ key: 'turn' as const, cards: [turn] }] : []),
    ...(fillSlots || river ? [{ key: 'river' as const, cards: [river] }] : []),
  ];

  return (
    <div className="flex items-end justify-center gap-3 sm:gap-4">
      {groups.map((g) => (
        <div key={g.key} className="flex flex-col items-center gap-1.5">
          {showLabels && labels && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {labels[g.key]}
            </span>
          )}
          <div className={`flex ${size === 'lg' ? 'gap-2' : 'gap-1.5'}`}>
            {g.cards.map((c, i) =>
              c ? (
                <PlayingCard key={`${c.rank}${c.suit}-${i}`} card={c} size={size} />
              ) : (
                <GhostSlot key={`ghost-${g.key}-${i}`} size={size} />
              )
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Smart hand display: tries to parse the string as cards. If it looks like
 * a valid 1–2 card hand, renders cards. Otherwise falls back to text
 * (handles range-style strings like "AKo" or partial info).
 */
export function HandCards({ hand, size = 'md' }: { hand: string | undefined; size?: Size }) {
  const cards = parseCards(hand);
  if (cards.length >= 1 && cards.length <= 2) {
    return <CardRow cards={cards} size={size} />;
  }
  if (!hand) return null;
  return (
    <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono text-sm text-slate-200">
      {hand}
    </span>
  );
}
