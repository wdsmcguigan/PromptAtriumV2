import { sql } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  uuid,
  integer,
  bigserial,
  boolean,
  jsonb,
  timestamp,
  varchar,
  index,
  uniqueIndex,
  primaryKey,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// v2 core schema — see docs/plans/phase-1-schema-v2.md for design rationale.
//
// These tables live ALONGSIDE the legacy schema (schema.ts) and evolve via
// real migrations (drizzle-v2.config.ts → lib/db/migrations). Legacy tables
// stay frozen and are never part of v2 migrations.
// ---------------------------------------------------------------------------

export const assetVisibilityEnum = pgEnum("asset_visibility", [
  "private",
  "unlisted",
  "public",
]);

// Ownership indirection: everything in v2 references principals, never users
// directly, so orgs/teams/groups can arrive later as new principal kinds
// without touching asset tables. user_id is a soft reference to legacy
// users.id (no DB-level FK, so v2 migrations stay independent of the legacy
// schema); integrity is enforced in the storage layer.
export const principals = pgTable(
  "principals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull().default("user"), // 'user' now; 'org'/'group' later
    userId: varchar("user_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("principals_user_id_idx").on(t.userId)],
);

// Kind registry: new asset kinds (harness config, eval suite, plugin, …)
// are INSERTs, not migrations.
export const assetKinds = pgTable("asset_kinds", {
  id: text("id").primaryKey(), // slug: 'prompt', 'skill', 'stack', …
  displayName: text("display_name").notNull(),
  description: text("description"),
  // JSON-Schema validating per-asset metadata for this kind
  metadataSchema: jsonb("metadata_schema"),
  // render hints, allowed content shape (inline vs bundle), composition slots
  capabilities: jsonb("capabilities"),
  // sync-target mapping hints (CLAUDE.md, .cursor/rules, MCP prompt, …)
  syncTargets: jsonb("sync_targets"),
  isActive: boolean("is_active").notNull().default(true),
});

export const assets = pgTable(
  "assets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // Short immutable external id (e.g. 'a_3kF9xQzL2m') used in URLs/API/CLI
    publicId: text("public_id").notNull(),
    kindId: text("kind_id")
      .notNull()
      .references(() => assetKinds.id),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => principals.id),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    visibility: assetVisibilityEnum("visibility").notNull().default("private"),
    license: text("license"),
    // graft lineage; survives deletion of the parent
    forkedFromAssetId: uuid("forked_from_asset_id").references(
      (): AnyPgColumn => assets.id,
      { onDelete: "set null" },
    ),
    // current-version pointer (circular with asset_versions; nullable)
    headVersionId: uuid("head_version_id").references(
      (): AnyPgColumn => assetVersions.id,
    ),
    // validated against the kind's metadataSchema in the storage layer
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    // derived caches; the events table is the source of truth
    starCount: integer("star_count").notNull().default(0),
    forkCount: integer("fork_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("assets_public_id_idx").on(t.publicId),
    uniqueIndex("assets_owner_slug_idx").on(t.ownerId, t.slug),
    index("assets_kind_idx").on(t.kindId),
    index("assets_visibility_idx").on(t.visibility),
    index("assets_tags_idx").using("gin", t.tags),
  ],
);

// Immutable version snapshots (the rings). No UPDATEs after insert —
// enforced in the storage layer. Dual content shape: contentText is the
// fast path for single-text assets (most prompts/rules); contentFiles is a
// bundle manifest [{ path, storageKey, size, sha256 }] with files in GCS.
export const assetVersions = pgTable(
  "asset_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    changelog: text("changelog"),
    contentText: text("content_text"),
    contentFiles: jsonb("content_files"),
    contentHash: text("content_hash"),
    createdBy: uuid("created_by").references(() => principals.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("asset_versions_asset_number_idx").on(t.assetId, t.versionNumber)],
);

// Composition graph. A stack is an asset (kind=stack) whose contents are
// these edges. role is 'item' for plain folders/stacks; harness-style
// compositions use slots ('system', 'rules', 'skills', 'tools', …).
// pinnedVersionId: null = float to the child's head version; set = pinned.
export const assetEdges = pgTable(
  "asset_edges",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentAssetId: uuid("parent_asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    childAssetId: uuid("child_asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("item"),
    position: integer("position").notNull().default(0),
    pinnedVersionId: uuid("pinned_version_id").references(() => assetVersions.id),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("asset_edges_parent_child_role_idx").on(
      t.parentAssetId,
      t.childAssetId,
      t.role,
    ),
    index("asset_edges_child_idx").on(t.childAssetId),
  ],
);

// Leaves & fruit: outputs attached to an asset (and, when known, the exact
// version that produced them). The Atrium's content.
export const assetResults = pgTable(
  "asset_results",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    assetVersionId: uuid("asset_version_id").references(() => assetVersions.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by").references(() => principals.id),
    mediaType: text("media_type").notNull(), // image | video | text | link
    storageKey: text("storage_key"),
    url: text("url"),
    caption: text("caption"),
    metadata: jsonb("metadata"), // generator, model, settings
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("asset_results_asset_idx").on(t.assetId)],
);

export const stars = pgTable(
  "stars",
  {
    principalId: uuid("principal_id")
      .notNull()
      .references(() => principals.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
      .notNull()
      .references(() => assets.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.principalId, t.assetId] })],
);

// Append-only event stream (the ship's log). Gamification, trending,
// analytics, and any future reputation/commerce accounting are derived from
// this; none of them get columns on content tables.
export const events = pgTable(
  "events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    actorId: uuid("actor_id").references(() => principals.id), // null = system
    verb: text("verb").notNull(), // 'asset.created', 'star.added', 'sync.pulled', …
    objectType: text("object_type").notNull(),
    objectId: text("object_id").notNull(),
    context: jsonb("context"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("events_object_idx").on(t.objectType, t.objectId),
    index("events_actor_idx").on(t.actorId, t.createdAt),
    index("events_verb_idx").on(t.verb),
  ],
);

// Personal access tokens for MCP/CLI auth. Only the hash is stored; the
// plaintext token is shown once at creation.
export const apiTokens = pgTable(
  "api_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    principalId: uuid("principal_id")
      .notNull()
      .references(() => principals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    tokenHash: text("token_hash").notNull(),
    scopes: text("scopes").array().notNull().default(sql`'{read}'::text[]`),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("api_tokens_hash_idx").on(t.tokenHash)],
);

// Types
export type Principal = typeof principals.$inferSelect;
export type InsertPrincipal = typeof principals.$inferInsert;
export type AssetKind = typeof assetKinds.$inferSelect;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = typeof assets.$inferInsert;
export type AssetVersion = typeof assetVersions.$inferSelect;
export type InsertAssetVersion = typeof assetVersions.$inferInsert;
export type AssetEdge = typeof assetEdges.$inferSelect;
export type InsertAssetEdge = typeof assetEdges.$inferInsert;
export type AssetResult = typeof assetResults.$inferSelect;
export type InsertAssetResult = typeof assetResults.$inferInsert;
export type Star = typeof stars.$inferSelect;
export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;
export type ApiToken = typeof apiTokens.$inferSelect;
export type InsertApiToken = typeof apiTokens.$inferInsert;
