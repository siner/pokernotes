'use client';

import { useTranslations } from 'next-intl';
import { useSession } from '@/lib/auth/client';
import { useRouter } from '@/i18n/navigation';
import { Loader2, Zap, CheckCircle2, Download } from 'lucide-react';
import { DeleteAccountSection } from '@/components/account/DeleteAccountSection';
import { SyncNowCard } from '@/components/account/SyncNowCard';
import { VerifyEmailBanner } from '@/components/account/VerifyEmailBanner';
import { useEffect, useState } from 'react';

import { useSearchParams } from 'next/navigation';

export function SettingsClient({ initialTier }: { initialTier: string }) {
  const { data: session, isPending } = useSession();
  const t = useTranslations('settings');
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutSuccess = searchParams.get('checkout') === 'success';
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingExport, setLoadingExport] = useState(false);
  const [exportError, setExportError] = useState(false);

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push('/login');
    }
  }, [session, isPending, router]);

  if (isPending || !session?.user) {
    return (
      <div className="flex h-[50vh] w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const { user } = session;
  const isPro = initialTier === 'pro';

  const handleExport = async () => {
    setLoadingExport(true);
    setExportError(false);
    try {
      const res = await fetch('/api/export');
      if (!res.ok) {
        setExportError(true);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pokerreads-export-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError(true);
    } finally {
      setLoadingExport(false);
    }
  };

  const handleManageBilling = async () => {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to load portal');
        setLoadingPortal(false);
      }
    } catch (err) {
      console.error(err);
      setLoadingPortal(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {checkoutSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-400">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-medium">
              Payment successful! Your account has been upgraded.
            </p>
          </div>
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-slate-400">
          {t('memberSince', { date: new Date(user.createdAt).toLocaleDateString() })}
        </p>
      </div>

      <VerifyEmailBanner />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0a110d] p-6 shadow-xl">
          <h2 className="mb-4 text-xl font-semibold text-white">{t('profile')}</h2>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/20 bg-slate-800">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name || 'User'}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-display text-2xl font-bold text-slate-300 uppercase">
                  {user.name?.[0] || user.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Subscription Card */}
        <div className="rounded-2xl border border-white/5 bg-[#0a110d] p-6 shadow-xl flex flex-col">
          <h2 className="mb-4 text-xl font-semibold text-white">{t('subscription')}</h2>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">{t('currentPlan')}</span>
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${isPro ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}
              >
                {isPro ? <Zap className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                {isPro ? t('proPlan') : t('freePlan')}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-auto">
            {isPro ? (
              <button
                onClick={handleManageBilling}
                disabled={loadingPortal}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:opacity-70"
              >
                {loadingPortal && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('manageBilling')}
              </button>
            ) : (
              <button
                onClick={() => router.push('/pricing')}
                className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-emerald-500/40"
              >
                {t('upgradeToPro')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Data & Export Card */}
      <div className="rounded-2xl border border-white/5 bg-[#0a110d] p-6 shadow-xl">
        <h2 className="mb-2 text-xl font-semibold text-white">{t('data')}</h2>
        <p className="mb-4 text-sm text-slate-400">
          {isPro ? t('exportCsvDescription') : t('exportCsvProOnly')}
        </p>

        {exportError && (
          <p className="mb-3 text-sm text-red-400" role="alert">
            {t('exportError')}
          </p>
        )}

        <button
          onClick={handleExport}
          disabled={!isPro || loadingExport}
          className="flex items-center justify-center gap-2 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingExport ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {t('exportCsv')}
        </button>
      </div>

      {isPro && <SyncNowCard />}

      <DeleteAccountSection />
    </div>
  );
}
