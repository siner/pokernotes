'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Extend window interface for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      // Already installed
      return;
    }

    // iOS doesn't support beforeinstallprompt, we show a manual tip
    if (isIOSDevice) {
      // Only show after a short delay so it's not too aggressive
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chrome support this
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-between rounded-xl border border-slate-700 bg-slate-800 p-4 shadow-xl shadow-black/20 sm:bottom-6 sm:left-auto sm:right-6 sm:w-80">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-slate-200">Install PokerReads</span>
        <span className="text-xs text-slate-400">
          {isIOS ? 'Tap share and "Add to Home Screen"' : 'Get the app for offline tools'}
        </span>
      </div>

      {!isIOS && (
        <button
          onClick={handleInstallClick}
          className="flex h-9 items-center justify-center rounded-lg bg-emerald-500 px-3 text-sm font-medium text-white transition-colors hover:bg-emerald-400"
        >
          <Download className="mr-1.5 h-4 w-4" />
          Install
        </button>
      )}

      {/* For iOS, we just show a dismiss button since we can't trigger it programmatically */}
      <button
        onClick={() => setShowPrompt(false)}
        className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border border-slate-600 bg-slate-700 text-xs text-slate-300 hover:text-white"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
