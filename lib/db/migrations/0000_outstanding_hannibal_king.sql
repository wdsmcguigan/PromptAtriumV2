CREATE TYPE "public"."asset_visibility" AS ENUM('private', 'unlisted', 'public');--> statement-breakpoint
CREATE TABLE "api_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"principal_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"scopes" text[] DEFAULT '{read}'::text[] NOT NULL,
	"last_used_at" timestamp with time zone,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_asset_id" uuid NOT NULL,
	"child_asset_id" uuid NOT NULL,
	"role" text DEFAULT 'item' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"pinned_version_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_kinds" (
	"id" text PRIMARY KEY NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"metadata_schema" jsonb,
	"capabilities" jsonb,
	"sync_targets" jsonb,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"asset_version_id" uuid,
	"created_by" uuid,
	"media_type" text NOT NULL,
	"storage_key" text,
	"url" text,
	"caption" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "asset_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"asset_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"changelog" text,
	"content_text" text,
	"content_files" jsonb,
	"content_hash" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "assets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"public_id" text NOT NULL,
	"kind_id" text NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"visibility" "asset_visibility" DEFAULT 'private' NOT NULL,
	"license" text,
	"forked_from_asset_id" uuid,
	"head_version_id" uuid,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"star_count" integer DEFAULT 0 NOT NULL,
	"fork_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"archived_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"actor_id" uuid,
	"verb" text NOT NULL,
	"object_type" text NOT NULL,
	"object_id" text NOT NULL,
	"context" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "principals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" text DEFAULT 'user' NOT NULL,
	"user_id" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stars" (
	"principal_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stars_principal_id_asset_id_pk" PRIMARY KEY("principal_id","asset_id")
);
--> statement-breakpoint
ALTER TABLE "api_tokens" ADD CONSTRAINT "api_tokens_principal_id_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."principals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_edges" ADD CONSTRAINT "asset_edges_parent_asset_id_assets_id_fk" FOREIGN KEY ("parent_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_edges" ADD CONSTRAINT "asset_edges_child_asset_id_assets_id_fk" FOREIGN KEY ("child_asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_edges" ADD CONSTRAINT "asset_edges_pinned_version_id_asset_versions_id_fk" FOREIGN KEY ("pinned_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_results" ADD CONSTRAINT "asset_results_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_results" ADD CONSTRAINT "asset_results_asset_version_id_asset_versions_id_fk" FOREIGN KEY ("asset_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_results" ADD CONSTRAINT "asset_results_created_by_principals_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_versions" ADD CONSTRAINT "asset_versions_created_by_principals_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_kind_id_asset_kinds_id_fk" FOREIGN KEY ("kind_id") REFERENCES "public"."asset_kinds"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_id_principals_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_forked_from_asset_id_assets_id_fk" FOREIGN KEY ("forked_from_asset_id") REFERENCES "public"."assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_head_version_id_asset_versions_id_fk" FOREIGN KEY ("head_version_id") REFERENCES "public"."asset_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_actor_id_principals_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."principals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_principal_id_principals_id_fk" FOREIGN KEY ("principal_id") REFERENCES "public"."principals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stars" ADD CONSTRAINT "stars_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_tokens_hash_idx" ON "api_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_edges_parent_child_role_idx" ON "asset_edges" USING btree ("parent_asset_id","child_asset_id","role");--> statement-breakpoint
CREATE INDEX "asset_edges_child_idx" ON "asset_edges" USING btree ("child_asset_id");--> statement-breakpoint
CREATE INDEX "asset_results_asset_idx" ON "asset_results" USING btree ("asset_id");--> statement-breakpoint
CREATE UNIQUE INDEX "asset_versions_asset_number_idx" ON "asset_versions" USING btree ("asset_id","version_number");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_public_id_idx" ON "assets" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "assets_owner_slug_idx" ON "assets" USING btree ("owner_id","slug");--> statement-breakpoint
CREATE INDEX "assets_kind_idx" ON "assets" USING btree ("kind_id");--> statement-breakpoint
CREATE INDEX "assets_visibility_idx" ON "assets" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "assets_tags_idx" ON "assets" USING gin ("tags");--> statement-breakpoint
CREATE INDEX "events_object_idx" ON "events" USING btree ("object_type","object_id");--> statement-breakpoint
CREATE INDEX "events_actor_idx" ON "events" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "events_verb_idx" ON "events" USING btree ("verb");--> statement-breakpoint
CREATE UNIQUE INDEX "principals_user_id_idx" ON "principals" USING btree ("user_id");