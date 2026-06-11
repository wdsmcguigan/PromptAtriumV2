# Schema & DB Additions for Lite + Shared Features

## What & Why
Adds the database columns and tables needed to power PromptAtriumLite's Discover and teaser features, and extends the shared prompt type system with new categories (skill, rule, agent, plugin). All changes are applied via raw SQL — never db:push — to avoid destructive migration prompts. Changes apply to both the dev and production databases.

Also creates the project's `docs/` folder with the schema reconciliation TODO documented there for future reference.

## Done looks like
- `prompts` table has `is_lite_featured` and `is_lite_preview` boolean columns (default false) in both dev and production
- `feature_types` table exists with initial rows: lite_featured, lite_preview, marketplace_featured, trending, sponsored
- `prompt_features` join table exists (prompt_id, feature_type_id, sort_order, expires_at) with a unique constraint and indexes
- `prompt_types` table has new global entries: skill, rule, agent, plugin (inserted, not schema-changed)
- A public (no-auth) GET endpoint returns prompts where `is_lite_featured = true`
- A public (no-auth) GET endpoint returns prompts where `is_lite_preview = true`
- A handful of existing public prompts are seeded as featured/preview (flag flipped via SQL)
- `docs/schema-reconciliation-todo.md` exists documenting the deferred schema cleanup work
- Web app admin area (or platform_settings) can toggle featured/preview flags on individual prompts via the existing admin API patterns — no new UI required for now; raw SQL seed is sufficient

## Out of scope
- Removing or renaming any existing columns (deferred to schema reconciliation task)
- db:push — never use this
- Admin UI for managing feature flags (future task; seed via SQL for now)
- Workflow/step linking columns on prompts (direction unclear; deferred)
- PromptAtrium Mobile or Lite app changes

## Steps
1. **Create docs folder** — Write `docs/schema-reconciliation-todo.md` documenting the deferred schema cleanup: which tables/columns exist in the live DB but not in schema.ts, which are legacy duplicates, and the safe approach to reconcile without db:push.
2. **Add Lite columns to prompts** — Run `ALTER TABLE prompts ADD COLUMN IF NOT EXISTS is_lite_featured boolean DEFAULT false` and the same for `is_lite_preview` against both dev and production databases. Add partial indexes on each.
3. **Create feature_types table** — Raw SQL `CREATE TABLE IF NOT EXISTS feature_types` with id, name (unique), display_name, description, is_active, created_at. Insert the initial five type rows.
4. **Create prompt_features join table** — Raw SQL with prompt_id (FK), feature_type_id (FK), sort_order, expires_at, created_at. Add a UNIQUE constraint on (prompt_id, feature_type_id) and indexes on both FK columns.
5. **Add new prompt type values** — `INSERT INTO prompt_types` for skill, rule, agent, and plugin as global entries (type='global', is_active=true). Skip if already exists.
6. **Update schema.ts** — Add the two new boolean columns to the `prompts` table definition, and add `featureTypes` and `promptFeatures` table definitions so schema.ts stays in sync.
7. **Backend endpoints** — Add two public (no-auth, strictApiLimiter) GET routes: one for lite-featured prompts, one for lite-preview prompts. Both filter isPublic=true, isHidden=false, isNsfw=false, and respect the existing public-prompt shape.
8. **Seed featured/preview prompts** — Flip `is_lite_featured = true` on 10–15 high-quality existing public prompts and `is_lite_preview = true` on 5–8 others via direct SQL.
9. **Verify** — API typecheck passes; curl both new endpoints unauthenticated and confirm they return data; confirm columns exist in both DBs.

## Relevant files
- `lib/db/src/schema/schema.ts:466-528`
- `lib/db/src/schema/schema.ts:310-319`
- `artifacts/api-server/src/legacyRoutes.ts`
- `artifacts/api-server/src/index.ts`
