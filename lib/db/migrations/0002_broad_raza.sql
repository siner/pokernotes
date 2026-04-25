-- Add updated_at (NOT NULL) and deleted_at (nullable) to sync-enabled tables.
-- Backfill updated_at to created_at for existing rows so the NOT NULL constraint holds.

ALTER TABLE `notes` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `notes` SET `updated_at` = `created_at`;--> statement-breakpoint
ALTER TABLE `notes` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `players` ADD `deleted_at` integer;--> statement-breakpoint
ALTER TABLE `poker_sessions` ADD `updated_at` integer NOT NULL DEFAULT 0;--> statement-breakpoint
UPDATE `poker_sessions` SET `updated_at` = `created_at`;--> statement-breakpoint
ALTER TABLE `poker_sessions` ADD `deleted_at` integer;
