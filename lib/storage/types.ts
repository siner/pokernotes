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

export interface StorageAdapter {
  // Players
  getAllPlayers(): Promise<Player[]>;
  getPlayer(id: string): Promise<Player | undefined>;
  savePlayer(player: Player): Promise<void>;
  deletePlayer(id: string): Promise<void>;
  countPlayers(): Promise<number>;

  // Notes
  getNotesForPlayer(playerId: string): Promise<Note[]>;
  getNotesForSession(sessionId: string): Promise<Note[]>;
  saveNote(note: Note): Promise<void>;
  deleteNote(id: string): Promise<void>;

  // Sessions
  getAllSessions(): Promise<Session[]>;
  getSession(id: string): Promise<Session | undefined>;
  saveSession(session: Session): Promise<void>;
  deleteSession(id: string): Promise<void>;
}
