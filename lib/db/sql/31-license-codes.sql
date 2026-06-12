-- Plan 31: migrate prompts.license from display strings to stable codes.
-- Run manually via psql against DATABASE_URL — dev first, verify, then prod.
-- NEVER apply via drizzle-kit push (live DB has drifted; push offers DROPs).
--
-- Sanity check before AND after:
--   SELECT license, count(*) FROM prompts GROUP BY license ORDER BY 2 DESC;
--
-- MUST be applied before deploying the schema.ts change that marks
-- prompts.license NOT NULL DEFAULT 'cc0' (commit that includes this file).

-- 1) Backfill legacy display strings -> stable codes
UPDATE prompts SET license = 'cc0'          WHERE license IN ('CC0 (Public Domain)', 'CC0');
UPDATE prompts SET license = 'cc-by-4.0'    WHERE license IN ('CC BY (Attribution)', 'CC BY');
UPDATE prompts SET license = 'cc-by-sa-4.0' WHERE license IN ('CC BY-SA (Share Alike)', 'CC BY-SA');
UPDATE prompts SET license = 'arr'          WHERE license IN ('All Rights Reserved');

-- 2) NULL / empty / anything unrecognized -> default (cc0).
--    Rationale: historically the form defaulted NULL to CC0; keep that intent.
UPDATE prompts SET license = 'cc0'
  WHERE license IS NULL OR license = ''
     OR license NOT IN ('cc0','cc-by-4.0','cc-by-sa-4.0','mit','arr');

-- 3) Lock the column down to match schema.ts
ALTER TABLE prompts ALTER COLUMN license SET DEFAULT 'cc0';
ALTER TABLE prompts ALTER COLUMN license SET NOT NULL;

-- 4) Defense-in-depth: reject bad values at the DB layer
ALTER TABLE prompts ADD CONSTRAINT prompts_license_check
  CHECK (license IN ('cc0','cc-by-4.0','cc-by-sa-4.0','mit','arr'));
