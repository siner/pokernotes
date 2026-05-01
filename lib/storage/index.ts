'use client';

import { useMemo } from 'react';
import { localAdapter } from './local';
import { hybridAdapter } from './hybrid';
import { useUserTier } from '@/lib/auth/useUserTier';
import type { StorageAdapter } from './types';

export type { Player, Note, Session, Hand, StorageAdapter } from './types';
export { getActiveSessionId, setActiveSessionId } from './local';
export { enableHandShare, disableHandShare } from './cloud';

export function useStorage(): StorageAdapter {
  const { tier, isLoading } = useUserTier();
  // While tier is loading we default to local — the safe choice if the user
  // turns out to be free, and harmless if pro (sync bootstrap will run after).
  return useMemo(() => {
    if (isLoading) return localAdapter;
    return tier === 'pro' ? hybridAdapter : localAdapter;
  }, [tier, isLoading]);
}
