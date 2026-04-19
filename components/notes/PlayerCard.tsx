'use client';

import { User, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type LocalPlayer } from '@/lib/storage/local';

interface PlayerCardProps {
  player: LocalPlayer;
  onDelete: (id: string) => void;
  onClick: (id: string) => void;
}

export function PlayerCard({ player, onDelete, onClick }: PlayerCardProps) {
  const t = useTranslations('notes');

  const lastSeenLabel = player.lastSeenAt
    ? t('lastSeen', { date: player.lastSeenAt.toLocaleDateString() })
    : null;

  const sessionsLabel = t('timesPlayed', { count: player.timesPlayed });

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    onDelete(player.id);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick(player.id)}
      onKeyDown={(e) => e.key === 'Enter' && onClick(player.id)}
      className="group relative flex min-h-[72px] cursor-pointer items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 transition-colors hover:border-slate-700 hover:bg-slate-900 active:bg-slate-800"
    >
      {/* Avatar */}
      <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-slate-500">
        <User size={20} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-white">{player.nickname}</p>

        {player.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {player.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400"
              >
                {tag}
              </span>
            ))}
            {player.tags.length > 4 && (
              <span className="rounded-full bg-slate-700/60 px-2 py-0.5 font-mono text-[11px] text-slate-400">
                +{player.tags.length - 4}
              </span>
            )}
          </div>
        )}

        <p className="mt-1.5 text-xs text-slate-500">
          {sessionsLabel}
          {lastSeenLabel && (
            <>
              {' · '}
              {lastSeenLabel}
            </>
          )}
        </p>
      </div>

      {/* Delete button */}
      <button
        onClick={handleDelete}
        aria-label={`Delete ${player.nickname}`}
        className="ml-1 mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
