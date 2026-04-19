'use client';

import { Trash2, Sparkles, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { type LocalNote } from '@/lib/storage/local';

interface NoteCardProps {
  note: LocalNote;
  onDelete: (id: string) => void;
  sessionName?: string;
}

export function NoteCard({ note, onDelete, sessionName }: NoteCardProps) {
  const t = useTranslations('notes.detail');
  const tNotes = useTranslations('notes');

  const date = note.createdAt.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="group rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      {/* Date + session badge + delete */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-mono text-xs text-slate-500 shrink-0">{date}</span>
          {sessionName && (
            <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400 truncate">
              <Clock size={10} className="shrink-0" />
              {sessionName}
            </span>
          )}
          {note.sessionId && !sessionName && (
            <span className="rounded-full border border-slate-700 bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-500">
              {tNotes('sessionBadge')}
            </span>
          )}
        </div>
        <button
          onClick={() => onDelete(note.id)}
          aria-label={t('deleteNote')}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-600 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100 focus:opacity-100"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Raw note */}
      {note.rawNote && (
        <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
          {note.rawNote}
        </p>
      )}

      {/* AI structured output */}
      {note.aiProcessed && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="mb-2 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-400" />
            <span className="font-mono text-xs font-semibold text-emerald-400">AI</span>
          </div>

          {note.structuredSummary && (
            <p className="mb-2 text-sm text-slate-300">{note.structuredSummary}</p>
          )}

          <div className="flex flex-col gap-1">
            {note.preflopTendency && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Pre: </span>
                {note.preflopTendency}
              </p>
            )}
            {note.postflopTendency && (
              <p className="text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Post: </span>
                {note.postflopTendency}
              </p>
            )}
          </div>

          {note.aiSuggestedTags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {note.aiSuggestedTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-medium text-emerald-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
