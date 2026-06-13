# Owner to-do — things only you can do

> Maintained by every agent session: when work blocks on the Owner, add an
> item here **with a how-to**; when the Owner does it, delete the item (STATUS.md
> keeps the history). Ordered by urgency. Auto-imported into session context
> via CLAUDE.md.

## 1. Replit exit, step 1: pick Postgres hosting + hand the Steward a prod snapshot

*(Replaces the old "deploy gate" item — that framing assumed this repo deploys
to the live app. It doesn't: the live app deploys from the Replit-connected
repo on your other GitHub account, and **we never mutate the Replit databases**.
See `.agents/memory/replit-exit.md`.)*

1. **Decide**: managed Postgres for the new stack — Neon / Supabase / Railway
   shortlist. Ask the Steward for a tradeoff brief, or just pick Neon if you
   want the default.
2. **Snapshot** (desktop, read-only, live app unaffected):
   ```bash
   pg_dump "$REPLIT_PROD_DATABASE_URL" -Fc -f promptatrium-prod.dump
   ```
3. **Restore** into the new instance (`pg_restore -d "$NEW_DATABASE_URL" promptatrium-prod.dump`),
   then run the old gate steps **there** — `migrate:v2`,
   `psql -f lib/db/sql/31-license-codes.sql`, `backfill:v2`, `import:seed` —
   and verify license counts before/after. A local Claude Code session can
   drive every step with your approval ("walk me through OWNER-TODO item 1").
4. Cutover (final dump → deploy → domain) is a later task with its own
   runbook, written once hosting is chosen. Until then Replit stays the
   untouched system of record. **Never `db:push` anywhere.**

## 2. DMCA designated agent (desktop, ~15 min + one decision)

Follow `docs/runbooks/dmca-designated-agent.md` (lands with PR #17).
Decision first: get a **virtual business address** (~$10–25/mo — iPostal1,
Anytime Mailbox, …). **Never file your home address — the directory is public
and permanent.** Then: dmca.copyright.gov → register ($6, card) → calendar
reminder at +2y10m → make `dmca@promptatrium.com` a real monitored mailbox →
apply the ToS patch in runbook §4.

## 3. One decision blocking work (just tell the Steward)

- [ ] **Brand voice** — two conflicting docs in `docs/research/`
      (`PromptAtriumBrandStrategyv1.md` = restrained vs `Brand Strategy for
      PromptAtrium.md` = grander). Read both, pick one; downstream copy waits.
      Newer inputs for the cauldron: `.agents/memory/almanac.md` (the earned
      vocabulary — whichever voice wins must be able to say "water table"
      without embarrassment) and `docs/plans/surface-map.md` §three faces
      (the voice must stretch from Keep-grade Capture to Obsidian-grade
      Workshop without changing character).

## 4. Low-urgency toggles

- [ ] Repo setting: **Settings → General → "Automatically delete head
      branches"** (turns the thing that saved harvest run #2 into policy).
      Owner is debating this one.
