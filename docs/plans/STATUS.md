# Project status & open threads

> Rolling document — newest session at top. Any orchestrator session should be
> able to boot from CLAUDE.md + `.agents/memory/MEMORY.md` + this file.

## 2026-06-12 (later) — Reconciliation: PRs #6–#10 merged, harvest audited, fan-out approved

### PR landscape (all verified against GitHub, not memory)
- **#6 Phase 1 + license registry — MERGED.** Deploy gate (migrate:v2 +
  `lib/db/sql/31-license-codes.sql`, dev → verify → prod) **still NOT run** —
  owner does it from desktop. ⚠️ The SQL file changed after merge: the CHECK
  constraint now includes `apache-2.0` — run the version on current main.
- **#7 pilot harvest (41 rules) — MERGED**, then audited: 8 assets corrupted by
  WebFetch, content_hash was unfalsifiable. **#9 repair — MERGED** (41/41
  byte-exact vs pinned SHA, hash redefined as integrity hash, WebFetch banned
  for content, validator enforces).
- **#8 MCP appendix — MERGED.** The review comment's 3 schema seams (owner
  handles don't exist on principals; versions are integers not semver;
  "published" = head_version_id + visibility) are now **folded into
  `docs/plans/phase-2-mcp-server.md` §"Schema seams"** — the scaffold session
  reads them there.
- **#10 harvest run #2 (anthropics/skills, 11 skill bundles) — MERGED**, then
  independently audited this session (see below).

### Harvest run #2 audit → fan-out APPROVED
Independent byte-level audit against the pinned tree (`5754626`, shallow clone,
not the tool's own validator): 61/61 files byte-exact, all hashes valid, all
exclusions deliberate & documented in SOURCES.md, negative test confirmed (zero
leaked content). Two license-compliance defects found and **fixed**:
1. Apache-2.0 assets were labeled `mit` (registry had no Apache code) → added
   `apache-2.0` to the registry (licenses.ts, schema.ts enum,
   31-license-codes.sql, harvest skill/validator/detector) and relabeled all 11
   assets. BSD/ISC now exit-3 (human review) instead of relabeling.
2. Bundles didn't carry license text (Apache-2.0 §4 requires it) → each skill's
   `LICENSE.txt` embedded byte-exact, hashes recomputed, re-verified 72/72.
Audit procedure + rules now durable in `.agents/memory/seed-harvesting.md`.
**Both harvest paths (single-file + bundle) validated → production fan-out is a
go** (Sonnet sessions per source, terse /harvest-source invocations, every
harvest PR gets the independent audit before merge).

### Blocked on the owner (desktop access)
1. **Deploy gate for PR #6** (above — use the updated SQL from current main).
2. **Principal handles** (gates Phase 2 scaffold addressing): recommendation =
   add required unique `handle` to principals, backfill from `users.username`
   (nullable — generate fallbacks). Alternative (uuid-canonical URIs) is worse
   model-facing UX.
3. **DMCA designated agent** — ToS placeholder; supply real contact + register.
4. **Brand voice** — two conflicting docs in `docs/research/`; pick one.

### Next builds
1. **Harvest fan-out** (unblocked) — per-source Sonnet sessions; orchestrator
   audits each PR per `.agents/memory/seed-harvesting.md`.
2. **`import-seed.ts`** (unblocked) — JSONL → assets/asset_versions with
   `metadata.source` provenance, "PromptAtrium curation" principal, verify on
   scratch Postgres like the v2 work. 52 assets ready in `data/seed/`.
3. **Phase 2 MCP scaffold** — plan + appendix + seams section are everything a
   build session needs; **waits only on the handle decision**.

## 2026-06-12 — Phase 1 complete, research adopted, seed harvesting begun

### Done (in PR #6, branch `claude/promptatrium-onboarding-sopgft`)
- **Phase 1 v2 schema + API + PAT auth + backfill** — see
  `.agents/memory/v2-asset-api.md` and `docs/plans/phase-1-schema-v2.md`.
  Verified end-to-end on a scratch Postgres (23-check HTTP smoke, idempotent
  backfill).
- **Plan 31 license registry** (backend + frontend + ToS) — see
  `.agents/memory/license-registry.md`.
- **Research adopted:** MCP survey → `docs/plans/phase-2-mcp-server.md`
  (decisions locked); licensing memo → plan 31 (shipped); GTM playbook →
  strategy notes below.

### Blocked on the owner (desktop access)
1. **Deploy gate for PR #6:** `migrate:v2` then `lib/db/sql/31-license-codes.sql`
   on dev (verify `SELECT license, count(*) FROM prompts GROUP BY license`),
   then prod. Then optionally `backfill:v2`.
2. **DMCA designated agent** — ToS placeholder `dmca@promptatrium.com`; supply
   real contact + register with the Copyright Office.
3. **Brand voice decision** — `docs/research/PromptAtriumBrandStrategyv1.md`
   (restrained) vs `Brand Strategy for PromptAtrium.md` (grander) conflict;
   downstream copy needs one canonical pick. Owner's call.

### In flight (other sessions)
- **Seed-corpus harvesting:** owner built a `/harvest-source` skill in another
  session; validation run planned on `PatrickJS/awesome-cursorrules` (CC0),
  capped ~30 assets, output JSONL to `data/seed/` on branch
  `claude/seed-corpus`. License rule: only redistributable content
  (CC0/CC-BY/MIT/Apache); uncertain → wishlist, never ingest. Provenance must
  pin commit SHAs. Sonnet sessions per source after validation.

### Next builds (each on a fresh branch off main, after PR #6 merges)
1. **`import-seed.ts`** — JSONL → assets + asset_versions with
   `metadata.source` provenance, owned by a "PromptAtrium curation" principal.
   Sibling of `backfill-v2.ts`; store layer already supports it. Build when the
   first harvest JSONL lands.
2. **Phase 2 MCP server** — plan locked in `docs/plans/phase-2-mcp-server.md`
   (PAT bearer as OAuth resource server + RFC 9728 stub, Streamable HTTP +
   stdio on pinned SDK v1, Resources + get_asset tool hedge, skill:// per
   SEP-2640, registry prep not dependence). Depends on nothing now that PATs
   exist; `@workspace/asset-core` (plan 30) adds compiled per-tool variants
   later.
3. **mcp-server-kind seed**: script against `registry.modelcontextprotocol.io`
   API (structured data — script, not agent judgment).

### Strategy notes (from the GTM playbook, for sequencing)
- Compounding artifacts before launches: public CC0-grade rules collection +
  open-sourced MCP server syndicated across MCP registries (Glama, PulseMCP,
  mcp.so, Smithery, official) are the distribution engine; Show HN / Reddit
  spikes come after. r/programming bans AI content — skip. Best editorial
  target: Latent Space.

### Asset-model framing (agreed with owner)
Three classes: **snapshot** assets (media prompts — content is the asset),
**upstream-tracked** assets (rules/skills/commands — need `metadata.source`
with repo/path/SHA/license so future scout loops can diff), and **pointer**
assets (mcp-server kind — reference by nature). Schema handles all three
without changes.
