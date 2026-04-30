'use client';

import { useTranslations } from 'next-intl';

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

const RESULT_COLOR: Record<string, string> = {
  hero_won: 'text-emerald-400',
  hero_lost: 'text-rose-400',
  split: 'text-amber-400',
  no_showdown: 'text-slate-400',
  unknown: 'text-slate-500',
};

export function HandStructuredView({ hand, compact = false }: HandStructuredViewProps) {
  const t = useTranslations('hands.view');
  const result = hand.result ?? 'unknown';
  const resultClass = RESULT_COLOR[result] ?? 'text-slate-500';

  return (
    <div className="flex flex-col gap-2.5">
      {/* Title + summary */}
      <div>
        <h3 className="font-semibold leading-tight text-white">{hand.title}</h3>
        {hand.summary && (
          <p
            className={`mt-1 text-sm leading-relaxed text-slate-300 ${compact ? 'line-clamp-3' : ''}`}
          >
            {hand.summary}
          </p>
        )}
      </div>

      {/* Quick chips */}
      <div className="flex flex-wrap gap-1.5 text-[11px]">
        {hand.format && hand.format !== 'unknown' && (
          <Chip label={t(`format.${hand.format}` as 'format.cash')} />
        )}
        {hand.stakes && <Chip label={hand.stakes} />}
        {hand.heroPosition && <Chip label={t('heroPosition', { pos: hand.heroPosition })} accent />}
        {hand.villainPosition && (
          <Chip label={t('villainPosition', { pos: hand.villainPosition })} />
        )}
        {hand.heroHand && <Chip label={t('heroHand', { hand: hand.heroHand })} accent />}
        {hand.villainHand && <Chip label={t('villainHand', { hand: hand.villainHand })} />}
        {hand.board && <Chip label={hand.board} mono />}
        {result !== 'unknown' && (
          <Chip label={t(`result.${result}` as 'result.hero_won')} className={resultClass} />
        )}
        {hand.heroResult && <Chip label={hand.heroResult} className={resultClass} />}
      </div>

      {/* Action by street (only in non-compact) */}
      {!compact &&
        (hand.preflopAction || hand.flopAction || hand.turnAction || hand.riverAction) && (
          <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-3 text-xs">
            {hand.preflopAction && <Street label={t('preflop')} text={hand.preflopAction} />}
            {hand.flopAction && <Street label={t('flop')} text={hand.flopAction} />}
            {hand.turnAction && <Street label={t('turn')} text={hand.turnAction} />}
            {hand.riverAction && <Street label={t('river')} text={hand.riverAction} />}
          </div>
        )}

      {/* Key moment */}
      {!compact && hand.keyMoment && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
          <p className="mb-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-amber-400">
            {t('keyMoment')}
          </p>
          <p className="text-sm text-slate-300">{hand.keyMoment}</p>
        </div>
      )}

      {/* Tags */}
      {hand.tags && hand.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {hand.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

interface ChipProps {
  label: string;
  accent?: boolean;
  mono?: boolean;
  className?: string;
}

function Chip({ label, accent, mono, className }: ChipProps) {
  const base =
    'rounded-md border px-2 py-0.5 ' +
    (accent
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
      : 'border-slate-700 bg-slate-800/60 text-slate-300');
  return <span className={`${base} ${mono ? 'font-mono' : ''} ${className ?? ''}`}>{label}</span>;
}

function Street({ label, text }: { label: string; text: string }) {
  return (
    <p className="border-t border-slate-800 py-1.5 first:border-0 first:pt-0">
      <span className="mr-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="text-slate-300">{text}</span>
    </p>
  );
}
