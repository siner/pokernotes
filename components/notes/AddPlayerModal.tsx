'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { PLAYER_TAGS } from '@/lib/constants/tags';

interface AddPlayerModalProps {
  onClose: () => void;
  onAdd: (data: { nickname: string; description: string; tags: string[] }) => void;
}

export function AddPlayerModal({ onClose, onAdd }: AddPlayerModalProps) {
  const t = useTranslations('notes.addModal');
  const tTags = useTranslations('tags');
  const tCommon = useTranslations('common');

  const [nickname, setNickname] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nickname.trim()) return;
    onAdd({ nickname: nickname.trim(), description: description.trim(), tags: selectedTags });
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-lg rounded-t-2xl border border-slate-800 bg-slate-950 p-5 sm:rounded-2xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">{t('title')}</h2>
          <button
            onClick={onClose}
            aria-label={tCommon('close')}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Nickname */}
          <div>
            <label htmlFor="nickname" className="mb-1.5 block text-sm font-medium text-slate-300">
              {t('nicknameLabel')}
            </label>
            <input
              id="nickname"
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={t('nicknamePlaceholder')}
              autoFocus
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-sm font-medium text-slate-300"
            >
              {t('descriptionLabel')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('descriptionPlaceholder')}
              rows={2}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Tags */}
          <div>
            <p className="mb-2 text-sm font-medium text-slate-300">{t('tagsLabel')}</p>
            <div className="flex flex-col gap-2">
              {(Object.entries(PLAYER_TAGS) as [keyof typeof PLAYER_TAGS, readonly string[]][]).map(
                ([category, tags]) => (
                  <div key={category} className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`rounded-full border px-2.5 py-1 font-mono text-xs font-medium transition-colors ${
                          selectedTags.includes(tag)
                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400'
                            : 'border-slate-700 bg-slate-800/60 text-slate-400 hover:border-slate-600 hover:text-slate-300'
                        }`}
                      >
                        {tTags(tag as Parameters<typeof tTags>[0])}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!nickname.trim()}
            className="mt-1 flex min-h-[44px] w-full items-center justify-center rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {t('submit')}
          </button>
        </form>
      </div>
    </div>
  );
}
