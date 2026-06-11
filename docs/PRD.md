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
- **`collections` (stacks)** — ordered sets of assets, deployable as a
  unit ("my Claude Code setup", "beginner Midjourney starter pack").
  Presented as folders in the Stash, as curated packs in the Atrium.
- **Results/creations** — media or text outputs attachable to an asset
  version (the Atrium's content; continuous with the existing prompt-image
  model).
- **Per-kind metadata** — JSONB validated by per-kind Zod schemas;
  render hints and sync-target mapping (`CLAUDE.md` vs `.cursor/rules` vs
  MCP prompt) live with the kind definition.
- **Real migrations** — `drizzle-kit generate`/`migrate` from Phase 1 on;
  no more interactive `push` against shared databases.
- **Forking lineage, stars, tags** from day one (cheap now, painful later).

**Haunted-forest rule:** the schema's generality must never leak into the
default UI. Progressive disclosure is a hard product requirement: users
see only the kinds they own, versioning hides behind "history", and
capture never asks a taxonomy question.

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
