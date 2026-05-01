'use client';

import { useCallback, useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { useSpeechToText } from '@/lib/speech/useSpeechToText';
import { MicButton, speechErrorMessage } from '@/components/notes/MicButton';
import type { Hand } from '@/lib/storage';
import { HandStructuredView } from './HandStructuredView';

// Mirrors AiHandResponse from lib/ai/handStructurer. Kept local to avoid a
// runtime dep on the AI module from the client bundle.
interface StructuredHand {
  title: string;
  summary: string;
  variant?: string;
  format?: string;
  stakes?: string;
  heroPosition?: string;
  villainPosition?: string;
  heroHand?: string;
  villainHand?: string;
  board?: string;
  preflopAction?: string;
  flopAction?: string;
  turnAction?: string;
  riverAction?: string;
  potSize?: string;
  result?: string;
  heroResult?: string;
  keyMoment?: string;
  tags?: string[];
  confidence?: number;
}

interface HandComposerProps {
  playerId?: string;
  playerNickname?: string;
  sessionId?: string;
  /** When provided, the composer pre-fills with this hand's data (edit mode). */
  initialHand?: Hand;
  onSave: (hand: Omit<Hand, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onClose: () => void;
}

export function HandComposer({
  playerId,
  playerNickname,
  sessionId,
  initialHand,
  onSave,
  onClose,
}: HandComposerProps) {
  const t = useTranslations('hands.composer');
  const tComposer = useTranslations('notes.composer');
  const tCommon = useTranslations('common');
  const locale = useLocale() as 'en' | 'es';

  const isEditing = !!initialHand;

  const [rawDescription, setRawDescription] = useState(() => initialHand?.rawDescription ?? '');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<StructuredHand | null>(() => {
    if (!initialHand?.aiProcessed) return null;
    const data = initialHand.structuredData as unknown as StructuredHand;
    return data.title ? data : null;
  });
  const [aiError, setAiError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Hint is shown only after a first AI run, to refine a regenerate.
  const [hint, setHint] = useState('');

  const handleSpeechSegment = useCallback((text: string) => {
    setRawDescription((prev) => (prev ? `${prev.replace(/\s+$/, '')} ${text}` : text));
  }, []);

  const speech = useSpeechToText({ locale, onFinalSegment: handleSpeechSegment });

  async function handleAi() {
    if (rawDescription.trim().length < 20 || aiLoading) return;
    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const res = await fetch('/api/ai/structure-hand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: rawDescription,
          playerNickname,
          locale,
          hint: hint.trim() ? hint.trim() : undefined,
        }),
      });

      if (res.status === 403) {
        setAiError(t('proRequired'));
        return;
      }
      if (res.status === 429) {
        setAiError(t('rateLimited'));
        return;
      }
      if (!res.ok) {
        setAiError(t('aiError'));
        return;
      }

      const data = (await res.json()) as StructuredHand;
      setAiResult(data);
    } catch {
      setAiError(t('aiError'));
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSave() {
    if (!rawDescription.trim()) return;
    setSaving(true);
    try {
      await onSave({
        playerId: playerId ?? initialHand?.playerId,
        sessionId: sessionId ?? initialHand?.sessionId,
        rawDescription: rawDescription.trim(),
        // When the user skipped AI, persist a minimal structured object so
        // the detail view always has something to render. The aiProcessed
        // flag lets the UI offer a "Structure with AI" action later.
        structuredData: (aiResult ?? {
          title: rawDescription.trim().slice(0, 80),
          summary: rawDescription.trim().slice(0, 200),
        }) as unknown as Record<string, unknown>,
        aiProcessed: aiResult !== null,
      });
    } finally {
      setSaving(false);
    }
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  const canStructure = rawDescription.trim().length >= 20;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-950 p-5 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-white">
            {isEditing ? t('editTitle') : t('title')}
          </h3>
          <button
            onClick={onClose}
            aria-label={tCommon('close')}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Player context hint */}
        {playerNickname && (
          <p className="mb-3 text-xs text-slate-500">{t('vs', { name: playerNickname })}</p>
        )}

        {/* Textarea */}
        <div className="relative mb-3">
          <textarea
            value={rawDescription}
            onChange={(e) => setRawDescription(e.target.value)}
            placeholder={t('placeholder')}
            rows={6}
            autoFocus
            disabled={aiLoading || saving}
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-3 pr-14 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-60"
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
            <span className="truncate">
              {speech.interimTranscript || tComposer('micListening')}
            </span>
          </p>
        )}
        {speech.error && !speech.isListening && (
          <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {speechErrorMessage(speech.error, tComposer)}
          </p>
        )}

        {/* AI error */}
        {aiError && (
          <p className="mb-3 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-400">
            {aiError}
          </p>
        )}

        {/* AI result preview */}
        {aiResult && (
          <div className="mb-3 max-h-64 overflow-y-auto rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5">
            <div className="mb-2 flex items-center gap-1.5">
              <Sparkles size={13} className="text-emerald-400" />
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {tComposer('aiResultTitle')}
              </span>
            </div>
            <HandStructuredView hand={aiResult} compact />
          </div>
        )}

        {/* Hint textarea — shown after a first AI run to refine the regenerate */}
        {aiResult && (
          <div className="mb-3">
            <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {t('hintLabel')}
            </label>
            <textarea
              value={hint}
              onChange={(e) => setHint(e.target.value)}
              placeholder={t('hintPlaceholder')}
              rows={2}
              maxLength={800}
              disabled={aiLoading || saving}
              className="w-full resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm leading-relaxed text-white placeholder-slate-500 focus:border-slate-600 focus:outline-none disabled:opacity-60"
            />
            <p className="mt-1 text-[11px] text-slate-500">{t('hintHelp')}</p>
          </div>
        )}

        {/* Min-length hint */}
        {!canStructure && rawDescription.length > 0 && !aiResult && (
          <p className="mb-3 text-xs text-slate-500">{t('minLengthHint')}</p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleAi}
            disabled={!canStructure || aiLoading || saving}
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
                {aiResult ? t('aiReButton') : t('aiButton')}
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={!rawDescription.trim() || saving || aiLoading}
            className="flex min-h-[44px] flex-1 items-center justify-center rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 size={15} className="animate-spin" />
            ) : isEditing ? (
              t('saveChanges')
            ) : aiResult ? (
              t('saveStructured')
            ) : (
              t('saveRaw')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
