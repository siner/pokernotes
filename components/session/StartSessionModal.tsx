'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { saveSession, setActiveSessionId, type LocalSession } from '@/lib/storage/local';

interface StartSessionModalProps {
  onClose: () => void;
}

export function StartSessionModal({ onClose }: StartSessionModalProps) {
  const t = useTranslations('session.startModal');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [name, setName] = useState('');

  async function handleStart() {
    const now = new Date();
    const session: LocalSession = {
      id: globalThis.crypto.randomUUID(),
      name: name.trim() || undefined,
      startedAt: now,
      createdAt: now,
    };
    await saveSession(session);
    setActiveSessionId(session.id);
    onClose();
    router.push('/session');
  }

  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-950 p-6 sm:rounded-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
          <button
            onClick={onClose}
            aria-label={tCommon('cancel')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          placeholder={t('namePlaceholder')}
          autoFocus
          className="mb-1.5 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
        />
        <p className="mb-5 text-xs text-slate-600">{t('nameHint')}</p>

        <button
          onClick={handleStart}
          className="w-full min-h-[48px] rounded-xl bg-emerald-500 text-sm font-semibold text-slate-950 hover:opacity-90"
        >
          {t('startButton')}
        </button>
      </div>
    </div>
  );
}
