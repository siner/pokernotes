export type SyncStatus = 'idle' | 'syncing' | 'pending' | 'error' | 'offline';

export interface SyncState {
  status: SyncStatus;
  pendingCount: number;
  lastSyncedAt: Date | null;
  lastError: string | null;
}

type Listener = (state: SyncState) => void;

let inFlight = 0;
let pendingCount = 0;
let lastSyncedAt: Date | null = null;
let lastError: string | null = null;
let online = typeof navigator !== 'undefined' ? navigator.onLine : true;

const listeners = new Set<Listener>();

function compute(): SyncState {
  let status: SyncStatus;
  if (!online) status = 'offline';
  else if (inFlight > 0) status = 'syncing';
  else if (lastError) status = 'error';
  else if (pendingCount > 0) status = 'pending';
  else status = 'idle';

  return { status, pendingCount, lastSyncedAt, lastError };
}

function notify(): void {
  const s = compute();
  for (const l of listeners) l(s);
}

export function getSyncState(): SyncState {
  return compute();
}

export function subscribeSyncState(listener: Listener): () => void {
  listeners.add(listener);
  listener(compute());
  return () => {
    listeners.delete(listener);
  };
}

export function syncOpStart(): void {
  inFlight++;
  notify();
}

export function syncOpEnd(error?: unknown): void {
  inFlight = Math.max(0, inFlight - 1);
  if (error) {
    lastError = error instanceof Error ? error.message : String(error);
  } else {
    lastError = null;
    if (inFlight === 0) lastSyncedAt = new Date();
  }
  notify();
}

export function setPendingCount(count: number): void {
  if (count === pendingCount) return;
  pendingCount = count;
  notify();
}

export function clearSyncError(): void {
  lastError = null;
  notify();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    online = true;
    notify();
  });
  window.addEventListener('offline', () => {
    online = false;
    notify();
  });
}
