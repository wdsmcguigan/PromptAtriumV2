# Project status & open threads

> Rolling document — newest session at top. Any orchestrator session should be
> able to boot from CLAUDE.md + `.agents/memory/MEMORY.md` + this file.

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
