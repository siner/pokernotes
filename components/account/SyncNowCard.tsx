'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, RefreshCw } from 'lucide-react';
import { refreshCloudSync } from '@/lib/storage/sync';
import { useSyncState } from '@/lib/storage/useSyncState';

export function SyncNowCard() {
  const t = useTranslations('sync');
  const state = useSyncState();
  const [busy, setBusy] = useState(false);

  async function handleSync() {
    setBusy(true);
    try {
      await refreshCloudSync();
    } finally {
      setBusy(false);
    }
  }

  const isSyncing = busy || state.status === 'syncing';

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a110d] p-6 shadow-xl">
      <h2 className="mb-2 text-xl font-semibold text-white">{t('syncNow')}</h2>
      <p className="mb-4 text-sm text-slate-400">{t('syncDescription')}</p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-wait disabled:opacity-70"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          {isSyncing ? t('syncing') : t('syncNow')}
        </button>

        <span className="text-xs text-slate-500">
          {state.lastSyncedAt
            ? t('lastSynced', { time: state.lastSyncedAt.toLocaleTimeString() })
            : t('neverSynced')}
        </span>
      </div>
    </div>
  );
}
