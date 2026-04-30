'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Trash2, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { useStorage, type Hand, type Player } from '@/lib/storage';
import { useUserTier } from '@/lib/auth/useUserTier';
import { HandStructuredView } from './HandStructuredView';

interface HandDetailProps {
  handId: string;
}

export function HandDetail({ handId }: HandDetailProps) {
  const t = useTranslations('hands.detail');
  const tCommon = useTranslations('common');
  const router = useRouter();

  const storage = useStorage();
  const { tier, isLoading: tierLoading } = useUserTier();
  const isPro = tier === 'pro';

  const [hand, setHand] = useState<Hand | null | undefined>(undefined);
  const [player, setPlayer] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    const h = await storage.getHand(handId);
    if (!h) {
      setHand(null);
      setPlayer(null);
      return;
    }
    setHand(h);
    if (h.playerId) {
      const p = await storage.getPlayer(h.playerId);
      setPlayer(p ?? null);
    }
  }, [handId, storage]);

  useEffect(() => {
    if (!tierLoading) load();
  }, [load, tierLoading]);

  async function handleDelete() {
    if (!hand) return;
    setDeleting(true);
    try {
      await storage.deleteHand(hand.id);
      router.push(player ? `/notes/${player.id}` : '/notes');
    } catch {
      setDeleting(false);
    }
  }

  if (tierLoading || hand === undefined) {
    return (
      <div className="flex h-48 items-center justify-center text-slate-500">
        {tCommon('loading')}
      </div>
    );
  }

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-slate-400">{t('proRequired')}</p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/30"
        >
          {t('proRequiredCta')}
        </Link>
      </div>
    );
  }

  if (hand === null) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="mb-4 text-slate-400">{t('notFound')}</p>
        <Link
          href="/notes"
          className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
        >
          <ArrowLeft size={16} />
          {t('notFoundBack')}
        </Link>
      </div>
    );
  }

  const data = hand.structuredData as unknown as Parameters<typeof HandStructuredView>[0]['hand'];
  const dateLabel = hand.createdAt.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <>
      {/* Back nav */}
      <div className="mb-4">
        <Link
          href={player ? `/notes/${player.id}` : '/notes'}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-white"
        >
          <ArrowLeft size={16} />
          {player ? t('backToPlayer', { name: player.nickname }) : t('backToNotes')}
        </Link>
      </div>

      {/* Meta */}
      <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
        <span>{dateLabel}</span>
        {!hand.aiProcessed && (
          <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
            {t('rawOnly')}
          </span>
        )}
      </div>

      {/* Structured view */}
      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <HandStructuredView hand={data} />
      </div>

      {/* Raw description */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          {t('rawDescription')}
        </p>
        <p className="whitespace-pre-wrap text-sm text-slate-300">{hand.rawDescription}</p>
      </div>

      {/* Delete */}
      {confirmDelete ? (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
          <p className="mb-3 text-sm text-rose-300">{t('deleteConfirm')}</p>
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-rose-500 px-3 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
              {t('deleteConfirmYes')}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="min-h-[44px] flex-1 rounded-lg border border-slate-700 px-3 text-sm text-slate-400 hover:bg-slate-800"
            >
              {tCommon('cancel')}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-rose-500/20 bg-rose-500/5 text-sm font-medium text-rose-400 hover:bg-rose-500/10"
        >
          <Trash2 size={15} />
          {t('delete')}
        </button>
      )}
    </>
  );
}
