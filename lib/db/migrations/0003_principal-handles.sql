-- Phase 2 seam #1: add a required, unique `handle` to principals.
-- Owner-approved 2026-06-12 (docs/plans/phase-2-mcp-server.md §"Schema seams").
-- drizzle generated `ADD COLUMN "handle" text NOT NULL` + the unique index;
-- that bare form fails on a non-empty table, so this hand-edited version adds
-- the column nullable, backfills, then enforces NOT NULL. The snapshot
-- (meta/0003_snapshot.json) already reflects the final NOT NULL + unique state.
--
-- Backfill rules:
--  * The singleton curation principal owns the public seed corpus; its assets
--    are addressed as asset://promptatrium/… — it gets the reserved brand
--    handle ahead of the general pass.
--  * The general pass reads legacy users.username when that table exists
--    (production, dev) but must also run on v2-only databases (scratch
--    verification, CI) — hence the to_regclass guard; there, every remaining
--    principal gets the stable `user-<short-id>` fallback.
--  * Pre-assigned handles participate in the ranking as fixed (rank-first),
--    so a username that slugifies onto a taken handle is suffixed, never
--    overwritten. The unique index created afterwards is the final guarantee —
--    this migration fails closed rather than writing a duplicate.

ALTER TABLE "principals" ADD COLUMN "handle" text;--> statement-breakpoint

DO $$
BEGIN
  UPDATE "principals" SET "handle" = 'promptatrium'
  WHERE id = (SELECT id FROM "principals" WHERE kind = 'curation' ORDER BY id LIMIT 1);

  IF to_regclass('public.users') IS NOT NULL THEN
    WITH base AS (
      SELECT
        p.id,
        (p.handle IS NOT NULL) AS fixed,
        COALESCE(
          p.handle,
          COALESCE(
            NULLIF(
              trim(BOTH '-' FROM regexp_replace(lower(u.username), '[^a-z0-9]+', '-', 'g')),
              ''
            ),
            'user-' || substr(replace(p.id::text, '-', ''), 1, 8)
          )
        ) AS h
      FROM "principals" p
      LEFT JOIN "users" u ON u.id = p.user_id
    ),
    ranked AS (
      SELECT
        id,
        h,
        row_number() OVER (PARTITION BY h ORDER BY fixed DESC, id) AS rn
      FROM base
    )
    UPDATE "principals" p
    SET "handle" = CASE
        WHEN r.rn = 1 THEN r.h
        ELSE r.h || '-' || substr(replace(p.id::text, '-', ''), 1, 12)
      END
    FROM ranked r
    WHERE p.id = r.id AND p."handle" IS NULL;
  ELSE
    -- v2-only database: no legacy usernames to mine; stable fallbacks only.
    -- uuid prefixes are unique across so few rows; the unique index still
    -- backstops the theoretical collision.
    UPDATE "principals"
    SET "handle" = 'user-' || substr(replace(id::text, '-', ''), 1, 8)
    WHERE "handle" IS NULL;
  END IF;
END $$;--> statement-breakpoint

ALTER TABLE "principals" ALTER COLUMN "handle" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "principals_handle_idx" ON "principals" USING btree ("handle");
