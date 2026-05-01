'use client';

import { useTranslations } from 'next-intl';
import { Quote, TrendingUp, Coins } from 'lucide-react';
import { Board, HandCards } from './PlayingCard';

interface StructuredHand {
  title: string;
  summary: string;
  variant?: string;
  format?: string;
  stakes?: string;
  heroPosition?: string;
  villainPosition?: string;
  heroHand?: string;
  villainHand?: string;
  board?: string;
  preflopAction?: string;
  flopAction?: string;
  turnAction?: string;
  riverAction?: string;
  potSize?: string;
  result?: string;
  heroResult?: string;
  keyMoment?: string;
  tags?: string[];
  confidence?: number;
}

interface HandStructuredViewProps {
  hand: StructuredHand;
  /** Compact mode: shorter, used in composer preview / cards */
  compact?: boolean;
}

const RESULT_BG: Record<string, string> = {
  hero_won: 'border-emerald-500/30 bg-emerald-500/10',
  hero_lost: 'border-rose-500/30 bg-rose-500/10',
  split: 'border-amber-500/30 bg-amber-500/10',
  no_showdown: 'border-slate-700 bg-slate-800/40',
};

const RESULT_TEXT: Record<string, string> = {
  hero_won: 'text-emerald-300',
  hero_lost: 'text-rose-300',
  split: 'text-amber-300',
  no_showdown: 'text-slate-300',
};

export function HandStructuredView({ hand, compact = false }: HandStructuredViewProps) {
  const t = useTranslations('hands.view');
  const result = hand.result ?? 'unknown';
  const hasShowdown = hand.heroHand || hand.villainHand;
  const cardSize = compact ? 'sm' : 'md';

  return (
    <div className="flex flex-col gap-5">
      {/* Title + summary */}
      <div>
        <h3 className={compact ? 'text-base font-bold text-white' : 'text-xl font-bold text-white'}>
          {hand.title}
        </h3>
        {hand.summary && (
          <p
            className={`mt-2 leading-relaxed text-slate-300 ${compact ? 'line-clamp-3 text-sm' : 'text-sm sm:text-base'}`}
          >
            {hand.summary}
          </p>
        )}
      </div>

      {/* Format / stakes strip */}
      {(hand.format || hand.stakes) && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {hand.format && hand.format !== 'unknown' && (
            <span className="rounded-md border border-slate-700 bg-slate-800/60 px-2 py-1 font-mono uppercase tracking-wider text-slate-300">
              {t(`format.${hand.format}` as 'format.cash')}
            </span>
          )}
          {hand.stakes && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 font-mono font-semibold text-emerald-300">
              {hand.stakes}
            </span>
          )}
        </div>
      )}

      {/* Hero vs Villain visual */}
      {hasShowdown && (
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/80 to-slate-950/60 p-4 sm:p-5">
          <div className="flex items-stretch justify-around gap-3 sm:gap-6">
            <PlayerSlot
              label={t('hero')}
              position={hand.heroPosition}
              cards={hand.heroHand}
              size={compact ? 'sm' : 'md'}
              accent
            />
            {hand.villainHand && (
              <>
                <div className="flex items-center font-mono text-xs uppercase tracking-widest text-slate-600">
                  vs
                </div>
                <PlayerSlot
                  label={t('villain')}
                  position={hand.villainPosition}
                  cards={hand.villainHand}
                  size={cardSize}
                />
              </>
            )}
            {!hand.villainHand && hand.villainPosition && (
              <>
                <div className="flex items-center font-mono text-xs uppercase tracking-widest text-slate-600">
                  vs
                </div>
                <PlayerSlot
                  label={t('villain')}
                  position={hand.villainPosition}
                  cards={undefined}
                  size={cardSize}
                />
              </>
            )}
          </div>
        </div>
      )}

      {/* If no hero hand but we have positions, render position pills */}
      {!hasShowdown && (hand.heroPosition || hand.villainPosition) && (
        <div className="flex flex-wrap gap-2 text-xs">
          {hand.heroPosition && (
            <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 font-mono font-semibold text-emerald-300">
              {t('heroPosition', { pos: hand.heroPosition })}
            </span>
          )}
          {hand.villainPosition && (
            <span className="rounded-md border border-slate-700 bg-slate-800/60 px-3 py-1.5 font-mono font-semibold text-slate-300">
              {t('villainPosition', { pos: hand.villainPosition })}
            </span>
          )}
        </div>
      )}

      {/* Board */}
      {hand.board && (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-800 bg-emerald-950/10 px-4 py-5">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-500/70">
            {t('board')}
          </span>
          <Board
            board={hand.board}
            size={cardSize}
            showLabels={!compact}
            labels={{ flop: t('flop'), turn: t('turn'), river: t('river') }}
          />
        </div>
      )}

      {/* Action timeline (only in non-compact) */}
      {!compact &&
        (hand.preflopAction || hand.flopAction || hand.turnAction || hand.riverAction) && (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
            <div className="border-b border-slate-800 px-4 py-2.5">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {t('action')}
              </span>
            </div>
            <ol className="divide-y divide-slate-800/80">
              {hand.preflopAction && <Street label={t('preflop')} text={hand.preflopAction} />}
              {hand.flopAction && <Street label={t('flop')} text={hand.flopAction} />}
              {hand.turnAction && <Street label={t('turn')} text={hand.turnAction} />}
              {hand.riverAction && <Street label={t('river')} text={hand.riverAction} />}
            </ol>
          </div>
        )}

      {/* Pot size highlight */}
      {!compact && hand.potSize && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <Coins size={16} className="shrink-0 text-amber-400" aria-hidden="true" />
          <div className="flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-amber-500/80">
              {t('potSize')}
            </p>
            <p className="text-base font-bold text-amber-200">{hand.potSize}</p>
          </div>
        </div>
      )}

      {/* Key moment */}
      {!compact && hand.keyMoment && (
        <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-5 pl-12">
          <Quote size={18} className="absolute left-4 top-5 text-emerald-400" aria-hidden="true" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
            {t('keyMoment')}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-200 sm:text-base">
            {hand.keyMoment}
          </p>
        </div>
      )}

      {/* Result banner */}
      {result !== 'unknown' && (
        <div
          className={`flex items-center gap-3 rounded-2xl border px-4 py-3.5 ${RESULT_BG[result] ?? RESULT_BG.no_showdown}`}
        >
          <TrendingUp
            size={18}
            className={`shrink-0 ${RESULT_TEXT[result] ?? 'text-slate-300'}`}
            aria-hidden="true"
          />
          <div className="flex-1">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-widest opacity-80">
              {t('result.label')}
            </p>
            <p className={`text-base font-bold ${RESULT_TEXT[result] ?? 'text-slate-100'}`}>
              {t(`result.${result}` as 'result.hero_won')}
              {hand.heroResult && (
                <span className="ml-2 font-mono text-sm font-semibold opacity-80">
                  · {hand.heroResult}
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tags */}
      {hand.tags && hand.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hand.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold text-emerald-300"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface PlayerSlotProps {
  label: string;
  position?: string;
  cards: string | undefined;
  size: 'sm' | 'md';
  accent?: boolean;
}

function PlayerSlot({ label, position, cards, size, accent }: PlayerSlotProps) {
  return (
    <div className="flex flex-1 flex-col items-center gap-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[10px] font-semibold uppercase tracking-widest ${accent ? 'text-emerald-400' : 'text-slate-500'}`}
        >
          {label}
        </span>
        {position && (
          <span
            className={`rounded-md px-1.5 py-0.5 font-mono text-[10px] font-bold ${
              accent
                ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                : 'border border-slate-700 bg-slate-800/80 text-slate-300'
            }`}
          >
            {position}
          </span>
        )}
      </div>
      {cards ? (
        <HandCards hand={cards} size={size} />
      ) : (
        <div className="flex items-center justify-center text-xs text-slate-600">—</div>
      )}
    </div>
  );
}

function Street({ label, text }: { label: string; text: string }) {
  return (
    <li className="flex gap-3 px-4 py-3">
      <span className="mt-0.5 inline-flex h-6 w-12 shrink-0 items-center justify-center rounded-md border border-slate-700 bg-slate-800/80 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </span>
      <p className="flex-1 text-sm leading-relaxed text-slate-300">{text}</p>
    </li>
  );
}
