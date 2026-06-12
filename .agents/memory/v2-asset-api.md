# v2 Asset API (Phase 1)

**Status (2026-06-12):** built, smoke-tested, in PR #6. NOT yet migrated/deployed
on dev or prod databases.

## Shape
- Schema: `lib/db/src/schema/v2.ts` — principals, asset_kinds (registry),
  assets, asset_versions (immutable), asset_edges (stacks), asset_results,
  stars, events (append-only), api_tokens. Real migrations in
  `lib/db/migrations/` via `drizzle-v2.config.ts` (`migrate:v2` script).
  Legacy tables frozen; v2 lives alongside (strangler-fig).
- API: `artifacts/api-server/src/v2/` (ids, auth, store, routes), mounted at
  `/api/v2` in legacyRoutes after setupAuth. Design doc:
  `docs/plans/phase-1-schema-v2.md`.

## Rules that must not be weakened
- Everything references **principals**, never users directly (orgs arrive later
  as rows, not columns). `getOrCreatePrincipalForUser` in `v2/auth.ts`.
- **asset_versions are immutable** — no UPDATE after insert; new content = new
  version + head pointer move (enforced in store layer, serialized with
  `SELECT … FOR UPDATE`).
- Auth = web session **or** PAT bearer (`pat_…`); only the sha256 hash is
  stored; scopes `read`/`write`; **PATs cannot mint/revoke PATs** (session-only
  token routes). PAT design intentionally matches the MCP survey's "Linear
  model" — the bearer fallback is permanent even after OAuth lands.
- Invisible assets return **404, not 403** (don't leak existence).
- Public ids are typed base58 (`a_…`); URLs/API never expose internal uuids.

## Backfill & smoke
- `pnpm --filter @workspace/api-server run backfill:v2` — idempotent legacy→v2
  (prompts→assets+v1, images→results, collections→stacks+edges,
  likes+favorites→deduped stars, branch_of→fork lineage). Re-runs are no-ops;
  provenance in `metadata.legacy_prompt_id` / `legacy_collection_id`.
- Manual HTTP smoke: `artifacts/api-server/src/scripts/v2-smoke.ts` (23 checks;
  build/run instructions in its header; needs scratch DB + seeded
  user-alice/user-bob + backfill).

## Deploy gate (until done, this blocks deploying main after PR #6)
1. `pnpm --filter @workspace/db run migrate:v2` on dev, then prod (additive).
2. `psql -f lib/db/sql/31-license-codes.sql` on dev (verify counts), then prod.
3. Optionally `backfill:v2` (any time after step 1).
Never `db:push` (see schema-drift-dev-db.md).
