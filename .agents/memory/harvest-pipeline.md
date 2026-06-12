# Harvest-to-database pipeline

**Status (2026-06-12):** built on `claude/harvest-database-pipeline-jihn1o`.
All four components are complete. Typecheck passes. NOT yet merged — Steward
must ratify two open decisions before the pipeline is production-complete.

## What was built

### 1. `import-seed.ts` — the keystone
`artifacts/api-server/src/scripts/import-seed.ts`
Run: `pnpm --filter @workspace/api-server run import:seed`

- Reads `data/seed/assets-*.jsonl` (path resolved relative to compiled output,
  4 levels up to workspace root).
- Owner: singleton "curation" principal (`kind='curation', user_id null`),
  looked up by kind, created if missing.
- Identity: `metadata.source.repo + metadata.source.path` (jsonb matching).
- Change detection: compares `provenance.content_hash` in JSONL against stored
  `metadata.source.content_hash` — same hash → no-op, different → new version.
- New version path mirrors `store.ts createVersion`: `SELECT … FOR UPDATE` to
  serialize version numbers, immutable insert, head pointer move.
- Events: `asset.created` (context.import=true) or `version.created` on update.
- Build: added as entry point in `build.mjs`; `import:seed` package script added.

⚠ **INLINE-BUNDLE DEVIATION (OPEN — needs Steward ratification):**
JSONL `content_files` entries are `{path, text}` (inline text). The v2 schema's
`ContentFile` type (in `store.ts`) expects GCS manifests
`{path, storageKey, size, sha256}`. The importer stores inline form directly in
the `contentFiles` jsonb column, bypassing GCS. The Steward must either:
A. Ratify inline-text bundles as a supported fast path (simplest; adequate for
   the current seed corpus where bundles are <50KB), or
B. Add a GCS upload step before insert (required if bundles must be streamable
   or if the MCP server serves them directly from GCS).

### 2. CI audit gate — `seed-audit.yml`
`.github/workflows/seed-audit.yml`
- Triggers on PRs touching `data/seed/assets-*.jsonl`.
- Step 1: `validate-jsonl.mjs` — schema + content_hash internal consistency.
- Step 2: `audit-upstream.mjs` — byte-comparison against raw.githubusercontent.com
  at pinned SHA. Catches harvest corruption that the internal validator misses
  (the pilot run's 8 corrupted assets would have been caught here).
- New script: `.claude/skills/harvest-source/audit-upstream.mjs`.
- Requires `GITHUB_TOKEN` (passed from `secrets.GITHUB_TOKEN`).

### 3. `data/seed/sources.json` — source queue
Four entries: PatrickJS/awesome-cursorrules (active, harvested), anthropics/skills
(active, harvested), f/awesome-chatgpt-prompts (active, not yet harvested),
modelcontextprotocol/registry (active, structured API — script not agent).
Schema: `{repo, kinds, status, last_harvested_sha, cap, notes}`.
SKILL.md step 9 updated to include updating this file after each harvest run.

### 4. `seed-staleness.yml` — weekly staleness check
`.github/workflows/seed-staleness.yml` (weekly cron, Monday 09:00 UTC)
`.github/scripts/check-seed-staleness.mjs` — the check script.
- For each active source with a `last_harvested_sha`, fetches GitHub HEAD SHA.
- If any moved, creates/updates a single issue titled "Stale harvest sources".
- Does NOT auto-harvest (human + budget decision; the issue is the handoff).

## scoutService.ts report (scrutinize, don't adopt)
`artifacts/api-server/src/services/scoutService.ts`
- **What it does:** uses Gemini 2.5 Pro with Google Search grounding to search
  for trending AI prompts on Reddit, Civitai, Twitter/X, GitHub, Discord. Returns
  `ScoutedPrompt[]` with title, promptText, platform, sourceUrl, tags.
- **What consumes it:** the legacy route monolith (`legacyRoutes.ts`); search the
  file for `scout` to find the handler. It feeds a "prompt discovery" / trending
  feature, not the seed corpus pipeline.
- **Overlap with this pipeline:** none. scoutService is a live-search discovery
  tool for user-facing trending prompts; this pipeline is an offline, audited
  ingestion of permissively-licensed curated assets. They should stay separate.
- **Conflicts:** none — different data sources, different owner principals, different
  content class (trending ephemera vs. audited redistributable assets).
- **Notable:** uses the grounding+no-structured-output workaround documented in
  `.agents/memory/MEMORY.md` (Gemini grounding vs structured output).
  Not suitable for the harvest pipeline (search grounding ≠ byte-faithful fetch).

## Open decisions for the Steward

1. **Inline-bundle fast path** — ratify `{path, text}` content_files as a
   first-class storage shape in the v2 schema, or mandate GCS upload in
   import-seed. Current bundles total ~300KB; GCS is overkill at this scale
   but required if the MCP server must stream bundle files from object storage.

2. **Auto-harvest scheduling** — `seed-staleness.yml` opens an issue when
   sources drift; it does NOT trigger harvests. A future decision: allow a
   scheduled workflow to invoke `/harvest-source` via the Claude API on a
   budget cap. This requires API keys in CI, a PR-auto-merge gate, and a
   budget policy. NOT implemented here by design.

## Idempotency guarantee
Running `import:seed` N times on the same JSONL corpus produces identical DB
state after the first run. Verified criterion: second run must produce
`created: 0, updated: 0, noop: N` (see PR for scratch-DB verification counts).

## How re-harvest = refresh
1. `/harvest-source` runs, produces new JSONL with updated content_hash
2. CI `seed-audit.yml` checks byte-exactness (audit gate)
3. PR merged → `import:seed` runs → for each changed record:
   - content_hash differs from stored → new immutable version, head moves
   - content_hash unchanged → no-op
4. `sources.json` updated with new last_harvested_sha
