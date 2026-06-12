# Plan 31 — Asset License Picker (stable codes) + ToS clauses

> **Builder-agent handoff.** Self-contained. Implements the per-asset `license` field as a
> stable code enum with a shared registry, migrates existing data, wires the picker into the
> existing modals, and tightens the Terms of Service. Decisions already made by the product
> owner are in **§0**. Backing research: `docs/research/prompt-licensing-and-terms-memo.md`.

## 0. Decisions (do not re-litigate)
- **Default license = `cc0`** (keep current product behavior; matches awesome-chatgpt-prompts / awesome-cursorrules).
- **Storage = stable SPDX-style codes**, not display strings. Existing rows **must be migrated** (raw SQL, §2).
- **Menu (final enum):** `cc0`, `cc-by-4.0`, `cc-by-sa-4.0`, `mit`, `arr`.
- `arr` (All Rights Reserved) **disables copy-to-library** for that asset.

## 0.1 HARD GOTCHAS (read `replit.md` + `.agents/memory/MEMORY.md` first)
- ⛔ **NEVER run `pnpm --filter @workspace/db run push` / `db:push`.** The live DB has drifted both directions; push offers to DROP real tables. Apply schema changes via **raw SQL on BOTH dev and prod** (§2).
- The codebase constrains strings with the inline `varchar(name, { enum: [...] })` pattern (see `status`, `subCommunityVisibility` in `schema.ts`) — **not `pgEnum`**. Follow that pattern.
- Verify with **`run typecheck`**, never `build`.
- `@shared/*` alias → `lib/db/src/schema/` (both Vite and tsconfig). New shared module goes there and imports as `@shared/licenses`.

## Current state (verified)
- `lib/db/src/schema/schema.ts:510` — `license: varchar("license")` on the **`prompts`** table: free-form, nullable, **no default**.
- Picker already exists, hardcoded, storing **display strings**:
  - `artifacts/prompt-atrium/src/components/PromptModal.tsx:986-989` (`"CC0 (Public Domain)"`, `"CC BY (Attribution)"`, `"CC BY-SA (Share Alike)"`, `"All Rights Reserved"`); default literal `"CC0 (Public Domain)"` at lines 77, 105, 131, 190, 216, 607.
  - `artifacts/prompt-atrium/src/components/BulkEditModal.tsx:869-890` + zod `license: z.string().optional()` at line 30.
- Read-only display of the raw string: `prompt-detail.tsx:683-685`, `PromptCard.tsx:2209-2211`.
- `bulkEditPromptSchema.license` at `schema.ts:1729` is `z.string().optional()`.
- ToS page `artifacts/prompt-atrium/src/pages/terms.tsx` already has: ownership-retained + display-license (123-124, 173-178), branching/attribution (190-201), DMCA (203-217).

---

## 1. Shared license registry (new file)

Create **`lib/db/src/schema/licenses.ts`**:

```ts
// Canonical per-asset license registry. Single source of truth for the
// `prompts.license` enum, the picker UI, and badge/label rendering.
// Stored value is the `code`; labels/blurbs are rendered from this map.

export const LICENSE_CODES = [
  "cc0",
  "cc-by-4.0",
  "cc-by-sa-4.0",
  "mit",
  "arr",
] as const;

export type LicenseCode = (typeof LICENSE_CODES)[number];

export const DEFAULT_LICENSE: LicenseCode = "cc0";

export interface LicenseMeta {
  code: LicenseCode;
  label: string;       // short label for picker + badge
  blurb: string;       // one-line plain-language explanation
  url: string;         // canonical license deed (or null-ish for arr)
  allowsCopy: boolean; // false => suppress copy-to-library for this asset
}

export const LICENSES: Record<LicenseCode, LicenseMeta> = {
  "cc0": {
    code: "cc0",
    label: "CC0 1.0 (Public Domain)",
    blurb: "Anyone can use, change, or sell this — no credit needed.",
    url: "https://creativecommons.org/publicdomain/zero/1.0/",
    allowsCopy: true,
  },
  "cc-by-4.0": {
    code: "cc-by-4.0",
    label: "CC BY 4.0",
    blurb: "Free to use and remix, even commercially — as long as they credit you.",
    url: "https://creativecommons.org/licenses/by/4.0/",
    allowsCopy: true,
  },
  "cc-by-sa-4.0": {
    code: "cc-by-sa-4.0",
    label: "CC BY-SA 4.0",
    blurb: "Same as CC BY, but anyone's remix must use this same license.",
    url: "https://creativecommons.org/licenses/by-sa/4.0/",
    allowsCopy: true,
  },
  "mit": {
    code: "mit",
    label: "MIT",
    blurb: "Permissive; keep the copyright notice. Best when the asset is mostly code/config.",
    url: "https://opensource.org/license/mit",
    allowsCopy: true,
  },
  "arr": {
    code: "arr",
    label: "All Rights Reserved",
    blurb: "Viewable on PromptAtrium, but no one may copy it to their library or republish it.",
    url: "",
    allowsCopy: false,
  },
};

export const LICENSE_LIST: LicenseMeta[] = LICENSE_CODES.map((c) => LICENSES[c]);

// Map legacy display-string values (pre-migration) → codes. Tolerant of stragglers.
const LEGACY_LICENSE_MAP: Record<string, LicenseCode> = {
  "CC0 (Public Domain)": "cc0",
  "CC0": "cc0",
  "CC BY (Attribution)": "cc-by-4.0",
  "CC BY": "cc-by-4.0",
  "CC BY-SA (Share Alike)": "cc-by-sa-4.0",
  "CC BY-SA": "cc-by-sa-4.0",
  "All Rights Reserved": "arr",
};

/** Normalize any stored value (code | legacy string | null) to a known code. */
export function normalizeLicense(value?: string | null): LicenseCode {
  if (!value) return DEFAULT_LICENSE;
  if ((LICENSE_CODES as readonly string[]).includes(value)) return value as LicenseCode;
  return LEGACY_LICENSE_MAP[value] ?? DEFAULT_LICENSE;
}

/** Human-readable label for any stored value. Safe for display components. */
export function licenseLabel(value?: string | null): string {
  return LICENSES[normalizeLicense(value)].label;
}
```

> `normalizeLicense`/`licenseLabel` make the display components resilient even if the data
> migration hasn't run yet or a stray legacy value survives.

## 2. DB migration (RAW SQL — run on dev AND prod; never db:push)

Run via the project's raw-SQL path (`executeSql` / psql against `DATABASE_URL`), **not** drizzle-kit:

```sql
-- 1) Backfill legacy display strings -> stable codes
UPDATE prompts SET license = 'cc0'          WHERE license IN ('CC0 (Public Domain)', 'CC0');
UPDATE prompts SET license = 'cc-by-4.0'    WHERE license IN ('CC BY (Attribution)', 'CC BY');
UPDATE prompts SET license = 'cc-by-sa-4.0' WHERE license IN ('CC BY-SA (Share Alike)', 'CC BY-SA');
UPDATE prompts SET license = 'arr'          WHERE license IN ('All Rights Reserved');

-- 2) NULL / empty / anything unrecognized -> default (cc0).
--    Rationale: historically the form defaulted NULL to CC0; keep that intent.
UPDATE prompts SET license = 'cc0'
  WHERE license IS NULL OR license = ''
     OR license NOT IN ('cc0','cc-by-4.0','cc-by-sa-4.0','mit','arr');

-- 3) Lock the column down to match schema.ts
ALTER TABLE prompts ALTER COLUMN license SET DEFAULT 'cc0';
ALTER TABLE prompts ALTER COLUMN license SET NOT NULL;

-- 4) Defense-in-depth: reject bad values at the DB layer
ALTER TABLE prompts ADD CONSTRAINT prompts_license_check
  CHECK (license IN ('cc0','cc-by-4.0','cc-by-sa-4.0','mit','arr'));
```

> ⚠️ Run **step 1 before step 2** (catch-all). Run on **dev first, verify counts, then prod.**
> Sanity check before/after: `SELECT license, count(*) FROM prompts GROUP BY license;`

## 3. Schema change (`lib/db/src/schema/schema.ts`)

At **line 510**, change:

```ts
license: varchar("license"),
```
to:
```ts
license: varchar("license", {
  enum: ["cc0", "cc-by-4.0", "cc-by-sa-4.0", "mit", "arr"],
}).notNull().default("cc0"),
```

> Keep this literal tuple **in sync with `LICENSE_CODES`**. (Drizzle's `enum` option needs a
> literal tuple for type inference; if you prefer importing `LICENSE_CODES`, spread it as
> `{ enum: [...LICENSE_CODES] }` and confirm `tsc` is happy — otherwise keep the literal and
> add a comment pointing at `licenses.ts`.)

Tighten the zod at **line 1729** (`bulkEditPromptSchema`) and the insert schema (~1602/1700s) where `license` appears:

```ts
import { LICENSE_CODES } from "./licenses";
// ...
license: z.enum(LICENSE_CODES).optional(),
```

## 4. Picker UI — `PromptModal.tsx`

Add import:
```ts
import { LICENSE_LIST, DEFAULT_LICENSE } from "@shared/licenses";
```

Replace the hardcoded `<SelectItem>`s (**986-989**) with a mapped list that shows the blurb:
```tsx
<Select value={normalizeLicense(formData.license)} onValueChange={(value) => setFormData({ ...formData, license: value })}>
  <SelectTrigger data-testid="select-license">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    {LICENSE_LIST.map((l) => (
      <SelectItem key={l.code} value={l.code}>
        <span className="font-medium">{l.label}</span>
        <span className="block text-xs text-muted-foreground">{l.blurb}</span>
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```
(import `normalizeLicense` too, or default the value with `formData.license || DEFAULT_LICENSE`.)

Replace every default literal `"CC0 (Public Domain)"` (lines **77, 105, 131, 190, 216, 607**)
with `DEFAULT_LICENSE`, and `prompt.license || "CC0 (Public Domain)"` with
`normalizeLicense(prompt.license)`.

## 5. Picker UI — `BulkEditModal.tsx`
- Import `LICENSE_LIST` from `@shared/licenses`; replace the hardcoded `SelectItem`s (~875-890) with the same `LICENSE_LIST.map(...)`.
- Line 30 zod: `license: z.enum(LICENSE_CODES).optional()`.

## 6. Display — badges/links
- `prompt-detail.tsx:683-685` and `PromptCard.tsx:2209-2211`: render `licenseLabel(prompt.license)` instead of the raw value. Optionally wrap in a link to `LICENSES[normalizeLicense(prompt.license)].url` (skip the link when `url === ""`, i.e. `arr`).

## 7. Copy-to-library gating (arr)
Wherever a "Copy to my library" / "Use this prompt" / fork action exists for **another user's**
public prompt, gate it on `LICENSES[normalizeLicense(prompt.license)].allowsCopy`. When false,
hide/disable the action with a tooltip: *"The author reserved all rights — copying is disabled."*
(Owner's own prompts are unaffected.) Search for the existing branch/copy handler; if none exists
yet, leave a `// TODO(license-gate)` at the action site so it's wired when that feature lands.

## 8. Terms of Service (`terms.tsx`) — tighten existing sections
Keep the existing structure; make these 4 clauses explicit (each mirrors a named platform —
see the memo):

1. **Per-asset license + default (new sentence in §3 "Your Content", near line 124):**
   *"Each prompt you publish carries a license you choose (CC0, CC BY 4.0, CC BY-SA 4.0, MIT, or All Rights Reserved). If you don't choose one, it defaults to CC0 (Public Domain). The license you choose governs what other users may do with that prompt."* — model: Hugging Face per-repo license field; GitHub D.6 inbound=outbound.
2. **Copy-to-library = fork, survives deletion (extend §4 "Branching & Attribution", lines 190-201):** add *"Copying a public prompt into your library, or creating a version of it, is permitted under that prompt's license. Copies others have already made remain valid even if you later unpublish the original."* — model: GitHub ToS D.5 (fork) + "licenses end when you remove Your Content, **unless other Users have forked it**."
3. **User warranty of rights (already at line 125 "Confirm you have the right to share") — strengthen to:** *"You represent and warrant that you own or have all necessary rights to the content you publish, and you agree to indemnify PromptAtrium against claims arising from it."* — model: GitHub ToS D.3.
4. **DMCA designated agent (extend §4 DMCA, lines 203-217):** add a concrete contact line (designated-agent email/address) so the notice path is actionable for 17 U.S.C. §512 safe harbor — model: GitHub DMCA Takedown Policy. *(Product owner must supply the real agent contact + register with the U.S. Copyright Office.)*

> These are conventions, **not legal advice** — have counsel review final ToS wording.

## 9. Verify (NO build, NO db:push)
```bash
pnpm --filter @workspace/db run typecheck
pnpm --filter @workspace/prompt-atrium run typecheck
```
Manual smoke: open PromptModal → license dropdown shows 5 options with blurbs, default CC0;
save a prompt as `arr` → copy-to-library hidden/disabled on another account; existing prompts
show migrated labels on cards/detail.

## 10. Out of scope (note for owner)
- Mobile apps (`prompt-atrium-mobile`, lite): mirror the same `@shared/licenses` registry later if they expose a license picker — not required for this task.
- Registering the DMCA agent and final legal review of ToS copy.
- Per-asset license on non-prompt asset types (rules/skills/workflows) if/when they get their own tables — reuse `licenses.ts`.
```
