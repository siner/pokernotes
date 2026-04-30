'use client';

import { ChevronRight, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Hand } from '@/lib/storage';

interface HandCardProps {
  hand: Hand;
}

const RESULT_COLOR: Record<string, string> = {
  hero_won: 'text-emerald-400',
  hero_lost: 'text-rose-400',
  split: 'text-amber-400',
  no_showdown: 'text-slate-400',
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
  const resultClass = RESULT_COLOR[result] ?? '';
  const dateLabel = hand.createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link
      href={`/hands/${hand.id}`}
      className="flex items-stretch gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900"
    >
      <div className="min-w-0 flex-1">
        {/* Header */}
        <div className="mb-1 flex items-start gap-2">
          {hand.aiProcessed && (
            <Sparkles size={12} className="mt-1 shrink-0 text-emerald-400" aria-hidden="true" />
          )}
          <h3 className="line-clamp-2 flex-1 text-sm font-semibold text-white">{title}</h3>
        </div>

        {/* Meta line */}
        <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500">
          <span>{dateLabel}</span>
          {data.heroHand && (
            <>
              <span>·</span>
              <span className="font-mono text-slate-400">{data.heroHand}</span>
            </>
          )}
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
          {data.board && (
            <>
              <span>·</span>
              <span className="font-mono text-slate-400">{data.board}</span>
            </>
          )}
          {data.heroResult && (
            <>
              <span>·</span>
              <span className={`font-mono ${resultClass}`}>{data.heroResult}</span>
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

      <ChevronRight size={16} className="shrink-0 self-center text-slate-600" />
    </Link>
  );
}
