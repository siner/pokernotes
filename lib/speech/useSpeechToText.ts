'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionErrorCode =
  | 'no-speech'
  | 'aborted'
  | 'audio-capture'
  | 'network'
  | 'not-allowed'
  | 'service-not-allowed'
  | 'bad-grammar'
  | 'language-not-supported';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: SpeechRecognitionErrorCode;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}

function getSpeechRecognition(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ─── Wake Lock ────────────────────────────────────────────────────────────────
//
// Keeps the screen on during dictation. Mobile screens auto-lock after ~30s by
// default — the user reported losing a long dictation that way. The Wake Lock
// API is supported on Chrome/Edge/Safari iOS 16.4+. Quietly noop where it is
// not available; auto-reacquires on visibilitychange because the browser
// releases the lock when the tab is hidden.

interface WakeLockSentinelLike {
  release(): Promise<void>;
}

interface NavigatorWakeLock {
  wakeLock?: {
    request(type: 'screen'): Promise<WakeLockSentinelLike>;
  };
}

async function acquireWakeLock(): Promise<WakeLockSentinelLike | null> {
  if (typeof navigator === 'undefined') return null;
  const nav = navigator as unknown as NavigatorWakeLock;
  if (!nav.wakeLock) return null;
  try {
    return await nav.wakeLock.request('screen');
  } catch {
    return null;
  }
}

const LOCALE_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  es: 'es-ES',
};

export type SpeechErrorKind = 'permission-denied' | 'no-speech' | 'audio-capture' | 'generic';

interface UseSpeechToTextOptions {
  locale: string;
  onFinalSegment: (text: string) => void;
}

interface UseSpeechToTextReturn {
  isSupported: boolean;
  isListening: boolean;
  interimTranscript: string;
  error: SpeechErrorKind | null;
  start: () => void;
  stop: () => void;
}

export function useSpeechToText({
  locale,
  onFinalSegment,
}: UseSpeechToTextOptions): UseSpeechToTextReturn {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<SpeechErrorKind | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null);
  const onFinalSegmentRef = useRef(onFinalSegment);

  useEffect(() => {
    onFinalSegmentRef.current = onFinalSegment;
  }, [onFinalSegment]);

  useEffect(() => {
    setIsSupported(getSpeechRecognition() !== null);
  }, []);

  const releaseWakeLock = useCallback(async () => {
    const lock = wakeLockRef.current;
    wakeLockRef.current = null;
    if (lock) {
      try {
        await lock.release();
      } catch {
        // ignore: the lock may have been released by the browser already
      }
    }
  }, []);

  // The browser releases the screen Wake Lock automatically when the tab is
  // hidden. Re-acquire when it becomes visible again so a quick app-switch
  // doesn't lose the lock for the rest of a long dictation.
  useEffect(() => {
    function handleVisibility() {
      if (
        document.visibilityState === 'visible' &&
        recognitionRef.current &&
        !wakeLockRef.current
      ) {
        void acquireWakeLock().then((lock) => {
          if (lock && recognitionRef.current) wakeLockRef.current = lock;
          else if (lock) void lock.release();
        });
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        rec.onresult = null;
        rec.onerror = null;
        rec.onend = null;
        rec.onstart = null;
        try {
          rec.abort();
        } catch {
          // ignore: recognition may already be stopped
        }
        recognitionRef.current = null;
      }
      void releaseWakeLock();
    };
  }, [releaseWakeLock]);

  const start = useCallback(() => {
    const Ctor = getSpeechRecognition();
    if (!Ctor) {
      setIsSupported(false);
      return;
    }
    if (recognitionRef.current) return;

    const rec = new Ctor();
    rec.lang = LOCALE_TO_BCP47[locale] ?? locale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setError(null);
      setIsListening(true);
      setInterimTranscript('');
      // Acquire Wake Lock so the screen does not auto-lock during long
      // dictations. Best-effort — silently noops on browsers that lack the API.
      void acquireWakeLock().then((lock) => {
        if (lock && recognitionRef.current) wakeLockRef.current = lock;
        else if (lock) void lock.release();
      });
    };

    rec.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? '';
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) onFinalSegmentRef.current(trimmed);
        } else {
          interim += text;
        }
      }
      setInterimTranscript(interim);
    };

    rec.onerror = (event) => {
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setError('permission-denied');
          break;
        case 'no-speech':
          setError('no-speech');
          break;
        case 'audio-capture':
          setError('audio-capture');
          break;
        case 'aborted':
          break;
        default:
          setError('generic');
      }
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      recognitionRef.current = null;
      void releaseWakeLock();
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError('generic');
      void releaseWakeLock();
    }
  }, [locale, releaseWakeLock]);

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {
      // ignore: recognition may have already ended
    }
  }, []);

  return { isSupported, isListening, interimTranscript, error, start, stop };
}
