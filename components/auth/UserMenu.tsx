'use client';
/* global HTMLDivElement, MouseEvent, Node */

import { useTranslations } from 'next-intl';
import { useSession, signOut } from '@/lib/auth/client';
import { resetUserTierCache, useUserTier } from '@/lib/auth/useUserTier';
import { Link, useRouter } from '@/i18n/navigation';
import { LogOut, Settings, Loader2, RefreshCw, AlertTriangle, CloudOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useSyncState } from '@/lib/storage/useSyncState';
import { refreshCloudSync } from '@/lib/storage/sync';
import { drainPending } from '@/lib/storage/hybrid';
import type { SyncStatus } from '@/lib/storage/syncState';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('nav');
  const tSync = useTranslations('sync');
  const router = useRouter();
  const { tier } = useUserTier();
  const isPro = tier === 'pro';
  const sync = useSyncState();
  const [isOpen, setIsOpen] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    resetUserTierCache();
    router.push('/');
  };

  const handleSyncNow = async () => {
    setSyncBusy(true);
    try {
      if (sync.status === 'pending' || sync.status === 'error') {
        await drainPending();
      } else {
        await refreshCloudSync();
      }
    } finally {
      setSyncBusy(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center p-2">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-1.5 sm:gap-3">
        <Link
          href="/login"
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5 hover:text-white"
        >
          {t('signIn')}
        </Link>
        <Link
          href="/signup"
          className="hidden sm:block rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40"
        >
          {t('signUp')}
        </Link>
      </div>
    );
  }

  const { user } = session;
  // Show a status dot on the avatar only when something is worth surfacing
  // (Pro tier + state isn't the silent "everything synced" idle).
  const showDot = isPro && sync.status !== 'idle';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex items-center justify-center h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-slate-800 transition-transform hover:scale-105 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#060d08]"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || 'User'} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-medium text-slate-300 uppercase">
            {user.name?.[0] || user.email?.[0] || 'U'}
          </span>
        )}
      </button>

      {showDot && (
        <span
          aria-hidden
          className={`pointer-events-none absolute -right-0.5 -top-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-[#060d08] ${dotTone(sync.status)}`}
        >
          {sync.status === 'syncing' && (
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
          )}
        </span>
      )}

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-white/10 bg-[#0c1410] p-1 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="px-3 py-2.5 border-b border-white/5 mb-1">
            <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

          {isPro && (
            <div className="mb-1 border-b border-white/5 px-3 py-2">
              <div className="mb-1.5 flex items-center gap-2 text-xs">
                <SyncStatusIcon status={sync.status} />
                <span className="font-medium text-slate-300">
                  {syncLabel(sync.status, sync.pendingCount, tSync)}
                </span>
              </div>
              <p className="mb-2 text-[11px] text-slate-500">
                {sync.lastSyncedAt
                  ? tSync('lastSynced', { time: sync.lastSyncedAt.toLocaleTimeString() })
                  : tSync('neverSynced')}
              </p>
              <button
                onClick={handleSyncNow}
                disabled={syncBusy || sync.status === 'syncing' || sync.status === 'offline'}
                className="flex w-full items-center justify-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {syncBusy || sync.status === 'syncing' ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
                {tSync('syncNow')}
              </button>
            </div>
          )}

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-4 w-4" />
            {t('settings')}
          </Link>

          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 mt-1"
          >
            <LogOut className="h-4 w-4" />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}

function dotTone(status: SyncStatus): string {
  switch (status) {
    case 'syncing':
      return 'bg-emerald-400 text-emerald-400';
    case 'pending':
      return 'bg-amber-400 text-amber-400';
    case 'error':
      return 'bg-red-500 text-red-500';
    case 'offline':
      return 'bg-slate-400 text-slate-400';
    case 'idle':
    default:
      return 'bg-emerald-500 text-emerald-500';
  }
}

function SyncStatusIcon({ status }: { status: SyncStatus }) {
  switch (status) {
    case 'syncing':
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-400" />;
    case 'pending':
      return <RefreshCw className="h-3.5 w-3.5 text-amber-400" />;
    case 'error':
      return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
    case 'offline':
      return <CloudOff className="h-3.5 w-3.5 text-slate-400" />;
    case 'idle':
    default:
      return <span className="h-2 w-2 rounded-full bg-emerald-500" />;
  }
}

function syncLabel(
  status: SyncStatus,
  pendingCount: number,
  t: ReturnType<typeof useTranslations>
): string {
  switch (status) {
    case 'syncing':
      return t('syncing');
    case 'pending':
      return t('pending', { count: pendingCount });
    case 'error':
      return t('error');
    case 'offline':
      return t('offline');
    case 'idle':
    default:
      return t('synced');
  }
}
