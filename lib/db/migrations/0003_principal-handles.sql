-- Phase 2 seam #1: add a required, unique `handle` to principals.
-- Owner-approved 2026-06-12 (docs/plans/phase-2-mcp-server.md §"Schema seams").
-- drizzle generated `ADD COLUMN "handle" text NOT NULL` + the unique index;
-- that bare form fails on a non-empty table, so this hand-edited version adds
-- the column nullable, backfills from users.username (slugified) with generated
-- fallbacks for nulls/collisions, then enforces NOT NULL. The snapshot
-- (meta/0003_snapshot.json) already reflects the final NOT NULL + unique state.

ALTER TABLE "principals" ADD COLUMN "handle" text;--> statement-breakpoint

-- Backfill in a single pass. Base handle = slugified users.username when the
-- principal maps to a legacy user that has one; otherwise a stable
-- `user-<short-id>` fallback. A window function appends an id-derived suffix to
-- every duplicate so the result is collision-free even when two usernames
-- slugify to the same value (or a fallback meets a real slug). The unique index
-- created afterwards is the final guarantee — this migration fails closed
-- rather than writing a duplicate.
WITH base AS (
  SELECT
    p.id,
    COALESCE(
      NULLIF(
        trim(BOTH '-' FROM regexp_replace(lower(u.username), '[^a-z0-9]+', '-', 'g')),
        ''
      ),
      'user-' || substr(replace(p.id::text, '-', ''), 1, 8)
    ) AS h
  FROM "principals" p
  LEFT JOIN "users" u ON u.id = p.user_id
),
ranked AS (
  SELECT
    id,
    h,
    row_number() OVER (PARTITION BY h ORDER BY id) AS rn
  FROM base
)
UPDATE "principals" p
SET "handle" = CASE
    WHEN r.rn = 1 THEN r.h
    ELSE r.h || '-' || substr(replace(p.id::text, '-', ''), 1, 12)
  END
FROM ranked r
WHERE p.id = r.id;--> statement-breakpoint

ALTER TABLE "principals" ALTER COLUMN "handle" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "principals_handle_idx" ON "principals" USING btree ("handle");
