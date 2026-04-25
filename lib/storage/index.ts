'use client';

import { localAdapter } from './local';
import type { StorageAdapter } from './types';

export type { Player, Note, Session, StorageAdapter } from './types';
export { getActiveSessionId, setActiveSessionId } from './local';

// Today this always returns the local (IndexedDB) adapter.
// In Sprint 5 it will branch on tier to return a hybrid adapter that
// also write-throughs to D1 via /api/* routes.
export function useStorage(): StorageAdapter {
  return localAdapter;
}
