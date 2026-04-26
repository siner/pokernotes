import { z } from 'zod';

const dateLike = z.union([z.string(), z.number(), z.date()]).transform((v) => new Date(v));
const optionalDateLike = dateLike.optional();

export const PlayerPayloadSchema = z.object({
  id: z.string().min(1),
  nickname: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  photoUrl: z.string().min(1).max(500).optional(),
  tags: z.array(z.string()).default([]),
  timesPlayed: z.number().int().nonnegative().default(0),
  firstSeenAt: optionalDateLike,
  lastSeenAt: optionalDateLike,
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const PlayerPatchSchema = PlayerPayloadSchema.partial().extend({
  updatedAt: dateLike,
});

export const NotePayloadSchema = z.object({
  id: z.string().min(1),
  playerId: z.string().min(1),
  sessionId: z.string().optional(),
  rawNote: z.string().max(4000).optional(),
  structuredSummary: z.string().max(4000).optional(),
  preflopTendency: z.string().max(2000).optional(),
  postflopTendency: z.string().max(2000).optional(),
  aiSuggestedTags: z.array(z.string()).default([]),
  aiProcessed: z.boolean().default(false),
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const SessionPayloadSchema = z.object({
  id: z.string().min(1),
  name: z.string().max(200).optional(),
  venue: z.string().max(200).optional(),
  gameType: z.string().max(100).optional(),
  startedAt: optionalDateLike,
  endedAt: optionalDateLike,
  notes: z.string().max(4000).optional(),
  createdAt: dateLike,
  updatedAt: dateLike,
});

export const SessionPatchSchema = SessionPayloadSchema.partial().extend({
  updatedAt: dateLike,
});

export const SyncImportSchema = z.object({
  players: z.array(PlayerPayloadSchema).default([]),
  notes: z.array(NotePayloadSchema).default([]),
  sessions: z.array(SessionPayloadSchema).default([]),
});

export type PlayerPayload = z.infer<typeof PlayerPayloadSchema>;
export type NotePayload = z.infer<typeof NotePayloadSchema>;
export type SessionPayload = z.infer<typeof SessionPayloadSchema>;
export type SyncImportPayload = z.infer<typeof SyncImportSchema>;
