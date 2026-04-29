'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight, StickyNote, Users, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useStorage, type Session } from '@/lib/storage';
import { formatSessionDuration } from '@/lib/utils/duration';

interface SessionSummary {
  session: Session;
  noteCount: number;
  playerCount: number;
  duration: string;
}

export function SessionList() {
  const t = useTranslations('session.list');
  const tCommon = useTranslations('common');
  const storage = useStorage();

  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [confirming, setConfirming] = useState<SessionSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function load() {
      const all = await storage.getAllSessions();
      const completed = all.filter((s) => s.endedAt);

      const summaries = await Promise.all(
        completed.map(async (s) => {
          const notes = await storage.getNotesForSession(s.id);
          const playerCount = new Set(notes.map((n) => n.playerId)).size;
          return {
            session: s,
            noteCount: notes.length,
            playerCount,
            duration: formatSessionDuration(s.startedAt, s.endedAt, (key, vals) =>
              t(key as Parameters<typeof t>[0], vals as Parameters<typeof t>[1])
            ),
          };
        })
      );

      setSessions(summaries);
      setLoaded(true);
    }
    load();
  }, [t, storage]);

  async function handleConfirmDelete() {
    if (!confirming) return;
    setDeleting(true);
    try {
      await storage.deleteSession(confirming.session.id);
      setSessions((prev) => prev.filter((s) => s.session.id !== confirming.session.id));
      setConfirming(null);
    } finally {
      setDeleting(false);
    }
  }

  if (!loaded) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 text-slate-600">
          <Clock size={32} />
        </div>
        <p className="mb-1 text-sm font-medium text-slate-400">{t('empty')}</p>
        <p className="max-w-xs text-xs text-slate-600">{t('emptyHint')}</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {sessions.map((summary) => {
          const { session, noteCount, playerCount, duration } = summary;
          const name =
            session.name ??
            t('unnamed', {
              date:
                session.startedAt?.toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                }) ?? '',
            });

          const dateLabel = session.startedAt?.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={session.id}
              className="group flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 transition-colors hover:border-slate-700 hover:bg-slate-900"
            >
              <Link
                href={`/sessions/${session.id}`}
                className="flex min-w-0 flex-1 items-center gap-4 px-4 py-4"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-semibold text-white">{name}</p>
                  <p className="text-xs text-slate-500">{dateLabel}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                    {duration && (
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {duration}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {t('playerCount', { count: playerCount })}
                    </span>
                    <span className="flex items-center gap-1">
                      <StickyNote size={11} />
                      {t('noteCount', { count: noteCount })}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-600" />
              </Link>
              <button
                type="button"
                onClick={() => setConfirming(summary)}
                aria-label={t('deleteSession', { name })}
                className="mr-2 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-red-500/10 hover:text-red-400 focus:opacity-100 sm:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100"
              >
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {confirming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-950 p-6">
            <h3 className="mb-1.5 text-base font-semibold text-white">
              {t('deleteConfirm.title')}
            </h3>
            <p className="mb-5 text-sm text-slate-400">
              {t('deleteConfirm.message', {
                name:
                  confirming.session.name ??
                  t('unnamed', {
                    date:
                      confirming.session.startedAt?.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      }) ?? '',
                  }),
              })}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-700 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-50"
              >
                {tCommon('cancel')}
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-500/20 py-2.5 text-sm font-semibold text-red-400 hover:bg-red-500/30 disabled:opacity-50"
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
