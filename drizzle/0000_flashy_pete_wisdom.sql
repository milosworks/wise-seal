CREATE TABLE IF NOT EXISTS "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"seal_count" integer DEFAULT 0 NOT NULL,
	"ignored_channels" text[] DEFAULT '{}'::text[] NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"seal_count" integer DEFAULT 0 NOT NULL,
	"ignore_count" boolean DEFAULT false NOT NULL
);
