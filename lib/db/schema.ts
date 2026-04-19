import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// ─────────────────────────────────────────
// BETTER AUTH TABLES
// ─────────────────────────────────────────

export const authUsers = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const authSessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
});

export const authAccounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const authVerifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ─────────────────────────────────────────
// USERS
// ─────────────────────────────────────────

export const users = sqliteTable('users', {
  id: text('id')
    .primaryKey()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  email: text('email').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  tier: text('tier', { enum: ['free', 'pro'] })
    .notNull()
    .default('free'),
  preferredLocale: text('preferred_locale', { enum: ['en', 'es'] })
    .notNull()
    .default('en'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status'), // active | canceled | past_due
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// POKER SESSIONS (not auth sessions)
// ─────────────────────────────────────────

export const pokerSessions = sqliteTable('poker_sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name'), // e.g. "Casino Orenes - Friday"
  venue: text('venue'),
  gameType: text('game_type'), // e.g. "NL100", "PLO200"
  startedAt: integer('started_at', { mode: 'timestamp' }),
  endedAt: integer('ended_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// PLAYERS (opponent profiles)
// ─────────────────────────────────────────

export const players = sqliteTable('players', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  nickname: text('nickname').notNull(),
  description: text('description'), // Physical description (discreet)
  photoUrl: text('photo_url'), // R2 CDN URL (Pro only)
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  timesPlayed: integer('times_played').notNull().default(0),
  firstSeenAt: integer('first_seen_at', { mode: 'timestamp' }),
  lastSeenAt: integer('last_seen_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// NOTES (per player, per session)
// ─────────────────────────────────────────

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id').references(() => pokerSessions.id, {
    onDelete: 'set null',
  }),

  // Raw input from user
  rawNote: text('raw_note'),

  // AI structured output
  structuredSummary: text('structured_summary'),
  preflopTendency: text('preflop_tendency'),
  postflopTendency: text('postflop_tendency'),
  aiSuggestedTags: text('ai_suggested_tags', { mode: 'json' }).$type<string[]>().default([]),

  // Was AI used to generate this note?
  aiProcessed: integer('ai_processed', { mode: 'boolean' }).notNull().default(false),

  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// SHARED PLAYERS (Pro: share with other users)
// ─────────────────────────────────────────

export const sharedPlayers = sqliteTable('shared_players', {
  id: text('id').primaryKey(),
  playerId: text('player_id')
    .notNull()
    .references(() => players.id, { onDelete: 'cascade' }),
  sharedByUserId: text('shared_by_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  sharedWithUserId: text('shared_with_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  permission: text('permission', { enum: ['read', 'collaborate'] })
    .notNull()
    .default('read'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// AI USAGE LOG (for analytics + rate limiting fallback)
// ─────────────────────────────────────────

export const aiUsage = sqliteTable('ai_usage', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipHash: text('ip_hash'), // For anonymous rate limiting
  endpoint: text('endpoint').notNull(), // "structure-note"
  tokensUsed: integer('tokens_used'),
  success: integer('success', { mode: 'boolean' }).notNull(),
  errorMessage: text('error_message'),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─────────────────────────────────────────
// BETTER AUTH TABLES
// (Better Auth manages its own schema — see Better Auth docs.
//  Typical tables: account, session, verification)
// ─────────────────────────────────────────
