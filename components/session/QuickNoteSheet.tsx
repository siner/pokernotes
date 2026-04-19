'use client';

import { useState } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { type LocalPlayer, type LocalNote } from '@/lib/storage/local';

interface AiResult {
  structuredSummary: string;
  preflopTendency: string;
  postflopTendency: string;
  suggestedTags: string[];
}

interface QuickNoteSheetProps {
  player: LocalPlayer;
  sessionId: string;
  onSave: (note: Omit<LocalNote, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

export function QuickNoteSheet({ player, sessionId, onSave, onClose }: QuickNoteSheetProps) {
  const t = useTranslations('session.quickNote');
  const tComposer = useTranslations('notes.composer');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [rawNote, setRawNote] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleAi() {
    if (!rawNote.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(false);
    try {
      const res = await fetch('/api/ai/structure-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rawNote, existingTags: player.tags, locale }),
      });
      if (!res.ok) throw new Error();
      setAiResult((await res.json()) as AiResult);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (!rawNote.trim()) return;
    setSaving(true);
    await onSave({
      playerId: player.id,
      sessionId,
      rawNote: rawNote.trim(),
      structuredSummary: aiResult?.structuredSummary,
      preflopTendency: aiResult?.preflopTendency,
      postflopTendency: aiResult?.postflopTendency,
      aiSuggestedTags: aiResult?.suggestedTags ?? [],
      aiProcessed: aiResult !== null,
    });
    setSaving(false);
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-950 p-5">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            {t('title', { name: player.nickname })}
          </h3>
          <button
            onClick={onClose}
            aria-label={tCommon('cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Existing tags */}
        {player.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {player.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[11px] text-slate-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Textarea */}
        <textarea
          value={rawNote}
          onChange={(e) => setRawNote(e.target.value)}
          placeholder={tComposer('placeholder')}
          rows={4}
          autoFocus
          className="mb-3 w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
        />

        {/* AI error */}
        {aiError && (
          <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {tComposer('aiError')}
          </p>
        )}

        {/* AI result */}
        {aiResult && (
          <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-emerald-400">AI</span>
            </div>
            {aiResult.structuredSummary && (
              <p className="mb-1.5 text-sm text-slate-300">{aiResult.structuredSummary}</p>
            )}
            {aiResult.suggestedTags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {aiResult.suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] text-emerald-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAi}
            disabled={!rawNote.trim() || aiLoading || saving}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {aiLoading ? tComposer('aiProcessing') : tComposer('aiButton')}
          </button>
          <button
            onClick={handleSave}
            disabled={!rawNote.trim() || saving || aiLoading}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
