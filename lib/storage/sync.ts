import { localAdapter, getAllPending, replaceLocalState } from './local';
import { pullCloudState, bulkImportToCloud } from './cloud';
import { drainPending } from './hybrid';
import { setPendingCount, syncOpEnd, syncOpStart } from './syncState';

let bootstrapPromise: Promise<void> | null = null;

async function runSync(): Promise<void> {
  syncOpStart();
  try {
    // 1. Try to flush any ops queued offline first.
    const pending = await getAllPending();
    if (pending.length > 0) {
      await drainPending();
    }

    // 2. Snapshot local state and push to cloud.
    const [players, sessions, hands] = await Promise.all([
      localAdapter.getAllPlayers(),
      localAdapter.getAllSessions(),
      localAdapter.getAllHands(),
    ]);
    const allNotes = (
      await Promise.all(players.map((p) => localAdapter.getNotesForPlayer(p.id)))
    ).flat();

    if (players.length > 0 || sessions.length > 0 || allNotes.length > 0 || hands.length > 0) {
      await bulkImportToCloud({ players, notes: allNotes, sessions, hands });
    }

    // 3. Pull merged state and replace local.
    const cloudState = await pullCloudState();
    await replaceLocalState(cloudState);

    setPendingCount((await getAllPending()).length);
    syncOpEnd();
  } catch (err) {
    console.error('[sync] failed', err);
    syncOpEnd(err);
    throw err;
  }
}

/**
 * One-time sync after the user's tier resolves to 'pro'. Idempotent — safe
 * to call multiple times; only runs once per page load.
 */
export function bootstrapCloudSync(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = runSync().catch((err) => {
    // Reset so a future trigger (e.g. user navigates) can retry.
    bootstrapPromise = null;
    throw err;
  });
  return bootstrapPromise;
}

/**
 * Force a fresh sync, bypassing the bootstrap idempotency cache. Useful for
 * a manual "Sync now" button when the user wants to pull updates from other
 * devices without reloading the page.
 */
export async function refreshCloudSync(): Promise<void> {
  bootstrapPromise = null;
  return bootstrapCloudSync();
}
