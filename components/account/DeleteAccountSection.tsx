'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Trash2 } from 'lucide-react';
import { authClient } from '@/lib/auth/client';
import { useRouter } from '@/i18n/navigation';

const ACTIVE_SESSION_KEY = 'pn_active_session';
const IDB_NAME = 'pokerreads';

async function wipeLocalData(): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  } catch {
    /* ignore */
  }
  await new Promise<void>((resolve) => {
    const req = window.indexedDB.deleteDatabase(IDB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
}

export function DeleteAccountSection() {
  const t = useTranslations('settings');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirmWord = t('deleteAccountConfirmWord');
  const canDelete = confirmInput.trim() === confirmWord && !submitting;

  async function handleDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/account', { method: 'DELETE' });
      if (!res.ok) {
        setError(t('deleteAccountError'));
        setSubmitting(false);
        return;
      }
      await wipeLocalData();
      try {
        await authClient.signOut();
      } catch {
        /* server already deleted the session — ignore */
      }
      router.push('/');
      router.refresh();
    } catch {
      setError(t('deleteAccountError'));
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 shadow-xl">
      <h2 className="mb-2 text-xl font-semibold text-red-300">{t('dangerZone')}</h2>
      <p className="mb-4 text-sm text-slate-400">{t('deleteAccountDescription')}</p>

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-colors hover:bg-red-500/20"
        >
          <Trash2 className="h-4 w-4" />
          {t('deleteAccount')}
        </button>
      ) : (
        <div className="space-y-3">
          <label className="flex flex-col gap-1.5 text-sm text-slate-300">
            {t('deleteAccountConfirm', { word: confirmWord })}
            <input
              type="text"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              autoFocus
              autoComplete="off"
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-sm text-white focus:border-red-500/50 focus:outline-none"
            />
          </label>

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDelete}
              disabled={!canDelete}
              className="flex items-center gap-2 rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? t('deleteAccountDeleting') : t('deleteAccountAction')}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                setConfirmInput('');
                setError(null);
              }}
              disabled={submitting}
              className="rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              {t('deleteAccountCancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
