# PromptAtrium PRD — "Where prompts can grow"

*Living document. Started 2026-06-11, after the off-Replit migration and
marketplace removal. Supersedes prior planning docs (`docs/plans/`,
`MIGRATION_AND_RELAUNCH_PLAN.md` ideas); mine those for detail only when
this document is silent.*

## 1. One-liner

**PromptAtrium is the home for your AI working set** — every piece of
context a person feeds an AI (prompts, system prompts, skills, rules,
workflows) lives in one library that grows with them: from a first copied
prompt to a versioned, synced, professional toolkit.

GitHub for context injection, with a front door that doesn't scare normal
people.

## 2. The problem

Everyone who uses AI accumulates working material, and it lives nowhere:

- **Beginners** (the office worker handed Copilot, the curious ChatGPT
  user) retype and lose prompts, and have no trusted place to find good
  ones that isn't listicle spam ("10 hacks to 10x your productivity!").
- **Content creators** iterate on generation prompts across Discord
  threads, Notes apps, and screenshots, with no link between a prompt and
  the results it produced.
- **Professionals** maintain `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`,
  skills, and MCP configs as scattered dotfiles — unversioned, unsynced
  across machines/projects, unshareable except by gist.

Per-tool registries are emerging (cursor.directory, skill collections, MCP
catalogs) but they're fragmented, developer-only, and tied to one tool.
Nothing spans tools, and nothing spans the user's *growth curve*.

## 3. Audience & tone

Three personas, one growth path (the seedling → Mandelbrot arc):

1. **The conscript** — forced to use Copilot/ChatGPT at work. Wants:
   find a good prompt, copy it, done. Must never see the word "schema."
2. **The creator** — image/video/text generation hobbyist or semi-pro.
   Wants: organize iterations, show off results, learn from others'
   prompts *with receipts* (the output attached).
3. **The professional** — developer or power user with an AI working set.
   Wants: versioning, stacks, instant sync into tools (MCP/CLI),
   discovery of quality skills/rules.

**Tone rule:** welcoming, never acerbic. No shock marketing, no "you're
using AI wrong." The brand voice is a garden, not a growth-hack funnel.

## 4. Product shape: one model, two surfaces, three access points

### The Stash (personal surface — built first)

A Google-Keep-grade personal library: instant capture, zero required
fields (quick-save defaults to kind=prompt; organize later), search, pin,
tags, collections-as-folders. This is the retention engine and the place
where browser-extension / right-click / CLI captures land.

### The Atrium (social surface — opens editorially)

A gallery — Instagram in the broad sense — where assets are shown **with
their results**: the prompt and the image it made, the rule-set and the
before/after, the skill and a transcript snippet. Public asset pages,
profiles, stars, forks ("grow a cutting"). Opens with curated/featured
content only; feed mechanics wait for user density. No communities/
sub-communities in v1 (share-first, community later).

### Native access points (what makes it real for professionals)

1. **MCP server** (first): search/fetch/save assets from inside Claude
   Code, Claude.ai, Cursor, etc. Personal-access-token auth.
2. **CLI** (`pa pull/push/sync`): materialize a stack into `.claude/`,
   `.cursor/rules`, `AGENTS.md` in any repo; capture changes back.
   "Dotfiles manager for AI config."
3. **Browser extension** (later): right-click save/insert — the
   conscript's and creator's capture tool.

The web app stays the *least scary* entry; MCP/CLI are the buoyancy
drivers for in-the-know users.

## 5. Data model principles (Phase 1 keystone)

- **`assets`** — one table for every context-injection artifact.
  `kind` references a lookup table (prompt, system_prompt, skill, rule,
  workflow at launch) so new kinds (plugin, harness config, eval, …) are
  data, not migrations.
- **`asset_versions`** — immutable snapshots with changelog. Content is a
  **file bundle** (1 file for a prompt, N files for a skill/plugin),
  stored in GCS like existing objects. Single-text assets and multi-file
  assets are the same shape.
- **`collections` (stacks)** — compositions are themselves assets
  (kind=stack: content is a manifest; membership edges carry a `role` and
  metadata). A stack presents as a folder in the Stash and a curated pack
  in the Atrium today, and the same mechanism grows into deployable
  harnesses (system prompt in the `system` slot, rules in `rules`, skills
  in `skills`, MCP config in `tools`) and platform blueprints later —
  with versioning, forking, and starring of compositions for free.
- **Results/creations** — media or text outputs attachable to an asset
  version (the Atrium's content; continuous with the existing prompt-image
  model).
- **Per-kind metadata** — JSONB validated by per-kind Zod schemas;
  render hints and sync-target mapping (`CLAUDE.md` vs `.cursor/rules` vs
  MCP prompt) live with the kind definition.
- **Real migrations** — `drizzle-kit generate`/`migrate` from Phase 1 on;
  no more interactive `push` against shared databases.
- **Forking lineage, stars, tags** from day one (cheap now, painful later).

### Future-proofing: the option purchases

The practice keeps renaming itself (prompts → prompt engineering →
context engineering → harness engineering → …). We model the invariants —
artifact, version, composition, provenance, target, evidence — as tables,
and push everything that churns into data. Each item below is cheap at
schema-birth and brutal to retrofit; none implies building the feature now:

1. **Kinds as registry, not enum** — new artifact kinds (harness config,
   eval suite, …) are an INSERT, not a migration.
2. **Polymorphic ownership** — assets belong to a *principal*; only users
   exist today, but orgs/teams/sub-groups (social and enterprise) arrive
   later without touching asset tables.
3. **Visibility as enum, never boolean** — `private | unlisted | public`,
   so audience-scoped sharing ("my team", "this community") is an
   additive table later.
4. **Immutable versions with stable IDs** — anything ever licensed,
   audited, or pinned by a deployment must be immutable. This is the
   marketplace *and* enterprise hook.
5. **Events, not features** — append-only event stream
   (asset_published, fork_created, star_given, sync_pulled, …).
   Gamification (credits, badges, streaks) is *derived state* over
   events, as are future reputation, analytics, and trending.
6. **Commerce stays satellite** — the old marketplace failed partly by
   weaving money into content tables. If commerce ever returns it is a
   separate schema (offers, entitlements) referencing asset versions and
   reading the event stream; zero columns on assets. A `license` field on
   assets now (useful for sharing anyway) completes the optionality.
7. **Stable public IDs + slugs** — URLs, API refs, and CLI pins survive
   internal refactors.

Explicitly *not* built now: org tables, ACL machinery, commerce
satellites, reputation systems. Future-proofing buys options; it does not
exercise them.

**Haunted-forest rule:** the schema's generality must never leak into the
default UI. Progressive disclosure is a hard product requirement: users
see only the kinds they own, versioning hides behind "history", and
capture never asks a taxonomy question.

## 5b. Philosophy & metaphor: the garden

The horticulture metaphor is not decoration — it maps onto the
architecture and should be ground into brand voice and consumer UX:

| Garden | Mechanism |
|---|---|
| Seed / seedling | Quick capture into the Stash, zero ceremony |
| Rings (inside the branch) | Immutable version history + event log — present, hidden |
| Leaves & fruit | Results/creations attached to assets — what the Atrium displays |
| Cutting / graft | Fork with lineage ("grow a cutting of this") |
| Garden bed | Stack |
| Greenhouse | Private stash |
| The Atrium | The shared, light-filled space where things are shown in bloom |
| Pruning | Archive / curation |
| Mycelium | The backend + MCP/CLI substrate — invisible, connects every garden, moves nutrients (assets) between them |
| Permaculture | A harness: a designed, self-sustaining context ecosystem |

**Positioning insight:** every industry label is a verb-phase that gets
superseded (prompt engineering → context engineering → harness
engineering → …). PromptAtrium owns the **noun** — the *place* where the
stuff lives, whatever the practice is called this year. "Your garden
grows with you" is the through-line; we never tell users they're "doing
AI wrong."

**Discipline:** the metaphor lives in brand voice and the consumer
surfaces only. Professional interfaces stay plain — the CLI is
`pa pull`, never `pa harvest`. Leaves for the conscript and creator;
plain bark for the professional.

## 6. Execution phases

| Phase | Deliverable | Status |
|---|---|---|
| 0 | Off-Replit migration; marketplace removal; portable build/deploy | **Done** |
| 1 | v2 core: assets/versions/collections schema, migrations, tested API modules, PAT auth, map legacy prompts → assets | Next |
| 2 | MCP server (remote + npx stdio) | |
| 3 | Web relaunch: Stash + curated Atrium on the asset model; salvage editor & refinement chat | |
| 4 | CLI sync; then browser extension | |
| 5+ | Feeds/communities (at density), teams/orgs, evals — *as demand shows* | |

Strangler-fig throughout: the legacy app keeps running; new modules grow
beside `legacyRoutes.ts`/`storage.ts`, pages cut over one at a time, and
legacy code is deleted, never polished.

## 7. Business posture

- Budget ≈ $0: Railway or Cloud Run free/cheap tiers + Neon free Postgres
  + existing GCS bucket. Sessions are in Postgres; the Docker image is
  host-portable.
- Goal: a live URL + a 30-second demo ("watch me save this prompt from
  inside Claude Code, then `pa pull` my whole setup into a new repo")
  that makes the potential legible to users and possible backers.
- No monetization in v1. The deleted marketplace is not coming back in
  any near horizon; if monetization ever returns it will be
  subscriptions/teams, not prompt sales.

## 8. Open questions

- Naming of "stacks" vs "collections" (existing feature overlaps).
- Fate of legacy features at cutover: codex/glossary, prompt miner,
  gamification credits — keep, fold in, or retire per usage.
- Result-attachment moderation story once the Atrium opens.
- Mobile: parked; responsive web serves it. Revisit post-Phase 4.
