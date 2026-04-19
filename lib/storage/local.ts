import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface LocalPlayer {
  id: string;
  nickname: string;
  description?: string;
  photoUrl?: string;
  tags: string[];
  timesPlayed: number;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalNote {
  id: string;
  playerId: string;
  sessionId?: string;
  rawNote?: string;
  structuredSummary?: string;
  preflopTendency?: string;
  postflopTendency?: string;
  aiSuggestedTags: string[];
  aiProcessed: boolean;
  createdAt: Date;
}

export interface LocalSession {
  id: string;
  name?: string;
  venue?: string;
  gameType?: string;
  startedAt?: Date;
  endedAt?: Date;
  notes?: string;
  createdAt: Date;
}

interface PokerNotesDB extends DBSchema {
  players: {
    key: string;
    value: LocalPlayer;
    indexes: { 'by-last-seen': Date; 'by-nickname': string };
  };
  notes: {
    key: string;
    value: LocalNote;
    indexes: { 'by-player': string; 'by-session': string };
  };
  sessions: {
    key: string;
    value: LocalSession;
    indexes: { 'by-started-at': Date };
  };
}

const DB_NAME = 'pokernotes';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PokerNotesDB>> | null = null;

function getDB(): Promise<IDBPDatabase<PokerNotesDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PokerNotesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const playerStore = db.createObjectStore('players', { keyPath: 'id' });
        playerStore.createIndex('by-last-seen', 'lastSeenAt');
        playerStore.createIndex('by-nickname', 'nickname');

        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('by-player', 'playerId');
        noteStore.createIndex('by-session', 'sessionId');

        const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
        sessionStore.createIndex('by-started-at', 'startedAt');
      },
    });
  }
  return dbPromise;
}

// ─── Players ────────────────────────────────────────────────────────────────

export async function getAllPlayers(): Promise<LocalPlayer[]> {
  const db = await getDB();
  const players = await db.getAll('players');
  return players.sort((a, b) => {
    const aTime = a.lastSeenAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.lastSeenAt?.getTime() ?? b.createdAt.getTime();
    return bTime - aTime;
  });
}

export async function getPlayer(id: string): Promise<LocalPlayer | undefined> {
  const db = await getDB();
  return db.get('players', id);
}

export async function savePlayer(player: LocalPlayer): Promise<void> {
  const db = await getDB();
  await db.put('players', player);
}

export async function deletePlayer(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['players', 'notes'], 'readwrite');
  const noteIndex = tx.objectStore('notes').index('by-player');
  const noteKeys = await noteIndex.getAllKeys(id);
  await Promise.all([
    ...noteKeys.map((key) => tx.objectStore('notes').delete(key)),
    tx.objectStore('players').delete(id),
    tx.done,
  ]);
}

export async function countPlayers(): Promise<number> {
  const db = await getDB();
  return db.count('players');
}

// ─── Notes ──────────────────────────────────────────────────────────────────

export async function getNotesForPlayer(playerId: string): Promise<LocalNote[]> {
  const db = await getDB();
  const notes = await db.getAllFromIndex('notes', 'by-player', playerId);
  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function saveNote(note: LocalNote): Promise<void> {
  const db = await getDB();
  await db.put('notes', note);
}

export async function deleteNote(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function getNotesForSession(sessionId: string): Promise<LocalNote[]> {
  const db = await getDB();
  const notes = await db.getAllFromIndex('notes', 'by-session', sessionId);
  return notes.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

// ─── Active session (localStorage) ──────────────────────────────────────────

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

// ─── Sessions ───────────────────────────────────────────────────────────────

export async function getAllSessions(): Promise<LocalSession[]> {
  const db = await getDB();
  const sessions = await db.getAll('sessions');
  return sessions.sort((a, b) => {
    const aTime = a.startedAt?.getTime() ?? a.createdAt.getTime();
    const bTime = b.startedAt?.getTime() ?? b.createdAt.getTime();
    return bTime - aTime;
  });
}

export async function getSession(id: string): Promise<LocalSession | undefined> {
  const db = await getDB();
  return db.get('sessions', id);
}

export async function saveSession(session: LocalSession): Promise<void> {
  const db = await getDB();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sessions', id);
}
