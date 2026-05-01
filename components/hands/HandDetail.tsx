'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Trash2,
  Loader2,
  Pencil,
  FileQuestion,
  Lock,
  Share2,
  Copy,
  Check,
  Eye,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import {
  useStorage,
  enableHandShare,
  disableHandShare,
  type Hand,
  type Player,
} from '@/lib/storage';
import { useUserTier } from '@/lib/auth/useUserTier';
import { HandStructuredView } from './HandStructuredView';
import { HandEditor } from './HandEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

interface HandDetailProps {
  handId: string;
}

export function HandDetail({ handId }: HandDetailProps) {
  const t = useTranslations('hands.detail');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const locale = useLocale();

  const storage = useStorage();
  const { tier, isLoading: tierLoading } = useUserTier();
  const isPro = tier === 'pro';

  const [hand, setHand] = useState<Hand | null | undefined>(undefined);
  const [player, setPlayer] = useState<Player | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  async function handleEnableShare() {
    if (!hand) return;
    setShareBusy(true);
    setShareError(null);
    try {
      const updated = await enableHandShare(hand.id);
      // Persist locally so IDB stays coherent and the share token survives
      // a page reload without waiting for the next sync pull.
      await storage.saveHand(updated);
      setHand(updated);
    } catch {
      setShareError(t('share.errorEnable'));
    } finally {
      setShareBusy(false);
    }
  }

  async function handleDisableShare() {
    if (!hand) return;
    setShareBusy(true);
    setShareError(null);
    try {
      const updated = await disableHandShare(hand.id);
      await storage.saveHand(updated);
      setHand(updated);
      setCopied(false);
    } catch {
      setShareError(t('share.errorDisable'));
    } finally {
      setShareBusy(false);
    }
  }

  async function handleCopyLink(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setShareError(t('share.errorCopy'));
    }
  }

  async function handleSaveEdit(handData: Omit<Hand, 'id' | 'createdAt' | 'updatedAt'>) {
    if (!hand) return;
    const updated: Hand = {
      ...hand,
      ...handData,
      id: hand.id,
      createdAt: hand.createdAt,
      updatedAt: new Date(),
    };
    await storage.saveHand(updated);
    setHand(updated);
    setShowEditor(false);
  }

  if (tierLoading || hand === undefined) {
    return <LoadingState label={tCommon('loading')} />;
  }

  if (!isPro) {
    return (
      <EmptyState
        Icon={Lock}
        title={t('proRequired')}
        cta={
          <Link
            href="/pricing"
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-amber-500/20 px-4 py-2.5 text-sm font-semibold text-amber-300 hover:bg-amber-500/30"
          >
            {t('proRequiredCta')}
          </Link>
        }
      />
    );
  }

  if (hand === null) {
    return (
      <EmptyState
        Icon={FileQuestion}
        title={t('notFound')}
        cta={
          <Link
            href="/notes"
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300"
          >
            <ArrowLeft size={16} />
            {t('notFoundBack')}
          </Link>
        }
      />
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
      <div className="mb-4 flex items-center justify-between gap-2 text-xs text-slate-500">
        <span>{dateLabel}</span>
        <div className="flex items-center gap-2">
          {!hand.aiProcessed && (
            <span className="rounded-full bg-slate-800 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-slate-400">
              {t('rawOnly')}
            </span>
          )}
          <button
            onClick={() => setShowEditor(true)}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
          >
            <Pencil size={13} />
            {t('edit')}
          </button>
        </div>
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

      {/* Share */}
      <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Share2 size={14} className="text-emerald-400" />
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            {t('share.title')}
          </p>
        </div>
        {hand.shareToken ? (
          (() => {
            const origin =
              typeof window !== 'undefined' ? window.location.origin : 'https://pokerreads.app';
            const shareUrl = `${origin}/${locale}/hands/share/${hand.shareToken}`;
            return (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-300">{t('share.activeDescription')}</p>
                <div className="flex items-stretch gap-2 rounded-lg border border-slate-700 bg-slate-950/60">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.currentTarget.select()}
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 font-mono text-xs text-slate-300 outline-none"
                  />
                  <button
                    onClick={() => handleCopyLink(shareUrl)}
                    className="flex min-h-[44px] items-center gap-1.5 border-l border-slate-700 px-3 text-xs font-medium text-emerald-400 hover:bg-slate-800"
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    {copied ? t('share.copied') : t('share.copy')}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Eye size={12} />
                    {t('share.viewCount', { count: hand.shareViewCount ?? 0 })}
                  </span>
                  <button
                    onClick={handleDisableShare}
                    disabled={shareBusy}
                    className="text-rose-400 hover:text-rose-300 disabled:opacity-50"
                  >
                    {shareBusy ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      t('share.disable')
                    )}
                  </button>
                </div>
              </div>
            );
          })()
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-400">{t('share.idleDescription')}</p>
            <button
              onClick={handleEnableShare}
              disabled={shareBusy}
              className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {shareBusy ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
              {t('share.enable')}
            </button>
          </div>
        )}
        {shareError && (
          <p className="mt-3 text-xs text-rose-400" role="alert">
            {shareError}
          </p>
        )}
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

      {/* Editor modal */}
      {showEditor && (
        <HandEditor
          hand={hand}
          playerNickname={player?.nickname}
          onSave={handleSaveEdit}
          onClose={() => setShowEditor(false)}
        />
      )}
    </>
  );
}
