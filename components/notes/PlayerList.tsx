'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Users, Play } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { PlayerCard } from './PlayerCard';
import { AddPlayerModal } from './AddPlayerModal';
import { StartSessionModal } from '@/components/session/StartSessionModal';
import {
  getAllPlayers,
  savePlayer,
  deletePlayer,
  getActiveSessionId,
  type LocalPlayer,
} from '@/lib/storage/local';

const FREE_TIER_LIMIT = 20;

export function PlayerList() {
  const t = useTranslations('notes');
  const tCommon = useTranslations('common');
  const tSession = useTranslations('session');

  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [query, setQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStartSession, setShowStartSession] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalPlayer | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  const router = useRouter();

  const loadPlayers = useCallback(async () => {
    const all = await getAllPlayers();
    setPlayers(all);
    setLoaded(true);
  }, []);

  useEffect(() => {
    loadPlayers();
    setActiveSessionIdState(getActiveSessionId());
  }, [loadPlayers]);

  const filtered = query.trim()
    ? players.filter((p) => p.nickname.toLowerCase().includes(query.toLowerCase().trim()))
    : players;

  async function handleAdd(data: { nickname: string; description: string; tags: string[] }) {
    const now = new Date();
    const player: LocalPlayer = {
      id: globalThis.crypto.randomUUID(),
      nickname: data.nickname,
      description: data.description || undefined,
      tags: data.tags,
      timesPlayed: 0,
      createdAt: now,
      updatedAt: now,
    };
    await savePlayer(player);
    await loadPlayers();
    setShowAddModal(false);
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    await deletePlayer(deleteTarget.id);
    await loadPlayers();
    setDeleteTarget(null);
  }

  function handlePlayerClick(id: string) {
    router.push(`/notes/${id}`);
  }

  const atLimit = players.length >= FREE_TIER_LIMIT;

  if (!loaded) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  return (
    <>
      {/* Active session banner */}
      {activeSessionId && (
        <Link
          href="/session"
          className="mb-4 flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            <span className="font-semibold text-emerald-400">
              {tSession('activeSessionBanner')}
            </span>
          </div>
          <span className="text-emerald-500/70">{tSession('activeBannerCta')} →</span>
        </Link>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">{t('title')}</h1>
        <div className="flex items-center gap-2">
          {!activeSessionId && (
            <button
              onClick={() => setShowStartSession(true)}
              className="flex min-h-[44px] items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
            >
              <Play size={15} />
              <span className="hidden sm:inline">{tSession('startSession')}</span>
            </button>
          )}
          <button
            onClick={() => !atLimit && setShowAddModal(true)}
            disabled={atLimit}
            title={atLimit ? t('limits.freeTier', { limit: FREE_TIER_LIMIT }) : undefined}
            className="flex min-h-[44px] items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">{t('addPlayer')}</span>
          </button>
        </div>
      </div>

      {/* Free tier warning */}
      {atLimit && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
          {t('limits.freeTier', { limit: FREE_TIER_LIMIT })}
        </div>
      )}

      {/* Search */}
      {players.length > 0 && (
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-slate-700 focus:outline-none"
          />
        </div>
      )}

      {/* Player count */}
      {players.length > 0 && (
        <p className="mb-3 text-xs text-slate-500">{t('playerCount', { count: players.length })}</p>
      )}

      {/* Empty state */}
      {players.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
            <Users size={32} />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-white">{t('empty.title')}</h2>
          <p className="mb-6 max-w-xs text-sm text-slate-500">{t('empty.description')}</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90"
          >
            <Plus size={18} />
            {t('empty.cta')}
          </button>
        </div>
      )}

      {/* Search no results */}
      {players.length > 0 && filtered.length === 0 && (
        <p className="py-10 text-center text-sm text-slate-500">{t('search.noResults')}</p>
      )}

      {/* Player list */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2">
          {filtered.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              onDelete={(id) => setDeleteTarget(players.find((p) => p.id === id) ?? null)}
              onClick={handlePlayerClick}
            />
          ))}
        </div>
      )}

      {/* Start session modal */}
      {showStartSession && <StartSessionModal onClose={() => setShowStartSession(false)} />}

      {/* Add player modal */}
      {showAddModal && <AddPlayerModal onClose={() => setShowAddModal(false)} onAdd={handleAdd} />}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h3 className="mb-2 text-base font-semibold text-white">{t('deleteConfirm.title')}</h3>
            <p className="mb-5 text-sm text-slate-400">
              {t('deleteConfirm.message', { name: deleteTarget.nickname })}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30"
              >
                {t('deleteConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
