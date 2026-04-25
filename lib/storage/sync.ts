import { localAdapter, getAllPending, replaceLocalState } from './local';
import { pullCloudState, bulkImportToCloud } from './cloud';
import { drainPending } from './hybrid';

let bootstrapPromise: Promise<void> | null = null;

/**
 * One-time sync after the user's tier resolves to 'pro':
 *   1. Drain any leftover pending ops from a previous session.
 *   2. Push local state to cloud (LWW handled server-side).
 *   3. Pull merged state and replace local.
 *
 * Idempotent — safe to call multiple times; only runs once per page load.
 */
export function bootstrapCloudSync(): Promise<void> {
  if (bootstrapPromise) return bootstrapPromise;
  bootstrapPromise = (async () => {
    try {
      // 1. Try to flush any ops queued offline first.
      const pending = await getAllPending();
      if (pending.length > 0) {
        await drainPending();
      }

      // 2. Snapshot local state and push to cloud.
      const [players, sessions] = await Promise.all([
        localAdapter.getAllPlayers(),
        localAdapter.getAllSessions(),
      ]);
      const allNotes = (
        await Promise.all(players.map((p) => localAdapter.getNotesForPlayer(p.id)))
      ).flat();

      if (players.length > 0 || sessions.length > 0 || allNotes.length > 0) {
        await bulkImportToCloud({ players, notes: allNotes, sessions });
      }

      // 3. Pull merged state and replace local.
      const cloudState = await pullCloudState();
      await replaceLocalState(cloudState);
    } catch (err) {
      console.error('[sync] bootstrap failed', err);
      // Reset so a future trigger (e.g. user navigates) can retry.
      bootstrapPromise = null;
    }
  })();
  return bootstrapPromise;
}
