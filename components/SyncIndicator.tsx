'use client';

import { AlertTriangle, CheckCircle2, CloudOff, Loader2, RotateCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useSyncState } from '@/lib/storage/useSyncState';
import { useUserTier } from '@/lib/auth/useUserTier';
import { refreshCloudSync } from '@/lib/storage/sync';
import { drainPending } from '@/lib/storage/hybrid';

export function SyncIndicator() {
  const t = useTranslations('sync');
  const { tier, isLoading } = useUserTier();
  const state = useSyncState();
  const [showDetail, setShowDetail] = useState(false);

  if (isLoading || tier !== 'pro') return null;

  const handleClick = () => {
    if (state.status === 'syncing' || state.status === 'offline') {
      setShowDetail((v) => !v);
      return;
    }
    if (state.status === 'pending' || state.status === 'error') {
      void drainPending();
      return;
    }
    // idle: trigger a manual refresh
    void refreshCloudSync();
  };

  const { icon, label, tone } = renderState(state.status, state.pendingCount, t);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        title={titleFor(state.lastSyncedAt, t)}
        aria-label={label}
        className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium transition-colors ${tone}`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </button>

      {showDetail && state.lastError && (
        <div className="absolute right-0 top-full mt-1 max-w-[14rem] rounded-lg border border-red-500/30 bg-slate-900 p-2 text-xs text-red-300 shadow-lg">
          {state.lastError}
        </div>
      )}
    </div>
  );
}

function renderState(
  status: ReturnType<typeof useSyncState>['status'],
  count: number,
  t: ReturnType<typeof useTranslations>
) {
  switch (status) {
    case 'syncing':
      return {
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: t('syncing'),
        tone: 'bg-emerald-500/10 text-emerald-400',
      };
    case 'pending':
      return {
        icon: <RotateCw className="h-3.5 w-3.5" />,
        label: t('pending', { count }),
        tone: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
      };
    case 'error':
      return {
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
        label: t('error'),
        tone: 'bg-red-500/10 text-red-400 hover:bg-red-500/20',
      };
    case 'offline':
      return {
        icon: <CloudOff className="h-3.5 w-3.5" />,
        label: t('offline'),
        tone: 'bg-slate-500/10 text-slate-400',
      };
    case 'idle':
    default:
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        label: t('synced'),
        tone: 'bg-white/5 text-slate-400 hover:bg-white/10',
      };
  }
}

function titleFor(lastSyncedAt: Date | null, t: ReturnType<typeof useTranslations>): string {
  if (!lastSyncedAt) return t('neverSynced');
  return t('lastSynced', { time: lastSyncedAt.toLocaleTimeString() });
}
