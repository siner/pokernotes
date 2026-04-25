'use client';

import { useState, useEffect } from 'react';
import { Clock, ChevronRight, StickyNote, Users } from 'lucide-react';
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
    <div className="flex flex-col gap-2">
      {sessions.map(({ session, noteCount, playerCount, duration }) => {
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
          <Link
            key={session.id}
            href={`/sessions/${session.id}`}
            className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 transition-colors hover:border-slate-700 hover:bg-slate-900"
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
        );
      })}
    </div>
  );
}
