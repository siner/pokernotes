'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { PlayerList } from './PlayerList';
import { SessionList } from './SessionList';

type Tab = 'players' | 'sessions';

export function NotesPageTabs({ defaultTab }: { defaultTab?: Tab }) {
  const t = useTranslations('notes.tabs');
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'players');

  return (
    <>
      <div className="mb-5 flex gap-0.5 rounded-xl border border-slate-800 bg-slate-900/40 p-1">
        {(['players', 'sessions'] as Tab[]).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t(key)}
          </button>
        ))}
      </div>

      {tab === 'players' && <PlayerList />}
      {tab === 'sessions' && <SessionList />}
    </>
  );
}
