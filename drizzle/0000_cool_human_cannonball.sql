CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`company` text NOT NULL,
	`role` text NOT NULL,
	`location` text,
	`source` text,
	`url` text,
	`compensation` text,
	`contact_name` text,
	`contact_email` text,
	`stage` text DEFAULT 'WISHLIST' NOT NULL,
	`priority` integer DEFAULT 2 NOT NULL,
	`position` real DEFAULT 1000 NOT NULL,
	`applied_at` integer,
	`next_action_at` integer,
	`next_action_note` text,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `applications_stage_idx` ON `applications` (`stage`);--> statement-breakpoint
CREATE INDEX `applications_next_action_idx` ON `applications` (`next_action_at`);--> statement-breakpoint
CREATE INDEX `applications_archived_idx` ON `applications` (`archived`);--> statement-breakpoint
CREATE TABLE `notes` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`body` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notes_application_idx` ON `notes` (`application_id`);--> statement-breakpoint
CREATE TABLE `stage_events` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`from_stage` text,
	`to_stage` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `stage_events_application_idx` ON `stage_events` (`application_id`);