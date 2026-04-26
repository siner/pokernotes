'use client';

import { useRef, useState } from 'react';
import { Camera, Loader2, X, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useStorage, type Player } from '@/lib/storage';
import { resizeImage } from '@/lib/utils/resizeImage';

interface PlayerPhotoProps {
  player: Player;
  onChange: (updated: Player) => void;
}

export function PlayerPhoto({ player, onChange }: PlayerPhotoProps) {
  const t = useTranslations('notes.detail.photo');
  const storage = useStorage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const blob = await resizeImage(file, { maxDimension: 800, quality: 0.85 });
      const upload = new File([blob], 'photo.jpg', { type: 'image/jpeg' });

      const form = new FormData();
      form.append('photo', upload);
      const res = await fetch(`/api/players/${player.id}/photo`, {
        method: 'POST',
        body: form,
      });

      if (!res.ok) {
        if (res.status === 413) setError(t('tooLarge'));
        else setError(t('uploadFailed'));
        return;
      }

      const data = (await res.json()) as { photoUrl: string; updatedAt: string };
      const updated: Player = {
        ...player,
        photoUrl: data.photoUrl,
        updatedAt: new Date(data.updatedAt),
      };
      await storage.savePlayer(updated);
      onChange(updated);
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto() {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/players/${player.id}/photo`, { method: 'DELETE' });
      if (!res.ok) {
        setError(t('uploadFailed'));
        return;
      }
      const updated: Player = {
        ...player,
        photoUrl: undefined,
        updatedAt: new Date(),
      };
      await storage.savePlayer(updated);
      onChange(updated);
    } catch {
      setError(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  }

  function handlePick() {
    inputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void uploadFile(file);
  }

  const hasPhoto = Boolean(player.photoUrl);
  const label = hasPhoto ? t('replace') : t('add');

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="relative">
        <button
          type="button"
          onClick={handlePick}
          disabled={uploading}
          aria-label={label}
          className="group relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-500/20 bg-slate-800 text-slate-500 transition-colors hover:border-emerald-500/40 disabled:cursor-wait"
        >
          {hasPhoto ? (
            <img
              src={player.photoUrl}
              alt={t('alt', { name: player.nickname })}
              className="h-full w-full object-cover"
            />
          ) : (
            <User size={32} />
          )}

          {/* Camera overlay (visible on hover for desktop, always for empty) */}
          {!uploading && (
            <span
              className={`absolute inset-0 flex items-center justify-center bg-black/60 text-white transition-opacity ${
                hasPhoto ? 'opacity-0 group-hover:opacity-100 group-focus:opacity-100' : 'opacity-0'
              }`}
            >
              <Camera size={20} />
            </span>
          )}

          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            </span>
          )}
        </button>

        {hasPhoto && !uploading && (
          <button
            type="button"
            onClick={deletePhoto}
            aria-label={t('delete')}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-slate-800 text-slate-300 shadow-lg transition-colors hover:bg-red-500/20 hover:text-red-400"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {error && (
        <p className="max-w-[12rem] text-xs text-red-400" role="alert">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
