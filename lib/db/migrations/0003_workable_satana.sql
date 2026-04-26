CREATE TABLE `processed_stripe_events` (
	`event_id` text PRIMARY KEY NOT NULL,
	`processed_at` integer NOT NULL
);
