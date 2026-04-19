'use client';
/* global HTMLDivElement, MouseEvent, Node */

import { useTranslations } from 'next-intl';
import { useSession, signOut } from '@/lib/auth/client';
import { Link, useRouter } from '@/i18n/navigation';
import { LogOut, Settings, Loader2 } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function UserMenu() {
  const { data: session, isPending } = useSession();
  const t = useTranslations('nav');
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
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
    router.push('/');
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

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center h-9 w-9 overflow-hidden rounded-full border border-white/10 bg-slate-800 transition-transform hover:scale-105 hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-[#060d08]"
      >
        {user.image ? (
          <img src={user.image} alt={user.name || 'User'} className="h-full w-full object-cover" />
        ) : (
          <span className="font-display text-sm font-medium text-slate-300 uppercase">
            {user.name?.[0] || user.email?.[0] || 'U'}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-white/10 bg-[#0c1410] p-1 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95">
          <div className="px-3 py-2.5 border-b border-white/5 mb-1">
            <p className="truncate text-sm font-medium text-slate-200">{user.name}</p>
            <p className="truncate text-xs text-slate-500">{user.email}</p>
          </div>

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
