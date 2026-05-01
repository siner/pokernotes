'use client';

import { useMemo } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type Card, RANKS, SUITS, cardToString, fullDeck } from '@/lib/equity/cards';

const SUIT_LABEL: Record<Card['suit'], string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

interface CardPickerSheetProps {
  title: string;
  /** Cards already used elsewhere — disabled in the picker. */
  usedCards: Set<string>;
  onPick: (card: Card) => void;
  onClose: () => void;
}

export function CardPickerSheet({ title, usedCards, onPick, onClose }: CardPickerSheetProps) {
  const tCommon = useTranslations('common');
  const deck = useMemo(() => fullDeck(), []);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-slate-800 bg-slate-950 p-4 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon('close')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {SUITS.map((suit) => {
            const red = suit === 'h' || suit === 'd';
            return (
              <div
                key={suit}
                className="grid gap-1"
                style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}
              >
                {RANKS.map((rank) => {
                  const card = deck.find((c) => c.rank === rank && c.suit === suit)!;
                  const used = usedCards.has(cardToString(card));
                  return (
                    <button
                      key={`${rank}${suit}`}
                      type="button"
                      disabled={used}
                      onClick={() => onPick(card)}
                      className={`flex aspect-[3/4] items-center justify-center rounded-md border text-sm font-bold transition-all ${
                        used
                          ? 'cursor-not-allowed border-slate-800 bg-slate-900/40 text-slate-700 opacity-40'
                          : red
                            ? 'border-slate-300 bg-white text-red-600 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/40 active:scale-95'
                            : 'border-slate-300 bg-white text-slate-900 hover:border-emerald-500 hover:ring-2 hover:ring-emerald-500/40 active:scale-95'
                      }`}
                      aria-label={`${rank}${SUIT_LABEL[suit]}`}
                    >
                      <span className="flex flex-col items-center leading-none">
                        <span className="font-mono text-[11px]">{rank}</span>
                        <span className="text-[11px]">{SUIT_LABEL[suit]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface CardSlotProps {
  card: Card | null;
  selected?: boolean;
  size?: 'sm' | 'md';
  onClick: () => void;
  onClear: () => void;
  ariaLabel?: string;
}

export function CardSlot({
  card,
  selected = false,
  size = 'md',
  onClick,
  onClear,
  ariaLabel,
}: CardSlotProps) {
  const sizing = size === 'sm' ? 'h-12 w-9 text-base' : 'h-14 w-10 text-lg';
  if (!card) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        className={`${sizing} flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          selected
            ? 'border-emerald-500/70 bg-emerald-500/5 text-emerald-400'
            : 'border-slate-700 bg-slate-900/40 text-slate-600 hover:border-slate-600 hover:text-slate-400'
        }`}
      >
        <span className="font-mono text-xs">+</span>
      </button>
    );
  }
  const red = card.suit === 'h' || card.suit === 'd';
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={ariaLabel ?? `${card.rank}${SUIT_LABEL[card.suit]}`}
      className={`${sizing} relative flex shrink-0 flex-col items-center justify-center rounded-lg border-2 bg-white font-bold leading-none shadow-sm transition-all ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-300'
      } ${red ? 'text-red-600' : 'text-slate-900'}`}
    >
      <span className="font-mono">{card.rank}</span>
      <span className={size === 'sm' ? 'text-sm' : 'text-base'}>{SUIT_LABEL[card.suit]}</span>
    </button>
  );
}
