'use client';

import { useEffect } from 'react';
import { useUserTier } from '@/lib/auth/useUserTier';
import { bootstrapCloudSync } from '@/lib/storage/sync';

/**
 * Mounted once in the layout. As soon as the user's tier resolves to 'pro',
 * pushes any local data to D1 then pulls back the merged state.
 */
export function SyncBootstrap() {
  const { tier, isLoading } = useUserTier();

  useEffect(() => {
    if (isLoading) return;
    if (tier !== 'pro') return;
    void bootstrapCloudSync();
  }, [tier, isLoading]);

  return null;
}
