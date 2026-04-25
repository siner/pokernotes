'use client';

import { User, StickyNote } from 'lucide-react';
import { type Player } from '@/lib/storage';

interface PlayerChipProps {
  player: Player;
  noteCount: number;
  onClick: () => void;
}

export function PlayerChip({ player, noteCount, onClick }: PlayerChipProps) {
  return (
    <button
      onClick={onClick}
      className="flex min-h-[80px] w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-center transition-colors hover:border-emerald-500/40 hover:bg-slate-900 active:bg-slate-800"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-500">
        <User size={18} />
      </div>
      <p className="w-full truncate text-xs font-semibold text-white">{player.nickname}</p>
      {noteCount > 0 && (
        <div className="flex items-center gap-1 text-emerald-400">
          <StickyNote size={11} />
          <span className="font-mono text-[10px]">{noteCount}</span>
        </div>
      )}
      {player.tags.length > 0 && (
        <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] text-slate-400 truncate max-w-full">
          {player.tags[0]}
        </span>
      )}
    </button>
  );
}
