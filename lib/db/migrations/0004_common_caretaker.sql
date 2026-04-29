-- Unify the legacy `users` table into Better Auth's `user` table.
-- Order matters: recreate FK-bearing tables to reference `user(id)` BEFORE
-- dropping `users`, otherwise the orphaned FK references break subsequent
-- DROP/SELECT operations on D1 (which doesn't honour PRAGMA foreign_keys=OFF
-- across statements — each statement is a separate invocation).

-- 1. Add new columns to `user` (Better Auth's table).
ALTER TABLE `user` ADD `tier` text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `preferred_locale` text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `stripe_customer_id` text;--> statement-breakpoint
ALTER TABLE `user` ADD `stripe_subscription_id` text;--> statement-breakpoint
ALTER TABLE `user` ADD `subscription_status` text;--> statement-breakpoint

-- 2. Backfill from legacy `users` table for any user that already had a row.
UPDATE `user`
SET
  `tier` = COALESCE((SELECT `tier` FROM `users` WHERE `users`.`id` = `user`.`id`), 'free'),
  `preferred_locale` = COALESCE((SELECT `preferred_locale` FROM `users` WHERE `users`.`id` = `user`.`id`), 'en'),
  `stripe_customer_id` = (SELECT `stripe_customer_id` FROM `users` WHERE `users`.`id` = `user`.`id`),
  `stripe_subscription_id` = (SELECT `stripe_subscription_id` FROM `users` WHERE `users`.`id` = `user`.`id`),
  `subscription_status` = (SELECT `subscription_status` FROM `users` WHERE `users`.`id` = `user`.`id`)
WHERE `id` IN (SELECT `id` FROM `users`);--> statement-breakpoint

-- 3. Recreate dependent tables so their FKs target `user(id)` (not `users(id)`).
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_ai_usage` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`ip_hash` text,
	`endpoint` text NOT NULL,
	`tokens_used` integer,
	`success` integer NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_ai_usage`("id", "user_id", "ip_hash", "endpoint", "tokens_used", "success", "error_message", "created_at") SELECT "id", "user_id", "ip_hash", "endpoint", "tokens_used", "success", "error_message", "created_at" FROM `ai_usage`;--> statement-breakpoint
DROP TABLE `ai_usage`;--> statement-breakpoint
ALTER TABLE `__new_ai_usage` RENAME TO `ai_usage`;--> statement-breakpoint
CREATE TABLE `__new_notes` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`user_id` text NOT NULL,
	`session_id` text,
	`raw_note` text,
	`structured_summary` text,
	`preflop_tendency` text,
	`postflop_tendency` text,
	`ai_suggested_tags` text DEFAULT '[]',
	`ai_processed` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `poker_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_notes`("id", "player_id", "user_id", "session_id", "raw_note", "structured_summary", "preflop_tendency", "postflop_tendency", "ai_suggested_tags", "ai_processed", "created_at", "updated_at", "deleted_at") SELECT "id", "player_id", "user_id", "session_id", "raw_note", "structured_summary", "preflop_tendency", "postflop_tendency", "ai_suggested_tags", "ai_processed", "created_at", "updated_at", "deleted_at" FROM `notes`;--> statement-breakpoint
DROP TABLE `notes`;--> statement-breakpoint
ALTER TABLE `__new_notes` RENAME TO `notes`;--> statement-breakpoint
CREATE TABLE `__new_players` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nickname` text NOT NULL,
	`description` text,
	`photo_url` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`times_played` integer DEFAULT 0 NOT NULL,
	`first_seen_at` integer,
	`last_seen_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_players`("id", "user_id", "nickname", "description", "photo_url", "tags", "times_played", "first_seen_at", "last_seen_at", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "nickname", "description", "photo_url", "tags", "times_played", "first_seen_at", "last_seen_at", "created_at", "updated_at", "deleted_at" FROM `players`;--> statement-breakpoint
DROP TABLE `players`;--> statement-breakpoint
ALTER TABLE `__new_players` RENAME TO `players`;--> statement-breakpoint
CREATE TABLE `__new_poker_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`name` text,
	`venue` text,
	`game_type` text,
	`started_at` integer,
	`ended_at` integer,
	`notes` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_poker_sessions`("id", "user_id", "name", "venue", "game_type", "started_at", "ended_at", "notes", "created_at", "updated_at", "deleted_at") SELECT "id", "user_id", "name", "venue", "game_type", "started_at", "ended_at", "notes", "created_at", "updated_at", "deleted_at" FROM `poker_sessions`;--> statement-breakpoint
DROP TABLE `poker_sessions`;--> statement-breakpoint
ALTER TABLE `__new_poker_sessions` RENAME TO `poker_sessions`;--> statement-breakpoint
CREATE TABLE `__new_shared_players` (
	`id` text PRIMARY KEY NOT NULL,
	`player_id` text NOT NULL,
	`shared_by_user_id` text NOT NULL,
	`shared_with_user_id` text NOT NULL,
	`permission` text DEFAULT 'read' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`shared_with_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_shared_players`("id", "player_id", "shared_by_user_id", "shared_with_user_id", "permission", "created_at") SELECT "id", "player_id", "shared_by_user_id", "shared_with_user_id", "permission", "created_at" FROM `shared_players`;--> statement-breakpoint
DROP TABLE `shared_players`;--> statement-breakpoint
ALTER TABLE `__new_shared_players` RENAME TO `shared_players`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint

-- 4. Now safe to drop the legacy table — no live FKs reference it anymore.
DROP TABLE `users`;
