# Phase 1 — v2 core schema design

*Design for review. No migrations have been generated from this yet.
Implements the PRD §5 principles and the seven option-purchases.
Expect amendments when research Brief 2 (context-format survey) lands.*

## Approach

New tables created **alongside** the legacy schema via real migrations
(`drizzle-kit generate` / `migrate` — first migration baselines the
existing DB). Legacy tables are untouched until cutover; legacy prompts
are backfilled into `assets` with provenance kept.

## Tables

### `principals` — ownership indirection (option purchase #2)

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| kind | text | `'user'` only at launch; `'org'`/`'group'` later |
| user_id | fk users, nullable, unique | set for kind=user |
| created_at | timestamptz | |

Seeded 1:1 from `users`. Everything in v2 references `principals`, never
`users`, so orgs/teams/sub-groups arrive later as new rows, not new columns.

### `asset_kinds` — the kind registry (option purchase #1)

| column | type | notes |
|---|---|---|
| id | text pk (slug) | `prompt`, `system_prompt`, `skill`, `rule`, `workflow`, `stack` |
| display_name / description | text | |
| metadata_schema | jsonb | JSON-Schema (generated from Zod) validating per-asset metadata |
| capabilities | jsonb | render hints, allowed content shape (inline vs bundle), composition slots |
| sync_targets | jsonb | mapping hints (CLAUDE.md, .cursor/rules, MCP prompt, …) — refined by Brief 2 |
| is_active | boolean | soft launch/retire kinds |

New kinds (harness config, eval suite, plugin) are INSERTs.

### `assets`

| column | type | notes |
|---|---|---|
| id | uuid pk | internal |
| public_id | text unique | short, immutable; used in URLs/API/CLI (option purchase #7) |
| kind_id | fk asset_kinds | |
| owner_id | fk principals | |
| name, slug, description | text | slug unique per owner |
| visibility | text enum | `private` \| `unlisted` \| `public` (option purchase #3) |
| license | text, nullable | SPDX-ish slug (option purchase #6 groundwork) |
| forked_from_asset_id | fk assets, nullable, on delete set null | graft lineage |
| head_version_id | fk asset_versions, nullable | current version pointer |
| metadata | jsonb | validated against the kind's metadata_schema |
| tags | text[] + GIN index | normalize into tables only if discovery demands it |
| star_count, fork_count | int | derived caches; events are the truth |
| created_at, updated_at, archived_at | timestamptz | archive = pruning, not deletion |

### `asset_versions` — the rings (option purchase #4)

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| asset_id | fk assets | |
| version_number | int | unique per asset, monotonic |
| changelog | text | |
| content_text | text, nullable | fast path: the single-text body (most prompts/rules) |
| content_files | jsonb, nullable | bundle manifest `[{path, storage_key, size, sha256}]`, files in GCS |
| content_hash | text | dedup/integrity across either shape |
| created_by | fk principals | |
| created_at | timestamptz | |

**Immutable** — no updates after insert (enforced in the storage layer,
optionally by trigger). A prompt is one `content_text`; a skill is a
bundle; both are the same row shape, so single-text assets never pay a
GCS round-trip.

### `asset_edges` — composition graph (the entropy ladder)

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| parent_asset_id / child_asset_id | fk assets | parent kind=stack (or any composing kind) |
| role | text | `item` today; `system`/`rules`/`skills`/`tools` slots when stacks become harnesses |
| position | int | ordering within role |
| pinned_version_id | fk asset_versions, nullable | **null = float to child's head; set = pinned** |
| metadata | jsonb | per-edge overrides/params later |

Unique `(parent, child, role)`. Stacks are assets (kind=stack) whose
content is this edge set — so compositions get versioning, forking,
starring, and publishing for free.

### `asset_results` — leaves & fruit

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| asset_id | fk assets | |
| asset_version_id | fk, nullable | which ring produced it, when known |
| created_by | fk principals | |
| media_type | text | image / video / text / link |
| storage_key or url | text | reuses existing GCS object paths |
| caption | text | |
| metadata | jsonb | generator, model, settings |
| created_at | timestamptz | |

Existing prompt-image rows map here at cutover.

### `stars`

`(principal_id, asset_id)` composite pk, `created_at`. Counts cached on
assets, recomputable from events.

### `events` — the event stream (option purchase #5)

| column | type | notes |
|---|---|---|
| id | bigserial pk | |
| actor_id | fk principals, nullable | null for system events |
| verb | text | `asset.created`, `asset.published`, `version.created`, `fork.created`, `star.added`, `result.attached`, `sync.pulled`, … |
| object_type / object_id | text / uuid | |
| context | jsonb | |
| created_at | timestamptz | |

Append-only. Gamification, trending, analytics, and any future
reputation or commerce accounting read this; none of them get columns on
content tables.

### `api_tokens` — PAT auth for MCP/CLI (Phase 2 dependency)

| column | type | notes |
|---|---|---|
| id | uuid pk | |
| principal_id | fk principals | |
| name | text | user-visible label ("laptop CLI") |
| token_hash | text unique | hash only; plaintext shown once |
| scopes | text[] | `read`, `write` at launch |
| last_used_at, expires_at, revoked_at, created_at | timestamptz | |

## Legacy mapping

- `prompts` → `assets` (kind=prompt) + one `asset_version`
  (`content_text` = prompt body); `metadata.legacy_prompt_id` keeps the
  back-reference; old URLs can redirect via it.
- prompt images → `asset_results`.
- `collections` → assets (kind=stack) + `asset_edges` (role=item,
  pinned_version_id=null).
- likes/favorites → `stars` + events; existing `activities` rows are the
  seed corpus for `events` if worth migrating, else start clean.

Backfill is a script, run repeatedly/idempotently; legacy tables keep
working throughout (strangler-fig).

## Deliberately NOT in Phase 1

Org/team rows (kind exists, no UI), ACL tables, comments, feeds,
notifications-v2, commerce satellites, normalized tags, full-text search
infra beyond a basic index. Each is additive later.

## Decisions wanting review

1. **Pin vs float default in stacks** — proposal: float to head (folders
   feel live), pin available per edge (harnesses/deploys want pins).
2. **`content_text` + `content_files` dual shape** vs bundles-only —
   proposal: dual; the fast path matters for the Stash's feel.
3. **events from day one vs added at Phase 3** — proposal: day one;
   retrofitting history is impossible by definition.
4. **public_id format** — proposal: 10–12 char base58, prefixed by type
   for debuggability (`a_3kF9…`, `v_…`, like Stripe IDs).
