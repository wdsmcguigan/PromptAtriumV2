# Agent team & relationship map

Org design for PromptAtrium's agent workforce, set by the owner 2026-06-12.
The Steward (orchestrator session) owns this map — update it when roles are
added or responsibilities move.

```
Owner (wdsmcguigan) — decisions only he can make: deploys/DB gates, product
  │                   calls (handles, brand voice), legal (DMCA), spend
  ▼
Steward (orchestrator, this role) — judgment & review: audits every harvest
  │   PR against pinned upstream, reviews pipeline/build PRs against the real
  │   schema & store semantics (not just internal consistency), sequences the
  │   queue, keeps STATUS.md + memory current, surfaces owner decisions with
  │   recommendations (not menus)
  ▼
Gardener (Sonnet, long-lived pipeline agent) — owns harvest infrastructure:
  │   import-seed.ts, CI byte-audit gate on data/seed PRs, sources.json queue,
  │   weekly staleness check. Lands work as PRs; flags decisions up.
  ▼
Harvest workers (Sonnet, ephemeral, one per source) — terse /harvest-source
  │   invocations; fresh branch per run; no judgment calls — license edge
  │   cases exit to human review, uncertain → wishlist
  ▼
Deterministic substrate — scripts (license-detector, validate-jsonl, deduper),
    CI checks, cron. Detects and verifies; never ingests or decides.
```

## Standing rules

- **Research sessions are bounded consultants**: one final deliverable
  (memo/survey), then archived — no open-ended extensions.
- **Marketing tooling (future) consumes corpus exports — it never writes** to
  the corpus, the DB, or the repo.
- Decisions flow up (worker → Gardener → Steward → Owner); each layer resolves
  what it can and escalates only what it can't.
- Anything merged on a lower layer's say-so still gets the layer-above review:
  harvest PRs get the Steward's independent byte-audit
  (`.agents/memory/seed-harvesting.md`); pipeline PRs get a v2-store-semantics
  review; cron/auto behavior changes get the Owner's sign-off.
