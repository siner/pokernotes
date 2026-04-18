# PokerNotes — Database Schema

## Overview

- **Engine:** Cloudflare D1 (SQLite)
- **ORM:** Drizzle ORM
- **Local fallback:** IndexedDB (free tier, same shape)

---

## Drizzle Schema (`lib/db/schema.ts`)

```typescript
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),                          // Better Auth user ID (nanoid)
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  tier: text("tier", { enum: ["free", "pro"] })
    .notNull()
    .default("free"),
  preferredLocale: text("preferred_locale", { enum: ["en", "es"] })
    .notNull()
    .default("en"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionStatus: text("subscription_status"),     // active | canceled | past_due
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// POKER SESSIONS (not auth sessions)
// ─────────────────────────────────────────

export const pokerSessions = sqliteTable("poker_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),                                  // e.g. "Casino Orenes - Friday"
  venue: text("venue"),
  gameType: text("game_type"),                         // e.g. "NL100", "PLO200"
  startedAt: integer("started_at", { mode: "timestamp" }),
  endedAt: integer("ended_at", { mode: "timestamp" }),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// PLAYERS (opponent profiles)
// ─────────────────────────────────────────

export const players = sqliteTable("players", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  nickname: text("nickname").notNull(),
  description: text("description"),                   // Physical description (discreet)
  photoUrl: text("photo_url"),                        // R2 CDN URL (Pro only)
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default([]),
  timesPlayed: integer("times_played").notNull().default(0),
  firstSeenAt: integer("first_seen_at", { mode: "timestamp" }),
  lastSeenAt: integer("last_seen_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// NOTES (per player, per session)
// ─────────────────────────────────────────

export const notes = sqliteTable("notes", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sessionId: text("session_id")
    .references(() => pokerSessions.id, { onDelete: "set null" }),

  // Raw input from user
  rawNote: text("raw_note"),

  // AI structured output
  structuredSummary: text("structured_summary"),
  preflopTendency: text("preflop_tendency"),
  postflopTendency: text("postflop_tendency"),
  aiSuggestedTags: text("ai_suggested_tags", { mode: "json" })
    .$type<string[]>()
    .default([]),

  // Was AI used to generate this note?
  aiProcessed: integer("ai_processed", { mode: "boolean" })
    .notNull()
    .default(false),

  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// SHARED PLAYERS (Pro: share with other users)
// ─────────────────────────────────────────

export const sharedPlayers = sqliteTable("shared_players", {
  id: text("id").primaryKey(),
  playerId: text("player_id")
    .notNull()
    .references(() => players.id, { onDelete: "cascade" }),
  sharedByUserId: text("shared_by_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  sharedWithUserId: text("shared_with_user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permission: text("permission", { enum: ["read", "collaborate"] })
    .notNull()
    .default("read"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// AI USAGE LOG (for analytics + rate limiting fallback)
// ─────────────────────────────────────────

export const aiUsage = sqliteTable("ai_usage", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .references(() => users.id, { onDelete: "set null" }),
  ipHash: text("ip_hash"),                             // For anonymous rate limiting
  endpoint: text("endpoint").notNull(),                // "structure-note"
  tokensUsed: integer("tokens_used"),
  success: integer("success", { mode: "boolean" }).notNull(),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// BETTER AUTH TABLES
// (Better Auth manages its own schema — see Better Auth docs.
//  Typical tables: account, session, verification)
// ─────────────────────────────────────────
```

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_players_last_seen ON players(user_id, last_seen_at DESC);
CREATE INDEX idx_notes_player_id ON notes(player_id, created_at DESC);
CREATE INDEX idx_notes_session_id ON notes(session_id);
CREATE INDEX idx_sessions_user_id ON poker_sessions(user_id, started_at DESC);
CREATE INDEX idx_shared_players_with ON shared_players(shared_with_user_id);
CREATE INDEX idx_ai_usage_user_date ON ai_usage(user_id, created_at);
```

---

## IndexedDB Schema (Free Tier)

Same shape as D1, stored locally. Use `idb` library for a clean Promise API.

```typescript
// lib/storage/local.ts

interface PokerNotesDB extends DBSchema {
  players: {
    key: string;
    value: LocalPlayer;
    indexes: { 'by-last-seen': Date; 'by-tag': string };
  };
  notes: {
    key: string;
    value: LocalNote;
    indexes: { 'by-player': string };
  };
  sessions: {
    key: string;
    value: LocalSession;
  };
}
```

---

## Migration Strategy: Local → Cloud (Free → Pro upgrade)

When a user upgrades to Pro:
1. Read all local data from IndexedDB
2. POST to `/api/sync/import` with the full payload
3. Server creates records in D1 under the user's ID
4. Local IndexedDB remains as offline cache
5. Future writes go to both (optimistic local + async cloud)

---

## Tag Taxonomy (Constant)

Stored as a constant, not in DB (simpler, version-controlled):

```typescript
// lib/constants/tags.ts
export const PLAYER_TAGS = {
  aggression: ['aggro', 'passive', 'nit', 'maniac'],
  style: ['fish', 'reg', 'shark', 'calling-station'],
  tendencies: [
    '3bet-happy', 'slow-player', 'bluffer',
    'value-heavy', 'overbet', 'scared-money',
    'tilt-prone', 'solid', 'tricky'
  ],
} as const;

export const ALL_TAGS = [
  ...PLAYER_TAGS.aggression,
  ...PLAYER_TAGS.style,
  ...PLAYER_TAGS.tendencies,
];
```
