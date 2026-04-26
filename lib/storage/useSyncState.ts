'use client';

import { useSyncExternalStore } from 'react';
import { getSyncState, subscribeSyncState, type SyncState } from './syncState';

export function useSyncState(): SyncState {
  return useSyncExternalStore(subscribeSyncState, getSyncState, getSyncState);
}
