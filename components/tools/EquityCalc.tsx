'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, RotateCcw, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type Card, RANKS, SUITS, cardToString, fullDeck } from '@/lib/equity/cards';
import { calculateEquity, type EquityResult } from '@/lib/equity/calculate';

type HandSlots = [Card | null, Card | null];
type BoardSlots = (Card | null)[];

type Selection =
  | { kind: 'hand'; handIdx: number; cardIdx: 0 | 1 }
  | { kind: 'board'; cardIdx: number };

const MAX_HANDS = 9;
const MIN_HANDS = 2;

const SUIT_LABEL: Record<Card['suit'], string> = { s: '♠', h: '♥', d: '♦', c: '♣' };

export function EquityCalc() {
  const t = useTranslations('tools.equity');
  const [hands, setHands] = useState<HandSlots[]>(() => [
    [null, null],
    [null, null],
  ]);
  const [board, setBoard] = useState<BoardSlots>(() => [null, null, null, null, null]);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [result, setResult] = useState<EquityResult | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const calcId = useRef(0);

  // ─── Used cards index ────────────────────────────────────────────────
  const usedSet = useMemo(() => {
    const s = new Set<string>();
    for (const hand of hands) {
      for (const c of hand) if (c) s.add(cardToString(c));
    }
    for (const c of board) if (c) s.add(cardToString(c));
    return s;
  }, [hands, board]);

  // ─── Auto-calc when state allows ────────────────────────────────────
  const completeHands = useMemo(
    () => hands.filter((h): h is [Card, Card] => h[0] !== null && h[1] !== null),
    [hands]
  );
  const boardCount = board.filter((c) => c !== null).length;
  const validBoardCount =
    boardCount === 0 || boardCount === 3 || boardCount === 4 || boardCount === 5;
  const canCalculate = completeHands.length >= 2 && validBoardCount;

  useEffect(() => {
    if (!canCalculate) {
      setResult(null);
      setError(null);
      return;
    }
    const id = ++calcId.current;
    setCalculating(true);
    setError(null);
    const completeBoard = board.filter((c): c is Card => c !== null);
    // Defer to next tick so UI updates before the heavy work
    const timer = window.setTimeout(() => {
      try {
        const r = calculateEquity(completeHands, completeBoard, { iterations: 8000 });
        if (id === calcId.current) {
          setResult(r);
          setCalculating(false);
        }
      } catch (e) {
        if (id === calcId.current) {
          setError(e instanceof Error ? e.message : 'Calculation error');
          setResult(null);
          setCalculating(false);
        }
      }
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hands, board, canCalculate, completeHands]);

  // ─── Handlers ────────────────────────────────────────────────────────
  function pickCard(card: Card) {
    if (!selection) return;
    if (selection.kind === 'hand') {
      setHands((prev) => {
        const next = prev.map((h) => [...h] as HandSlots);
        next[selection.handIdx][selection.cardIdx] = card;
        return next;
      });
      const nextSel = advanceFromHand(selection.handIdx, selection.cardIdx, hands, board);
      setSelection(nextSel);
    } else {
      setBoard((prev) => {
        const next = [...prev];
        next[selection.cardIdx] = card;
        return next;
      });
      const nextSel = advanceFromBoard(selection.cardIdx, board);
      setSelection(nextSel);
    }
  }

  function clearSlot(sel: Selection) {
    if (sel.kind === 'hand') {
      setHands((prev) => {
        const next = prev.map((h) => [...h] as HandSlots);
        next[sel.handIdx][sel.cardIdx] = null;
        return next;
      });
    } else {
      setBoard((prev) => {
        const next = [...prev];
        next[sel.cardIdx] = null;
        return next;
      });
    }
  }

  function addHand() {
    if (hands.length >= MAX_HANDS) return;
    setHands((prev) => [...prev, [null, null]]);
  }

  function removeHand(idx: number) {
    if (hands.length <= MIN_HANDS) return;
    setHands((prev) => prev.filter((_, i) => i !== idx));
  }

  function reset() {
    setHands([
      [null, null],
      [null, null],
    ]);
    setBoard([null, null, null, null, null]);
    setSelection(null);
    setResult(null);
    setError(null);
  }

  // ─── Render ──────────────────────────────────────────────────────────
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-xl sm:p-6"
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.04) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }}
    >
      {/* Hands */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            {t('handsTitle')}
          </h2>
          <button
            type="button"
            onClick={reset}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <RotateCcw size={12} />
            {t('reset')}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {hands.map((hand, idx) => {
            const equity = result?.hands[idx];
            return (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-3"
              >
                <span className="w-14 shrink-0 font-mono text-[11px] text-slate-500">
                  {t('handLabel', { n: idx + 1 })}
                </span>
                <div className="flex flex-1 items-center gap-2">
                  <CardSlot
                    card={hand[0]}
                    selected={
                      selection?.kind === 'hand' &&
                      selection.handIdx === idx &&
                      selection.cardIdx === 0
                    }
                    onClick={() => setSelection({ kind: 'hand', handIdx: idx, cardIdx: 0 })}
                    onClear={() => clearSlot({ kind: 'hand', handIdx: idx, cardIdx: 0 })}
                  />
                  <CardSlot
                    card={hand[1]}
                    selected={
                      selection?.kind === 'hand' &&
                      selection.handIdx === idx &&
                      selection.cardIdx === 1
                    }
                    onClick={() => setSelection({ kind: 'hand', handIdx: idx, cardIdx: 1 })}
                    onClear={() => clearSlot({ kind: 'hand', handIdx: idx, cardIdx: 1 })}
                  />
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {equity && (
                    <span className="font-mono text-sm font-bold tabular-nums text-emerald-400">
                      {(equity.equity * 100).toFixed(1)}%
                    </span>
                  )}
                  {hands.length > MIN_HANDS && (
                    <button
                      type="button"
                      onClick={() => removeHand(idx)}
                      aria-label={t('removeHand', { n: idx + 1 })}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {hands.length < MAX_HANDS && (
          <button
            type="button"
            onClick={addHand}
            className="mt-2 flex w-full min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-800 text-sm text-slate-500 transition-colors hover:border-slate-700 hover:text-slate-300"
          >
            <Plus size={14} />
            {t('addHand')}
          </button>
        )}
      </section>

      {/* Board */}
      <section className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('boardTitle')}
        </h2>
        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/40 p-3">
          <BoardGroup label={t('flop')}>
            {[0, 1, 2].map((i) => (
              <CardSlot
                key={i}
                card={board[i]}
                size="sm"
                selected={selection?.kind === 'board' && selection.cardIdx === i}
                onClick={() => setSelection({ kind: 'board', cardIdx: i })}
                onClear={() => clearSlot({ kind: 'board', cardIdx: i })}
              />
            ))}
          </BoardGroup>
          <BoardGroup label={t('turn')}>
            <CardSlot
              card={board[3]}
              size="sm"
              selected={selection?.kind === 'board' && selection.cardIdx === 3}
              onClick={() => setSelection({ kind: 'board', cardIdx: 3 })}
              onClear={() => clearSlot({ kind: 'board', cardIdx: 3 })}
            />
          </BoardGroup>
          <BoardGroup label={t('river')}>
            <CardSlot
              card={board[4]}
              size="sm"
              selected={selection?.kind === 'board' && selection.cardIdx === 4}
              onClick={() => setSelection({ kind: 'board', cardIdx: 4 })}
              onClear={() => clearSlot({ kind: 'board', cardIdx: 4 })}
            />
          </BoardGroup>
        </div>
        {boardCount > 0 && !validBoardCount && (
          <p className="mt-2 text-xs text-yellow-400">{t('invalidBoard')}</p>
        )}
      </section>

      {/* Result */}
      <ResultPanel
        canCalculate={canCalculate}
        calculating={calculating}
        result={result}
        error={error}
        hands={hands}
      />

      {/* Picker */}
      {selection && (
        <CardPicker
          usedSet={usedSet}
          onPick={pickCard}
          onClose={() => setSelection(null)}
          title={
            selection.kind === 'hand'
              ? t('pickerHandTitle', {
                  n: selection.handIdx + 1,
                  card: selection.cardIdx + 1,
                })
              : t('pickerBoardTitle', {
                  card: boardSlotLabel(selection.cardIdx, t),
                })
          }
        />
      )}
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────

interface CardSlotProps {
  card: Card | null;
  selected?: boolean;
  size?: 'md' | 'sm';
  onClick: () => void;
  onClear: () => void;
}

function CardSlot({ card, selected = false, size = 'md', onClick, onClear }: CardSlotProps) {
  const sizing = size === 'sm' ? 'h-12 w-9 text-base' : 'h-16 w-12 text-xl';
  if (!card) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${sizing} flex shrink-0 items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          selected
            ? 'border-emerald-500/70 bg-emerald-500/5 text-emerald-400'
            : 'border-slate-700 bg-slate-900/40 text-slate-600 hover:border-slate-600 hover:text-slate-400'
        }`}
        aria-label="Pick card"
      >
        <Plus size={size === 'sm' ? 14 : 18} />
      </button>
    );
  }
  const red = card.suit === 'h' || card.suit === 'd';
  return (
    <button
      type="button"
      onClick={onClear}
      className={`${sizing} relative flex shrink-0 flex-col items-center justify-center rounded-lg border-2 bg-white font-bold leading-none shadow-sm transition-all ${
        selected ? 'border-emerald-500 ring-2 ring-emerald-500/40' : 'border-slate-300'
      } ${red ? 'text-red-600' : 'text-slate-900'}`}
      aria-label={`${card.rank}${SUIT_LABEL[card.suit]} — tap to clear`}
    >
      <span className="font-mono">{card.rank}</span>
      <span className={size === 'sm' ? 'text-sm' : 'text-lg'}>{SUIT_LABEL[card.suit]}</span>
    </button>
  );
}

function BoardGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[10px] uppercase tracking-widest text-slate-600">
        {label}
      </span>
      <div className="flex gap-1">{children}</div>
    </div>
  );
}

interface ResultPanelProps {
  canCalculate: boolean;
  calculating: boolean;
  result: EquityResult | null;
  error: string | null;
  hands: HandSlots[];
}

function ResultPanel({ canCalculate, calculating, result, error, hands }: ResultPanelProps) {
  const t = useTranslations('tools.equity');
  if (error) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
        {error}
      </div>
    );
  }
  if (!canCalculate) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
        {t('hint')}
      </div>
    );
  }
  if (calculating || !result) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
        {t('calculating')}
      </div>
    );
  }
  // Build display rows aligning with original `hands` indexes
  const completeIndexes = hands
    .map((h, i) => (h[0] !== null && h[1] !== null ? i : -1))
    .filter((i) => i !== -1);

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('equityTitle')}
        </p>
        <p className="font-mono text-[10px] text-slate-600">
          {result.exhaustive
            ? t('exhaustive', { n: result.iterations.toLocaleString() })
            : t('monteCarlo', { n: result.iterations.toLocaleString() })}
        </p>
      </div>
      <div className="flex flex-col gap-3">
        {result.hands.map((eq, i) => {
          const handIdx = completeIndexes[i];
          const pct = eq.equity * 100;
          const tiePct = result.iterations === 0 ? 0 : (eq.tieCount / result.iterations) * 100;
          return (
            <div key={handIdx}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-slate-400">{t('handLabel', { n: handIdx + 1 })}</span>
                <span className="font-mono font-bold tabular-nums text-emerald-400">
                  {pct.toFixed(2)}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {tiePct >= 0.1 && (
                <p className="mt-1 font-mono text-[10px] text-slate-600">
                  {t('tieShare', { pct: tiePct.toFixed(2) })}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface CardPickerProps {
  usedSet: Set<string>;
  title: string;
  onPick: (card: Card) => void;
  onClose: () => void;
}

function CardPicker({ usedSet, title, onPick, onClose }: CardPickerProps) {
  const deck = useMemo(() => fullDeck(), []);
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center"
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
            aria-label="Close picker"
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
                  const used = usedSet.has(cardToString(card));
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

// ─── Helpers ─────────────────────────────────────────────────────────

function advanceFromHand(
  handIdx: number,
  cardIdx: 0 | 1,
  hands: HandSlots[],
  board: BoardSlots
): Selection | null {
  if (cardIdx === 0 && hands[handIdx][1] === null) {
    return { kind: 'hand', handIdx, cardIdx: 1 };
  }
  // Find next incomplete hand
  for (let i = handIdx + 1; i < hands.length; i++) {
    if (hands[i][0] === null) return { kind: 'hand', handIdx: i, cardIdx: 0 };
    if (hands[i][1] === null) return { kind: 'hand', handIdx: i, cardIdx: 1 };
  }
  // Then board
  const firstEmpty = board.findIndex((c) => c === null);
  if (firstEmpty !== -1) return { kind: 'board', cardIdx: firstEmpty };
  return null;
}

function advanceFromBoard(cardIdx: number, board: BoardSlots): Selection | null {
  for (let i = cardIdx + 1; i < board.length; i++) {
    if (board[i] === null) return { kind: 'board', cardIdx: i };
  }
  return null;
}

function boardSlotLabel(
  cardIdx: number,
  t: ReturnType<typeof useTranslations<'tools.equity'>>
): string {
  if (cardIdx < 3) return t('flopCard', { n: cardIdx + 1 });
  if (cardIdx === 3) return t('turn');
  return t('river');
}
