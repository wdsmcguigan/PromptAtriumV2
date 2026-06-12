# License registry (plan 31)

**Status (2026-06-12):** code complete in PR #6; the raw-SQL migration has NOT
yet run on dev/prod (see deploy gate in v2-asset-api.md).

- Single source of truth: `lib/db/src/schema/licenses.ts` — stable codes
  `cc0 | cc-by-4.0 | cc-by-sa-4.0 | mit | arr`, **default `cc0`** (product
  decision in `docs/plans/31-license-picker-and-terms.md` §0 — do not
  re-litigate). Frontend imports as `@shared/licenses`.
- **Store codes, never display strings.** `normalizeLicense()` maps legacy
  display strings ("CC0 (Public Domain)" etc.) and unknowns → codes;
  `licenseLabel()` renders. Pickers map `LICENSE_LIST`.
- `arr` (All Rights Reserved) **disables copy-to-library/branch** for other
  users' prompts — gate via `LICENSES[normalizeLicense(x)].allowsCopy`. The
  branch action lives in PromptCard (`branchMutation`) and prompt-detail.
- `prompts.license` is enum'd varchar NOT NULL DEFAULT 'cc0' in schema.ts;
  the matching DB migration is `lib/db/sql/31-license-codes.sql` (raw SQL,
  ordered: normalize → default → NOT NULL → CHECK). Code that inserts prompts
  must send a valid code — `license: 'private'` was a real bug
  (promptHistoryStorage), fixed.
- v2 `assets.license` uses the same codes; v2 createAsset defaults to cc0;
  backfill normalizes and stashes unrecognized originals in
  `metadata.legacy_license`.
- ToS (`pages/terms.tsx`) has the 4 clauses from the licensing memo; the DMCA
  designated-agent contact is a **placeholder** (`dmca@promptatrium.com`) —
  owner must supply the real agent + register with the Copyright Office.
- Backing research: `docs/research/prompt-licensing-and-terms-memo.md`.
  Ingestion implication: only harvest redistributable content (CC0/CC-BY/MIT/
  Apache); uncertain → wishlist, never ingest.
