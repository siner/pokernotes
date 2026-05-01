import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { ArrowRight, Eye, Sparkles } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getDb } from '@/lib/db';
import { hands } from '@/lib/db/schema';
import { HandStructuredView } from '@/components/hands/HandStructuredView';

type Props = {
  params: Promise<{ locale: string; token: string }>;
};

interface SharedHand {
  id: string;
  structuredData: Record<string, unknown>;
  shareCreatedAt: Date | null;
  shareViewCount: number;
  createdAt: Date;
}

async function loadShared(token: string): Promise<SharedHand | null> {
  if (!token || token.length > 80) return null;
  const { env } = await getCloudflareContext({ async: true });
  const db = getDb(env.DB);
  const row = await db
    .select({
      id: hands.id,
      structuredData: hands.structuredData,
      shareCreatedAt: hands.shareCreatedAt,
      shareViewCount: hands.shareViewCount,
      createdAt: hands.createdAt,
    })
    .from(hands)
    .where(and(eq(hands.shareToken, token), isNotNull(hands.shareToken), isNull(hands.deletedAt)))
    .get();
  if (!row) return null;
  return {
    id: row.id,
    structuredData: row.structuredData as Record<string, unknown>,
    shareCreatedAt: row.shareCreatedAt ?? null,
    shareViewCount: row.shareViewCount ?? 0,
    createdAt: row.createdAt,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, token } = await params;
  const t = await getTranslations({ locale, namespace: 'hands.share' });

  const shared = await loadShared(token);
  if (!shared) {
    return { title: t('notFoundMetaTitle'), robots: { index: false, follow: false } };
  }

  const data = shared.structuredData as { title?: string; summary?: string };
  const title = data.title ?? t('metaTitleFallback');
  const description = data.summary ?? t('metaDescriptionFallback');

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      type: 'article',
      title,
      description,
      // opengraph-image.tsx in this segment auto-injects the image
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function SharedHandPage({ params }: Props) {
  const { token } = await params;
  const t = await getTranslations('hands.share');

  const shared = await loadShared(token);

  if (!shared) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-white">{t('notFoundTitle')}</h1>
          <p className="mb-6 text-sm text-slate-400">{t('notFoundDescription')}</p>
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
          >
            {t('notFoundCta')}
            <ArrowRight size={15} />
          </Link>
        </div>
      </main>
    );
  }

  const data = shared.structuredData as unknown as Parameters<typeof HandStructuredView>[0]['hand'];
  const sharedAt = (shared.shareCreatedAt ?? shared.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8">
      {/* Hero banner */}
      <div className="relative mb-6 overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-5">
        <div
          className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-emerald-500/15 blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-emerald-400">
                {t('banner.eyebrow')}
              </p>
              <p className="text-sm font-semibold text-white">{t('banner.title')}</p>
            </div>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
          >
            {t('banner.cta')}
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Meta */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>{sharedAt}</span>
        <span className="inline-flex items-center gap-1">
          <Eye size={12} />
          {t('viewCount', { count: shared.shareViewCount })}
        </span>
      </div>

      {/* Structured view */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-2xl shadow-black/20">
        <HandStructuredView hand={data} />
      </div>

      {/* Footer CTA */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center">
        <h2 className="mb-1 text-base font-semibold text-white">{t('footer.title')}</h2>
        <p className="mb-4 text-sm text-slate-400">{t('footer.description')}</p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          {t('footer.cta')}
          <ArrowRight size={15} />
        </Link>
      </div>
    </main>
  );
}
