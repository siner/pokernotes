'use client';

import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Plus, Pencil, Check, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { NoteCard } from './NoteCard';
import { NoteComposer } from './NoteComposer';
import { PlayerPhoto } from './PlayerPhoto';
import { useStorage, type Player, type Note, type Session } from '@/lib/storage';
import { useUserTier } from '@/lib/auth/useUserTier';
import { PLAYER_TAGS } from '@/lib/constants/tags';

interface PlayerDetailProps {
  playerId: string;
}

type Tab = 'notes' | 'info';

export function PlayerDetail({ playerId }: PlayerDetailProps) {
  const t = useTranslations('notes.detail');
  const tTags = useTranslations('tags');
  const tCommon = useTranslations('common');

  const storage = useStorage();
  const { tier } = useUserTier();
  const isPro = tier === 'pro';
  const [player, setPlayer] = useState<Player | null | undefined>(undefined);
  const [notes, setNotes] = useState<Note[]>([]);
  const [sessionMap, setSessionMap] = useState<Record<string, Session>>({});
  const [tab, setTab] = useState<Tab>('notes');
  const [showComposer, setShowComposer] = useState(false);

  // Inline editing
  const [editingNickname, setEditingNickname] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');

  const load = useCallback(async () => {
    const [p, n, sessions] = await Promise.all([
      storage.getPlayer(playerId),
      storage.getNotesForPlayer(playerId),
      storage.getAllSessions(),
    ]);
    setPlayer(p ?? null);
    setNotes(n);
    setSessionMap(Object.fromEntries(sessions.map((s) => [s.id, s])));
  }, [playerId, storage]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSaveNote(noteData: Omit<Note, 'id' | 'createdAt'>) {
    const note: Note = {
      ...noteData,
      id: globalThis.crypto.randomUUID(),
      createdAt: new Date(),
    };
    await storage.saveNote(note);

    // If note has AI tags, merge them into player tags
    if (note.aiSuggestedTags.length > 0 && player) {
      const merged = Array.from(new Set([...player.tags, ...note.aiSuggestedTags]));
      const updated: Player = {
        ...player,
        tags: merged,
        timesPlayed: player.timesPlayed + 1,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.savePlayer(updated);
    } else if (player) {
      const updated: Player = {
        ...player,
        timesPlayed: player.timesPlayed + 1,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      };
      await storage.savePlayer(updated);
    }

    await load();
    setShowComposer(false);
  }

  async function handleDeleteNote(id: string) {
    await storage.deleteNote(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }

  async function handleToggleTag(tag: string) {
    if (!player) return;
    const has = player.tags.includes(tag);
    const updated: Player = {
      ...player,
      tags: has ? player.tags.filter((t) => t !== tag) : [...player.tags, tag],
      updatedAt: new Date(),
    };
    await storage.savePlayer(updated);
    setPlayer(updated);
  }

  async function handleSaveNickname() {
    if (!player || !nicknameInput.trim()) return;
    const updated: Player = {
      ...player,
      nickname: nicknameInput.trim(),
      updatedAt: new Date(),
    };
    await storage.savePlayer(updated);
    setPlayer(updated);
    setEditingNickname(false);
  }

  async function handleSaveDescription() {
    if (!player) return;
    const updated: Player = {
      ...player,
      description: descriptionInput.trim() || undefined,
      updatedAt: new Date(),
    };
    await storage.savePlayer(updated);
    setPlayer(updated);
    setEditingDescription(false);
  }

  // Loading state
  if (player === undefined) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  // Not found
  if (player === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-slate-400">{t('notFound')}</p>
        <Link
          href="/notes"
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft size={16} />
          {t('notFoundBack')}
        </Link>
      </div>
    );
  }

  const lastSeenLabel = player.lastSeenAt
    ? t('lastSeen', { date: player.lastSeenAt.toLocaleDateString() })
    : null;

  return (
    <>
      {/* Back nav */}
      <div className="mb-4">
        <Link
          href="/notes"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {tCommon('cancel')}
        </Link>
      </div>

      {/* Player header */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="mb-4 flex items-start gap-4">
          {isPro && <PlayerPhoto player={player} onChange={setPlayer} />}

          <div className="min-w-0 flex-1">
            {/* Nickname */}
            <div className="mb-1 flex items-start gap-2">
              {editingNickname ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xl font-bold text-white focus:border-emerald-500 focus:outline-none"
                  />
                  <button
                    onClick={handleSaveNickname}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => setEditingNickname(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="flex-1 text-2xl font-bold text-white">{player.nickname}</h1>
                  <button
                    onClick={() => {
                      setNicknameInput(player.nickname);
                      setEditingNickname(true);
                    }}
                    aria-label={t('editNickname')}
                    className="mt-1 flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
                  >
                    <Pencil size={15} />
                  </button>
                </>
              )}
            </div>

            {/* Stats */}
            <p className="text-xs text-slate-500">
              {t('timesPlayed', { count: player.timesPlayed })}
              {lastSeenLabel && <> · {lastSeenLabel}</>}
              {' · '}
              {t('noteCount', { count: notes.length })}
            </p>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(PLAYER_TAGS) as [keyof typeof PLAYER_TAGS, readonly string[]][]).flatMap(
            ([, tags]) =>
              tags.map((tag) => {
                const active = player.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className={`rounded-full border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                      active
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                        : 'border-slate-700 bg-slate-800/60 text-slate-500 hover:border-slate-600 hover:text-slate-400'
                    }`}
                  >
                    {tTags(tag as Parameters<typeof tTags>[0])}
                  </button>
                );
              })
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-0.5 rounded-xl border border-slate-800 bg-slate-900/40 p-1">
        {(['notes', 'info'] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === tabKey ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {/* Notes tab */}
      {tab === 'notes' && (
        <>
          <button
            onClick={() => setShowComposer(true)}
            className="mb-4 flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 text-sm font-medium text-slate-400 transition-colors hover:border-emerald-500/40 hover:text-emerald-400"
          >
            <Plus size={16} />
            {t('addNote')}
          </button>

          {notes.length === 0 ? (
            <div className="py-10 text-center">
              <p className="mb-1 text-sm font-medium text-slate-400">{t('noNotes')}</p>
              <p className="text-xs text-slate-600">{t('noNotesHint')}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onDelete={handleDeleteNote}
                  sessionName={
                    note.sessionId
                      ? (sessionMap[note.sessionId]?.name ??
                        sessionMap[note.sessionId]?.startedAt?.toLocaleDateString())
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Info tab */}
      {tab === 'info' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                {t('infoSection.description')}
              </p>
              <button
                onClick={() => {
                  setDescriptionInput(player.description ?? '');
                  setEditingDescription(true);
                }}
                aria-label={t('editDescription')}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-800 hover:text-slate-300"
              >
                <Pencil size={13} />
              </button>
            </div>

            {editingDescription ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={descriptionInput}
                  onChange={(e) => setDescriptionInput(e.target.value)}
                  autoFocus
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-emerald-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveDescription}
                    className="flex-1 rounded-lg bg-emerald-500/20 py-1.5 text-xs font-medium text-emerald-400 hover:bg-emerald-500/30"
                  >
                    {tCommon('save')}
                  </button>
                  <button
                    onClick={() => setEditingDescription(false)}
                    className="flex-1 rounded-lg border border-slate-700 py-1.5 text-xs text-slate-400 hover:bg-slate-800"
                  >
                    {tCommon('cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <p className={`text-sm ${player.description ? 'text-slate-300' : 'text-slate-600'}`}>
                {player.description ?? t('infoSection.descriptionEmpty')}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1 border-t border-slate-800 pt-3 text-xs text-slate-500">
            {player.firstSeenAt && (
              <p>
                {t('infoSection.firstSeen')}: {player.firstSeenAt.toLocaleDateString()}
              </p>
            )}
            <p>
              {t('infoSection.addedOn')}: {player.createdAt.toLocaleDateString()}
            </p>
          </div>
        </div>
      )}

      {/* Note composer modal */}
      {showComposer && (
        <NoteComposer
          playerId={playerId}
          onSave={handleSaveNote}
          onClose={() => setShowComposer(false)}
        />
      )}
    </>
  );
}
