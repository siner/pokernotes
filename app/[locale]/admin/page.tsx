import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ArrowLeft, Crown, Sparkles, StickyNote, User as UserIcon, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { requireAdmin } from '@/lib/auth/requireAdmin';
import {
  getAiUsageStats,
  getDailyAiCalls,
  getOverview,
  getRecentUsers,
  getTopAiUsers,
} from '@/lib/admin/queries';

export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin');
  return {
    title: t('metaTitle'),
    robots: { index: false, follow: false },
  };
}

export default async function AdminPage() {
  const reqHeaders = await headers();
  const auth = await requireAdmin(reqHeaders);
  if (!auth.ok) notFound();

  const t = await getTranslations('admin');
  const { db } = auth.ctx;

  const [overview, recentUsers, aiStats, topAiUsers, dailyCalls] = await Promise.all([
    getOverview(db),
    getRecentUsers(db, 50),
    getAiUsageStats(db, 30),
    getTopAiUsers(db, 30, 10),
    getDailyAiCalls(db, 14),
  ]);

  const successRate =
    aiStats.totalCalls === 0 ? null : Math.round((aiStats.successCalls / aiStats.totalCalls) * 100);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToApp')}
        </Link>
        <span className="font-mono text-xs text-slate-600">
          {t('signedInAs', { email: auth.ctx.email })}
        </span>
      </div>

      <header className="mb-8">
        <h1 className="mb-1 text-3xl font-bold tracking-tight text-white sm:text-4xl">
          {t('title')}
        </h1>
        <p className="text-sm text-slate-400">{t('subtitle')}</p>
      </header>

      {/* KPI cards */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('kpis.title')}
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi
            icon={<Users size={14} />}
            label={t('kpis.totalUsers')}
            value={overview.totalUsers}
            sub={t('kpis.tierBreakdown', {
              free: overview.freeUsers,
              pro: overview.proUsers,
            })}
          />
          <Kpi
            icon={<Crown size={14} />}
            label={t('kpis.proUsers')}
            value={overview.proUsers}
            sub={
              overview.totalUsers > 0
                ? t('kpis.conversion', {
                    pct: ((overview.proUsers / overview.totalUsers) * 100).toFixed(1),
                  })
                : '—'
            }
          />
          <Kpi
            icon={<UserIcon size={14} />}
            label={t('kpis.signups7d')}
            value={overview.signups7d}
            sub={t('kpis.signups30d', { count: overview.signups30d })}
          />
          <Kpi
            icon={<StickyNote size={14} />}
            label={t('kpis.notesTotal')}
            value={overview.totalNotes}
            sub={t('kpis.playersAndSessions', {
              players: overview.totalPlayers,
              sessions: overview.totalSessions,
            })}
          />
        </div>
      </section>

      {/* AI usage */}
      <section className="mb-10">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('ai.title')}
        </h2>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label={t('ai.totalCalls30d')} value={aiStats.totalCalls} />
            <Stat
              label={t('ai.successRate')}
              value={successRate === null ? '—' : `${successRate}%`}
            />
            <Stat label={t('ai.failed')} value={aiStats.failedCalls} />
            <Stat label={t('ai.uniqueUsers')} value={aiStats.uniqueUsers} />
          </div>

          {/* Daily breakdown */}
          {dailyCalls.length > 0 && (
            <div className="mt-5 rounded-xl border border-slate-800/60 bg-slate-950/40 p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                {t('ai.last14Days')}
              </p>
              <div className="flex flex-col gap-1">
                {dailyCalls.map((d) => {
                  const max = Math.max(...dailyCalls.map((x) => x.total), 1);
                  const pct = (d.total / max) * 100;
                  return (
                    <div key={d.day} className="flex items-center gap-3 text-xs">
                      <span className="w-20 shrink-0 font-mono text-slate-500">{d.day}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className="h-full rounded-full bg-emerald-500/70"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-16 shrink-0 text-right font-mono text-slate-400">
                        {d.success}/{d.total}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top users */}
          {topAiUsers.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-600">
                {t('ai.topUsers')}
              </p>
              <div className="flex flex-col gap-1">
                {topAiUsers.map((u) => (
                  <div
                    key={u.userId ?? 'anon'}
                    className="flex items-center justify-between rounded-lg border border-slate-800/60 bg-slate-950/30 px-3 py-2 text-xs"
                  >
                    <span className="truncate text-slate-300">
                      {u.email ?? t('ai.unknownUser')}
                    </span>
                    <span className="ml-3 flex shrink-0 items-center gap-1 font-mono text-emerald-400">
                      <Sparkles size={11} />
                      {u.callCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiStats.totalCalls === 0 && (
            <p className="mt-4 text-sm text-slate-500">{t('ai.noData')}</p>
          )}
        </div>
      </section>

      {/* Recent users */}
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
          {t('users.title')}
        </h2>
        {recentUsers.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-5 text-sm text-slate-500">
            {t('users.empty')}
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50">
            <div className="hidden grid-cols-[1.5fr_0.6fr_0.5fr_1fr_0.7fr] gap-3 border-b border-slate-800 bg-slate-950/40 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-widest text-slate-500 sm:grid">
              <span>{t('users.cols.email')}</span>
              <span>{t('users.cols.tier')}</span>
              <span>{t('users.cols.locale')}</span>
              <span>{t('users.cols.subscription')}</span>
              <span className="text-right">{t('users.cols.signedUp')}</span>
            </div>
            <ul className="divide-y divide-slate-800">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="grid grid-cols-1 gap-1 px-4 py-3 text-sm sm:grid-cols-[1.5fr_0.6fr_0.5fr_1fr_0.7fr] sm:items-center sm:gap-3"
                >
                  <span className="truncate text-white">{u.email}</span>
                  <span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[11px] ${
                        u.tier === 'pro'
                          ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border border-slate-700 bg-slate-800 text-slate-400'
                      }`}
                    >
                      {u.tier}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-slate-500">{u.preferredLocale}</span>
                  <span className="truncate text-xs text-slate-500">
                    {u.subscriptionStatus ?? '—'}
                  </span>
                  <span className="text-right font-mono text-xs text-slate-500">
                    {u.createdAt.toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="mb-1 flex items-center gap-1.5 text-slate-500">
        {icon}
        <span className="text-[11px] font-semibold uppercase tracking-widest">{label}</span>
      </div>
      <p className="font-mono text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p className="font-mono text-xl font-bold text-white">{value}</p>
    </div>
  );
}
