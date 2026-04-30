'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Layers, Lock, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useStorage, type Hand, type Player } from '@/lib/storage';
import { useUserTier } from '@/lib/auth/useUserTier';
import { HandCard } from './HandCard';
import { HandComposer } from './HandComposer';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonCard';

export function HandsList() {
  const t = useTranslations('hands.list');
  const tDetail = useTranslations('hands.detail');

  const storage = useStorage();
  const { tier, isLoading: tierLoading } = useUserTier();
  const isPro = tier === 'pro';

  const [hands, setHands] = useState<Hand[]>([]);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [loaded, setLoaded] = useState(false);
  const [showComposer, setShowComposer] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    if (!isPro) {
      setLoaded(true);
      return;
    }
    const [allHands, allPlayers] = await Promise.all([
      storage.getAllHands(),
      storage.getAllPlayers(),
    ]);
    setHands(allHands);
    setPlayers(Object.fromEntries(allPlayers.map((p) => [p.id, p])));
    setLoaded(true);
  }, [storage, isPro]);

  useEffect(() => {
    if (!tierLoading) load();
  }, [load, tierLoading]);

  async function handleSaveHand(handData: Omit<Hand, 'id' | 'createdAt' | 'updatedAt'>) {
    const now = new Date();
    const hand: Hand = {
      ...handData,
      id: globalThis.crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await storage.saveHand(hand);
    await load();
    setShowComposer(false);
  }

  // Cheap search: matches hand title/summary in structuredData and the linked
  // player's nickname. Token-AND, diacritic-insensitive parity with the rest
  // of the app.
  const filteredHands = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return hands;
    const tokens = q.split(/\s+/).filter(Boolean);
    return hands.filter((h) => {
      const data = h.structuredData as { title?: string; summary?: string };
      const playerName = h.playerId ? (players[h.playerId]?.nickname ?? '') : '';
      const haystack = [data.title ?? '', data.summary ?? '', playerName, h.rawDescription]
        .join(' ')
        .toLowerCase();
      return tokens.every((token) => haystack.includes(token));
    });
  }, [hands, players, query]);

  if (tierLoading || !loaded) {
    return (
      <>
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="motion-safe:animate-pulse h-7 w-32 rounded bg-slate-800" />
        </div>
        <SkeletonCard count={3} variant="hand" />
      </>
    );
  }

  if (!isPro) {
    return (
      <EmptyState
        Icon={Lock}
        title={tDetail('proRequired')}
        cta={
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/30"
          >
            {tDetail('proRequiredCta')}
          </Link>
        }
      />
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <button
          onClick={() => setShowComposer(true)}
          className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t('addHand')}</span>
        </button>
      </div>

      {/* Search */}
      {hands.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-slate-700 focus:outline-none"
          />
        </div>
      )}

      {/* Count */}
      {hands.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">{t('handCount', { count: hands.length })}</p>
      )}

      {/* Empty state */}
      {hands.length === 0 && (
        <EmptyState
          Icon={Layers}
          title={t('empty.title')}
          description={t('empty.description')}
          cta={
            <button
              onClick={() => setShowComposer(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
            >
              <Plus size={18} />
              {t('empty.cta')}
            </button>
          }
        />
      )}

      {/* No-search-results */}
      {hands.length > 0 && filteredHands.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">{t('noResults')}</p>
      )}

      {/* List */}
      {filteredHands.length > 0 && (
        <div className="flex flex-col gap-2.5">
          {filteredHands.map((hand) => (
            <HandCard key={hand.id} hand={hand} />
          ))}
        </div>
      )}

      {/* Composer modal */}
      {showComposer && (
        <HandComposer onSave={handleSaveHand} onClose={() => setShowComposer(false)} />
      )}
    </>
  );
}
