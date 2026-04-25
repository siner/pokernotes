'use client';

import { useEffect, useState } from 'react';
import type { MeResponse } from '@/app/api/me/route';

interface UserTierState {
  tier: 'free' | 'pro';
  isAuthenticated: boolean;
  isLoading: boolean;
}

let cached: MeResponse | null = null;
let inflight: Promise<MeResponse> | null = null;

async function fetchMe(): Promise<MeResponse> {
  if (cached) return cached;
  if (inflight) return inflight;
  inflight = fetch('/api/me', { credentials: 'include' })
    .then((res) => res.json() as Promise<MeResponse>)
    .then((data) => {
      cached = data;
      inflight = null;
      return data;
    })
    .catch((err) => {
      inflight = null;
      throw err;
    });
  return inflight;
}

export function useUserTier(): UserTierState {
  const [state, setState] = useState<UserTierState>(() => ({
    tier: cached?.tier ?? 'free',
    isAuthenticated: cached?.isAuthenticated ?? false,
    isLoading: !cached,
  }));

  useEffect(() => {
    if (cached) return;
    let cancelled = false;
    fetchMe()
      .then((data) => {
        if (cancelled) return;
        setState({
          tier: data.tier,
          isAuthenticated: data.isAuthenticated,
          isLoading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState((prev) => ({ ...prev, isLoading: false }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}

// Test/utility: forget cached value (e.g. after sign-out).
export function resetUserTierCache(): void {
  cached = null;
  inflight = null;
}
