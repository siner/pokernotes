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

// Cached snapshot. useSyncExternalStore requires getSnapshot() to return a
// stable reference when the underlying state hasn't changed; otherwise React
// triggers re-renders forever (React error #185).
let snapshot: SyncState = computeSnapshot();

const listeners = new Set<Listener>();

function computeSnapshot(): SyncState {
  let status: SyncStatus;
  if (!online) status = 'offline';
  else if (inFlight > 0) status = 'syncing';
  else if (lastError) status = 'error';
  else if (pendingCount > 0) status = 'pending';
  else status = 'idle';

  return { status, pendingCount, lastSyncedAt, lastError };
}

function refresh(): void {
  snapshot = computeSnapshot();
  for (const l of listeners) l(snapshot);
}

export function getSyncState(): SyncState {
  return snapshot;
}

// Note: do NOT invoke the listener on subscribe — React reads the initial
// state via getSnapshot. Calling here would trigger an immediate re-render
// loop with useSyncExternalStore.
export function subscribeSyncState(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function syncOpStart(): void {
  inFlight++;
  refresh();
}

export function syncOpEnd(error?: unknown): void {
  inFlight = Math.max(0, inFlight - 1);
  if (error) {
    lastError = error instanceof Error ? error.message : String(error);
  } else {
    lastError = null;
    if (inFlight === 0) lastSyncedAt = new Date();
  }
  refresh();
}

export function setPendingCount(count: number): void {
  if (count === pendingCount) return;
  pendingCount = count;
  refresh();
}

export function clearSyncError(): void {
  if (lastError === null) return;
  lastError = null;
  refresh();
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    if (online) return;
    online = true;
    refresh();
  });
  window.addEventListener('offline', () => {
    if (!online) return;
    online = false;
    refresh();
  });
}
