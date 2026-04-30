'use client';

import { useCallback, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { type Note } from '@/lib/storage';
import { useSpeechToText } from '@/lib/speech/useSpeechToText';
import { MicButton, speechErrorMessage } from './MicButton';

interface AiResult {
  structuredSummary: string;
  preflopTendency: string;
  postflopTendency: string;
  suggestedTags: string[];
}

interface NoteComposerProps {
  playerId: string;
  onSave: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
  onClose: () => void;
}

export function NoteComposer({ playerId, onSave, onClose }: NoteComposerProps) {
  const t = useTranslations('notes.composer');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  const [rawNote, setRawNote] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiResult | null>(null);
  const [aiError, setAiError] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSpeechSegment = useCallback((text: string) => {
    setRawNote((prev) => (prev ? `${prev.replace(/\s+$/, '')} ${text}` : text));
  }, []);

  const speech = useSpeechToText({ locale, onFinalSegment: handleSpeechSegment });

  async function handleAi() {
    if (!rawNote.trim() || aiLoading) return;
    setAiLoading(true);
    setAiError(false);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/structure-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: rawNote, locale }),
      });

      if (!res.ok) throw new Error('API error');

      const data = (await res.json()) as AiResult;
      setAiResult(data);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave(withAi: boolean) {
    if (!rawNote.trim()) return;
    setSaving(true);
    await onSave({
      playerId,
      rawNote: rawNote.trim(),
      structuredSummary: withAi ? (aiResult?.structuredSummary ?? undefined) : undefined,
      preflopTendency: withAi ? (aiResult?.preflopTendency ?? undefined) : undefined,
      postflopTendency: withAi ? (aiResult?.postflopTendency ?? undefined) : undefined,
      aiSuggestedTags: withAi ? (aiResult?.suggestedTags ?? []) : [],
      aiProcessed: withAi && aiResult !== null,
    });
    setSaving(false);
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-950 p-5 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">{t('save')}</h3>
          <button
            onClick={onClose}
            aria-label={tCommon('cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Textarea */}
        <div className="relative mb-3">
          <textarea
            value={rawNote}
            onChange={(e) => setRawNote(e.target.value)}
            placeholder={t('placeholder')}
            rows={5}
            autoFocus
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 pr-14 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none"
          />
          <div className="absolute bottom-2 right-2">
            <MicButton
              isSupported={speech.isSupported}
              isListening={speech.isListening}
              disabled={aiLoading || saving}
              onStart={speech.start}
              onStop={speech.stop}
            />
          </div>
        </div>

        {/* Speech status */}
        {speech.isListening && (
          <p className="mb-3 flex items-center gap-2 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
            <span
              aria-hidden="true"
              className="motion-safe:animate-pulse h-2 w-2 rounded-full bg-rose-400"
            />
            <span className="truncate">{speech.interimTranscript || t('micListening')}</span>
          </p>
        )}
        {speech.error && !speech.isListening && (
          <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {speechErrorMessage(speech.error, t)}
          </p>
        )}

        {/* AI error */}
        {aiError && (
          <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {t('aiError')}
          </p>
        )}

        {/* AI result */}
        {aiResult && (
          <div className="mb-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {t('aiResultTitle')}
              </span>
            </div>

            {aiResult.structuredSummary && (
              <p className="mb-2 text-sm text-slate-300">{aiResult.structuredSummary}</p>
            )}

            <div className="flex flex-col gap-1 text-xs">
              {aiResult.preflopTendency && (
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">{t('aiPreflopLabel')}: </span>
                  {aiResult.preflopTendency}
                </p>
              )}
              {aiResult.postflopTendency && (
                <p className="text-slate-400">
                  <span className="font-semibold text-slate-300">{t('aiPostflopLabel')}: </span>
                  {aiResult.postflopTendency}
                </p>
              )}
            </div>

            {aiResult.suggestedTags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {aiResult.suggestedTags.map((tag) => (
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

        {/* Actions */}
        <div className="flex gap-2">
          {/* AI button */}
          <button
            onClick={handleAi}
            disabled={!rawNote.trim() || aiLoading || saving}
            className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aiLoading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                {t('aiProcessing')}
              </>
            ) : (
              <>
                <Sparkles size={15} />
                {t('aiButton')}
              </>
            )}
          </button>

          {/* Save button */}
          <button
            onClick={() => handleSave(aiResult !== null)}
            disabled={!rawNote.trim() || saving || aiLoading}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {aiResult ? t('saveWithAi') : t('save')}
          </button>
        </div>
      </div>
    </div>
  );
}
