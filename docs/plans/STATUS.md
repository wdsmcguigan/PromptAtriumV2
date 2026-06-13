# Project status & open threads

> Rolling document — newest session at top. Any orchestrator session should be
> able to boot from CLAUDE.md + `.agents/memory/MEMORY.md` + this file.

## 2026-06-13 — Brand voice DECIDED & forged (branch `claude/brand-voice-documentation-wf6los`)

The "pick one brand voice" Owner decision is **resolved**, not by picking but by
synthesizing both research drafts into a canonical **`docs/brand/brand-voice-v1.md`**.
Owner decisions locked this session: **restrained-cultivation register** +
**one-continuum persona arc** (conscript→professional inside one product).

- **Synthesis:** restrained "Codified Fertilizer" is the register source; the
  "Foundational" draft contributed the progressive-disclosure pillar, the
  professional-wedge GTM, and the noun-ownership thesis. Five pillars
  (Permanence, Progressive disclosure, Receipts, Composability, Hospitality);
  integrity folded into the litmus tests as the enforcement layer.
- **Reconciled against project canon** — the key new value-add. Both drafts
  violated the almanac's **no-trees rule** (arboreal words belong to git, not the
  garden): "rings" and the "root/trunk/branch = high-credibility" gradient are
  **retired**. Versions are plain "Version"; forking is "Fork"/"grow a cutting."
- **Implementation debt flagged (§12):** user-facing **"branch"** must become
  "Fork"/"cutting" — the code's `branchMutation` name stays (git owns the tree),
  but the PromptCard/prompt-detail **labels** need an audit. `arr` assets show no
  live Fork button. Handles (`@handle`) are the public name; license labels render
  from codes. Lexicon grounded in real mechanics throughout.
- **Honesty ledger (§13):** the doc only lets marketing claim what's built per
  `surface-map.md` (stacks/versioning/CLI not yet user-visible — don't claim them
  live).
- Two research drafts now carry superseded-by banners pointing at the canonical
  doc; OWNER-TODO brand-voice item deleted. Memory: `.agents/memory/brand-voice.md`.
- **Owner follow-up:** none blocking. When copy/UI work begins, §12 is the
  catch-up checklist; the rename-to-"The Atrium" question is logged as a
  long-horizon tension in §16, not a v1 action.

## 2026-06-12 (late night) — Phase 2 MCP scaffold BUILT (branch `claude/adoring-ramanujan-ckwyvm`)

Built per `docs/plans/phase-2-mcp-server.md` + appendix + Schema seams. Full
workspace typecheck green; end-to-end smoke-tested with the real MCP SDK client
over **both** transports. Details: `.agents/memory/phase-2-mcp-server.md`.

- **Seam #1 resolved — `principals.handle` (required + unique).** Migration
  `0003_principal-handles.sql` (hand-edited after `drizzle-kit generate`: add
  nullable → backfill from `users.username` slug with `user-<short-id>`
  fallbacks → window-function id-suffix dedup → SET NOT NULL + unique index).
  **Validated on a scratch PG 16**: case-collisions (`Alice`/`alice`), null
  username, slug-to-empty, diacritics, null-user_id curation principal — all
  unique, zero nulls. Snapshot updated so future `generate` stays consistent.
  All principal inserts now set a handle (auth / import-seed=`promptatrium` /
  backfill). Seams #2 (int versions) & #3 (head = latest) honored as-is.
- **v2 API:** `GET /api/v2/me` (caller learns its handle),
  `GET /api/v2/handles/:handle/assets/:slug` (+ `/versions/:number`,
  canRead-gated 404-not-403), `ownerHandle` on list/single responses.
- **New package `artifacts/mcp-server` (`promptatrium-mcp`):** thin front-end
  over `/api/v2` (never touches the DB → one code path for stdio + hosted).
  `createMcpServer` (tools `list_assets`/`get_asset`, resources
  `asset://`+`skill://` SEP-2640, prompt-kind→MCP prompts, `listChanged`);
  stdio bin (PAT via env, stderr-only logs); Streamable HTTP
  (`mountMcpServer`/`createMcpHttpApp`: single `/mcp`, per-session factory,
  Origin→403, bearer→401+`WWW-Authenticate`, RFC 9728 stub). **SDK pinned v1
  `@modelcontextprotocol/sdk@^1.29.0`; package uses zod v3 (SDK peer) — the one
  spot that diverges from the repo's zod-v4 rule.** `server.json` checked in,
  unpublished.
- **Out of scope (per plan):** OAuth AS (Claude.ai's only path), write tools,
  registry GA publish, per-tool compiled variants (plan 30). api-server does NOT
  mount `/mcp` by default (keeps the SDK out of the server bundle).
- **Remaining to productionize:** deploy gate (`migrate:v2` now also runs 0003)
  → stand up the hosted endpoint → live-verify in Claude Code/Cursor → publish
  the npm package + submit `server.json` once the official registry exits preview.

## 2026-06-12 (late night) — Owner decisions: handles APPROVED, budget set; board clean

- **PRs #13–#18 all MERGED** (operating rules, seed-audit required-check fix,
  almanac, blight screening, DMCA runbook, OWNER-TODO). Branch protection
  ruleset active on main: required check `Validate and audit seed corpus` +
  PR-before-merge, approvals 0 (single-account — self-approval impossible).
- **Principal handles: APPROVED by the Owner** (2026-06-12 ~21:48 UTC) —
  required unique `handle` on `principals`, backfill from `users.username`,
  generated fallbacks for nulls. **The Phase 2 MCP scaffold is now fully
  unblocked**; seam §1 in `docs/plans/phase-2-mcp-server.md` marked resolved.
  Note: the gap wasn't Replit's doing — Phase 1 deliberately kept principals
  minimal (kind + user_id); Replit-era auth only explains why legacy
  `users.username` is nullable, hence the backfill fallbacks.
- **Agent/token budget set:** $0 today (nothing runs unattended; interactive
  sessions ride the Owner's plan). When scheduled automation first lands,
  starting cap **$25–50/month**, reviewed at first real invoice.
- Remaining owner items (see OWNER-TODO.md): deploy gate, DMCA filing, brand
  voice, auto-delete-branches toggle (debating).

## 2026-06-12 (night) — Blight screening added to the phytosanitary gate

- **New inspection: blight** (byte-perfect, properly-licensed copies of
  *malicious* content passed every existing gate). `blight-check.mjs` is the
  deterministic layer — invisible/bidi unicode, piped-shell installs,
  encoded-exec, long base64 blobs, injection phrasing, raw-IP URLs — wired as
  step 3 of `seed-audit.yml`. Findings are fatal unless allowlisted in
  `data/seed/blight-allowlist.json` (per content_hash × check, with reason +
  reviewer + date; never allowlist unread content).
- Corpus screened: 52 records, one finding — skill-creator's *defensive*
  mention of exfiltration — read in upstream context and allowlisted.
  Negative test: five planted blight classes all detected, exit 1.
- **Procedural layer** (SKILL.md + seed-harvesting.md): adversarial read of
  every new source; re-harvest PRs must display the upstream diff (a trusted
  source compromised after first harvest propagates via the refresh loop).
- **DMCA runbook** researched & landing as `docs/runbooks/dmca-designated-agent.md`
  (separate PR): $6 Copyright Office filing, 3-year renewal, ToS patch,
  §512(c)(3)/(g)(3) takedown + counter-notice procedures. Owner files from
  desktop — recommendation: virtual business address, never the home address.

## 2026-06-12 (evening) — PR #12 verified, ratified & MERGED; operating rules codified

- **Gardener's PR #12** (import-seed.ts + CI audit gate + sources.json +
  staleness check) independently verified on scratch Postgres 16: run 1
  `created: 52`, run 2 all no-ops, update-probe → immutable v1 preserved +
  head moves to v2; CI audit script 113/113 green on the real corpus and
  exit-1 on a one-byte tamper. Review posted on the PR with counts;
  **merged by the Owner 2026-06-12 ~16:30 UTC.**
- **Both Steward decisions ratified on the PR:** (a) inline-text bundles
  accepted as the storage shape (GCS manifests = future large/binary path;
  follow-up: declare the inline form in `store.ts`'s `ContentFile` union);
  (b) no auto-scheduled harvests — cron detects, never ingests.
- **Required follow-up:** the CI gate checks byte-faithfulness but not
  *completeness* (missing-file detection is how the LICENSE.txt omission was
  caught). Until a tree-diff lands in `audit-upstream.mjs`, the Steward's
  manual audit per `.agents/memory/seed-harvesting.md` stays authoritative.
- ⚠️ **Branch protection:** `seed-audit.yml` only blocks merges if the Owner
  enables required status checks on `main` (Settings → Branches).
- **Operating rules codified** in `.agents/memory/agent-roles.md` (INVARIANTS
  + disposable roster; supersedes the agent-team.md draft that never reached
  main). Steward succession: PRIME → **PLUMB** (this session).

## 2026-06-12 (Gardener session) — Harvest-to-database pipeline built

### What was built (branch `claude/harvest-database-pipeline-jihn1o`)

All four pipeline components are complete. Full typecheck passes.

1. **`import-seed.ts`** (`artifacts/api-server/src/scripts/import-seed.ts`) —
   the keystone. Reads `data/seed/assets-*.jsonl`, upserts into v2 tables.
   - Owner: singleton `curation` principal (`kind='curation', user_id null`).
   - Identity: `metadata.source.repo + metadata.source.path`.
   - Change detection: `provenance.content_hash` vs stored → no-op or new version.
   - New version path mirrors `store.ts createVersion` (FOR UPDATE pattern).
   - Added entry in `build.mjs`; `import:seed` package script added.

2. **CI audit gate** — `.github/workflows/seed-audit.yml` on PRs touching
   `data/seed/assets-*.jsonl`. Two steps: schema validation (`validate-jsonl.mjs`)
   then upstream byte-comparison (`audit-upstream.mjs` — new script in
   `.claude/skills/harvest-source/`). Automates the manual audits that caught 8
   corrupted assets in the pilot.

3. **`data/seed/sources.json`** — source queue with 4 entries: PatrickJS/
   awesome-cursorrules (active, harvested), anthropics/skills (active, harvested),
   f/awesome-chatgpt-prompts (active, not yet harvested), modelcontextprotocol/
   registry (active, script not agent). SKILL.md step 9 updated to update this
   file after each run.

4. **`seed-staleness.yml`** — weekly cron (Monday 09:00 UTC); for each active
   source with `last_harvested_sha`, fetches GitHub HEAD, creates/updates single
   issue "Stale harvest sources" listing what moved. No auto-harvesting.

**scoutService.ts** scrutinized (see `.agents/memory/harvest-pipeline.md`):
live Gemini+grounding search for trending prompts; feeds a legacy discovery
feature in `legacyRoutes.ts`; no overlap or conflict with this pipeline.

### Two open decisions for the Steward (block production use of import:seed)

1. **Inline-bundle fast path** — JSONL `content_files` are `{path, text}` but
   the v2 `ContentFile` type expects GCS manifests. import-seed.ts stores inline
   form directly in jsonb. Ratify as supported fast path, OR mandate a GCS
   upload step. See `.agents/memory/harvest-pipeline.md` §INLINE-BUNDLE DEVIATION.

2. **Auto-harvest scheduling** — staleness.yml opens an issue but does NOT
   trigger harvests. A future decision: allow scheduled harvest via Claude API.
   Requires API keys in CI + budget policy + PR-auto-merge gate. Intentionally
   not built here.

### Verification needed before merge
Run on a scratch Postgres (per `.agents/memory/v2-asset-api.md` procedure):
```
pnpm --filter @workspace/api-server run import:seed   # run 1
pnpm --filter @workspace/api-server run import:seed   # run 2 — must be all no-ops
```
Paste counts in the PR: expected `{created: 52, updated: 0, noop: 0}` then
`{created: 0, updated: 0, noop: 52}`.

### Still blocked on the owner (unchanged from previous session)
1. Deploy gate for PR #6 (migrate:v2 + 31-license-codes.sql on dev+prod).
2. Principal handles decision (gates Phase 2 MCP scaffold).
3. DMCA designated agent.
4. Brand voice.

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
