'use client';

import { Mic, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { SpeechErrorKind } from '@/lib/speech/useSpeechToText';

export function speechErrorMessage(error: SpeechErrorKind, t: (key: string) => string): string {
  switch (error) {
    case 'permission-denied':
      return t('micPermissionDenied');
    case 'no-speech':
      return t('micNoSpeech');
    case 'audio-capture':
      return t('micAudioCapture');
    default:
      return t('micError');
  }
}

interface MicButtonProps {
  isSupported: boolean;
  isListening: boolean;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
}

export function MicButton({ isSupported, isListening, disabled, onStart, onStop }: MicButtonProps) {
  const t = useTranslations('notes.composer');

  if (!isSupported) return null;

  const label = isListening ? t('micStop') : t('micStart');

  return (
    <button
      type="button"
      onClick={isListening ? onStop : onStart}
      disabled={disabled}
      aria-label={label}
      aria-pressed={isListening}
      title={label}
      className={
        'relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ' +
        (isListening
          ? 'border-rose-500/40 bg-rose-500/15 text-rose-400 hover:bg-rose-500/25'
          : 'border-slate-700 bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white')
      }
    >
      {isListening ? <Square size={16} fill="currentColor" /> : <Mic size={18} />}
      {isListening && (
        <span
          aria-hidden="true"
          className="motion-safe:animate-ping absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500"
        />
      )}
    </button>
  );
}
