import { localAdapter, enqueuePending, getAllPending, deletePending, updatePending } from './local';
import { cloudAdapter, CloudError } from './cloud';
import { setPendingCount, syncOpEnd, syncOpStart } from './syncState';
import type { PendingOp } from './local';
import type { StorageAdapter } from './types';

const MAX_ATTEMPTS = 5;

let draining = false;

async function tryCloud(op: PendingOp): Promise<void> {
  switch (op.kind) {
    case 'savePlayer':
      await cloudAdapter.savePlayer(op.entity);
      return;
    case 'deletePlayer':
      await cloudAdapter.deletePlayer(op.id);
      return;
    case 'saveNote':
      await cloudAdapter.saveNote(op.entity);
      return;
    case 'deleteNote':
      await cloudAdapter.deleteNote(op.id);
      return;
    case 'saveSession':
      await cloudAdapter.saveSession(op.entity);
      return;
    case 'deleteSession':
      await cloudAdapter.deleteSession(op.id);
      return;
  }
}

async function refreshPendingCount(): Promise<void> {
  const pending = await getAllPending();
  setPendingCount(pending.length);
}

async function dispatch(op: PendingOp): Promise<void> {
  syncOpStart();
  try {
    await tryCloud(op);
    await refreshPendingCount();
    syncOpEnd();
  } catch (err) {
    // 4xx (except 409) means the request itself is bad — don't enqueue, just surface.
    if (err instanceof CloudError && err.status >= 400 && err.status < 500 && err.status !== 409) {
      console.error('[hybrid] cloud rejected op', op.kind, err.status);
      syncOpEnd(err);
      return;
    }
    await enqueuePending(op);
    await refreshPendingCount();
    syncOpEnd();
    void drainPending();
  }
}

export async function drainPending(): Promise<void> {
  if (draining) return;
  draining = true;
  syncOpStart();
  let lastError: unknown;
  try {
    const records = await getAllPending();
    for (const record of records) {
      try {
        await tryCloud(record.op);
        await deletePending(record.id);
      } catch (err) {
        lastError = err;
        const attempts = record.attempts + 1;
        if (attempts >= MAX_ATTEMPTS) {
          console.error('[hybrid] giving up on op after retries', record.op.kind, err);
          await deletePending(record.id);
        } else {
          await updatePending({
            ...record,
            attempts,
            lastError: err instanceof Error ? err.message : String(err),
          });
        }
        // Stop draining on first failure — likely offline, retry later.
        break;
      }
    }
  } finally {
    await refreshPendingCount();
    syncOpEnd(lastError);
    draining = false;
  }
}

export const hybridAdapter: StorageAdapter = {
  // Reads stay local (fast, offline-friendly).
  getAllPlayers: localAdapter.getAllPlayers,
  getPlayer: localAdapter.getPlayer,
  countPlayers: localAdapter.countPlayers,
  getAllNotes: localAdapter.getAllNotes,
  getNotesForPlayer: localAdapter.getNotesForPlayer,
  getNotesForSession: localAdapter.getNotesForSession,
  getAllSessions: localAdapter.getAllSessions,
  getSession: localAdapter.getSession,

  async savePlayer(player) {
    await localAdapter.savePlayer(player);
    void dispatch({ kind: 'savePlayer', entity: player });
  },

  async deletePlayer(id) {
    await localAdapter.deletePlayer(id);
    void dispatch({ kind: 'deletePlayer', id });
  },

  async saveNote(note) {
    await localAdapter.saveNote(note);
    void dispatch({ kind: 'saveNote', entity: note });
  },

  async deleteNote(id) {
    await localAdapter.deleteNote(id);
    void dispatch({ kind: 'deleteNote', id });
  },

  async saveSession(session) {
    await localAdapter.saveSession(session);
    void dispatch({ kind: 'saveSession', entity: session });
  },

  async deleteSession(id) {
    await localAdapter.deleteSession(id);
    void dispatch({ kind: 'deleteSession', id });
  },
};
