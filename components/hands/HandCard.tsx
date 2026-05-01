'use client';

import { ChevronRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Hand } from '@/lib/storage';
import { parseCards } from '@/lib/hands/parseCards';
import { CardRow } from './PlayingCard';

interface HandCardProps {
  hand: Hand;
}

const RESULT_DOT: Record<string, string> = {
  hero_won: 'bg-emerald-400',
  hero_lost: 'bg-rose-400',
  split: 'bg-amber-400',
  no_showdown: 'bg-slate-500',
};

export function HandCard({ hand }: HandCardProps) {
  const t = useTranslations('hands.card');
  const data = hand.structuredData as {
    title?: string;
    summary?: string;
    heroPosition?: string;
    villainPosition?: string;
    heroHand?: string;
    board?: string;
    result?: string;
    heroResult?: string;
    tags?: string[];
  };

  const title = data.title ?? hand.rawDescription.slice(0, 80);
  const result = data.result ?? 'unknown';
  const dot = RESULT_DOT[result];
  const heroCards = parseCards(data.heroHand);
  const boardCards = parseCards(data.board);
  const dateLabel = hand.createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/hands/${hand.id}`}
      className="group relative flex items-stretch gap-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-all hover:border-slate-700 hover:bg-slate-900"
    >
      {/* Result accent stripe */}
      {dot && <span className={`absolute inset-y-0 left-0 w-0.5 ${dot}`} aria-hidden="true" />}

      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-2 flex items-start gap-2">
          {hand.aiProcessed && (
            <Sparkles size={12} className="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
          )}
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-white">{title}</h3>
        </div>

        {/* Cards row: hero + board */}
        {(heroCards.length > 0 || boardCards.length > 0) && (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {heroCards.length > 0 && <CardRow cards={heroCards} size="xs" />}
            {heroCards.length > 0 && boardCards.length > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
                /
              </span>
            )}
            {boardCards.length > 0 && <CardRow cards={boardCards} size="xs" />}
          </div>
        )}

        {/* Meta line */}
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
          <span>{dateLabel}</span>
          {data.heroPosition && (
            <>
              <span>·</span>
              <span className="font-mono text-slate-400">
                {t('positions', {
                  hero: data.heroPosition,
                  villain: data.villainPosition ?? '?',
                })}
              </span>
            </>
          )}
          {data.heroResult && (
            <>
              <span>·</span>
              <span className="font-mono text-slate-300">{data.heroResult}</span>
            </>
          )}
        </div>

        {/* Tags */}
        {data.tags && data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {data.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-400"
              >
                {tag}
              </span>
            ))}
            {data.tags.length > 4 && (
              <span className="font-mono text-[10px] text-slate-500">+{data.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      <ChevronRight
        size={16}
        className="shrink-0 self-center text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-400"
      />
    </Link>
  );
}
