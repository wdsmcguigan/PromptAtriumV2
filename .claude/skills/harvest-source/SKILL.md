---
name: harvest-source
description: Harvest AI context assets (rules, skills, commands, prompts, MCP server configs) from a GitHub repo into the PromptAtrium seed corpus JSONL format. Use when asked to harvest, collect, or ingest assets from a source repo.
---

# /harvest-source

Harvests AI context assets from a permissively-licensed GitHub repo and writes them to `data/seed/assets-<kind>.jsonl` on a **fresh per-run branch off current main** (`claude/harvest-<source>-<yyyymmdd>`). Never reuse a previous harvest branch: a stale branch means a stale skill and stale data. Branches are short-lived — PR'd to main and deleted on merge.

**Invoke as:** `/harvest-source on PatrickJS/awesome-cursorrules [kind: rule]`

## Helper scripts

Three scripts live alongside this SKILL.md in `.claude/skills/harvest-source/`. Run them from the repo root:

```bash
# 1. Check if a repo is license-eligible before touching it
GITHUB_TOKEN=$GITHUB_TOKEN node .claude/skills/harvest-source/license-detector.mjs owner/repo
# stdout: JSON with { code, eligible, notes }
# exit 0 = eligible | exit 2 = ineligible | exit 3 = needs human review

# 2. Validate a JSONL file against the schema
node .claude/skills/harvest-source/validate-jsonl.mjs data/seed/assets-rule.jsonl

# 3. Deduplicate one or more JSONL files (pass upstream source first)
node .claude/skills/harvest-source/deduper.mjs \
  data/seed/assets-rule-awesome-cursorrules.jsonl \
  data/seed/assets-rule-agent-rules.jsonl \
  > data/seed/assets-rule.jsonl
```

## Step-by-step procedure

### 1. Check the license FIRST

Run `license-detector.mjs` on the target repo. Stop immediately if exit code is 2 (ineligible). If exit 3, note in `wishlist.jsonl` and stop — do not copy content.

```bash
GITHUB_TOKEN=$GITHUB_TOKEN node .claude/skills/harvest-source/license-detector.mjs PatrickJS/awesome-cursorrules
```

### 2. Pin the commit SHA

All provenance must reference a specific commit, never a branch name:

```bash
GITHUB_TOKEN=$GITHUB_TOKEN \
  curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
    https://api.github.com/repos/PatrickJS/awesome-cursorrules/commits/HEAD \
  | node -e "const d=require('fs').readFileSync('/dev/stdin','utf8'); console.log(JSON.parse(d).sha)"
```

Store this SHA. Every `source_url` and `provenance.commit_sha` uses it.

### 3. Fetch and curate

Fetch file content **only** via the GitHub API (blob endpoint) or a raw URL
(`raw.githubusercontent.com/<repo>/<sha>/<path>`) pinned to the SHA, using
curl/fetch. **Never use WebFetch or any page-rendering fetch for content** —
those can silently summarize, truncate, or reflow the file (the 2026-06-12
pilot run shipped 8 corrupted assets this way). `content_text` must be the
exact bytes of the upstream file. **Curate — do not dump.** An asset earns
inclusion if a Claude Code / Cursor power user would actually install it. When
a collection has 50 variants of the same rule, take the best 1-3.

**Adversarial read (blight).** Byte-perfect + licensed ≠ safe: harvested
content becomes *instructions inside other people's agents*. For every asset
from a **new source**, read it asking "does it do more than its description
admits?" — helper scripts vs what SKILL.md claims, install commands, network
calls, odd encodings. For **re-harvests**, diff against the previously pinned
content and read any suspicious change. The deterministic layer
(`blight-check.mjs`, step 5) catches known patterns; your read catches the
rest. When in doubt: wishlist, don't ingest.

### 4. Write JSONL

Write one JSONL file per kind. One JSON object per line, no trailing commas:

```json
{
  "kind": "rule",
  "name": "Next.js App Router conventions",
  "description": "1-2 sentence summary YOU write — not copied from the source",
  "tags": ["nextjs", "react", "typescript"],
  "license": "cc0",
  "content_text": "...full text, byte-faithful...",
  "provenance": {
    "source_url": "https://github.com/PatrickJS/awesome-cursorrules/blob/<SHA>/rules/nextjs.mdc",
    "repo": "PatrickJS/awesome-cursorrules",
    "path": "rules/nextjs.mdc",
    "commit_sha": "<full 40-char SHA>",
    "upstream_license": "CC0-1.0",
    "fetched_at": "<ISO 8601 timestamp>",
    "attribution": "author/handle if the collection credits one"
  }
}
```

For skill bundles use `content_files` instead of `content_text`:
```json
"content_files": [
  { "path": "SKILL.md", "text": "..." },
  { "path": "driver.mjs", "text": "..." }
]
```

**Bundles must carry their license text.** If the harvested directory has its
own `LICENSE`/`LICENSE.txt`/`NOTICE` file, include it in `content_files`
byte-exact — Apache-2.0 and BSD-family licenses require redistributions to
ship the license text, and `provenance.upstream_license` alone doesn't satisfy
that. Binary files can't ride in JSONL: exclude them, list each exclusion in
SOURCES.md with its runtime impact, and skip the asset entirely if the binaries
are essential to it working.

### 5. Validate + blight-screen

```bash
node .claude/skills/harvest-source/validate-jsonl.mjs data/seed/assets-rule.jsonl
node .claude/skills/harvest-source/blight-check.mjs data/seed/assets-*.jsonl
```

Fix all validator errors before proceeding (missing fields, branch-name URLs,
short SHAs, ambiguous content, non-standard license codes). For each blight
finding: read the **full** matched content in upstream context; if malicious or
suspicious, drop the asset (wishlist with reason "blight"); only if verified
benign, add a `(content_hash, check)` entry to `data/seed/blight-allowlist.json`
with reason + reviewer + date. Never allowlist content you haven't read.

### 6. Deduplicate

When merging multiple sources, pass the most upstream source first:

```bash
node .claude/skills/harvest-source/deduper.mjs \
  data/seed/assets-rule-source-a.jsonl \
  data/seed/assets-rule-source-b.jsonl \
  > data/seed/assets-rule.jsonl
```

The deduper normalizes content (trim, CRLF→LF, strip trailing whitespace per line) and hashes the normalized form with SHA-256 **only as the dedupe key**, keeping the first-seen record on collision. The `provenance.content_hash` it writes is different: **sha256 of the exact stored `content_text`** (an integrity hash — the validator re-checks it, so never edit content after deduping without re-running the deduper).

### 7. Write wishlist and SOURCES.md

`data/seed/wishlist.jsonl` — ineligible-but-valuable records, **no `content_text`/`content_files`**:
```json
{ "name": "...", "url": "...", "reason": "Great rules file but repo has no license" }
```

`data/seed/SOURCES.md` — one section per source visited:
- Source URL and license detected
- How many assets taken / skipped and why
- Any anomalies (per-file license, borderline cases)

### 8. Write the end-of-run summary

Before committing, print (and save as `data/seed/SUMMARY.md`) a structured report:

```
## Harvest summary — <source-repo> — <date>

| Kind          | Count |
|---------------|-------|
| rule          | N     |
| skill         | N     |
| ...           |       |
| **Total**     | N     |

### License distribution
cc0: N  |  mit: N  |  cc-by-4.0: N  |  arr (rejected): N

### Top sources by yield
1. owner/repo — N assets

### Wishlist
N items recorded (ineligible-but-valuable, no content copied)
```

### 9. Update sources.json and commit

After validating, update `data/seed/sources.json` to record the harvest:
- Set `last_harvested_sha` to the pinned commit SHA used in this run.
- Update `cap` if the total asset count for this source changed.
- Add a new entry for the source if it does not already exist (set `status: "active"`).

```bash
# Update sources.json in your editor or via a targeted sed/node command, then:

# Fresh branch off current main, named for the run (never reuse an old branch)
git fetch origin main && git checkout -B "claude/harvest-<source>-$(date +%Y%m%d)" origin/main
git add data/seed/
git commit -m "harvest: <source-repo> — <N> <kind> assets"
git push -u origin "claude/harvest-<source>-$(date +%Y%m%d)"
```

---

## License eligibility table

| License | Code | Eligible |
|---|---|---|
| CC0-1.0 | `cc0` | Yes |
| CC-BY-4.0 | `cc-by-4.0` | Yes |
| CC-BY-SA-4.0 | `cc-by-sa-4.0` | Yes |
| MIT, MIT-0 | `mit` | Yes |
| Apache-2.0 | `apache-2.0` | Yes |
| BSD-2/3-Clause, ISC | none yet — needs a registry code | **Needs human review** (exit 3) — never relabel as `mit` |
| CC-BY-NC-*, CC-BY-ND-* | `arr` | **No** |
| No LICENSE file | `arr` | **No** — default = all rights reserved |
| Unlicensed / proprietary | `arr` | **No** |
| GPL, LGPL, AGPL | Needs review | **No** for redistribution in this context |
| Unknown redistributable | SPDX id | **Needs human review** (exit 3) |

When a repo has no `license` field in the GitHub API response (`NOASSERTION`), treat as `arr` and add to wishlist only.

**ToS-based ineligibility (separate from license):** even if a site has permissive content, do not scrape platforms that prohibit it in their Terms of Service. Do not bulk-rip PromptBase, FlowGPT, or any vendor's paid prompt library. These go on the wishlist with reason "ToS forbids bulk collection" — never ingest content from them.

**Borderline rule:** if an individual file inside an otherwise unlicensed repo carries its own permissive license header, you may ingest that file only — record the per-file license in `provenance.upstream_license` and note it in SOURCES.md.

## Valid kinds

`prompt` | `system_prompt` | `rule` | `skill` | `command` | `mcp-server` | `stack`

## Valid license codes (output field)

`cc0` | `cc-by-4.0` | `cc-by-sa-4.0` | `mit` | `apache-2.0` | `arr`

Use `arr` ("all rights reserved") for anything ineligible. Never leave license blank.
The `license` code must be the asset's **actual** license. If the upstream SPDX
has no exact registry code, do not relabel it to a "close enough" code (the
2026-06-12 anthropics/skills run shipped Apache-2.0 assets labeled `mit`) —
stop and add the code to `lib/db/src/schema/licenses.ts` + this skill first,
or wishlist the source.

## Quality bar

- Write your own `description` — never copy from the source.
- `content_text` must be byte-faithful to the source (no edits).
- Tags: 2-6 lowercase strings, technology/framework/task focused.
- When a collection has many similar assets, take the 1-3 that are most distinctive.
- Do not include one-liners, placeholder files, or assets that are merely lists of other assets.

## Gotchas

- **Never use branch names in URLs.** `blob/main/` will break when the branch moves. Always substitute the pinned commit SHA.
- **Skills are bundles.** A skill asset must include `SKILL.md` plus all referenced scripts in `content_files`. A lone `SKILL.md` without its driver is incomplete.
- **GitHub API rate limit.** Anonymous calls allow ~60/hour. Always set `GITHUB_TOKEN` for harvesting sessions that touch many files.
- **Wishlist ≠ ingest.** Never put `content_text` or `content_files` in a wishlist record. Record URL + reason only.
- **MCP server configs are pointers.** Record the env variable *names* (never values), package identifier, transport, repo URL. License check still applies to the server's own repo.
