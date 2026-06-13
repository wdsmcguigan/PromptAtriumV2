# Replit exit — the actual mission frame

**Recorded 2026-06-13 from the Owner directly.** These facts override any doc
that implies otherwise; several earlier docs were written without them.

## The two load-bearing facts

1. **Completely leaving the Replit ecosystem is the core impetus of this whole
   endeavor** — the monorepo rebuild, the v2 schema, the MCP server: all of it
   is the off-ramp. "Deploy" in older docs implicitly meant the Replit app;
   read it skeptically.
2. **This repo (wdsmcguigan/PromptAtriumV2) is NOT the live codebase.** The
   live production app deploys from the Replit-connected repo on a *different
   GitHub account*. Nothing merged here reaches production users. There is no
   deployment pipeline from this repo — yet. (This defused the old "deploy
   gate landmine": main here can't ship ahead of its schema because main here
   doesn't ship.)

## The rule: never mutate the Replit databases

Migration = **clone → transform → cutover**, never in-place surgery on the
live system we're leaving:

- Rehearsal (any time): `pg_dump` Replit prod (read-only, app unaffected) →
  restore into the new/dev Postgres → run `migrate:v2` +
  `lib/db/sql/31-license-codes.sql` + `backfill:v2` + `import:seed` there →
  verify counts (Steward, cold-frame discipline).
- Cutover (later, own runbook — not yet written): final dump → restore →
  deploy new app → move domain. Until then the Replit DB remains the system
  of record and keeps drifting ahead of any snapshot; that's expected.

## Exit inventory (what still lives on Replit / needs a new home)

- **Prod + dev Postgres** (clone at cutover; dev = fresh instance seeded from
  a prod snapshot, don't migrate Replit's dev DB).
- **Object storage** — code uses GCS, but VERIFY whether the bucket is
  Replit-managed or Owner-owned; if Replit-managed, objects must be copied to
  an owned bucket at cutover and serve paths checked.
- **Auth** — code is already generic OIDC (Google default); needs new redirect
  URIs at cutover, no data migration.
- **Domain** — pointed at Replit today; flips at cutover.
- **Expo-app workflows + other connectors** — inventory and re-home; not yet
  enumerated (Owner knows the list).

## Open decisions

- New Postgres hosting (Neon / Supabase / Railway shortlist) — Owner picks,
  Steward briefs on tradeoffs.
- New app hosting + deploy pipeline for this repo — undecided.
- Cutover runbook — to be written once hosting is chosen.
