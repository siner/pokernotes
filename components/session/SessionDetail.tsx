'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Clock, Users, StickyNote, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useStorage, type Session, type Note, type Player } from '@/lib/storage';
import { formatSessionDuration } from '@/lib/utils/duration';

interface PlayerWithNotes {
  player: Player;
  notes: Note[];
}

interface SessionDetailProps {
  sessionId: string;
}

export function SessionDetail({ sessionId }: SessionDetailProps) {
  const t = useTranslations('session.detail');
  const tList = useTranslations('session.list');
  const tCommon = useTranslations('common');

  const storage = useStorage();
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [playersWithNotes, setPlayersWithNotes] = useState<PlayerWithNotes[]>([]);

  useEffect(() => {
    async function load() {
      const [s, notes] = await Promise.all([
        storage.getSession(sessionId),
        storage.getNotesForSession(sessionId),
      ]);
      if (!s) {
        setSession(null);
        return;
      }
      setSession(s);

      // Group notes by player and load player data
      const byPlayer = new Map<string, Note[]>();
      for (const note of notes) {
        const arr = byPlayer.get(note.playerId) ?? [];
        arr.push(note);
        byPlayer.set(note.playerId, arr);
      }

      const items = await Promise.all(
        Array.from(byPlayer.entries()).map(async ([playerId, playerNotes]) => {
          const player = await storage.getPlayer(playerId);
          return player ? { player, notes: playerNotes } : null;
        })
      );

      setPlayersWithNotes(items.filter((x): x is PlayerWithNotes => x !== null));
    }
    load();
  }, [sessionId, storage]);

  if (session === undefined) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  if (session === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-slate-400">{t('noPlayers')}</p>
        <Link href="/notes" className="text-sm text-emerald-400 hover:text-emerald-300">
          ← {t('backToSessions')}
        </Link>
      </div>
    );
  }

  const sessionName =
    session.name ??
    t('unnamed', {
      date:
        session.startedAt?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) ?? '',
    });

  const duration = formatSessionDuration(session.startedAt, session.endedAt, (key, vals) =>
    tList(key as Parameters<typeof tList>[0], vals as Parameters<typeof tList>[1])
  );

  const totalNotes = playersWithNotes.reduce((s, p) => s + p.notes.length, 0);

  return (
    <>
      {/* Back nav */}
      <div className="mb-4">
        <Link
          href="/notes?tab=sessions"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {t('backToSessions')}
        </Link>
      </div>

      {/* Session header */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h1 className="mb-1 text-xl font-bold text-white">{sessionName}</h1>
        {session.startedAt && (
          <p className="mb-4 text-sm text-slate-500">
            {session.startedAt.toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        )}
        <div className="flex flex-wrap gap-4 text-xs text-slate-400">
          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock size={13} />
              {duration}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users size={13} />
            {tList('playerCount', { count: playersWithNotes.length })}
          </span>
          <span className="flex items-center gap-1.5">
            <StickyNote size={13} />
            {tList('noteCount', { count: totalNotes })}
          </span>
        </div>
      </div>

      {/* Players + notes */}
      {playersWithNotes.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t('noPlayers')}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {playersWithNotes.map(({ player, notes }) => (
            <div key={player.id}>
              {/* Player header */}
              <Link
                href={`/notes/${player.id}`}
                className="mb-2 flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 hover:border-slate-700"
              >
                <div>
                  <p className="font-semibold text-white">{player.nickname}</p>
                  {player.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {player.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {tList('noteCount', { count: notes.length })} →
                </span>
              </Link>

              {/* Notes from this session */}
              <div className="flex flex-col gap-2 pl-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl border border-slate-800/60 bg-slate-900/40 p-3.5"
                  >
                    <p className="mb-1.5 font-mono text-[11px] text-slate-600">
                      {note.createdAt.toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {note.rawNote && (
                      <p className="mb-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
                        {note.rawNote}
                      </p>
                    )}
                    {note.aiProcessed && note.structuredSummary && (
                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2.5">
                        <div className="mb-1 flex items-center gap-1">
                          <Sparkles size={11} className="text-emerald-400" />
                          <span className="font-mono text-[11px] font-semibold text-emerald-400">
                            AI
                          </span>
                        </div>
                        <p className="text-xs text-slate-300">{note.structuredSummary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
