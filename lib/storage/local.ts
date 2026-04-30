import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Player, Note, Session, Hand, StorageAdapter } from './types';

export type PendingOp =
  | { kind: 'savePlayer'; entity: Player }
  | { kind: 'deletePlayer'; id: string }
  | { kind: 'saveNote'; entity: Note }
  | { kind: 'deleteNote'; id: string }
  | { kind: 'saveSession'; entity: Session }
  | { kind: 'deleteSession'; id: string }
  | { kind: 'saveHand'; entity: Hand }
  | { kind: 'deleteHand'; id: string };

export interface PendingRecord {
  id: string;
  op: PendingOp;
  createdAt: Date;
  attempts: number;
  lastError?: string;
}

interface PokerReadsDB extends DBSchema {
  players: {
    key: string;
    value: Player;
    indexes: { 'by-last-seen': Date; 'by-nickname': string };
  };
  notes: {
    key: string;
    value: Note;
    indexes: { 'by-player': string; 'by-session': string };
  };
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-started-at': Date };
  };
  hands: {
    key: string;
    value: Hand;
    indexes: { 'by-player': string; 'by-session': string; 'by-created-at': Date };
  };
  pending: {
    key: string;
    value: PendingRecord;
    indexes: { 'by-created-at': Date };
  };
}

const DB_NAME = 'pokerreads';
const DB_VERSION = 3;

let dbPromise: Promise<IDBPDatabase<PokerReadsDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PokerReadsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PokerReadsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const playerStore = db.createObjectStore('players', { keyPath: 'id' });
          playerStore.createIndex('by-last-seen', 'lastSeenAt');
          playerStore.createIndex('by-nickname', 'nickname');

          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('by-player', 'playerId');
          noteStore.createIndex('by-session', 'sessionId');

          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('by-started-at', 'startedAt');
        }
        if (oldVersion < 2) {
          const pendingStore = db.createObjectStore('pending', { keyPath: 'id' });
          pendingStore.createIndex('by-created-at', 'createdAt');
        }
        if (oldVersion < 3) {
          const handStore = db.createObjectStore('hands', { keyPath: 'id' });
          handStore.createIndex('by-player', 'playerId');
          handStore.createIndex('by-session', 'sessionId');
          handStore.createIndex('by-created-at', 'createdAt');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Pending queue (used by hybrid adapter) ─────────────────────────────────

export async function enqueuePending(op: PendingOp): Promise<void> {
  const db = await getDB();
  const record: PendingRecord = {
    id: globalThis.crypto.randomUUID(),
    op,
    createdAt: new Date(),
    attempts: 0,
  };
  await db.put('pending', record);
}

export async function getAllPending(): Promise<PendingRecord[]> {
  const db = await getDB();
  return db.getAllFromIndex('pending', 'by-created-at');
}

export async function deletePending(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('pending', id);
}

export async function updatePending(record: PendingRecord): Promise<void> {
  const db = await getDB();
  await db.put('pending', record);
}

// ─── Bulk overwrite (used by sync pull) ─────────────────────────────────────

export async function replaceLocalState(state: {
  players: Player[];
  notes: Note[];
  sessions: Session[];
  hands: Hand[];
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['players', 'notes', 'sessions', 'hands'], 'readwrite');
  await Promise.all([
    tx.objectStore('players').clear(),
    tx.objectStore('notes').clear(),
    tx.objectStore('sessions').clear(),
    tx.objectStore('hands').clear(),
  ]);
  await Promise.all([
    ...state.players.map((p) => tx.objectStore('players').put(p)),
    ...state.notes.map((n) => tx.objectStore('notes').put(n)),
    ...state.sessions.map((s) => tx.objectStore('sessions').put(s)),
    ...state.hands.map((h) => tx.objectStore('hands').put(h)),
  ]);
  await tx.done;
}

export const localAdapter: StorageAdapter = {
  // ─── Players ──────────────────────────────────────────────────────────────

  async getAllPlayers() {
    const db = await getDB();
    const players = await db.getAll('players');
    return players.sort((a, b) => {
      const aTime = a.lastSeenAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.lastSeenAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
  },

  async getPlayer(id) {
    const db = await getDB();
    return db.get('players', id);
  },

  async savePlayer(player) {
    const db = await getDB();
    await db.put('players', player);
  },

  async deletePlayer(id) {
    const db = await getDB();
    const tx = db.transaction(['players', 'notes'], 'readwrite');
    const noteIndex = tx.objectStore('notes').index('by-player');
    const noteKeys = await noteIndex.getAllKeys(id);
    await Promise.all([
      ...noteKeys.map((key) => tx.objectStore('notes').delete(key)),
      tx.objectStore('players').delete(id),
      tx.done,
    ]);
  },

  async countPlayers() {
    const db = await getDB();
    return db.count('players');
  },

  // ─── Notes ────────────────────────────────────────────────────────────────

  async getAllNotes() {
    const db = await getDB();
    return db.getAll('notes');
  },

  async getNotesForPlayer(playerId) {
    const db = await getDB();
    const notes = await db.getAllFromIndex('notes', 'by-player', playerId);
    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getNotesForSession(sessionId) {
    const db = await getDB();
    const notes = await db.getAllFromIndex('notes', 'by-session', sessionId);
    return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async saveNote(note) {
    const db = await getDB();
    await db.put('notes', note);
  },

  async deleteNote(id) {
    const db = await getDB();
    await db.delete('notes', id);
  },

  // ─── Sessions ─────────────────────────────────────────────────────────────

  async getAllSessions() {
    const db = await getDB();
    const sessions = await db.getAll('sessions');
    return sessions.sort((a, b) => {
      const aTime = a.startedAt?.getTime() ?? a.createdAt.getTime();
      const bTime = b.startedAt?.getTime() ?? b.createdAt.getTime();
      return bTime - aTime;
    });
  },

  async getSession(id) {
    const db = await getDB();
    return db.get('sessions', id);
  },

  async saveSession(session) {
    const db = await getDB();
    await db.put('sessions', session);
  },

  async deleteSession(id) {
    const db = await getDB();
    await db.delete('sessions', id);
  },

  // ─── Hands ────────────────────────────────────────────────────────────────

  async getAllHands() {
    const db = await getDB();
    const hands = await db.getAll('hands');
    return hands.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getHand(id) {
    const db = await getDB();
    return db.get('hands', id);
  },

  async getHandsForPlayer(playerId) {
    const db = await getDB();
    const hands = await db.getAllFromIndex('hands', 'by-player', playerId);
    return hands.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async getHandsForSession(sessionId) {
    const db = await getDB();
    const hands = await db.getAllFromIndex('hands', 'by-session', sessionId);
    return hands.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  },

  async saveHand(hand) {
    const db = await getDB();
    await db.put('hands', hand);
  },

  async deleteHand(id) {
    const db = await getDB();
    await db.delete('hands', id);
  },
};

// ─── Active session id (per-device, always local) ─────────────────────────────

const ACTIVE_SESSION_KEY = 'pn_active_session';

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string | null): void {
  if (typeof window === 'undefined') return;
  if (id) {
    window.localStorage.setItem(ACTIVE_SESSION_KEY, id);
  } else {
    window.localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}
