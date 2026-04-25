'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Clock, Users, StickyNote } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { PlayerChip } from './PlayerChip';
import { QuickNoteSheet } from './QuickNoteSheet';
import {
  useStorage,
  getActiveSessionId,
  setActiveSessionId,
  type Session,
  type Player,
  type Note,
} from '@/lib/storage';

interface SessionStats {
  noteCount: number;
}

export function SessionView() {
  const t = useTranslations('session');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const storage = useStorage();

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [tablePlayers, setTablePlayers] = useState<Player[]>([]);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, SessionStats>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayer, setActivePlayer] = useState<Player | null>(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [sessionDuration, setSessionDuration] = useState('');
  const [summaryData, setSummaryData] = useState({ duration: '', players: 0, notes: 0 });

  const sessionId = getActiveSessionId();

  const loadSession = useCallback(async () => {
    if (!sessionId) {
      setSession(null);
      return;
    }
    const s = await storage.getSession(sessionId);
    setSession(s ?? null);
  }, [sessionId, storage]);

  const loadPlayers = useCallback(async () => {
    const all = await storage.getAllPlayers();
    setAllPlayers(all);
  }, [storage]);

  const loadStats = useCallback(
    async (players: Player[]) => {
      if (!sessionId) return;
      const entries = await Promise.all(
        players.map(async (p) => {
          const notes = await storage.getNotesForPlayer(p.id);
          const sessionNotes = notes.filter((n) => n.sessionId === sessionId);
          return [p.id, { noteCount: sessionNotes.length }] as const;
        })
      );
      setStatsMap(Object.fromEntries(entries));
    },
    [sessionId, storage]
  );

  useEffect(() => {
    loadSession();
    loadPlayers();
  }, [loadSession, loadPlayers]);

  // Update duration every minute
  useEffect(() => {
    if (!session?.startedAt) return;
    const update = () => setSessionDuration(formatDuration(session.startedAt!, t));
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [session, t]);

  useEffect(() => {
    loadStats(tablePlayers);
  }, [tablePlayers, loadStats]);

  // Search filtering — players not already at the table
  const tablePlayerIds = new Set(tablePlayers.map((p) => p.id));
  const searchResults = searchQuery.trim()
    ? allPlayers.filter(
        (p) =>
          !tablePlayerIds.has(p.id) && p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  async function addPlayerToTable(player: Player) {
    if (tablePlayerIds.has(player.id)) return;
    setTablePlayers((prev) => [...prev, player]);
    setSearchQuery('');
  }

  async function createAndAddPlayer() {
    const nickname = searchQuery.trim();
    if (!nickname) return;
    const now = new Date();
    const newPlayer: Player = {
      id: globalThis.crypto.randomUUID(),
      nickname,
      tags: [],
      timesPlayed: 0,
      createdAt: now,
      updatedAt: now,
    };
    await storage.savePlayer(newPlayer);
    setAllPlayers((prev) => [newPlayer, ...prev]);
    setTablePlayers((prev) => [...prev, newPlayer]);
    setSearchQuery('');
  }

  async function handleSaveNote(noteData: Omit<Note, 'id' | 'createdAt'>) {
    const note: Note = {
      ...noteData,
      id: globalThis.crypto.randomUUID(),
      createdAt: new Date(),
    };
    await storage.saveNote(note);

    // Update player stats
    const player = tablePlayers.find((p) => p.id === noteData.playerId);
    if (player) {
      const merged = noteData.aiSuggestedTags.length
        ? Array.from(new Set([...player.tags, ...noteData.aiSuggestedTags]))
        : player.tags;
      await storage.savePlayer({
        ...player,
        tags: merged,
        timesPlayed: player.timesPlayed + 1,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      });
      setTablePlayers((prev) =>
        prev.map((p) =>
          p.id === player.id ? { ...p, tags: merged, timesPlayed: p.timesPlayed + 1 } : p
        )
      );
    }

    // Refresh stats
    await loadStats(tablePlayers);
    setActivePlayer(null);
  }

  async function handleEndSession() {
    if (!session || !sessionId) return;

    const totalNotes = Object.values(statsMap).reduce((sum, s) => sum + s.noteCount, 0);
    const duration = formatDuration(session.startedAt!, t);

    const ended = { ...session, endedAt: new Date() };
    await storage.saveSession(ended);
    setActiveSessionId(null);

    setSummaryData({ duration, players: tablePlayers.length, notes: totalNotes });
    setShowEndConfirm(false);
    setShowSummary(true);
  }

  function handleSummaryDone() {
    router.push('/notes');
  }

  // Loading
  if (session === undefined) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  // No active session
  if (session === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
          <Clock size={32} />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-white">{t('noActive.title')}</h2>
        <p className="mb-6 max-w-xs text-sm text-slate-500">{t('noActive.description')}</p>
        <Link
          href="/notes"
          className="flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:opacity-90"
        >
          {t('noActive.cta')}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Session header */}
      <div className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">
              {session.name ?? t('header.playerCount', { count: tablePlayers.length })}
            </h1>
            {session.venue && <p className="text-sm text-slate-500">{session.venue}</p>}
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5">
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            <span className="font-mono text-xs font-medium text-emerald-400">
              {sessionDuration || '0m'}
            </span>
          </div>
        </div>

        <div className="mt-3 flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Users size={13} />
            {t('header.playerCount', { count: tablePlayers.length })}
          </span>
          <span className="flex items-center gap-1">
            <StickyNote size={13} />
            {t('header.noteCount', {
              count: Object.values(statsMap).reduce((s, v) => s + v.noteCount, 0),
            })}
          </span>
        </div>
      </div>

      {/* Add player search */}
      <div className="relative mb-4">
        <Plus size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('table.addSearch')}
          className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-emerald-500/40 focus:outline-none"
        />
      </div>

      {/* Search results dropdown */}
      {searchQuery.trim() && (
        <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
          {searchResults.map((p) => (
            <button
              key={p.id}
              onClick={() => addPlayerToTable(p)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white hover:bg-slate-800"
            >
              <span className="flex-1 font-medium">{p.nickname}</span>
              {p.tags.length > 0 && (
                <span className="font-mono text-xs text-slate-500">{p.tags[0]}</span>
              )}
            </button>
          ))}
          {/* Create new */}
          <button
            onClick={createAndAddPlayer}
            className="flex w-full items-center gap-2 border-t border-slate-800 px-4 py-3 text-left text-sm text-emerald-400 hover:bg-slate-800"
          >
            <Plus size={15} />
            Add &ldquo;{searchQuery.trim()}&rdquo;
          </button>
        </div>
      )}

      {/* Players at table */}
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
        {t('table.title')}
      </p>

      {tablePlayers.length === 0 ? (
        <div className="mb-6 rounded-xl border border-dashed border-slate-800 py-10 text-center">
          <p className="mb-1 text-sm text-slate-500">{t('table.empty')}</p>
          <p className="text-xs text-slate-600">{t('table.emptyHint')}</p>
        </div>
      ) : (
        <div className="mb-6 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {tablePlayers.map((player) => (
            <PlayerChip
              key={player.id}
              player={player}
              noteCount={statsMap[player.id]?.noteCount ?? 0}
              onClick={() => setActivePlayer(player)}
            />
          ))}
        </div>
      )}

      {/* End session button */}
      <button
        onClick={() => setShowEndConfirm(true)}
        className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 text-sm font-semibold text-red-400 hover:bg-red-500/20"
      >
        {t('endSession')}
      </button>

      {/* Quick note sheet */}
      {activePlayer && sessionId && (
        <QuickNoteSheet
          player={activePlayer}
          sessionId={sessionId}
          onSave={handleSaveNote}
          onClose={() => setActivePlayer(null)}
        />
      )}

      {/* End confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h3 className="mb-1.5 text-base font-semibold text-white">{t('endConfirm.title')}</h3>
            <p className="mb-5 text-sm text-slate-400">{t('endConfirm.message')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800"
              >
                {tCommon('cancel')}
              </button>
              <button
                onClick={handleEndSession}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30"
              >
                {t('endConfirm.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary modal */}
      {showSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <StickyNote size={28} />
            </div>
            <h3 className="mb-4 text-lg font-bold text-white">{t('summary.title')}</h3>
            <div className="mb-6 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-900 py-3">
                <p className="mb-0.5 font-mono text-xl font-bold text-white">
                  {summaryData.duration}
                </p>
                <p className="text-xs text-slate-500">{t('summary.duration')}</p>
              </div>
              <div className="rounded-xl bg-slate-900 py-3">
                <p className="mb-0.5 font-mono text-xl font-bold text-emerald-400">
                  {summaryData.players}
                </p>
                <p className="text-xs text-slate-500">{t('summary.playersTracked')}</p>
              </div>
              <div className="rounded-xl bg-slate-900 py-3">
                <p className="mb-0.5 font-mono text-xl font-bold text-emerald-400">
                  {summaryData.notes}
                </p>
                <p className="text-xs text-slate-500">{t('summary.notesAdded')}</p>
              </div>
            </div>
            <button
              onClick={handleSummaryDone}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 hover:opacity-90"
            >
              {t('summary.done')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function formatDuration(startedAt: Date, t: ReturnType<typeof useTranslations<'session'>>) {
  const mins = Math.floor((Date.now() - startedAt.getTime()) / 60_000);
  if (mins < 60) return t('header.durationMinutes', { minutes: mins });
  return t('header.duration', { hours: Math.floor(mins / 60), minutes: mins % 60 });
}
