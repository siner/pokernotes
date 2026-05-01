'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useUserTier } from '@/lib/auth/useUserTier';
import { PlayerList } from './PlayerList';
import { SessionList } from './SessionList';

type Tab = 'players' | 'sessions';

export function NotesPageTabs({ defaultTab }: { defaultTab?: Tab }) {
  const t = useTranslations('notes.tabs');
  const tHands = useTranslations('hands.list');
  const [tab, setTab] = useState<Tab>(defaultTab ?? 'players');
  const { tier } = useUserTier();
  const isPro = tier === 'pro';

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
        {/* Hands lives at its own route — unlike Players/Sessions which swap
            in-place, so we link rather than handle it as a local tab. Pro only. */}
        {isPro && (
          <Link
            href="/hands"
            className="flex-1 rounded-lg py-2 text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-300"
          >
            {tHands('tab')}
          </Link>
        )}
      </div>

      {tab === 'players' && <PlayerList />}
      {tab === 'sessions' && <SessionList />}
    </>
  );
}
