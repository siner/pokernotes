import type { Player, Note, Session, Hand, StorageAdapter } from './types';

interface ApiPlayer extends Omit<Player, 'firstSeenAt' | 'lastSeenAt' | 'createdAt' | 'updatedAt'> {
  firstSeenAt: string | number | null;
  lastSeenAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

interface ApiNote extends Omit<Note, 'createdAt'> {
  createdAt: string | number;
  updatedAt: string | number;
}

interface ApiSession extends Omit<Session, 'startedAt' | 'endedAt' | 'createdAt'> {
  startedAt: string | number | null;
  endedAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

interface ApiHand extends Omit<Hand, 'shareCreatedAt' | 'createdAt' | 'updatedAt'> {
  shareCreatedAt: string | number | null;
  createdAt: string | number;
  updatedAt: string | number;
}

function toDate(v: string | number | null | undefined): Date | undefined {
  if (v === null || v === undefined) return undefined;
  return new Date(v);
}

function deserializePlayer(p: ApiPlayer): Player {
  return {
    id: p.id,
    nickname: p.nickname,
    description: p.description,
    photoUrl: p.photoUrl,
    tags: p.tags ?? [],
    timesPlayed: p.timesPlayed ?? 0,
    firstSeenAt: toDate(p.firstSeenAt),
    lastSeenAt: toDate(p.lastSeenAt),
    createdAt: new Date(p.createdAt),
    updatedAt: new Date(p.updatedAt),
  };
}

function deserializeNote(n: ApiNote): Note {
  return {
    id: n.id,
    playerId: n.playerId,
    sessionId: n.sessionId ?? undefined,
    rawNote: n.rawNote,
    structuredSummary: n.structuredSummary,
    preflopTendency: n.preflopTendency,
    postflopTendency: n.postflopTendency,
    aiSuggestedTags: n.aiSuggestedTags ?? [],
    aiProcessed: n.aiProcessed ?? false,
    createdAt: new Date(n.createdAt),
  };
}

function deserializeSession(s: ApiSession): Session {
  return {
    id: s.id,
    name: s.name,
    venue: s.venue,
    gameType: s.gameType,
    startedAt: toDate(s.startedAt),
    endedAt: toDate(s.endedAt),
    notes: s.notes,
    createdAt: new Date(s.createdAt),
  };
}

function deserializeHand(h: ApiHand): Hand {
  return {
    id: h.id,
    playerId: h.playerId ?? undefined,
    sessionId: h.sessionId ?? undefined,
    rawDescription: h.rawDescription,
    structuredData: h.structuredData ?? {},
    aiProcessed: h.aiProcessed ?? false,
    shareToken: h.shareToken ?? undefined,
    shareCreatedAt: toDate(h.shareCreatedAt),
    createdAt: new Date(h.createdAt),
    updatedAt: new Date(h.updatedAt),
  };
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(path, { credentials: 'include' });
  if (!res.ok) throw new CloudError(res.status, `GET ${path} failed`);
  return res.json() as Promise<T>;
}

async function send<T>(
  method: 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(path, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new CloudError(res.status, `${method} ${path} failed`);
  return (res.headers.get('content-type')?.includes('json') ? res.json() : undefined) as Promise<T>;
}

export class CloudError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'CloudError';
  }
}

function serializePlayer(p: Player) {
  return {
    ...p,
    firstSeenAt: p.firstSeenAt?.toISOString(),
    lastSeenAt: p.lastSeenAt?.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function serializeNote(n: Note, updatedAt = new Date()) {
  return {
    ...n,
    createdAt: n.createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function serializeSession(s: Session, updatedAt = new Date()) {
  return {
    ...s,
    startedAt: s.startedAt?.toISOString(),
    endedAt: s.endedAt?.toISOString(),
    createdAt: s.createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

function serializeHand(h: Hand) {
  return {
    ...h,
    shareCreatedAt: h.shareCreatedAt?.toISOString() ?? null,
    createdAt: h.createdAt.toISOString(),
    updatedAt: h.updatedAt.toISOString(),
  };
}

export const cloudAdapter: StorageAdapter = {
  async getAllPlayers() {
    const rows = await get<ApiPlayer[]>('/api/players');
    return rows.map(deserializePlayer);
  },

  async getPlayer(id) {
    try {
      const row = await get<ApiPlayer>(`/api/players/${id}`);
      return deserializePlayer(row);
    } catch (err) {
      if (err instanceof CloudError && err.status === 404) return undefined;
      throw err;
    }
  },

  async savePlayer(player) {
    await send('POST', '/api/players', serializePlayer(player));
  },

  async deletePlayer(id) {
    await send('DELETE', `/api/players/${id}`);
  },

  async countPlayers() {
    const rows = await get<ApiPlayer[]>('/api/players');
    return rows.length;
  },

  async getAllNotes() {
    const rows = await get<ApiNote[]>('/api/notes');
    return rows.map(deserializeNote);
  },

  async getNotesForPlayer(playerId) {
    const rows = await get<ApiNote[]>(`/api/notes?playerId=${encodeURIComponent(playerId)}`);
    return rows.map(deserializeNote);
  },

  async getNotesForSession(sessionId) {
    const rows = await get<ApiNote[]>(`/api/notes?sessionId=${encodeURIComponent(sessionId)}`);
    return rows.map(deserializeNote);
  },

  async saveNote(note) {
    await send('POST', '/api/notes', serializeNote(note));
  },

  async deleteNote(id) {
    await send('DELETE', `/api/notes/${id}`);
  },

  async getAllSessions() {
    const rows = await get<ApiSession[]>('/api/sessions');
    return rows.map(deserializeSession);
  },

  async getSession(id) {
    try {
      const rows = await get<ApiSession[]>('/api/sessions');
      return rows.map(deserializeSession).find((s) => s.id === id);
    } catch (err) {
      if (err instanceof CloudError && err.status === 404) return undefined;
      throw err;
    }
  },

  async saveSession(session) {
    await send('POST', '/api/sessions', serializeSession(session));
  },

  async deleteSession(id) {
    await send('DELETE', `/api/sessions/${id}`);
  },

  async getAllHands() {
    const rows = await get<ApiHand[]>('/api/hands');
    return rows.map(deserializeHand);
  },

  async getHand(id) {
    try {
      const row = await get<ApiHand>(`/api/hands/${id}`);
      return deserializeHand(row);
    } catch (err) {
      if (err instanceof CloudError && err.status === 404) return undefined;
      throw err;
    }
  },

  async getHandsForPlayer(playerId) {
    const rows = await get<ApiHand[]>(`/api/hands?playerId=${encodeURIComponent(playerId)}`);
    return rows.map(deserializeHand);
  },

  async getHandsForSession(sessionId) {
    const rows = await get<ApiHand[]>(`/api/hands?sessionId=${encodeURIComponent(sessionId)}`);
    return rows.map(deserializeHand);
  },

  async saveHand(hand) {
    await send('POST', '/api/hands', serializeHand(hand));
  },

  async deleteHand(id) {
    await send('DELETE', `/api/hands/${id}`);
  },
};

export interface CloudPullPayload {
  players: ApiPlayer[];
  notes: ApiNote[];
  sessions: ApiSession[];
  hands: ApiHand[];
}

export async function pullCloudState(): Promise<{
  players: Player[];
  notes: Note[];
  sessions: Session[];
  hands: Hand[];
}> {
  const data = await get<CloudPullPayload>('/api/sync/pull');
  return {
    players: data.players.map(deserializePlayer),
    notes: data.notes.map(deserializeNote),
    sessions: data.sessions.map(deserializeSession),
    hands: (data.hands ?? []).map(deserializeHand),
  };
}

export async function bulkImportToCloud(payload: {
  players: Player[];
  notes: Note[];
  sessions: Session[];
  hands: Hand[];
}): Promise<void> {
  await send('POST', '/api/sync/import', {
    players: payload.players.map((p) => serializePlayer(p)),
    notes: payload.notes.map((n) => serializeNote(n, new Date(n.createdAt))),
    sessions: payload.sessions.map((s) => serializeSession(s, new Date(s.createdAt))),
    hands: payload.hands.map((h) => serializeHand(h)),
  });
}
