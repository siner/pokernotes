export interface Player {
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

export interface Note {
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

export interface Session {
  id: string;
  name?: string;
  venue?: string;
  gameType?: string;
  startedAt?: Date;
  endedAt?: Date;
  notes?: string;
  createdAt: Date;
}

// Hand: a specific hand played, structured by AI. `structuredData` is the
// AI output blob (matches AiHandResponse from lib/ai/handStructurer); kept
// untyped here so the storage layer doesn't have to track AI schema
// versions. Consumers should narrow with the AI module's types.
export interface Hand {
  id: string;
  playerId?: string;
  sessionId?: string;
  rawDescription: string;
  structuredData: Record<string, unknown>;
  aiProcessed: boolean;
  shareToken?: string;
  shareCreatedAt?: Date;
  shareViewCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StorageAdapter {
  // Players
  getAllPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  savePlayer(player: Player): Promise<void>;
  deletePlayer(id: string): Promise<void>;
  countPlayers(): Promise<number>;

  // Notes
  getAllNotes(): Promise<Note[]>;
  getNotesForPlayer(playerId: string): Promise<Note[]>;
  getNotesForSession(sessionId: string): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Sessions
  getAllSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;

  // Hands (Pro-only feature; adapters can no-op for free users)
  getAllHands(): Promise<Hand[]>;
  getHand(id: string): Promise<Hand | undefined>;
  getHandsForPlayer(playerId: string): Promise<Hand[]>;
  getHandsForSession(sessionId: string): Promise<Hand[]>;
  saveHand(hand: Hand): Promise<void>;
  deleteHand(id: string): Promise<void>;
}
