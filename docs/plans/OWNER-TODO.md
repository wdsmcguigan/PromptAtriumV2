# Owner to-do — things only you can do

> Maintained by every agent session: when work blocks on the Owner, add an
> item here **with a how-to**; when the Owner does it, delete the item (STATUS.md
> keeps the history). Ordered by urgency. Auto-imported into session context
> via CLAUDE.md.

## 1. Merge taps (mobile-friendly)

- [ ] **PR #16 — blight screening** (CI green, full gate exercised)
- [ ] **PR #17 — DMCA runbook** (docs-only, check green)
- [ ] **PR for this file** (you're reading it, so probably done)

## 2. Deploy gate for PR #6 (desktop, ~15 min) — the live landmine

Production code past PR #6 assumes these have run. **Dev first, verify, then prod. Never `db:push`.**

```bash
# 0. Sanity snapshot (run BEFORE and AFTER step 2):
psql "$DATABASE_URL" -c "SELECT license, count(*) FROM prompts GROUP BY license ORDER BY 2 DESC;"

# 1. v2 tables (additive only; legacy tables untouched):
pnpm --filter @workspace/db run migrate:v2

# 2. License codes (normalizes display strings → codes, locks the column):
psql "$DATABASE_URL" -f lib/db/sql/31-license-codes.sql
```

Repeat with prod `DATABASE_URL`. Use the SQL **from current main** (the CHECK
constraint includes `apache-2.0`). Afterwards, optionally:

```bash
pnpm --filter @workspace/api-server run backfill:v2   # idempotent legacy→v2
pnpm --filter @workspace/api-server run import:seed   # 52-asset seed corpus → v2
```

⚠️ `import:seed` creates the curation principal and 52 **public** v2 assets in
that DB. The legacy frontend doesn't surface v2 assets yet, so user impact is
nil — but it's a deliberate step, not part of the gate.

## 3. DMCA designated agent (desktop, ~15 min + one decision)

Follow `docs/runbooks/dmca-designated-agent.md` (lands with PR #17).
Decision first: get a **virtual business address** (~$10–25/mo — iPostal1,
Anytime Mailbox, …). **Never file your home address — the directory is public
and permanent.** Then: dmca.copyright.gov → register ($6, card) → calendar
reminder at +2y10m → make `dmca@promptatrium.com` a real monitored mailbox →
apply the ToS patch in runbook §4.

## 4. Two decisions blocking builds (just tell the Steward)

- [ ] **Principal handles** — gates the Phase 2 MCP scaffold.
      Recommendation: add required unique `handle` to `principals`, backfill
      from `users.username`, generated fallbacks for nulls. Reply "handles
      approved" (or veto) and the scaffold session launches.
- [ ] **Brand voice** — two conflicting docs in `docs/research/`
      (`PromptAtriumBrandStrategyv1.md` = restrained vs `Brand Strategy for
      PromptAtrium.md` = grander). Read both, pick one; downstream copy waits.

## 5. Low-urgency toggles & numbers

- [ ] Repo setting: **Settings → General → "Automatically delete head
      branches"** (turns the thing that saved harvest run #2 into policy).
- [ ] Put a number on the **monthly agent/token budget** before scheduled
      gardening makes spend creep silently (PRIME's harbinger).
