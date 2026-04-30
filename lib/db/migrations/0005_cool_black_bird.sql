CREATE TABLE `hands` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`player_id` text,
	`session_id` text,
	`raw_description` text NOT NULL,
	`structured_data` text NOT NULL,
	`ai_processed` integer DEFAULT false NOT NULL,
	`share_token` text,
	`share_created_at` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`session_id`) REFERENCES `poker_sessions`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE UNIQUE INDEX `hands_share_token_unique` ON `hands` (`share_token`);