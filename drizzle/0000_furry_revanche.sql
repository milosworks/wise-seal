CREATE TABLE "count_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"count_id" integer NOT NULL,
	"message" text NOT NULL,
	"message_id" text NOT NULL,
	"user_count_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"match" text NOT NULL,
	"is_regex" boolean NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	"react" boolean DEFAULT true,
	"random_emoji" boolean DEFAULT true,
	"emoji" text,
	"ignored_channels" text[] DEFAULT '{}'::text[] NOT NULL,
	"ignored_users" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "guilds" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_counts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_count" integer DEFAULT 0 NOT NULL,
	"user_id" text NOT NULL,
	"count_id" integer NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "user_counts_user_id_count_id_unique" UNIQUE("user_id","count_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "count_messages" ADD CONSTRAINT "count_messages_count_id_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "count_messages" ADD CONSTRAINT "count_messages_user_count_id_user_counts_id_fk" FOREIGN KEY ("user_count_id") REFERENCES "public"."user_counts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "counts" ADD CONSTRAINT "counts_guild_id_guilds_id_fk" FOREIGN KEY ("guild_id") REFERENCES "public"."guilds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_counts" ADD CONSTRAINT "user_counts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_counts" ADD CONSTRAINT "user_counts_count_id_counts_id_fk" FOREIGN KEY ("count_id") REFERENCES "public"."counts"("id") ON DELETE cascade ON UPDATE no action;